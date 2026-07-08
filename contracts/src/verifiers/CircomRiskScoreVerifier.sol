// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRiskScoreVerifier} from "../interfaces/IRiskScoreVerifier.sol";
import {ILoraHeadGroth16Verifier} from "../interfaces/ILoraHeadGroth16Verifier.sol";
import {CircomProofJsonLib} from "../libraries/CircomProofJsonLib.sol";
import {CircomPublicInputLayout} from "../libraries/CircomPublicInputLayout.sol";

/// @title CircomRiskScoreVerifier
/// @notice `IRiskScoreVerifier` adapter for snarkjs-exported Groth16 verifiers.
/// @dev Proof bytes ABI-encode `(uint256[2] pA, uint256[2][2] pB, uint256[2] pC)` with EVM pi_b layout.
///      Public inputs (snarkjs order): logit_acc + hidden[8] + borrower (10 signals).
contract CircomRiskScoreVerifier is IRiskScoreVerifier {
  ILoraHeadGroth16Verifier public immutable groth16;

  error InvalidPublicInputs(uint256 expected, uint256 actual);
  error InvalidProofEncoding();

  event Groth16VerifierLinked(address indexed groth16Verifier);

  constructor(address groth16Verifier_) {
    groth16 = ILoraHeadGroth16Verifier(groth16Verifier_);
    emit Groth16VerifierLinked(groth16Verifier_);
  }

  /// @inheritdoc IRiskScoreVerifier
  function verify(bytes calldata proof, uint256[] calldata publicInputs)
    external
    view
    returns (bool valid)
  {
    if (publicInputs.length != CircomPublicInputLayout.CIRCOM_PUBLIC_INPUT_COUNT) {
      revert InvalidPublicInputs(CircomPublicInputLayout.CIRCOM_PUBLIC_INPUT_COUNT, publicInputs.length);
    }

    (uint256[2] memory pA, uint256[2][2] memory pB, uint256[2] memory pC) =
      abi.decode(proof, (uint256[2], uint256[2][2], uint256[2]));

    uint256[10] memory pub = CircomProofJsonLib.toFixedPublicInputs(publicInputs);
    return groth16.verifyProof(pA, pB, pC, pub);
  }
}
