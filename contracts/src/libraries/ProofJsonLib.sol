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
      // EZKL EVM verifier expects decomposed field limbs (see encode_evm_calldata).
      publicInputs[i] = _hexStringToUint(instanceHex[i]) >> 248;
    }
    return Artifacts({proof: proof, publicInputs: publicInputs});
  }

  /// @notice Load EZKL proof artifacts and append borrower binding as the 8th public input.
  function loadWithBorrower(string memory proofJson, address borrower)
    internal
    pure
    returns (Artifacts memory)
  {
    Artifacts memory base = load(proofJson);
    uint256[] memory extended = new uint256[](base.publicInputs.length + 1);
    for (uint256 i = 0; i < base.publicInputs.length; i++) {
      extended[i] = base.publicInputs[i];
    }
    extended[base.publicInputs.length] = uint256(uint160(borrower));
    return Artifacts({proof: base.proof, publicInputs: extended});
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
