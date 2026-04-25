#!/usr/bin/env python3
"""Train base MLP and optional LoRA adapter on the output head."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from zyocra_ml.config import (
    BATCH_SIZE,
    EPOCHS,
    FEATURES_DIR,
    LEARNING_RATE,
    LORA_RANK,
    MANIFESTS_DIR,
    MODEL_VERSION,
    MODELS_DIR,
    SEED,
    WEIGHT_DECAY,
)
from zyocra_ml.dataset import load_npz_split
from zyocra_ml.manifest import build_manifest, write_manifest
from zyocra_ml.model import RiskMLP
from zyocra_ml.quantization import quantization_summary
from zyocra_ml.seed import set_global_seed


def _loader(features: torch.Tensor, labels: torch.Tensor, shuffle: bool) -> DataLoader:
    ds = TensorDataset(features, labels)
    return DataLoader(ds, batch_size=BATCH_SIZE, shuffle=shuffle)


def _train_epochs(
    model: RiskMLP,
    train_loader: DataLoader,
    val_loader: DataLoader,
    epochs: int,
    lr: float,
) -> list[dict[str, float]]:
    device = torch.device("cpu")
    model.to(device)
    criterion = nn.MSELoss()
    optimizer = torch.optim.AdamW(
        (p for p in model.parameters() if p.requires_grad),
        lr=lr,
        weight_decay=WEIGHT_DECAY,
    )

    history: list[dict[str, float]] = []
    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        for xb, yb in train_loader:
            xb, yb = xb.to(device), yb.to(device).unsqueeze(1)
            optimizer.zero_grad()
            pred = model(xb)
            loss = criterion(pred, yb)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(xb)

        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for xb, yb in val_loader:
                xb, yb = xb.to(device), yb.to(device).unsqueeze(1)
                pred = model(xb)
                val_loss += criterion(pred, yb).item() * len(xb)

        train_loss /= len(train_loader.dataset)
        val_loss /= len(val_loader.dataset)
        history.append({"epoch": float(epoch), "train_mse": train_loss, "val_mse": val_loss})

    return history


def main() -> None:
    parser = argparse.ArgumentParser(description="Train Zyocra risk MLP")
    parser.add_argument("--features", type=Path, default=FEATURES_DIR)
    parser.add_argument("--out", type=Path, default=MODELS_DIR / f"{MODEL_VERSION}.pt")
    parser.add_argument("--epochs", type=int, default=EPOCHS)
    parser.add_argument("--lora-epochs", type=int, default=10)
    parser.add_argument("--seed", type=int, default=SEED)
    parser.add_argument("--skip-lora", action="store_true")
    args = parser.parse_args()

    set_global_seed(args.seed)

    train_x, train_y = load_npz_split(args.features / "train.npz")
    val_x, val_y = load_npz_split(args.features / "val.npz")

    train_features = torch.from_numpy(train_x)
    train_labels = torch.from_numpy(train_y)
    val_features = torch.from_numpy(val_x)
    val_labels = torch.from_numpy(val_y)

    model = RiskMLP()
    base_history = _train_epochs(
        model,
        _loader(train_features, train_labels, shuffle=True),
        _loader(val_features, val_labels, shuffle=False),
        epochs=args.epochs,
        lr=LEARNING_RATE,
    )

    lora_history: list[dict[str, float]] = []
    if not args.skip_lora:
        for param in model.backbone.parameters():
            param.requires_grad = False
        model.enable_lora(rank=LORA_RANK)
        lora_history = _train_epochs(
            model,
            _loader(train_features, train_labels, shuffle=True),
            _loader(val_features, val_labels, shuffle=False),
            epochs=args.lora_epochs,
            lr=LEARNING_RATE * 2,
        )

    args.out.parent.mkdir(parents=True, exist_ok=True)
    torch.save(
        {
            "model_version": MODEL_VERSION,
            "state_dict": model.state_dict(),
            "lora_enabled": model.lora_enabled,
            "seed": args.seed,
            "base_history": base_history,
            "lora_history": lora_history,
        },
        args.out,
    )

    manifest = build_manifest(
        model_version=MODEL_VERSION,
        parameter_counts=model.count_parameters(),
        quantization_config=quantization_summary(),
        metrics={"final_val_mse": base_history[-1]["val_mse"]},
        extra={
            "checkpoint": str(args.out.relative_to(ROOT)),
            "lora_enabled": model.lora_enabled,
            "training": {"base_epochs": args.epochs, "lora_epochs": 0 if args.skip_lora else args.lora_epochs},
        },
    )
    manifest_path = MANIFESTS_DIR / "train-latest.json"
    write_manifest(manifest_path, manifest)

    print(f"wrote checkpoint {args.out}")
    print(f"parameters: {json.dumps(model.count_parameters())}")
    print(f"wrote manifest {manifest_path}")


if __name__ == "__main__":
    main()
