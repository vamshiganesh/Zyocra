"""Ensure local Anvil is running for broadcast operator jobs."""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from urllib.parse import urlparse

from web3 import Web3

PublishFn = Callable[[str], Awaitable[None]]

_LOCAL_HOSTS = {"127.0.0.1", "localhost", "0.0.0.0"}
_anvil_process: asyncio.subprocess.Process | None = None


def is_local_rpc(rpc_url: str) -> bool:
    host = (urlparse(rpc_url).hostname or "").lower()
    return host in _LOCAL_HOSTS


def rpc_reachable(rpc_url: str, timeout_sec: float = 2.0) -> bool:
    try:
        w3 = Web3(Web3.HTTPProvider(rpc_url, request_kwargs={"timeout": timeout_sec}))
        return bool(w3.is_connected())
    except Exception:
        return False


async def ensure_local_anvil(rpc_url: str, publish: PublishFn) -> None:
    """Start Anvil when operator targets localhost and nothing is listening."""
    global _anvil_process

    if not is_local_rpc(rpc_url):
        return
    if rpc_reachable(rpc_url):
        return

    port = urlparse(rpc_url).port or 8545
    await publish(f"[operator] no RPC at {rpc_url} — starting Anvil on port {port}")

    _anvil_process = await asyncio.create_subprocess_exec(
        "anvil",
        "--port",
        str(port),
        "--silent",
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.DEVNULL,
    )

    for _ in range(40):
        await asyncio.sleep(0.25)
        if rpc_reachable(rpc_url):
            await publish(f"[operator] Anvil ready at {rpc_url}")
            return
        if _anvil_process.returncode is not None:
            break

    raise RuntimeError(f"Anvil failed to start on port {port}")
