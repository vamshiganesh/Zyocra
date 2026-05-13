// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRiskScoreVerifier} from "../interfaces/IRiskScoreVerifier.sol";
import {CircomProofJsonLib} from "../libraries/CircomProofJsonLib.sol";
import {Groth16Verifier} from "circuits-custom/verifiers/LoraHeadVerifier.sol";

/// @title CircomRiskScoreVerifier
/// @notice `IRiskScoreVerifier` adapter for snarkjs-exported Groth16 verifiers.
/// @dev Proof bytes ABI-encode `(uint256[2] pA, uint256[2][2] pB, uint256[2] pC)` with EVM pi_b layout.
///      Public inputs: 9 signals — hidden[8] + logit_acc (see docs/circom.md).
contract CircomRiskScoreVerifier is IRiskScoreVerifier {
  Groth16Verifier public immutable groth16;

  error InvalidPublicInputs(uint256 expected, uint256 actual);
  error InvalidProofEncoding();

  event Groth16VerifierLinked(address indexed groth16Verifier);

  constructor(address groth16Verifier_) {
    groth16 = Groth16Verifier(groth16Verifier_);
    emit Groth16VerifierLinked(groth16Verifier_);
  }

  /// @inheritdoc IRiskScoreVerifier
  function verify(bytes calldata proof, uint256[] calldata publicInputs)
    external
    returns (bool valid)
  {
    if (publicInputs.length != CircomProofJsonLib.PUBLIC_INPUT_COUNT) {
      revert InvalidPublicInputs(CircomProofJsonLib.PUBLIC_INPUT_COUNT, publicInputs.length);
    }

    (uint256[2] memory pA, uint256[2][2] memory pB, uint256[2] memory pC) =
      abi.decode(proof, (uint256[2], uint256[2][2], uint256[2]));

    uint256[9] memory pub = CircomProofJsonLib.toFixedPublicInputs(publicInputs);
    return groth16.verifyProof(pA, pB, pC, pub);
  }
}
