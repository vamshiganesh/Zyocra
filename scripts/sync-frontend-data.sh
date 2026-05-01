#!/usr/bin/env bash
# Aggregate EZKL + contract artifacts into frontend/public/data/phase1-demo.json
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${ROOT}/frontend/public/data/phase1-demo.json"
mkdir -p "$(dirname "$OUT")"

python3 <<PY
import json
from datetime import datetime, timezone
from pathlib import Path

root = Path("${ROOT}")

def load_json(path: Path):
    if not path.is_file():
        return None
    text = path.read_text(encoding="utf-8").strip()
    if not text or text in ('"result"', '"deployment"'):
        return None
    return json.loads(text)

def short_hex(value: str, chars: int = 6) -> str:
    if not value or value == "—":
        return value
    v = value if value.startswith("0x") else f"0x{value}"
    if len(v) <= 2 + chars * 2:
        return v
    return f"{v[:2 + chars]}…{v[-chars:]}"

def bucket_for_bps(bps: int) -> tuple[str, str]:
    if bps < 5500:
        return "LOW", "0.00 – 0.55"
    if bps < 8000:
        return "MEDIUM", "0.55 – 0.80"
    if bps < 9200:
        return "HIGH", "0.80 – 0.92"
    return "CRITICAL", "0.92 – 1.00"

def collateral_bps_for_bucket(bucket: str) -> int:
    return {"LOW": 8000, "MEDIUM": 7200, "HIGH": 6500, "CRITICAL": 5000}[bucket]

def spread_bps_for_bucket(bucket: str) -> int:
    return {"LOW": 0, "MEDIUM": 45, "HIGH": 120, "CRITICAL": 250}[bucket]

demo = load_json(root / "circuits-baseline/logs/demo-latest.json") or {}
oracle = load_json(root / "circuits-baseline/proofs/oracle-payload.json") or {}
deploy = load_json(root / "contracts/deployments/anvil-ezkl-latest.json") or {}
loop = load_json(root / "contracts/deployments/phase1-loop-latest.json") or {}

# Fallback: broadcast CREATE order halo2, ezkl, oracle, consumer
if not deploy:
    broadcast = root / "contracts/broadcast/DeployEzkl.s.sol/31337/run-latest.json"
    b = load_json(broadcast)
    if b:
        txs = [t for t in b.get("transactions", []) if t.get("transactionType") == "CREATE"]
        if len(txs) >= 4:
            deploy = {
                "halo2Verifier": txs[0]["contractAddress"],
                "ezklVerifier": txs[1]["contractAddress"],
                "oracle": txs[2]["contractAddress"],
                "consumer": txs[3]["contractAddress"],
            }

epoch_num = int(oracle.get("epoch") or loop.get("epoch") or demo.get("epoch") or 2026041)
epoch_id = f"epoch-{str(epoch_num)[:4]}-{str(epoch_num)[4:].lstrip('0') or '0'}"

score_bps = int(oracle.get("scoreBps") or loop.get("scoreBps") or round(float(demo.get("score_float", 0)) * 10000))
score_float = float(oracle.get("scoreFloat") or demo.get("score_float") or score_bps / 10000)
bucket, bucket_range = bucket_for_bps(score_bps)

features = demo.get("features") or []
feature_names = [
    "collateralization_ratio",
    "debt_utilization",
    "volatility_proxy_7d",
    "liquidation_proximity",
    "borrow_concentration",
    "wallet_age_days",
]

proof_len = int(oracle.get("proofLengthBytes") or 0)
proof_hex = oracle.get("proofHex") or ""
verify_passed = bool(demo.get("verify_passed", False))
on_chain = bool(loop.get("epoch"))

borrower = loop.get("borrower") or "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
collateral_bps = int(loop.get("collateralFactorBps") or collateral_bps_for_bucket(bucket))
spread_bps = int(loop.get("borrowSpreadBps") if loop.get("borrowSpreadBps") is not None else spread_bps_for_bucket(bucket))
borrow_allowed = loop.get("borrowAllowed", bucket in ("LOW", "MEDIUM"))

model_hash = oracle.get("modelHash") or "0x2fe8f38e2a8992e0546762c67f073e737f12419ac3f13004598e08c7d978f627"
adapter_hash = oracle.get("adapterHash") or "0x5c840159cf800e89cc2fc5ff33164ec8aee75b5a20c7e15cbdc612c31d47993c"

out = {
    "syncedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "hasArtifacts": bool(oracle or demo),
    "hasOnChain": on_chain,
    "epoch": {
        "id": epoch_id,
        "numeric": epoch_num,
        "status": "active" if on_chain else "ready",
    },
    "commitments": {
        "modelHash": model_hash,
        "adapterHash": adapter_hash,
        "modelHashShort": short_hex(model_hash),
        "adapterHashShort": short_hex(adapter_hash),
    },
    "features": {
        "names": feature_names,
        "values": features,
        "sampleIndex": demo.get("sample_index", 0),
    },
    "score": {
        "float": score_float,
        "bps": score_bps,
        "bucket": bucket,
        "bucketRange": bucket_range,
    },
    "proof": {
        "status": "verified" if verify_passed and on_chain else ("generated" if verify_passed else "pending"),
        "offChainVerify": verify_passed,
        "lengthBytes": proof_len,
        "hashPrefix": short_hex(proof_hex, 8) if proof_hex else "—",
        "ezklVersion": demo.get("ezkl_version", "23.0.5"),
        "artifactPath": "circuits-baseline/proofs/proof.json",
    },
    "verification": {
        "result": "pass" if verify_passed else "pending",
        "onChain": on_chain,
        "chainId": 31337,
        "verifierAdapter": deploy.get("ezklVerifier"),
        "halo2Verifier": deploy.get("halo2Verifier"),
        "oracle": deploy.get("oracle"),
        "consumer": deploy.get("consumer"),
    },
    "consumer": {
        "borrower": borrower,
        "borrowerShort": short_hex(borrower),
        "collateralFactorBps": collateral_bps,
        "collateralFactor": collateral_bps / 10000,
        "borrowSpreadBps": spread_bps,
        "borrowAllowed": borrow_allowed,
        "bucket": loop.get("bucket") is not None and ["LOW", "MEDIUM", "HIGH", "CRITICAL"][int(loop["bucket"])] or bucket,
        "lastEpoch": loop.get("epoch") or epoch_num,
    },
    "benchmark": {
        "populated": False,
        "note": "Run Milestone 5 benchmarks to populate EZKL vs Circom comparison rows.",
    },
}

Path("${OUT}").write_text(json.dumps(out, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"wrote {OUT}")
print(f"  epoch={epoch_id} scoreBps={score_bps} bucket={bucket} onChain={on_chain}")
PY

chmod +x "${ROOT}/scripts/sync-frontend-data.sh" 2>/dev/null || true
