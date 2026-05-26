// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {RiskOracle} from "../src/RiskOracle.sol";
import {RiskConsumer} from "../src/RiskConsumer.sol";
import {ProofJsonLib} from "../src/libraries/ProofJsonLib.sol";
import {stdJson} from "forge-std/StdJson.sol";

/// @title SubmitAndApply
/// @notice Submit EZKL proof to oracle and apply verified score on the consumer.
/// @dev Proof bytes + public instances are loaded from `proof.json` (canonical EZKL format).
///      Metadata (epoch, score, hashes) comes from `oracle-payload.json`.
contract SubmitAndApply is Script {
  using stdJson for string;

  /// @dev Anvil account #1 — deterministic demo borrower.
  address internal constant DEMO_BORROWER = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;

  function run() external {
    address oracleAddr = vm.envAddress("ORACLE_ADDRESS");
    address consumerAddr = vm.envAddress("CONSUMER_ADDRESS");

    ProofJsonLib.Artifacts memory artifacts =
      ProofJsonLib.loadWithBorrower(vm.readFile(_proofJsonPath()), DEMO_BORROWER);

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

    console2.log("==> submitScore");
    console2.log("  epoch", epoch);
    console2.log("  scoreBps", scoreBps);
    console2.log("  proof bytes", artifacts.proof.length);
    console2.log("  public inputs", artifacts.publicInputs.length);

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

    console2.log("==> applyVerifiedScore");
    console2.log("  borrower", borrower);

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
    json.write("deployments/phase1-loop-latest.json");
  }

  function _proofJsonPath() internal view returns (string memory) {
    return string.concat(vm.projectRoot(), "/../circuits-baseline/proofs/proof.json");
  }

  function _payloadJsonPath() internal view returns (string memory) {
    return string.concat(vm.projectRoot(), "/../circuits-baseline/proofs/oracle-payload.json");
  }
}
