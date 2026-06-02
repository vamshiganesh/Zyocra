// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CircomPublicInputLayout
/// @notice Public signal layout for the LoRA output-head Groth16 circuit.
library CircomPublicInputLayout {
    /// @dev hidden[8] + logit_acc
    uint256 internal constant CIRCOM_PUBLIC_INPUT_COUNT = 9;

    /// @dev Index of the integer logit accumulator (pre-bias, pre-sigmoid).
    uint256 internal constant CIRCOM_LOGIT_ACC_INDEX = 8;

    /// @dev Optional borrower binding limb appended after circuit public signals.
    uint256 internal constant CIRCOM_BORROWER_INDEX = 9;

    /// @dev Extended layout: 9 circuit signals + 1 borrower binding limb.
    uint256 internal constant CIRCOM_EXTENDED_INPUT_COUNT = 10;

    error InvalidPublicInputs(uint256 expected, uint256 actual);

    function requireCircomLayout(uint256[] memory publicInputs) internal pure {
        if (
            publicInputs.length != CIRCOM_PUBLIC_INPUT_COUNT
                && publicInputs.length != CIRCOM_EXTENDED_INPUT_COUNT
        ) {
            revert InvalidPublicInputs(CIRCOM_EXTENDED_INPUT_COUNT, publicInputs.length);
        }
    }

    function logitAcc(uint256[] memory publicInputs) internal pure returns (uint256) {
        requireCircomLayout(publicInputs);
        return publicInputs[CIRCOM_LOGIT_ACC_INDEX];
    }
}
