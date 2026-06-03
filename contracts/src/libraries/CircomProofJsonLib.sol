// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {stdJson} from "forge-std/StdJson.sol";

/// @title CircomProofJsonLib
/// @notice Parse snarkjs Groth16 `proof.json` + `public.json` for EVM verification.
library CircomProofJsonLib {
  using stdJson for string;

  uint256 internal constant PUBLIC_INPUT_COUNT = 9;

  struct Groth16Proof {
    uint256[2] pA;
    uint256[2][2] pB;
    uint256[2] pC;
  }

  struct Artifacts {
    bytes proof;
    uint256[] publicInputs;
    Groth16Proof groth16;
  }

  /// @notice Load proof + public signals; applies pi_b Fq2 swap for EVM verifiers.
  function load(string memory proofJson, string memory publicJson) internal pure returns (Artifacts memory) {
    Groth16Proof memory groth16 = _loadGroth16(proofJson);
    uint256[] memory publicInputs = _loadPublicSignals(publicJson);
    return Artifacts({proof: abi.encode(groth16.pA, groth16.pB, groth16.pC), publicInputs: publicInputs, groth16: groth16});
  }

  /// @notice Load Groth16 artifacts and append borrower binding as the 10th public input.
  function loadWithBorrower(string memory proofJson, string memory publicJson, address borrower)
    internal
    pure
    returns (Artifacts memory)
  {
    Artifacts memory base = load(proofJson, publicJson);
    uint256[] memory extended = new uint256[](base.publicInputs.length + 1);
    for (uint256 i = 0; i < base.publicInputs.length; i++) {
      extended[i] = base.publicInputs[i];
    }
    extended[base.publicInputs.length] = uint256(uint160(borrower));
    return Artifacts({proof: base.proof, publicInputs: extended, groth16: base.groth16});
  }

  function _loadGroth16(string memory proofJson) private pure returns (Groth16Proof memory groth16) {
    groth16.pA[0] = proofJson.readUint(".pi_a[0]");
    groth16.pA[1] = proofJson.readUint(".pi_a[1]");

    uint256 b00 = proofJson.readUint(".pi_b[0][0]");
    uint256 b01 = proofJson.readUint(".pi_b[0][1]");
    uint256 b10 = proofJson.readUint(".pi_b[1][0]");
    uint256 b11 = proofJson.readUint(".pi_b[1][1]");
    groth16.pB[0][0] = b01;
    groth16.pB[0][1] = b00;
    groth16.pB[1][0] = b11;
    groth16.pB[1][1] = b10;

    groth16.pC[0] = proofJson.readUint(".pi_c[0]");
    groth16.pC[1] = proofJson.readUint(".pi_c[1]");
  }

  function _loadPublicSignals(string memory publicJson) private pure returns (uint256[] memory publicInputs) {
    publicInputs = new uint256[](PUBLIC_INPUT_COUNT);
    publicInputs[0] = publicJson.readUint("[0]");
    publicInputs[1] = publicJson.readUint("[1]");
    publicInputs[2] = publicJson.readUint("[2]");
    publicInputs[3] = publicJson.readUint("[3]");
    publicInputs[4] = publicJson.readUint("[4]");
    publicInputs[5] = publicJson.readUint("[5]");
    publicInputs[6] = publicJson.readUint("[6]");
    publicInputs[7] = publicJson.readUint("[7]");
    publicInputs[8] = publicJson.readUint("[8]");
  }

  function toFixedPublicInputs(uint256[] memory publicInputs) internal pure returns (uint256[9] memory fixedInputs) {
    if (publicInputs.length != PUBLIC_INPUT_COUNT) {
      revert("CircomProofJsonLib: expected 9 public signals");
    }
    for (uint256 i = 0; i < PUBLIC_INPUT_COUNT; i++) {
      fixedInputs[i] = publicInputs[i];
    }
  }
}
