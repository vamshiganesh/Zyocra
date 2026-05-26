"""Build subprocess commands for operator jobs."""

from __future__ import annotations

import os
from pathlib import Path

from ..config import Settings
from .types import JobType, ProverKind


def build_command(job_type: JobType, settings: Settings, prover: ProverKind = "ezkl") -> list[str]:
    root = settings.repo_root
    env_extra: dict[str, str] = {
        "RPC_URL": settings.rpc_url,
        "PRIVATE_KEY": settings.private_key,
        "DEPLOY_CHAIN": settings.deploy_chain,
    }

    if job_type == JobType.RUN_FULL_EPOCH:
        if prover == "circom":
            # Circom scope A: head prove + benchmark, not full oracle e2e.
            return ["bash", str(root / "scripts" / "operator_circom_bench.sh")]
        return ["bash", str(root / "scripts" / "e2e_phase1.sh")]

    if job_type == JobType.DEPLOY_ONLY:
        return [
            "forge",
            "script",
            "script/DeployEzkl.s.sol:DeployEzkl",
            "--rpc-url",
            settings.rpc_url,
            "--broadcast",
            "--private-key",
            settings.private_key,
        ]

    if job_type == JobType.SUBMIT_APPLY:
        deploy = _load_deploy_addresses(settings)
        env_extra["ORACLE_ADDRESS"] = deploy["oracle"]
        env_extra["CONSUMER_ADDRESS"] = deploy["consumer"]
        return [
            "forge",
            "script",
            "script/SubmitAndApply.s.sol:SubmitAndApply",
            "--rpc-url",
            settings.rpc_url,
            "--broadcast",
            "--private-key",
            settings.private_key,
        ]

    if job_type == JobType.RUN_BENCHMARK:
        return ["make", "benchmark"]

    if job_type == JobType.PROVE_EZKL:
        return [
            str(settings.python),
            str(root / "circuits-baseline" / "scripts" / "demo.py"),
            "--skip-setup",
            "--skip-compile",
            "--sample-index",
            "0",
        ]

    if job_type == JobType.PROVE_CIRCOM_HEAD:
        return ["bash", str(root / "circuits-custom" / "scripts" / "run_pipeline.sh")]

    if job_type == JobType.SYNC_FRONTEND:
        return ["bash", str(root / "scripts" / "sync-frontend-data.sh")]

    raise ValueError(f"unknown job type: {job_type}")


def command_cwd(job_type: JobType, settings: Settings) -> Path:
    if job_type in (JobType.DEPLOY_ONLY, JobType.SUBMIT_APPLY):
        return settings.contracts_dir
    return settings.repo_root


def command_env(job_type: JobType, settings: Settings) -> dict[str, str]:
    env = os.environ.copy()
    env["RPC_URL"] = settings.rpc_url
    env["PRIVATE_KEY"] = settings.private_key
    env["DEPLOY_CHAIN"] = settings.deploy_chain

    if job_type == JobType.SUBMIT_APPLY:
        deploy = _load_deploy_addresses(settings)
        env["ORACLE_ADDRESS"] = deploy["oracle"]
        env["CONSUMER_ADDRESS"] = deploy["consumer"]

    return env


def _load_deploy_addresses(settings: Settings) -> dict[str, str]:
    import json

    path = settings.deploy_json_path
    if not path.exists():
        raise FileNotFoundError(f"deployment json missing: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if "oracle" not in data or "consumer" not in data:
        raise ValueError(f"invalid deployment json: {path}")
    return {"oracle": data["oracle"], "consumer": data["consumer"]}


def job_requires_broadcast(job_type: JobType) -> bool:
    return job_type in (JobType.RUN_FULL_EPOCH, JobType.DEPLOY_ONLY, JobType.SUBMIT_APPLY)
