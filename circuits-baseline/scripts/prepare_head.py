#!/usr/bin/env python3
"""Prepare EZKL head-only ONNX and compile settings (comparable subgraph benchmark)."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HEAD_ROOT = ROOT / "head"
ML_ROOT = ROOT.parent / "ml-base"
sys.path.insert(0, str(ML_ROOT))
sys.path.insert(0, str(ROOT))

import onnx  # noqa: E402

from zyocra_ezkl.pipeline import compile_circuit, ensure_srs, gen_settings, prepare_onnx, setup_keys  # noqa: E402


def main() -> None:
    head_onnx_src = ML_ROOT / "artifacts" / "onnx" / "zyocra-head-v1.onnx"
    if not head_onnx_src.is_file():
        raise SystemExit(
            f"missing {head_onnx_src} — run: cd ml-base && .venv/bin/python scripts/export_head_onnx.py"
        )

    onnx_dir = HEAD_ROOT / "onnx"
    settings_dir = HEAD_ROOT / "settings"
    keys_dir = HEAD_ROOT / "keys"
    for d in (onnx_dir, settings_dir, keys_dir, HEAD_ROOT / "witnesses", HEAD_ROOT / "proofs"):
        d.mkdir(parents=True, exist_ok=True)

    dest_onnx = onnx_dir / "zyocra-head-v1.onnx"
    model = onnx.load(head_onnx_src, load_external_data=True)
    onnx.save(model, dest_onnx, save_as_external_data=False)

    settings_json = settings_dir / "settings.json"
    compiled = settings_dir / "network.ezkl"
    srs = keys_dir / "kzg.srs"
    vk = keys_dir / "vk.key"
    pk = keys_dir / "pk.key"

    gen_settings(model=dest_onnx, settings=settings_json)
    compile_circuit(model=dest_onnx, compiled=compiled, settings=settings_json)
    ensure_srs()
    if not srs.exists() or srs.stat().st_size == 0:
        import ezkl

        ezkl.gen_srs(str(srs))
    setup_keys(compiled=compiled, vk=vk, pk=pk, srs=srs)

    print(f"==> head settings: {settings_json}")
    print(f"==> head compiled: {compiled}")


if __name__ == "__main__":
    main()
