"""Chain status and artifact summary routes."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..config import settings
from ..services.chain import artifacts_summary, chain_status, submit_payload
from ..util.rpc import redact_rpc_url, rpc_display_label

router = APIRouter(prefix="/api", tags=["chain"])


class ChainModeRequest(BaseModel):
    mode: Literal["anvil", "sepolia"]


@router.get("/chain/status")
def get_chain_status(prover: Literal["ezkl", "circom"] = "ezkl"):
    return chain_status(prover)


@router.get("/chain/mode")
def get_chain_mode():
    return {
        "mode": settings.active_chain,
        "rpcUrl": redact_rpc_url(settings.effective_rpc_url),
        "rpcLabel": rpc_display_label(settings.effective_rpc_url, settings.active_chain),
        "sepoliaConfigured": bool(settings.sepolia_rpc_url and settings.deployer_private_key),
    }


@router.post("/chain/mode")
def set_chain_mode(body: ChainModeRequest):
    try:
        settings.set_chain_mode(body.mode)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return get_chain_mode()


@router.get("/artifacts/summary")
def get_artifacts_summary(prover: Literal["ezkl", "circom"] = "ezkl"):
    return artifacts_summary(prover)


@router.get("/artifacts/submit-payload")
def get_submit_payload(prover: Literal["ezkl", "circom"] = "ezkl"):
    try:
        return submit_payload(prover)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
