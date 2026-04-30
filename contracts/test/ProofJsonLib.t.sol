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
    assertEq(
      artifacts.publicInputs[0],
      15378636851831057204693021446466362761762419838405387411490460376050962530304
    );
    assertEq(artifacts.proof.length, 3648);
  }
}
