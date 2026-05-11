// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PublicInputLayout} from "./PublicInputLayout.sol";

/// @title ScoreEncoding
/// @notice Map EZKL Q8.8 score limbs to RiskOracle basis points.
library ScoreEncoding {
    /// @dev ml-base activation_scale for score outputs (Q8.8 with scale 128).
    uint256 internal constant EZKL_SCORE_SCALE = 128;
    uint256 internal constant BPS_DENOMINATOR = 10_000;

    error ScoreMismatch(uint256 calldataBps, uint256 provedBps);

    /// @notice Convert decomposed EZKL score limb to basis points (round half up).
    /// @dev scoreBps = round(limb / 128 * 10_000). Demo: limb 23 -> 1797 bps (0.1796875).
    function scoreBpsFromEzklLimb(uint256 limb) internal pure returns (uint256) {
        return (limb * BPS_DENOMINATOR + (EZKL_SCORE_SCALE / 2)) / EZKL_SCORE_SCALE;
    }

    /// @notice Assert calldata score matches the proved EZKL public output limb.
    function requireScoreMatchesPublicInput(uint256 scoreBps, uint256[] memory publicInputs)
        internal
        pure
    {
        PublicInputLayout.requireEzklLayout(publicInputs);
        uint256 provedBps = scoreBpsFromEzklLimb(publicInputs[PublicInputLayout.EZKL_SCORE_INDEX]);
        if (scoreBps != provedBps) {
            revert ScoreMismatch(scoreBps, provedBps);
        }
    }
}
