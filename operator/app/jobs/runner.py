"""Build subprocess commands for operator jobs."""

from __future__ import annotations

import os
from pathlib import Path

from ..config import Settings
from .types import JobType, ProverKind


def _deploy_json_name(settings: Settings, prover: ProverKind) -> str:
    return settings.deploy_json_name_for(prover)


def _result_outfile(settings: Settings, prover: ProverKind) -> str:
    sepolia = settings.active_chain == "sepolia"
    if prover == "circom":
        name = "sepolia-circom-loop-latest.json" if sepolia else "circom-loop-latest.json"
    else:
        name = "sepolia-loop-latest.json" if sepolia else "phase1-loop-latest.json"
    return f"deployments/{name}"


def build_command(job_type: JobType, settings: Settings, prover: ProverKind = "ezkl") -> list[str]:
    root = settings.repo_root
    rpc = settings.effective_rpc_url
    key = settings.effective_private_key

    if job_type == JobType.RUN_FULL_EPOCH:
        if settings.active_chain == "sepolia":
            raise ValueError(
                "run_full_epoch on Sepolia is disabled — use bash scripts/submit_testnet.sh "
                "or scripts/submit_circom_testnet.sh (or Operator deploy_only + submit_apply)"
            )
        if prover == "circom":
            return ["bash", str(root / "scripts" / "e2e_circom.sh")]
        return ["bash", str(root / "scripts" / "e2e_phase1.sh")]

    if job_type == JobType.DEPLOY_ONLY:
        if prover == "circom":
            return [
                "forge",
                "script",
                "script/DeployCircomOracle.s.sol:DeployCircomOracle",
                "--rpc-url",
                rpc,
                "--broadcast",
                "--private-key",
                key,
            ]
        return [
            "forge",
            "script",
            "script/DeployEzkl.s.sol:DeployEzkl",
            "--rpc-url",
            rpc,
            "--broadcast",
            "--private-key",
            key,
        ]

    if job_type == JobType.SUBMIT_APPLY:
        if prover == "circom":
            return [
                "forge",
                "script",
                "script/SubmitAndApplyCircom.s.sol:SubmitAndApplyCircom",
                "--rpc-url",
                rpc,
                "--broadcast",
                "--private-key",
                key,
            ]
        return [
            "forge",
            "script",
            "script/SubmitAndApply.s.sol:SubmitAndApply",
            "--rpc-url",
            rpc,
            "--broadcast",
            "--private-key",
            key,
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


def command_env(job_type: JobType, settings: Settings, prover: ProverKind = "ezkl") -> dict[str, str]:
    env = os.environ.copy()
    env["RPC_URL"] = settings.effective_rpc_url
    env["PRIVATE_KEY"] = settings.effective_private_key
    env["DEPLOY_CHAIN"] = settings.active_chain
    env["PROVER_KIND"] = prover
    env["DEPLOY_OUTFILE"] = f"deployments/{_deploy_json_name(settings, prover)}"
    env["RESULT_OUTFILE"] = _result_outfile(settings, prover)

    if job_type == JobType.SUBMIT_APPLY:
        deploy = _load_deploy_addresses(settings, prover)
        env["ORACLE_ADDRESS"] = deploy["oracle"]
        env["CONSUMER_ADDRESS"] = deploy["consumer"]

    return env


def _load_deploy_addresses(settings: Settings, prover: ProverKind = "ezkl") -> dict[str, str]:
    import json

    path = settings.contracts_dir / "deployments" / _deploy_json_name(settings, prover)
    if not path.exists():
        raise FileNotFoundError(f"deployment json missing: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if "oracle" not in data or "consumer" not in data:
        raise ValueError(f"invalid deployment json: {path}")
    return {"oracle": data["oracle"], "consumer": data["consumer"]}


def job_requires_broadcast(job_type: JobType) -> bool:
    return job_type in (JobType.RUN_FULL_EPOCH, JobType.DEPLOY_ONLY, JobType.SUBMIT_APPLY)
