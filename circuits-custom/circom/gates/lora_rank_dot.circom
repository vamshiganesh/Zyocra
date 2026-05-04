pragma circom 2.1.6;

include "dot_product.circom";
include "sum.circom";

/**
 * LoRA contribution without materializing W_delta = A @ B.
 *
 * For rank r and input x ∈ R^{in_dim}:
 *   out = Σ_{k=0}^{rank-1} A[k] · ⟨B[k, :], x⟩
 *
 * lora_b is row-major flatten of shape (rank, in_dim).
 */
template LoRARankDot(in_dim, rank) {
    signal input hidden[in_dim];
    signal input lora_a[rank];
    signal input lora_b[rank * in_dim];
    signal output out;

    component row_dots[rank];
    signal scaled[rank];

    for (var r = 0; r < rank; r++) {
        row_dots[r] = DotProduct(in_dim);
        for (var j = 0; j < in_dim; j++) {
            row_dots[r].a[j] <== hidden[j];
            row_dots[r].b[j] <== lora_b[r * in_dim + j];
        }
        scaled[r] <== lora_a[r] * row_dots[r].out;
    }

    component total = Sum(rank);
    for (var r = 0; r < rank; r++) {
        total.in[r] <== scaled[r];
    }
    out <== total.out;
}
