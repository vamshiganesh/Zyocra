"""RPC URL helpers — never expose API keys to the frontend."""

from __future__ import annotations

from urllib.parse import urlparse, urlunparse


def redact_rpc_url(rpc_url: str) -> str:
    """Mask path segments that look like API keys (Alchemy, Infura, etc.)."""
    parsed = urlparse(rpc_url)
    if not parsed.path or parsed.path in ("/", ""):
        return rpc_url

    segments = [segment for segment in parsed.path.split("/") if segment]
    if not segments:
        return rpc_url

    # Typical pattern: /v2/<api-key> or /<project-id>/<api-key>
    if len(segments) >= 2 and segments[-1] not in ("v2", "v3"):
        segments[-1] = "***"

    redacted_path = "/" + "/".join(segments)
    return urlunparse(parsed._replace(path=redacted_path))


def rpc_display_label(rpc_url: str, deploy_chain: str) -> str:
    """Human-readable operator target without secrets."""
    host = (urlparse(rpc_url).hostname or "").lower()
    if host in {"127.0.0.1", "localhost", "0.0.0.0"}:
        return f"local Anvil ({redact_rpc_url(rpc_url)})"
    if deploy_chain == "sepolia" or "sepolia" in host:
        return f"Sepolia ({redact_rpc_url(rpc_url)})"
    return redact_rpc_url(rpc_url)
