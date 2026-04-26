"""Shared model loading for training, export, and validation scripts."""

from __future__ import annotations

from pathlib import Path

import torch

from zyocra_ml.model import RiskMLP


def load_risk_mlp(checkpoint: Path) -> RiskMLP:
    """Load a trained RiskMLP checkpoint in eval mode with gradients disabled."""
    payload = torch.load(checkpoint, map_location="cpu", weights_only=False)
    model = RiskMLP()
    if payload.get("lora_enabled"):
        for param in model.backbone.parameters():
            param.requires_grad = False
        model.enable_lora()
    model.load_state_dict(payload["state_dict"])
    for param in model.parameters():
        param.requires_grad = False
    model.eval()
    return model
