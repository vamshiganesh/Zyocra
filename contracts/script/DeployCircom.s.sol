// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {CircomRiskScoreVerifier} from "../src/verifiers/CircomRiskScoreVerifier.sol";
import {Groth16Verifier} from "circuits-custom/verifiers/LoraHeadVerifier.sol";
import {stdJson} from "forge-std/StdJson.sol";

/// @title DeployCircom
/// @notice Deploy Groth16 verifier + adapter (standalone; not wired to RiskOracle in Phase 1).
contract DeployCircom is Script {
  using stdJson for string;

  struct Deployment {
    address groth16Verifier;
    address circomAdapter;
  }

  function run() external returns (Deployment memory d) {
    address deployer = vm.envOr("DEPLOYER", msg.sender);

    vm.startBroadcast(deployer);

    Groth16Verifier groth16 = new Groth16Verifier();
    CircomRiskScoreVerifier adapter = new CircomRiskScoreVerifier(address(groth16));

    vm.stopBroadcast();

    d = Deployment({groth16Verifier: address(groth16), circomAdapter: address(adapter)});

    _writeDeployment(d);
    console2.log("Groth16Verifier", d.groth16Verifier);
    console2.log("CircomRiskScoreVerifier", d.circomAdapter);
  }

  function _writeDeployment(Deployment memory d) internal {
    string memory objectKey = "deployment";
    objectKey.serialize("groth16Verifier", d.groth16Verifier);
    string memory json = objectKey.serialize("circomAdapter", d.circomAdapter);
    json.write("deployments/anvil-circom-latest.json");
  }
}
