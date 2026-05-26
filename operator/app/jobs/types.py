"""Job type definitions."""

from __future__ import annotations

from enum import Enum
from typing import Literal

ProverKind = Literal["ezkl", "circom"]


class JobType(str, Enum):
    RUN_FULL_EPOCH = "run_full_epoch"
    DEPLOY_ONLY = "deploy_only"
    SUBMIT_APPLY = "submit_apply"
    RUN_BENCHMARK = "run_benchmark"
    PROVE_EZKL = "prove_ezkl"
    PROVE_CIRCOM_HEAD = "prove_circom_head"
    SYNC_FRONTEND = "sync_frontend"


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"
