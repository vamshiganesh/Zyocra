// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PublicInputLayout
/// @notice EZKL full-graph public instance layout for RiskOracle submissions.
library PublicInputLayout {
    /// @dev Six public feature inputs, one public risk-score output, one borrower binding limb.
    uint256 internal constant EZKL_PUBLIC_INPUT_COUNT = 8;

    /// @dev Index of the risk-score Q8.8 limb (activation scale 128) in decomposed public inputs.
    uint256 internal constant EZKL_SCORE_INDEX = 6;

    /// @dev Index of borrower address encoded as uint256 (lower 160 bits) in public inputs.
    uint256 internal constant EZKL_BORROWER_INDEX = 7;

    error InvalidPublicInputs(uint256 expected, uint256 actual);

    function requireEzklLayout(uint256[] memory publicInputs) internal pure {
        if (publicInputs.length != EZKL_PUBLIC_INPUT_COUNT) {
            revert InvalidPublicInputs(EZKL_PUBLIC_INPUT_COUNT, publicInputs.length);
        }
    }
}
