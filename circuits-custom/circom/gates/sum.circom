pragma circom 2.1.6;

/// Integer sum of n field elements (witness values are signed int32 grids).
template Sum(n) {
    signal input in[n];
    signal output out;

    signal acc[n + 1];
    acc[0] <== 0;
    for (var i = 0; i < n; i++) {
        acc[i + 1] <== acc[i] + in[i];
    }
    out <== acc[n];
}
