pragma circom 2.1.6;

include "sum.circom";

/// Inner product ⟨a, b⟩ with integer witness values.
template DotProduct(n) {
    signal input a[n];
    signal input b[n];
    signal output out;

    signal partial[n];
    for (var i = 0; i < n; i++) {
        partial[i] <== a[i] * b[i];
    }

    component total = Sum(n);
    for (var i = 0; i < n; i++) {
        total.in[i] <== partial[i];
    }
    out <== total.out;
}
