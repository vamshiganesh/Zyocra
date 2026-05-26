"""Job REST + SSE routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from ..jobs.manager import job_manager
from ..jobs.types import JobType, ProverKind

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


class CreateJobRequest(BaseModel):
    type: JobType = Field(alias="type")
    prover: ProverKind = "ezkl"

    model_config = {"populate_by_name": True}


@router.post("")
async def create_job(body: CreateJobRequest):
    try:
        job = await job_manager.enqueue(body.type, body.prover)
        return job.to_dict()
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except (ValueError, FileNotFoundError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("")
async def list_jobs(limit: int = 50):
    return {"jobs": job_manager.list_jobs(limit=limit)}


@router.get("/{job_id}")
async def get_job(job_id: str):
    job = job_manager.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job not found")
    return {**job.to_dict(), "logs": job.logs[-200:]}


@router.get("/{job_id}/stream")
async def stream_job(job_id: str):
    job = job_manager.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job not found")

    async def event_generator():
        try:
            async for line in job_manager.stream(job_id):
                if line.startswith("event: status"):
                    yield f"{line}\n"
                else:
                    yield f"data: {line}\n\n"
        except KeyError as exc:
            yield f"event: error\ndata: {exc}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
