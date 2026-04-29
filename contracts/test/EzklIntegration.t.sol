// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {RiskOracle} from "../src/RiskOracle.sol";
import {RiskConsumer} from "../src/RiskConsumer.sol";
import {Halo2Verifier} from "../src/verifiers/Halo2Verifier.sol";
import {EzklRiskScoreVerifier} from "../src/verifiers/EzklRiskScoreVerifier.sol";
import {DemoCommitments} from "../src/libraries/DemoCommitments.sol";
import {RiskBuckets} from "../src/libraries/RiskBuckets.sol";
import {stdJson} from "forge-std/StdJson.sol";

/// @notice On-chain EZKL proof → oracle → consumer integration (requires generated artifacts).
contract EzklIntegrationTest is Test {
  using stdJson for string;

  address internal borrower = makeAddr("borrower-demo");

  string internal payloadJson;
  bytes internal proof;
  uint256[] internal publicInputs;
  bytes32 internal modelHash;
  bytes32 internal adapterHash;
  uint256 internal scoreBps;
  uint64 internal epoch;

  Halo2Verifier internal halo2;
  EzklRiskScoreVerifier internal ezklVerifier;
  RiskOracle internal oracle;
  RiskConsumer internal consumer;

  function _payloadPath() internal view returns (string memory) {
    return string.concat(vm.projectRoot(), "/../circuits-baseline/proofs/oracle-payload.json");
  }

  function setUp() public {
    string memory path = _payloadPath();
    vm.skip(!vm.exists(path));

    payloadJson = vm.readFile(path);
    proof = payloadJson.readBytes(".proofHex");
    publicInputs = payloadJson.readUintArray(".publicInputs");
    modelHash = payloadJson.readBytes32(".modelHash");
    adapterHash = payloadJson.readBytes32(".adapterHash");
    scoreBps = payloadJson.readUint(".scoreBps");
    epoch = uint64(payloadJson.readUint(".epoch"));

    halo2 = new Halo2Verifier();
    ezklVerifier = new EzklRiskScoreVerifier(address(halo2));
    oracle = new RiskOracle(
      address(this), address(ezklVerifier), DemoCommitments.EZKL_MODEL_HASH, DemoCommitments.EZKL_ADAPTER_HASH
    );
    consumer = new RiskConsumer(address(oracle));
  }

  function test_ezklVerifier_acceptsGeneratedProof() public {
    bool ok = ezklVerifier.verify(proof, publicInputs);
    assertTrue(ok, "EZKL proof should verify on-chain");
  }

  function test_fullLoop_proofToConsumerPolicy() public {
    assertTrue(ezklVerifier.verify(proof, publicInputs));

    vm.expectEmit(true, true, true, false);
    emit RiskOracle.ScoreVerified(epoch, modelHash, adapterHash, scoreBps, 0);

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

    RiskBuckets.Bucket expectedBucket = RiskBuckets.bucketForScore(scoreBps);

    vm.expectEmit(true, true, true, true);
    emit RiskConsumer.CollateralParamsUpdated(
      borrower,
      epoch,
      expectedBucket,
      _collateralFor(expectedBucket),
      _spreadFor(expectedBucket),
      _borrowAllowed(expectedBucket),
      _mitigation(expectedBucket)
    );

    consumer.applyVerifiedScore(borrower, epoch);

    RiskConsumer.BorrowerPolicy memory policy = consumer.getBorrowerPolicy(borrower);
    assertEq(policy.lastEpoch, epoch);
    assertEq(policy.collateralFactorBps, _collateralFor(expectedBucket));
    assertEq(uint8(policy.bucket), uint8(expectedBucket));
  }

  function test_rerun_bumpsEpochWithSameProof() public {
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

    uint64 nextEpoch = epoch + 1;
    oracle.submitScore(
      RiskOracle.ScoreUpdatePayload({
        modelHash: modelHash,
        adapterHash: adapterHash,
        epoch: nextEpoch,
        scoreBps: scoreBps,
        proof: proof,
        publicInputs: publicInputs
      })
    );

    assertEq(oracle.latestEpoch(), nextEpoch);
  }

  function _collateralFor(RiskBuckets.Bucket bucket) internal pure returns (uint256) {
    if (bucket == RiskBuckets.Bucket.LOW) return 8_000;
    if (bucket == RiskBuckets.Bucket.MEDIUM) return 7_200;
    if (bucket == RiskBuckets.Bucket.HIGH) return 6_500;
    return 5_000;
  }

  function _spreadFor(RiskBuckets.Bucket bucket) internal pure returns (uint256) {
    if (bucket == RiskBuckets.Bucket.LOW) return 0;
    if (bucket == RiskBuckets.Bucket.MEDIUM) return 45;
    if (bucket == RiskBuckets.Bucket.HIGH) return 120;
    return 250;
  }

  function _borrowAllowed(RiskBuckets.Bucket bucket) internal pure returns (bool) {
    return bucket == RiskBuckets.Bucket.LOW || bucket == RiskBuckets.Bucket.MEDIUM;
  }

  function _mitigation(RiskBuckets.Bucket bucket) internal pure returns (bool) {
    return bucket == RiskBuckets.Bucket.CRITICAL;
  }
}
