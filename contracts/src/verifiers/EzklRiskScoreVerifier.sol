// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRiskScoreVerifier} from "../interfaces/IRiskScoreVerifier.sol";
import {Halo2Verifier} from "./Halo2Verifier.sol";

/// @title EzklRiskScoreVerifier
/// @notice `IRiskScoreVerifier` adapter for EZKL-generated Halo2 verifiers.
/// @dev Wraps `Halo2Verifier.verifyProof` (non-view) behind the oracle adapter surface.
contract EzklRiskScoreVerifier is IRiskScoreVerifier {
  Halo2Verifier public immutable halo2;

  event Halo2VerifierLinked(address indexed halo2Verifier);

  constructor(address halo2Verifier_) {
    halo2 = Halo2Verifier(halo2Verifier_);
    emit Halo2VerifierLinked(halo2Verifier_);
  }

  /// @inheritdoc IRiskScoreVerifier
  function verify(bytes calldata proof, uint256[] calldata publicInputs)
    external
    returns (bool valid)
  {
    return halo2.verifyProof(proof, publicInputs);
  }
}
