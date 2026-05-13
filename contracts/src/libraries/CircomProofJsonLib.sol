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
    return Artifacts({
      proof: abi.encode(groth16.pA, groth16.pB, groth16.pC),
      publicInputs: publicInputs,
      groth16: groth16
    });
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
    string[] memory signals = publicJson.readStringArray("$");
    publicInputs = new uint256[](signals.length);
    for (uint256 i = 0; i < signals.length; i++) {
      publicInputs[i] = _decimalStringToUint(signals[i]);
    }
  }

  function toFixedPublicInputs(uint256[] memory publicInputs) internal pure returns (uint256[9] memory fixedInputs) {
    if (publicInputs.length != PUBLIC_INPUT_COUNT) {
      revert("CircomProofJsonLib: expected 9 public signals");
    }
    for (uint256 i = 0; i < PUBLIC_INPUT_COUNT; i++) {
      fixedInputs[i] = publicInputs[i];
    }
  }

  function _decimalStringToUint(string memory decimalString) private pure returns (uint256) {
    bytes memory chars = bytes(decimalString);
    uint256 value;
    for (uint256 i = 0; i < chars.length; i++) {
      uint8 ch = uint8(chars[i]);
      if (ch < uint8(bytes1("0")) || ch > uint8(bytes1("9"))) {
        revert("CircomProofJsonLib: invalid decimal");
      }
      value = value * 10 + (ch - uint8(bytes1("0")));
    }
    return value;
  }
}
