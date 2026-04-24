// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IRiskScoreVerifier
/// @notice Adapter surface for on-chain zk proof verification (EZKL / Circom verifiers).
/// @dev Phase 1 uses `StubRiskScoreVerifier` locally. Production wiring swaps the
///      deployed address on `RiskOracle` without changing oracle logic.
interface IRiskScoreVerifier {
    /// @notice Verify a serialized proof against public inputs.
    /// @param proof Proof bytes from the off-chain prover (format depends on verifier).
    /// @param publicInputs Public field elements committed by the circuit (score, hashes, epoch, …).
    /// @return valid True when the proof is valid on-chain.
    function verify(bytes calldata proof, uint256[] calldata publicInputs)
        external
        view
        returns (bool valid);
}
