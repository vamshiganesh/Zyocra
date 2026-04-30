// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {RiskOracle} from "../src/RiskOracle.sol";
import {RiskConsumer} from "../src/RiskConsumer.sol";
import {Halo2Verifier} from "../src/verifiers/Halo2Verifier.sol";
import {EzklRiskScoreVerifier} from "../src/verifiers/EzklRiskScoreVerifier.sol";
import {DemoCommitments} from "../src/libraries/DemoCommitments.sol";
import {stdJson} from "forge-std/StdJson.sol";

/// @title DeployEzkl
/// @notice Deploy oracle stack wired to the EZKL Halo2 verifier (local Anvil).
contract DeployEzkl is Script {
  using stdJson for string;

  struct Deployment {
    address halo2Verifier;
    address ezklVerifier;
    address oracle;
    address consumer;
    bytes32 modelHash;
    bytes32 adapterHash;
  }

  function run() external returns (Deployment memory d) {
    address deployer = vm.envOr("DEPLOYER", msg.sender);

    vm.startBroadcast(deployer);

    Halo2Verifier halo2 = new Halo2Verifier();
    EzklRiskScoreVerifier ezkl = new EzklRiskScoreVerifier(address(halo2));
    RiskOracle oracle = new RiskOracle(
      deployer,
      address(ezkl),
      DemoCommitments.EZKL_MODEL_HASH,
      DemoCommitments.EZKL_ADAPTER_HASH
    );
    RiskConsumer consumer = new RiskConsumer(address(oracle));

    vm.stopBroadcast();

    d = Deployment({
      halo2Verifier: address(halo2),
      ezklVerifier: address(ezkl),
      oracle: address(oracle),
      consumer: address(consumer),
      modelHash: DemoCommitments.EZKL_MODEL_HASH,
      adapterHash: DemoCommitments.EZKL_ADAPTER_HASH
    });

    _writeDeployment(d);
    _logDeployment(d);
  }

  function _writeDeployment(Deployment memory d) internal {
    string memory json = "deployment";
    json = json.serialize("halo2Verifier", d.halo2Verifier);
    json = json.serialize("ezklVerifier", d.ezklVerifier);
    json = json.serialize("oracle", d.oracle);
    json = json.serialize("consumer", d.consumer);
    json = json.serialize("modelHash", d.modelHash);
    json = json.serialize("adapterHash", d.adapterHash);
    json.write("deployment", "deployments/anvil-ezkl-latest.json");
  }

  function _logDeployment(Deployment memory d) internal view {
    console2.log("Halo2Verifier", d.halo2Verifier);
    console2.log("EzklRiskScoreVerifier", d.ezklVerifier);
    console2.log("RiskOracle", d.oracle);
    console2.log("RiskConsumer", d.consumer);
    console2.log("modelHash", vm.toString(d.modelHash));
    console2.log("adapterHash", vm.toString(d.adapterHash));
  }
}
