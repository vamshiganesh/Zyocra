// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {EzklRiskScoreVerifier} from "../src/verifiers/EzklRiskScoreVerifier.sol";
import {Halo2Verifier} from "../src/verifiers/Halo2Verifier.sol";
import {ProofJsonLib} from "../src/libraries/ProofJsonLib.sol";
import {Groth16Verifier} from "circuits-custom/verifiers/LoraHeadVerifier.sol";
import {stdJson} from "forge-std/StdJson.sol";

/// @dev Logs gas for benchmarks/zyocra_bench/gas_bench.py (standalone verifier calls).
contract BenchmarkGasTest is Test {
  using stdJson for string;

  function _gasInputPath() internal view returns (string memory) {
    return string.concat(vm.projectRoot(), "/../benchmarks/raw-results/gas-input.json");
  }

  function _ezklProofPath() internal view returns (string memory) {
    return string.concat(vm.projectRoot(), "/../circuits-baseline/proofs/proof.json");
  }

  function test_gas_ezklVerify() public {
    vm.skip(!vm.exists(_ezklProofPath()));

    ProofJsonLib.Artifacts memory artifacts = ProofJsonLib.load(vm.readFile(_ezklProofPath()));
    Halo2Verifier halo2 = new Halo2Verifier();
    EzklRiskScoreVerifier verifier = new EzklRiskScoreVerifier(address(halo2));

    uint256 g0 = gasleft();
    bool ok = verifier.verify(artifacts.proof, artifacts.publicInputs);
    uint256 used = g0 - gasleft();
    assertTrue(ok);
    console2.log("EZKL_VERIFY_GAS:", used);
  }

  function test_gas_circomVerify() public {
    string memory path = _gasInputPath();
    vm.skip(!vm.exists(path));

    string memory raw = vm.readFile(path);
    Groth16Verifier verifier = new Groth16Verifier();

    uint256[2] memory pA;
    uint256[2][2] memory pB;
    uint256[2] memory pC;
    uint256[10] memory pub;

    pA[0] = raw.readUint(".circom.pi_a[0]");
    pA[1] = raw.readUint(".circom.pi_a[1]");
    pB[0][0] = raw.readUint(".circom.pi_b[0][0]");
    pB[0][1] = raw.readUint(".circom.pi_b[0][1]");
    pB[1][0] = raw.readUint(".circom.pi_b[1][0]");
    pB[1][1] = raw.readUint(".circom.pi_b[1][1]");
    pC[0] = raw.readUint(".circom.pi_c[0]");
    pC[1] = raw.readUint(".circom.pi_c[1]");
    for (uint256 i = 0; i < 10; i++) {
      pub[i] = raw.readUint(string(abi.encodePacked(".circom.pub_signals[", vm.toString(i), "]")));
    }

    uint256 g0 = gasleft();
    bool ok = verifier.verifyProof(pA, pB, pC, pub);
    uint256 used = g0 - gasleft();
    assertTrue(ok, "circom proof should verify");
    console2.log("CIRCOM_VERIFY_GAS:", used);
  }
}
