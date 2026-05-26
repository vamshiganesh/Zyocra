"""Chain status and artifact summary routes."""

from __future__ import annotations

from fastapi import APIRouter

from ..services.chain import artifacts_summary, chain_status

router = APIRouter(prefix="/api", tags=["chain"])


@router.get("/chain/status")
def get_chain_status():
    return chain_status()


@router.get("/artifacts/summary")
def get_artifacts_summary():
    return artifacts_summary()
