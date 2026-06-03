// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {RiskOracle} from "../src/RiskOracle.sol";
import {RiskConsumer} from "../src/RiskConsumer.sol";
import {CircomProofJsonLib} from "../src/libraries/CircomProofJsonLib.sol";
import {DemoCommitments} from "../src/libraries/DemoCommitments.sol";
import {stdJson} from "forge-std/StdJson.sol";

/// @title SubmitAndApplyCircom
/// @notice Submit Circom head proof to oracle and apply verified score on the consumer.
contract SubmitAndApplyCircom is Script {
  using stdJson for string;

  address internal constant DEMO_BORROWER = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;

  function run() external {
    address oracleAddr = vm.envAddress("ORACLE_ADDRESS");
    address consumerAddr = vm.envAddress("CONSUMER_ADDRESS");

    CircomProofJsonLib.Artifacts memory artifacts = CircomProofJsonLib.loadWithBorrower(
      vm.readFile(_proofJsonPath()), vm.readFile(_publicJsonPath()), DEMO_BORROWER
    );

    string memory payloadJson = vm.readFile(_payloadJsonPath());
    bytes32 modelHash = payloadJson.readBytes32(".modelHash");
    bytes32 adapterHash = payloadJson.readBytes32(".adapterHash");
    uint256 scoreBps = payloadJson.readUint(".scoreBps");
    uint64 epoch = uint64(payloadJson.readUint(".epoch"));
    address borrower = vm.parseJsonAddress(payloadJson, ".borrower");
    if (borrower == address(0)) {
      borrower = DEMO_BORROWER;
    }

    RiskOracle oracle = RiskOracle(oracleAddr);
    RiskConsumer consumer = RiskConsumer(consumerAddr);

    uint64 latest = oracle.latestEpoch();
    if (epoch <= latest) {
      epoch = latest + 1;
      console2.log("bumped epoch for rerun", epoch);
    }

    console2.log("==> submitScore (Circom)");
    console2.log("  epoch", epoch);
    console2.log("  scoreBps", scoreBps);
    console2.log("  logit_acc", artifacts.publicInputs[8]);
    console2.log("  borrower", borrower);

    vm.startBroadcast();

    oracle.submitScore(
      RiskOracle.ScoreUpdatePayload({
        modelHash: modelHash,
        adapterHash: adapterHash,
        epoch: epoch,
        scoreBps: scoreBps,
        borrower: borrower,
        proof: artifacts.proof,
        publicInputs: artifacts.publicInputs
      })
    );

    consumer.applyVerifiedScore(borrower, epoch);

    vm.stopBroadcast();

    RiskConsumer.BorrowerPolicy memory policy = consumer.getBorrowerPolicy(borrower);
    console2.log("==> consumer policy");
    console2.log("  bucket", uint8(policy.bucket));
    console2.log("  collateralFactorBps", policy.collateralFactorBps);
    console2.log("  borrowSpreadBps", policy.borrowSpreadBps);
    console2.log("  borrowAllowed", policy.borrowAllowed);
    console2.log("  mitigationFlag", policy.mitigationFlag);
    console2.log("  lastEpoch", policy.lastEpoch);

    string memory objectKey = "result";
    objectKey.serialize("epoch", uint256(epoch));
    objectKey.serialize("scoreBps", scoreBps);
    objectKey.serialize("borrower", borrower);
    objectKey.serialize("bucket", uint256(uint8(policy.bucket)));
    objectKey.serialize("collateralFactorBps", policy.collateralFactorBps);
    objectKey.serialize("borrowSpreadBps", policy.borrowSpreadBps);
    objectKey.serialize("borrowAllowed", policy.borrowAllowed);
    string memory json = objectKey.serialize("mitigationFlag", policy.mitigationFlag);
    json.write("deployments/circom-loop-latest.json");
  }

  function _proofJsonPath() internal view returns (string memory) {
    return string.concat(vm.projectRoot(), "/../circuits-custom/proofs/proof.json");
  }

  function _publicJsonPath() internal view returns (string memory) {
    return string.concat(vm.projectRoot(), "/../circuits-custom/proofs/public.json");
  }

  function _payloadJsonPath() internal view returns (string memory) {
    return string.concat(vm.projectRoot(), "/../circuits-custom/proofs/oracle-payload.json");
  }
}
