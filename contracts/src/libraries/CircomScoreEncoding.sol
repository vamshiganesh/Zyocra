// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {CircomPublicInputLayout} from "./CircomPublicInputLayout.sol";
import {DemoCommitments} from "./DemoCommitments.sol";

/// @title CircomScoreEncoding
/// @notice Map Circom `logit_acc` public signals to RiskOracle basis points.
/// @dev Bias and sigmoid are applied off-circuit; on-chain uses committed bias + Taylor sigmoid.
library CircomScoreEncoding {
    uint256 internal constant WAD = 1e18;
    uint256 internal constant LOGIT_DENOMINATOR = 128 * 256;
    uint256 internal constant HIGH_LOGIT_ACC = 20 * LOGIT_DENOMINATOR;

    error ScoreMismatch(uint256 calldataBps, uint256 provedBps);
    error BorrowerMismatch(address calldataBorrower, address provedBorrower);

    /// @notice Convert integer logit_acc to basis points using committed output bias.
    function scoreBpsFromLogitAcc(uint256 logitAcc) internal pure returns (uint256) {
        if (logitAcc >= HIGH_LOGIT_ACC) {
            return 10_000;
        }

        int256 biasWad = DemoCommitments.CIRCOM_OUTPUT_BIAS_WAD;
        int256 xWad = int256((logitAcc * WAD) / LOGIT_DENOMINATOR) + biasWad;

        if (xWad >= 20 * int256(WAD)) {
            return 10_000;
        }
        if (xWad <= -20 * int256(WAD)) {
            return 0;
        }

        int256 sigmoidWad = int256(WAD / 2) + xWad / 4;
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

    /// @notice Assert borrower binding limb when extended public inputs are provided.
    function requireBorrowerMatchesPublicInput(address borrower, uint256[] memory publicInputs)
        internal
        pure
    {
        if (publicInputs.length != CircomPublicInputLayout.CIRCOM_EXTENDED_INPUT_COUNT) {
            return;
        }
        address provedBorrower =
            address(uint160(publicInputs[CircomPublicInputLayout.CIRCOM_BORROWER_INDEX]));
        if (borrower != provedBorrower) {
            revert BorrowerMismatch(borrower, provedBorrower);
        }
    }
}
