# lora

Low-rank adapter implementation: `zyocra_ml/lora.py` (`LoRALinear`, \(W' = W + AB\)).

Phase 1 applies LoRA to the **output head only** after base training. Full-layer adapters can extend the same abstraction in later milestones.
