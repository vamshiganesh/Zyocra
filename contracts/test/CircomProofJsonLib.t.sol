// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CircomProofJsonLib} from "../src/libraries/CircomProofJsonLib.sol";

contract CircomProofJsonHarness {
  function toFixed(uint256[] memory inputs) external pure returns (uint256[10] memory) {
    return CircomProofJsonLib.toFixedPublicInputs(inputs);
  }
}

contract CircomProofJsonLibTest is Test {
  CircomProofJsonHarness internal harness;

  function setUp() public {
    harness = new CircomProofJsonHarness();
  }
  function _proofPath() internal view returns (string memory) {
    return string.concat(vm.projectRoot(), "/../circuits-custom/proofs/proof.json");
  }

  function _publicPath() internal view returns (string memory) {
    return string.concat(vm.projectRoot(), "/../circuits-custom/proofs/public.json");
  }

  function test_load_parsesFixtureArtifacts() public {
    vm.skip(!vm.exists(_proofPath()) || !vm.exists(_publicPath()));

    CircomProofJsonLib.Artifacts memory artifacts =
      CircomProofJsonLib.load(vm.readFile(_proofPath()), vm.readFile(_publicPath()));

    assertEq(artifacts.publicInputs.length, 10);
    assertGt(artifacts.proof.length, 0);
    assertGt(artifacts.groth16.pA[0], 0);
  }

  function test_toFixedPublicInputs_revertsOnWrongLength() public {
    uint256[] memory shortInputs = new uint256[](3);
    vm.expectRevert("CircomProofJsonLib: expected 10 public signals");
    harness.toFixed(shortInputs);
  }
}
