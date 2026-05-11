// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RiskOracle} from "../src/RiskOracle.sol";
import {RiskConsumer} from "../src/RiskConsumer.sol";
import {Halo2Verifier} from "../src/verifiers/Halo2Verifier.sol";
import {EzklRiskScoreVerifier} from "../src/verifiers/EzklRiskScoreVerifier.sol";
import {DemoCommitments} from "../src/libraries/DemoCommitments.sol";
import {ProofJsonLib} from "../src/libraries/ProofJsonLib.sol";
import {RiskBuckets} from "../src/libraries/RiskBuckets.sol";
import {RiskPolicies} from "../src/libraries/RiskPolicies.sol";
import {ScoreEncoding} from "../src/libraries/ScoreEncoding.sol";
import {stdJson} from "forge-std/StdJson.sol";

/// @notice On-chain EZKL proof → oracle → consumer integration (requires generated artifacts).
contract EzklIntegrationTest is Test {
  using stdJson for string;

  address internal borrower = makeAddr("borrower-demo");

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

  function _proofJsonPath() internal view returns (string memory) {
    return string.concat(vm.projectRoot(), "/../circuits-baseline/proofs/proof.json");
  }

  function _payloadJsonPath() internal view returns (string memory) {
    return string.concat(vm.projectRoot(), "/../circuits-baseline/proofs/oracle-payload.json");
  }

  function setUp() public {
    vm.skip(!vm.exists(_proofJsonPath()));

    ProofJsonLib.Artifacts memory artifacts =
      ProofJsonLib.load(vm.readFile(_proofJsonPath()));
    proof = artifacts.proof;
    publicInputs = artifacts.publicInputs;

    string memory payloadJson = vm.readFile(_payloadJsonPath());
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
    RiskPolicies.Policy memory expected = RiskPolicies.policyFor(expectedBucket);

    consumer.applyVerifiedScore(borrower, epoch);

    RiskConsumer.BorrowerPolicy memory policy = consumer.getBorrowerPolicy(borrower);
    assertEq(policy.lastEpoch, epoch);
    assertEq(uint8(policy.bucket), uint8(expectedBucket));
    assertEq(policy.collateralFactorBps, expected.collateralFactorBps);
    assertEq(policy.borrowSpreadBps, expected.borrowSpreadBps);
    assertEq(policy.borrowAllowed, expected.borrowAllowed);
    assertEq(policy.mitigationFlag, expected.mitigationFlag);
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

  function test_submitScore_revertsOnTamperedScoreBps() public {
    assertTrue(ezklVerifier.verify(proof, publicInputs));

    vm.expectRevert(
      abi.encodeWithSelector(
        ScoreEncoding.ScoreMismatch.selector,
        scoreBps + 1,
        ScoreEncoding.scoreBpsFromEzklLimb(publicInputs[6])
      )
    );
    oracle.submitScore(
      RiskOracle.ScoreUpdatePayload({
        modelHash: modelHash,
        adapterHash: adapterHash,
        epoch: epoch,
        scoreBps: scoreBps + 1,
        proof: proof,
        publicInputs: publicInputs
      })
    );
  }
}
