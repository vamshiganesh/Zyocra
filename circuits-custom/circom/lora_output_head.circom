pragma circom 2.1.6;

include "gates/dot_product.circom";
include "gates/lora_rank_dot.circom";

/**
 * Zyocra custom path — LoRA output head (algebraic core).
 *
 * Proves the integer accumulator for the final linear layer with explicit
 * low-rank adapter decomposition (Phase 1 head: 8 → 1, rank 4):
 *
 *   logit_acc = ⟨hidden, W_base⟩ + Σ_r A[r] · ⟨B[r, :], hidden⟩
 *
 * Matches ml-base Q8.8 grids (activation_scale=128, weight_scale=256).
 * Bias and cubic Taylor sigmoid remain off-circuit (oracle binding), but
 * `borrower` is an in-circuit public signal so the address is part of the
 * Groth16 statement (not an appended limb stripped before verify).
 *
 * Public:  hidden[in_dim], borrower, logit_acc (main output)
 * Private: weight_base, lora_a, lora_b
 */
template LoRAOutputHead(in_dim, rank) {
    signal input hidden[in_dim];
    signal input borrower;
    signal input weight_base[in_dim];
    signal input lora_a[rank];
    signal input lora_b[rank * in_dim];

    signal output logit_acc;

    // Address limb is public-only binding (no extra algebra). Constraining it
    // into the statement means tampering with borrower invalidates the proof.
    signal borrower_sq;
    borrower_sq <== borrower * borrower;

    component base_dot = DotProduct(in_dim);
    for (var i = 0; i < in_dim; i++) {
        base_dot.a[i] <== hidden[i];
        base_dot.b[i] <== weight_base[i];
    }

    component lora_dot = LoRARankDot(in_dim, rank);
    for (var i = 0; i < in_dim; i++) {
        lora_dot.hidden[i] <== hidden[i];
    }
    for (var r = 0; r < rank; r++) {
        lora_dot.lora_a[r] <== lora_a[r];
    }
    for (var k = 0; k < rank * in_dim; k++) {
        lora_dot.lora_b[k] <== lora_b[k];
    }

    logit_acc <== base_dot.out + lora_dot.out;
}

// Risk MLP output head after backbone: hidden_dim=8, lora_rank=4.
component main {public [hidden, borrower]} = LoRAOutputHead(8, 4);
