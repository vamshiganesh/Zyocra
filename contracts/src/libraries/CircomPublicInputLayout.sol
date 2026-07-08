// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CircomPublicInputLayout
/// @notice Public signal layout for the LoRA output-head Groth16 circuit.
/// @dev snarkjs / Circom order for `main {public [hidden, borrower]}` with output `logit_acc`:
///      [logit_acc, hidden[0..7], borrower] (public output first, then public inputs).
library CircomPublicInputLayout {
    /// @dev logit_acc + hidden[8] + borrower
    uint256 internal constant CIRCOM_PUBLIC_INPUT_COUNT = 10;

    /// @dev Index of the integer logit accumulator (circuit output; first public signal).
    uint256 internal constant CIRCOM_LOGIT_ACC_INDEX = 0;

    /// @dev Index of the in-circuit borrower binding limb (last public signal).
    uint256 internal constant CIRCOM_BORROWER_INDEX = 9;

    error InvalidPublicInputs(uint256 expected, uint256 actual);

    function requireCircomLayout(uint256[] memory publicInputs) internal pure {
        if (publicInputs.length != CIRCOM_PUBLIC_INPUT_COUNT) {
            revert InvalidPublicInputs(CIRCOM_PUBLIC_INPUT_COUNT, publicInputs.length);
        }
    }

    function logitAcc(uint256[] memory publicInputs) internal pure returns (uint256) {
        requireCircomLayout(publicInputs);
        return publicInputs[CIRCOM_LOGIT_ACC_INDEX];
    }

    function borrower(uint256[] memory publicInputs) internal pure returns (address) {
        requireCircomLayout(publicInputs);
        return address(uint160(publicInputs[CIRCOM_BORROWER_INDEX]));
    }
}
