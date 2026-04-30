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
}
