// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {RiskOracle} from "../src/RiskOracle.sol";
import {RiskConsumer} from "../src/RiskConsumer.sol";
import {CircomRiskScoreVerifier} from "../src/verifiers/CircomRiskScoreVerifier.sol";
import {DemoCommitments} from "../src/libraries/DemoCommitments.sol";
import {Groth16Verifier} from "circuits-custom/verifiers/LoraHeadVerifier.sol";
import {stdJson} from "forge-std/StdJson.sol";

/// @title DeployCircomOracle
/// @notice Deploy oracle stack wired to the Circom Groth16 head verifier.
contract DeployCircomOracle is Script {
  using stdJson for string;

  struct Deployment {
    address groth16Verifier;
    address circomVerifier;
    address oracle;
    address consumer;
    bytes32 modelHash;
    bytes32 adapterHash;
  }

  function run() external returns (Deployment memory d) {
    address deployer = vm.envOr("DEPLOYER", msg.sender);

    vm.startBroadcast(deployer);

    Groth16Verifier groth16 = new Groth16Verifier();
    CircomRiskScoreVerifier circom = new CircomRiskScoreVerifier(address(groth16));
    RiskOracle oracle = new RiskOracle(
      deployer,
      address(circom),
      DemoCommitments.CIRCOM_MODEL_HASH,
      DemoCommitments.CIRCOM_ADAPTER_HASH
    );
    RiskConsumer consumer = new RiskConsumer(address(oracle), deployer);

    vm.stopBroadcast();

    d = Deployment({
      groth16Verifier: address(groth16),
      circomVerifier: address(circom),
      oracle: address(oracle),
      consumer: address(consumer),
      modelHash: DemoCommitments.CIRCOM_MODEL_HASH,
      adapterHash: DemoCommitments.CIRCOM_ADAPTER_HASH
    });

    _writeDeployment(d);
    _logDeployment(d);
  }

  function _writeDeployment(Deployment memory d) internal {
    string memory objectKey = "deployment";
    objectKey.serialize("groth16Verifier", d.groth16Verifier);
    objectKey.serialize("circomVerifier", d.circomVerifier);
    objectKey.serialize("oracle", d.oracle);
    objectKey.serialize("consumer", d.consumer);
    objectKey.serialize("modelHash", d.modelHash);
    string memory json = objectKey.serialize("adapterHash", d.adapterHash);
    string memory outfile = vm.envOr("DEPLOY_OUTFILE", string("deployments/anvil-circom-oracle-latest.json"));
    json.write(outfile);
  }

  function _logDeployment(Deployment memory d) internal pure {
    console2.log("Groth16Verifier", d.groth16Verifier);
    console2.log("CircomRiskScoreVerifier", d.circomVerifier);
    console2.log("RiskOracle", d.oracle);
    console2.log("RiskConsumer", d.consumer);
    console2.logBytes32(d.modelHash);
    console2.logBytes32(d.adapterHash);
  }
}
