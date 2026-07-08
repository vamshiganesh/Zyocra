// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CircomRiskScoreVerifier} from "../src/verifiers/CircomRiskScoreVerifier.sol";
import {CircomProofJsonLib} from "../src/libraries/CircomProofJsonLib.sol";
import {Groth16Verifier} from "circuits-custom/verifiers/LoraHeadVerifier.sol";

contract CircomRiskScoreVerifierTest is Test {
  function _proofPath() internal view returns (string memory) {
    return string.concat(vm.projectRoot(), "/../circuits-custom/proofs/proof.json");
  }

  function _publicPath() internal view returns (string memory) {
    return string.concat(vm.projectRoot(), "/../circuits-custom/proofs/public.json");
  }

  function test_adapter_acceptsGeneratedProof() public {
    vm.skip(!vm.exists(_proofPath()));

    CircomProofJsonLib.Artifacts memory artifacts =
      CircomProofJsonLib.load(vm.readFile(_proofPath()), vm.readFile(_publicPath()));

    Groth16Verifier groth16 = new Groth16Verifier();
    CircomRiskScoreVerifier adapter = new CircomRiskScoreVerifier(address(groth16));

    bool ok = adapter.verify(artifacts.proof, artifacts.publicInputs);
    assertTrue(ok, "Circom adapter should verify fixture proof");
  }

  function test_adapter_revertsOnWrongPublicInputCount() public {
    Groth16Verifier groth16 = new Groth16Verifier();
    CircomRiskScoreVerifier adapter = new CircomRiskScoreVerifier(address(groth16));

    uint256[] memory inputs = new uint256[](3);
    vm.expectRevert(
      abi.encodeWithSelector(CircomRiskScoreVerifier.InvalidPublicInputs.selector, 10, 3)
    );
    adapter.verify(hex"00", inputs);
  }
}
