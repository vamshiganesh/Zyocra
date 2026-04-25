"""Low-rank adapter abstraction for structured W' = W + AB updates."""

from __future__ import annotations

import torch
import torch.nn as nn
import torch.nn.functional as F


class LoRALinear(nn.Module):
    """
    Wraps a frozen linear layer with a trainable low-rank delta.

    Effective weight: W' = W + A @ B
    where A has shape (out_features, rank) and B has shape (rank, in_features).
  """

    def __init__(self, base: nn.Linear, rank: int) -> None:
        super().__init__()
        if rank <= 0:
            raise ValueError("rank must be positive")

        self.base = base
        self.rank = rank
        self.in_features = base.in_features
        self.out_features = base.out_features

        for param in self.base.parameters():
            param.requires_grad = False

        self.lora_a = nn.Parameter(torch.zeros(self.out_features, rank))
        self.lora_b = nn.Parameter(torch.zeros(rank, self.in_features))
        nn.init.kaiming_uniform_(self.lora_a, a=5**0.5)
        nn.init.zeros_(self.lora_b)

    @property
    def effective_weight(self) -> torch.Tensor:
        return self.base.weight + self.lora_a @ self.lora_b

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        base_out = self.base(x)
        lora_out = F.linear(x, self.lora_a @ self.lora_b)
        return base_out + lora_out

    def adapter_state_dict(self) -> dict[str, torch.Tensor]:
        return {"lora_a": self.lora_a.detach().cpu(), "lora_b": self.lora_b.detach().cpu()}
