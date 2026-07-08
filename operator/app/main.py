"""Zyocra operator FastAPI application."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routes import chain, jobs
from .util.rpc import redact_rpc_url, rpc_display_label

app = FastAPI(title="Zyocra Operator", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router)
app.include_router(chain.router)


@app.get("/health")
def health():
    return {
        "ok": True,
        "rpcUrl": redact_rpc_url(settings.effective_rpc_url),
        "rpcLabel": rpc_display_label(settings.effective_rpc_url, settings.active_chain),
        "chain": settings.active_chain,
        "sepoliaConfigured": bool(settings.sepolia_rpc_url and settings.deployer_private_key),
    }
