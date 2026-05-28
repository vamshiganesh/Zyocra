// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ProofJsonLib} from "../src/libraries/ProofJsonLib.sol";

contract ProofJsonLibTest is Test {
  function test_loadInstances_matchPythonReference() public {
    string memory path = string.concat(vm.projectRoot(), "/../circuits-baseline/proofs/proof.json");
    vm.skip(!vm.exists(path));

    ProofJsonLib.Artifacts memory artifacts = ProofJsonLib.load(vm.readFile(path));
    assertEq(artifacts.publicInputs.length, 7);
    assertEq(artifacts.publicInputs[0], 34);
    assertEq(artifacts.publicInputs[6], 23);
    assertEq(artifacts.proof.length, 3648);
  }

  function test_loadWithBorrower_appendsBindingLimb() public {
    string memory path = string.concat(vm.projectRoot(), "/../circuits-baseline/proofs/proof.json");
    vm.skip(!vm.exists(path));

    address borrower = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    ProofJsonLib.Artifacts memory artifacts =
      ProofJsonLib.loadWithBorrower(vm.readFile(path), borrower);

    assertEq(artifacts.publicInputs.length, 8);
    assertEq(artifacts.publicInputs[6], 23);
    assertEq(artifacts.publicInputs[7], uint256(uint160(borrower)));
  }
}
