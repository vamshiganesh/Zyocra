// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ILoraHeadGroth16Verifier
/// @notice ABI for snarkjs-exported LoRA-head Groth16 verifiers (10 public signals).
/// @dev Declared separately from `circuits-custom/verifiers/LoraHeadVerifier.sol` so
///      remapped/stale IDE copies of the generated file cannot desync to uint[9].
interface ILoraHeadGroth16Verifier {
    function verifyProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[10] calldata _pubSignals
    ) external view returns (bool);
}
