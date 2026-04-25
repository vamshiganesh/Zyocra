from __future__ import annotations

import torch

from zyocra_ml.model import RiskMLP
from zyocra_ml.seed import set_global_seed


def test_risk_mlp_forward_shape() -> None:
    set_global_seed(0)
    model = RiskMLP()
    x = torch.randn(4, 6)
    y = model(x)
    assert y.shape == (4, 1)
    assert (y >= 0).all() and (y <= 1).all()


def test_lora_enables_trainable_adapter_only() -> None:
    model = RiskMLP()
    for param in model.backbone.parameters():
        param.requires_grad = False
    model.enable_lora(rank=4)
    counts = model.count_parameters()
    assert counts["frozen"] == 257
    assert counts["trainable"] == 36
