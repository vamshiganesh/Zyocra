// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {CircomPublicInputLayout} from "./CircomPublicInputLayout.sol";
import {DemoCommitments} from "./DemoCommitments.sol";

/// @title CircomScoreEncoding
/// @notice Map Circom `logit_acc` public signals to RiskOracle basis points.
/// @dev Bias + cubic Taylor sigmoid are applied off-circuit; must match `oracle_payload.py`.
library CircomScoreEncoding {
    uint256 internal constant WAD = 1e18;
    uint256 internal constant LOGIT_DENOMINATOR = 128 * 256;
    uint256 internal constant HIGH_ABS_XWAD = 5 * WAD;
    /// @dev BN254 scalar field (snarkjs / Circom).
    uint256 internal constant SNARK_SCALAR_FIELD =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;

    error ScoreMismatch(uint256 calldataBps, uint256 provedBps);
    error BorrowerMismatch(address calldataBorrower, address provedBorrower);

    /// @notice Decode Circom field element to signed integer (negatives as p - |x|).
    function signedLogitAcc(uint256 logitAcc) internal pure returns (int256) {
        if (logitAcc > SNARK_SCALAR_FIELD / 2) {
            return -int256(SNARK_SCALAR_FIELD - logitAcc);
        }
        return int256(logitAcc);
    }

    /// @notice Convert integer logit_acc to basis points using cubic Taylor sigmoid.
    /// @dev σ(x) ≈ 1/2 + x/4 − x³/48 on |x| ≤ 5, then saturate. Matches oracle_payload.py.
    function scoreBpsFromLogitAcc(uint256 logitAcc) internal pure returns (uint256) {
        int256 biasWad = DemoCommitments.CIRCOM_OUTPUT_BIAS_WAD;
        int256 signedAcc = signedLogitAcc(logitAcc);
        int256 xWad = (signedAcc * int256(WAD)) / int256(LOGIT_DENOMINATOR) + biasWad;

        if (xWad >= int256(HIGH_ABS_XWAD)) {
            return 10_000;
        }
        if (xWad <= -int256(HIGH_ABS_XWAD)) {
            return 0;
        }

        int256 x2 = (xWad * xWad) / int256(WAD);
        int256 x3 = (x2 * xWad) / int256(WAD);
        int256 sigmoidWad = int256(WAD / 2) + xWad / 4 - x3 / 48;
        if (sigmoidWad > int256(WAD)) sigmoidWad = int256(WAD);
        if (sigmoidWad < 0) sigmoidWad = 0;

        return uint256((sigmoidWad * int256(10_000)) / int256(WAD));
    }

    /// @notice Assert calldata score matches proved Circom logit_acc public signal.
    function requireScoreMatchesPublicInput(uint256 scoreBps, uint256[] memory publicInputs)
        internal
        pure
    {
        uint256 logitAcc = CircomPublicInputLayout.logitAcc(publicInputs);
        uint256 provedBps = scoreBpsFromLogitAcc(logitAcc);
        if (scoreBps != provedBps) {
            revert ScoreMismatch(scoreBps, provedBps);
        }
    }

    /// @notice Assert borrower matches the in-circuit public limb.
    function requireBorrowerMatchesPublicInput(address borrower, uint256[] memory publicInputs)
        internal
        pure
    {
        CircomPublicInputLayout.requireCircomLayout(publicInputs);
        address provedBorrower = CircomPublicInputLayout.borrower(publicInputs);
        if (borrower != provedBorrower) {
            revert BorrowerMismatch(borrower, provedBorrower);
        }
    }
}
