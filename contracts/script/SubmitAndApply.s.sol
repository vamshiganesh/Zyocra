// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {RiskOracle} from "../src/RiskOracle.sol";
import {RiskConsumer} from "../src/RiskConsumer.sol";
import {RiskBuckets} from "../src/libraries/RiskBuckets.sol";
import {stdJson} from "forge-std/StdJson.sol";

/// @title SubmitAndApply
/// @notice Submit EZKL proof to oracle and apply verified score on the consumer.
/// @dev Reads `circuits-baseline/proofs/oracle-payload.json`. Bumps epoch when rerunning
///      against an oracle that already has a newer epoch committed.
contract SubmitAndApply is Script {
  using stdJson for string;

  /// @dev Anvil account #1 — deterministic demo borrower.
  address internal constant DEMO_BORROWER = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;

  function run() external {
    address oracleAddr = vm.envAddress("ORACLE_ADDRESS");
    address consumerAddr = vm.envAddress("CONSUMER_ADDRESS");

    string memory payloadPath = _payloadPath();
    string memory payloadJson = vm.readFile(payloadPath);

    bytes memory proof = payloadJson.readBytes(".proofHex");
    uint256[] memory publicInputs = payloadJson.readUintArray(".publicInputs");
    bytes32 modelHash = payloadJson.readBytes32(".modelHash");
    bytes32 adapterHash = payloadJson.readBytes32(".adapterHash");
    uint256 scoreBps = payloadJson.readUint(".scoreBps");
    uint64 epoch = uint64(payloadJson.readUint(".epoch"));

    RiskOracle oracle = RiskOracle(oracleAddr);
    RiskConsumer consumer = RiskConsumer(consumerAddr);

    uint64 latest = oracle.latestEpoch();
    if (epoch <= latest) {
      epoch = latest + 1;
      console2.log("bumped epoch for rerun", epoch);
    }

    console2.log("==> submitScore");
    console2.log("  epoch", epoch);
    console2.log("  scoreBps", scoreBps);
    console2.log("  proof bytes", proof.length);
    console2.log("  public inputs", publicInputs.length);

    vm.startBroadcast();

    oracle.submitScore(
      RiskOracle.ScoreUpdatePayload({
        modelHash: modelHash,
        adapterHash: adapterHash,
        epoch: epoch,
        scoreBps: scoreBps,
        proof: proof,
        publicInputs: publicInputs
      })
    );

    console2.log("==> applyVerifiedScore");
    console2.log("  borrower", DEMO_BORROWER);

    consumer.applyVerifiedScore(DEMO_BORROWER, epoch);

    vm.stopBroadcast();

    RiskConsumer.BorrowerPolicy memory policy = consumer.getBorrowerPolicy(DEMO_BORROWER);
    console2.log("==> consumer policy");
    console2.log("  bucket", uint8(policy.bucket));
    console2.log("  collateralFactorBps", policy.collateralFactorBps);
    console2.log("  borrowSpreadBps", policy.borrowSpreadBps);
    console2.log("  borrowAllowed", policy.borrowAllowed);
    console2.log("  mitigationFlag", policy.mitigationFlag);
    console2.log("  lastEpoch", policy.lastEpoch);

    string memory result = "result";
    string memory out = result.serialize("epoch", uint256(epoch));
    out = out.serialize("scoreBps", scoreBps);
    out = out.serialize("borrower", DEMO_BORROWER);
    out = out.serialize("bucket", uint8(policy.bucket));
    out = out.serialize("collateralFactorBps", policy.collateralFactorBps);
    out = out.serialize("borrowSpreadBps", policy.borrowSpreadBps);
    out = out.serialize("borrowAllowed", policy.borrowAllowed);
    out = out.serialize("mitigationFlag", policy.mitigationFlag);
    out.write("deployments/phase1-loop-latest.json");
  }
}
