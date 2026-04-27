"""EZKL pipeline steps with readable logging."""

from __future__ import annotations

import asyncio
import json
import sys
import time
from pathlib import Path
from typing import Any

import ezkl
import numpy as np
import onnx

from zyocra_ezkl.config import (
    COMPILED_EZKL,
    EZKL_INPUT_SCALE,
    EZKL_LOGROWS,
    EZKL_PARAM_SCALE,
    EZKL_VERSION,
    FEATURES_DIR,
    KEYS_DIR,
    LOGS_DIR,
    NETWORK_ONNX,
    ONNX_SRC,
    PK_FILE,
    PROOF_JSON,
    PROOFS_DIR,
    SETTINGS_DIR,
    SETTINGS_JSON,
    SRS_FILE,
    VK_FILE,
    WITNESS_JSON,
    WITNESSES_DIR,
)


def _log(msg: str) -> None:
    print(f"==> {msg}", flush=True)


def _ensure_ezkl_version() -> None:
    installed = getattr(ezkl, "__version__", "unknown")
    if installed != EZKL_VERSION:
        raise RuntimeError(
            f"ezkl version mismatch: expected {EZKL_VERSION}, got {installed}. "
            f"Run: ml-base/.venv/bin/python -m pip install ezkl=={EZKL_VERSION}"
        )


def default_run_args() -> ezkl.PyRunArgs:
    ra = ezkl.PyRunArgs()
    ra.input_visibility = "public"
    ra.output_visibility = "public"
    ra.param_visibility = "fixed"
    ra.input_scale = EZKL_INPUT_SCALE
    ra.param_scale = EZKL_PARAM_SCALE
    ra.logrows = EZKL_LOGROWS
    return ra


def ensure_dirs() -> None:
    for path in (SETTINGS_DIR, KEYS_DIR, WITNESSES_DIR, PROOFS_DIR, LOGS_DIR, NETWORK_ONNX.parent):
        path.mkdir(parents=True, exist_ok=True)


def prepare_onnx(src: Path = ONNX_SRC, dest: Path = NETWORK_ONNX) -> Path:
    """Copy ONNX from ml-base and inline external weights for EZKL tract."""
    _ensure_ezkl_version()
    ensure_dirs()
    if not src.exists():
        raise FileNotFoundError(
            f"ONNX missing at {src}. Run: cd ml-base && bash scripts/run_pipeline.sh"
        )

    model = onnx.load(src, load_external_data=True)
    dest.parent.mkdir(parents=True, exist_ok=True)
    onnx.save(model, dest, save_as_external_data=False)
    for sidecar in dest.parent.glob(f"{dest.name}.data"):
        sidecar.unlink(missing_ok=True)

    _log(f"prepared ONNX → {dest} ({dest.stat().st_size} bytes, weights inlined)")
    return dest


def load_sample_features(index: int = 0) -> np.ndarray:
    sys.path.insert(0, str(FEATURES_DIR.parents[1]))
    from zyocra_ml.dataset import load_npz_split

    features, _ = load_npz_split(FEATURES_DIR / "test.npz")
    if index < 0 or index >= len(features):
        raise IndexError(f"sample index {index} out of range (0..{len(features) - 1})")
    return features[index : index + 1].astype(np.float32)


def write_input_json(features: np.ndarray, path: Path) -> Path:
    payload = {"input_data": [features.reshape(-1).tolist()]}
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    _log(f"wrote input JSON → {path}")
    return path


def gen_settings(
    model: Path = NETWORK_ONNX,
    settings: Path = SETTINGS_JSON,
    run_args: ezkl.PyRunArgs | None = None,
) -> Path:
    _ensure_ezkl_version()
    ensure_dirs()
    if not model.exists():
        prepare_onnx()
    ra = run_args or default_run_args()
    _log(f"gen_settings ({model.name})")
    ezkl.gen_settings(str(model), str(settings), py_run_args=ra)
    _log(f"wrote settings → {settings}")
    return settings


def calibrate_settings(
    input_json: Path,
    model: Path = NETWORK_ONNX,
    settings: Path = SETTINGS_JSON,
) -> Path:
    """Optional accuracy/resource tuning. Can be slow on CPU — see docs/ezkl.md."""
    _ensure_ezkl_version()
    _log("calibrate_settings (optional; may take several minutes on CPU)")
    ezkl.calibrate_settings(
        str(input_json),
        str(model),
        str(settings),
        "resources",
        0.1,
    )
    _log(f"calibrated settings → {settings}")
    return settings


def compile_circuit(
    model: Path = NETWORK_ONNX,
    compiled: Path = COMPILED_EZKL,
    settings: Path = SETTINGS_JSON,
) -> Path:
    _ensure_ezkl_version()
    _log("compile_circuit")
    ezkl.compile_circuit(str(model), str(compiled), str(settings))
    _log(f"wrote compiled circuit → {compiled} ({compiled.stat().st_size} bytes)")
    return compiled


def ensure_srs(logrows: int = EZKL_LOGROWS) -> Path:
    """
    Generate local SRS via gen_srs.

    Note: ezkl.get_srs() requires an asyncio event loop in 23.0.5 and is flaky
    in headless shells — we use gen_srs for reproducible local demos instead.
    """
    _ensure_ezkl_version()
    KEYS_DIR.mkdir(parents=True, exist_ok=True)
    if SRS_FILE.exists() and SRS_FILE.stat().st_size > 0:
        _log(f"reuse SRS → {SRS_FILE}")
        return SRS_FILE
    _log(f"gen_srs (logrows={logrows}) — one-time ~16MB local file")
    ezkl.gen_srs(str(SRS_FILE), logrows=logrows)
    _log(f"wrote SRS → {SRS_FILE}")
    return SRS_FILE


def setup_keys(
    compiled: Path = COMPILED_EZKL,
    vk: Path = VK_FILE,
    pk: Path = PK_FILE,
    srs: Path = SRS_FILE,
) -> tuple[Path, Path]:
    _ensure_ezkl_version()
    ensure_srs()
    _log("setup (vk + pk) — pk is large (~600MB) for this circuit")
    t0 = time.time()
    ezkl.setup(str(compiled), str(vk), str(pk), str(srs))
    _log(f"setup done in {time.time() - t0:.1f}s · vk={vk.stat().st_size} pk={pk.stat().st_size}")
    return vk, pk


def gen_witness(
    input_json: Path,
    compiled: Path = COMPILED_EZKL,
    witness: Path = WITNESS_JSON,
    vk: Path = VK_FILE,
    srs: Path = SRS_FILE,
) -> Path:
    _ensure_ezkl_version()
    _log("gen_witness")
    ezkl.gen_witness(str(input_json), str(compiled), str(witness), vk_path=str(vk), srs_path=str(srs))
    _log(f"wrote witness → {witness}")
    return witness


def prove(
    witness: Path = WITNESS_JSON,
    compiled: Path = COMPILED_EZKL,
    pk: Path = PK_FILE,
    proof: Path = PROOF_JSON,
    srs: Path = SRS_FILE,
) -> Path:
    _ensure_ezkl_version()
    _log("prove")
    t0 = time.time()
    ezkl.prove(str(witness), str(compiled), str(pk), str(proof), str(srs))
    _log(f"prove done in {time.time() - t0:.1f}s → {proof} ({proof.stat().st_size} bytes)")
    return proof


def verify(
    proof: Path = PROOF_JSON,
    settings: Path = SETTINGS_JSON,
    vk: Path = VK_FILE,
    srs: Path = SRS_FILE,
) -> bool:
    _ensure_ezkl_version()
    _log("verify (off-chain)")
    ok = bool(ezkl.verify(str(proof), str(settings), str(vk), str(srs)))
    _log(f"verify → {'PASS' if ok else 'FAIL'}")
    return ok


async def _create_evm_verifier_async(
    vk: Path,
    settings: Path,
    sol: Path,
    abi: Path,
    srs: Path,
) -> None:
    await ezkl.create_evm_verifier(
        str(vk),
        str(settings),
        str(sol),
        str(abi),
        str(srs),
        reusable=False,
    )


def gen_evm_verifier(
    vk: Path = VK_FILE,
    settings: Path = SETTINGS_JSON,
    sol: Path | None = None,
    abi: Path | None = None,
    srs: Path = SRS_FILE,
) -> tuple[Path, Path]:
    from zyocra_ezkl.config import VERIFIER_ABI, VERIFIER_SOL

    _ensure_ezkl_version()
    sol_path = sol or VERIFIER_SOL
    abi_path = abi or VERIFIER_ABI
    sol_path.parent.mkdir(parents=True, exist_ok=True)
    _log("create_evm_verifier (async in ezkl 23.0.5)")
    asyncio.run(_create_evm_verifier_async(vk, settings, sol_path, abi_path, srs))
    _log(f"wrote verifier → {sol_path} ({sol_path.stat().st_size} bytes)")
    return sol_path, abi_path


def read_score_from_witness(witness_path: Path = WITNESS_JSON) -> float:
    data = json.loads(witness_path.read_text(encoding="utf-8"))
    rescaled = data.get("pretty_elements", {}).get("rescaled_outputs", [[0]])
    return float(rescaled[0][0])


def write_demo_manifest(extra: dict[str, Any], path: Path) -> None:
    payload = {
        "ezkl_version": EZKL_VERSION,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        **extra,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    _log(f"wrote demo manifest → {path}")
