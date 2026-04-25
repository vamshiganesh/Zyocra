"""Compact tabular risk MLP."""

from __future__ import annotations

import torch
import torch.nn as nn

from zyocra_ml.config import FEATURE_NAMES, HIDDEN_DIMS, LORA_RANK
from zyocra_ml.lora import LoRALinear


class RiskMLP(nn.Module):
    """
    Small MLP for liquidation-risk scoring.

    Architecture supports optional LoRA on the output head for W' = W + AB updates
    without changing the forward graph shape (important for ONNX / zk export).
    """

    def __init__(self, input_dim: int = len(FEATURE_NAMES), hidden_dims: tuple[int, ...] = HIDDEN_DIMS) -> None:
        super().__init__()
        layers: list[nn.Module] = []
        prev = input_dim
        for dim in hidden_dims:
            layers.append(nn.Linear(prev, dim))
            layers.append(nn.ReLU())
            prev = dim
        self.backbone = nn.Sequential(*layers)
        self.head = nn.Linear(prev, 1)
        self.output_head: nn.Module = self.head
        self.lora_enabled = False

    def enable_lora(self, rank: int = LORA_RANK) -> LoRALinear:
        """Replace the output head with a LoRA-wrapped linear layer."""
        if self.lora_enabled:
            raise RuntimeError("LoRA already enabled on this model")
        lora_head = LoRALinear(self.head, rank=rank)
        self.output_head = lora_head
        self.lora_enabled = True
        return lora_head

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        hidden = self.backbone(x)
        logits = self.output_head(hidden)
        return torch.sigmoid(logits)

    def count_parameters(self) -> dict[str, int]:
        total = sum(p.numel() for p in self.parameters())
        trainable = sum(p.numel() for p in self.parameters() if p.requires_grad)
        return {
            "total": total,
            "trainable": trainable,
            "frozen": total - trainable,
        }
