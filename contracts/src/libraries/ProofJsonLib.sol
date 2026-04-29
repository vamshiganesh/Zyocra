// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {stdJson} from "forge-std/StdJson.sol";

/// @title ProofJsonLib
/// @notice Parse EZKL `proof.json` artifacts for on-chain submission.
library ProofJsonLib {
  using stdJson for string;

  struct Artifacts {
    bytes proof;
    uint256[] publicInputs;
  }

  function load(string memory proofJson) internal pure returns (Artifacts memory) {
    bytes memory proof = proofJson.readBytes(".hex_proof");
    string[] memory instanceHex = proofJson.readStringArray(".instances[0]");
    uint256[] memory publicInputs = new uint256[](instanceHex.length);
    for (uint256 i = 0; i < instanceHex.length; i++) {
      publicInputs[i] = _hexStringToUint(instanceHex[i]);
    }
    return Artifacts({proof: proof, publicInputs: publicInputs});
  }

  function _hexStringToUint(string memory hexString) private pure returns (uint256) {
    bytes memory chars = bytes(hexString);
    uint256 value;
    for (uint256 i = 0; i < chars.length; i++) {
      uint8 ch = uint8(chars[i]);
      uint8 digit;
      if (ch >= uint8(bytes1("0")) && ch <= uint8(bytes1("9"))) {
        digit = ch - uint8(bytes1("0"));
      } else if (ch >= uint8(bytes1("a")) && ch <= uint8(bytes1("f"))) {
        digit = 10 + ch - uint8(bytes1("a"));
      } else if (ch >= uint8(bytes1("A")) && ch <= uint8(bytes1("F"))) {
        digit = 10 + ch - uint8(bytes1("A"));
      } else {
        revert("invalid hex");
      }
      value = (value << 4) + digit;
    }
    return value;
  }
}
