// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Halo2Verifier} from "../src/verifiers/Halo2Verifier.sol";
import {ProofJsonLib} from "../src/libraries/ProofJsonLib.sol";

contract Halo2SmokeTest is Test {
  function test_verifyProof_onFreshDeploy() public {
    string memory path = string.concat(vm.projectRoot(), "/../circuits-baseline/proofs/proof.json");
    vm.skip(!vm.exists(path));

    ProofJsonLib.Artifacts memory artifacts = ProofJsonLib.load(vm.readFile(path));
    Halo2Verifier halo2 = new Halo2Verifier();
    bool ok = halo2.verifyProof(artifacts.proof, artifacts.publicInputs);
    assertTrue(ok);
  }

  function test_verifyProof_onAnvilDeploy() public {
    string memory path = string.concat(vm.projectRoot(), "/../circuits-baseline/proofs/proof.json");
    vm.skip(!vm.exists(path));

    try vm.createSelectFork("http://127.0.0.1:8545") {
      // deployed by DeployEzkl earlier
      Halo2Verifier halo2 = Halo2Verifier(0x5FbDB2315678afecb367f032d93F642f64180aa3);
      ProofJsonLib.Artifacts memory artifacts = ProofJsonLib.load(vm.readFile(path));
      bool ok = halo2.verifyProof(artifacts.proof, artifacts.publicInputs);
      assertTrue(ok);
    } catch {
      vm.skip(true);
    }
  }
}
