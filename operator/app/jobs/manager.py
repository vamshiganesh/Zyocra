"""In-memory job queue with streaming log capture."""

from __future__ import annotations

import asyncio
import time
import uuid
from dataclasses import dataclass, field
from typing import AsyncIterator

from ..config import settings
from ..services.anvil import ensure_local_anvil
from .runner import build_command, command_cwd, command_env, job_requires_broadcast
from .types import JobStatus, JobType, ProverKind


@dataclass
class Job:
    id: str
    job_type: JobType
    prover: ProverKind
    status: JobStatus = JobStatus.QUEUED
    created_at: float = field(default_factory=time.time)
    started_at: float | None = None
    finished_at: float | None = None
    exit_code: int | None = None
    error: str | None = None
    logs: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "type": self.job_type.value,
            "prover": self.prover,
            "status": self.status.value,
            "createdAt": self.created_at,
            "startedAt": self.started_at,
            "finishedAt": self.finished_at,
            "exitCode": self.exit_code,
            "error": self.error,
            "durationSec": self.duration_sec,
        }

    @property
    def duration_sec(self) -> float | None:
        if self.started_at is None:
            return None
        end = self.finished_at or time.time()
        return round(end - self.started_at, 2)


class JobManager:
    def __init__(self) -> None:
        self._jobs: dict[str, Job] = {}
        self._order: list[str] = []
        self._lock = asyncio.Lock()
        self._running = False
        self._subscribers: dict[str, list[asyncio.Queue[str | None]]] = {}

    def list_jobs(self, limit: int = 50) -> list[dict]:
        ids = list(reversed(self._order))[:limit]
        return [self._jobs[jid].to_dict() for jid in ids if jid in self._jobs]

    def get_job(self, job_id: str) -> Job | None:
        return self._jobs.get(job_id)

    async def enqueue(self, job_type: JobType, prover: ProverKind = "ezkl") -> Job:
        if job_requires_broadcast(job_type) and not settings.needs_broadcast_key():
            raise ValueError("PRIVATE_KEY is required for broadcast jobs")

        async with self._lock:
            if self._running and job_type != JobType.SYNC_FRONTEND:
                raise RuntimeError("another heavy job is already running")

        job_id = uuid.uuid4().hex[:12]
        job = Job(id=job_id, job_type=job_type, prover=prover)
        self._jobs[job_id] = job
        self._order.append(job_id)
        self._subscribers[job_id] = []

        asyncio.create_task(self._run_job(job))
        return job

    async def _run_job(self, job: Job) -> None:
        async with self._lock:
            if job.job_type != JobType.SYNC_FRONTEND:
                self._running = True

        job.status = JobStatus.RUNNING
        job.started_at = time.time()
        await self._publish(job.id, f"[operator] starting {job.job_type.value} ({job.prover})")

        try:
            if job_requires_broadcast(job.job_type):
                await ensure_local_anvil(
                    settings.rpc_url,
                    lambda line: self._publish(job.id, line),
                )

            cmd = build_command(job.job_type, settings, job.prover)
            cwd = command_cwd(job.job_type, settings)
            env = command_env(job.job_type, settings, job.prover)

            await self._publish(job.id, f"[operator] cwd={cwd}")
            await self._publish(job.id, f"[operator] cmd={' '.join(cmd)}")

            process = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=str(cwd),
                env=env,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
            )

            assert process.stdout is not None
            while True:
                line = await process.stdout.readline()
                if not line:
                    break
                text = line.decode("utf-8", errors="replace").rstrip("\n")
                job.logs.append(text)
                await self._publish(job.id, text)

            job.exit_code = await process.wait()
            if job.exit_code == 0:
                job.status = JobStatus.DONE
                if job.job_type in (JobType.RUN_BENCHMARK, JobType.PROVE_CIRCOM_HEAD):
                    await self._run_sync(job)
            else:
                job.status = JobStatus.FAILED
                job.error = f"process exited with code {job.exit_code}"
        except Exception as exc:  # noqa: BLE001
            job.status = JobStatus.FAILED
            job.error = str(exc)
            await self._publish(job.id, f"[operator] error: {exc}")
        finally:
            job.finished_at = time.time()
            async with self._lock:
                self._running = False
            await self._publish(job.id, None)

    async def _run_sync(self, parent: Job) -> None:
        """Sync frontend data after benchmark jobs."""
        await self._publish(parent.id, "[operator] syncing frontend data...")
        sync_job = Job(id=f"{parent.id}-sync", job_type=JobType.SYNC_FRONTEND, prover=parent.prover)
        try:
            cmd = build_command(JobType.SYNC_FRONTEND, settings)
            process = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=str(settings.repo_root),
                env=command_env(JobType.SYNC_FRONTEND, settings, parent.prover),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
            )
            assert process.stdout is not None
            while True:
                line = await process.stdout.readline()
                if not line:
                    break
                text = line.decode("utf-8", errors="replace").rstrip("\n")
                await self._publish(parent.id, text)
            code = await process.wait()
            if code != 0:
                await self._publish(parent.id, f"[operator] sync failed with code {code}")
        except Exception as exc:  # noqa: BLE001
            await self._publish(parent.id, f"[operator] sync error: {exc}")

    async def _publish(self, job_id: str, message: str | None) -> None:
        for queue in self._subscribers.get(job_id, []):
            await queue.put(message)

    async def stream(self, job_id: str) -> AsyncIterator[str]:
        job = self._jobs.get(job_id)
        if job is None:
            raise KeyError(job_id)

        for existing in job.logs:
            yield existing

        if job.status in (JobStatus.DONE, JobStatus.FAILED):
            yield f"event: status\ndata: {job.status.value}\n\n"
            return

        queue: asyncio.Queue[str | None] = asyncio.Queue()
        self._subscribers.setdefault(job_id, []).append(queue)
        try:
            while True:
                message = await queue.get()
                if message is None:
                    yield f"event: status\ndata: {job.status.value}\n\n"
                    break
                yield message
        finally:
            subs = self._subscribers.get(job_id, [])
            if queue in subs:
                subs.remove(queue)


job_manager = JobManager()
