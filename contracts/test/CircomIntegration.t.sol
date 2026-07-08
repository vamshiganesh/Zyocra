// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RiskOracle} from "../src/RiskOracle.sol";
import {RiskConsumer} from "../src/RiskConsumer.sol";
import {CircomRiskScoreVerifier} from "../src/verifiers/CircomRiskScoreVerifier.sol";
import {CircomProofJsonLib} from "../src/libraries/CircomProofJsonLib.sol";
import {CircomScoreEncoding} from "../src/libraries/CircomScoreEncoding.sol";
import {CircomPublicInputLayout} from "../src/libraries/CircomPublicInputLayout.sol";
import {DemoCommitments} from "../src/libraries/DemoCommitments.sol";
import {RiskBuckets} from "../src/libraries/RiskBuckets.sol";
import {RiskPolicies} from "../src/libraries/RiskPolicies.sol";
import {Groth16Verifier} from "circuits-custom/verifiers/LoraHeadVerifier.sol";
import {stdJson} from "forge-std/StdJson.sol";

/// @notice On-chain Circom proof → oracle → consumer integration (requires generated artifacts).
contract CircomIntegrationTest is Test {
  using stdJson for string;

  address internal constant BORROWER = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;

  bytes internal proof;
  uint256[] internal publicInputs;
  uint256 internal scoreBps;
  uint64 internal epoch;

  Groth16Verifier internal groth16;
  CircomRiskScoreVerifier internal circomVerifier;
  RiskOracle internal oracle;
  RiskConsumer internal consumer;

  function _proofJsonPath() internal view returns (string memory) {
    return string.concat(vm.projectRoot(), "/../circuits-custom/proofs/proof.json");
  }

  function _publicJsonPath() internal view returns (string memory) {
    return string.concat(vm.projectRoot(), "/../circuits-custom/proofs/public.json");
  }

  function _payloadJsonPath() internal view returns (string memory) {
    return string.concat(vm.projectRoot(), "/../circuits-custom/proofs/oracle-payload.json");
  }

  function setUp() public {
    vm.skip(!vm.exists(_proofJsonPath()) || !vm.exists(_payloadJsonPath()));

    CircomProofJsonLib.Artifacts memory artifacts = CircomProofJsonLib.loadWithBorrower(
      vm.readFile(_proofJsonPath()), vm.readFile(_publicJsonPath()), BORROWER
    );
    proof = artifacts.proof;
    publicInputs = artifacts.publicInputs;

    string memory payloadJson = vm.readFile(_payloadJsonPath());
    scoreBps = payloadJson.readUint(".scoreBps");
    epoch = uint64(payloadJson.readUint(".epoch"));

    groth16 = new Groth16Verifier();
    circomVerifier = new CircomRiskScoreVerifier(address(groth16));
    oracle = new RiskOracle(
      address(this),
      address(circomVerifier),
      DemoCommitments.CIRCOM_MODEL_HASH,
      DemoCommitments.CIRCOM_ADAPTER_HASH
    );
    consumer = new RiskConsumer(address(oracle), address(this));
  }

  function test_circomVerifier_acceptsGeneratedProof() public view {
    bool ok = circomVerifier.verify(proof, publicInputs);
    assertTrue(ok, "Circom proof should verify on-chain");
  }

  function test_fullLoop_proofToConsumerPolicy() public {
    assertTrue(circomVerifier.verify(proof, publicInputs));

    oracle.submitScore(
      RiskOracle.ScoreUpdatePayload({
        modelHash: DemoCommitments.CIRCOM_MODEL_HASH,
        adapterHash: DemoCommitments.CIRCOM_ADAPTER_HASH,
        epoch: epoch,
        scoreBps: scoreBps,
        borrower: BORROWER,
        proof: proof,
        publicInputs: publicInputs
      })
    );

    assertEq(oracle.getScoreByEpoch(epoch).borrower, BORROWER);

    RiskBuckets.Bucket expectedBucket = RiskBuckets.bucketForScore(scoreBps);
    RiskPolicies.Policy memory expected = RiskPolicies.policyFor(expectedBucket);

    consumer.applyVerifiedScore(BORROWER, epoch);

    RiskConsumer.BorrowerPolicy memory policy = consumer.getBorrowerPolicy(BORROWER);
    assertEq(policy.lastEpoch, epoch);
    assertEq(uint8(policy.bucket), uint8(expectedBucket));
    assertEq(policy.collateralFactorBps, expected.collateralFactorBps);
    assertEq(policy.borrowSpreadBps, expected.borrowSpreadBps);
    assertEq(policy.borrowAllowed, expected.borrowAllowed);
    assertEq(policy.mitigationFlag, expected.mitigationFlag);
  }

  function test_submitScore_revertsOnTamperedScoreBps() public {
    uint256 logitAcc = publicInputs[CircomPublicInputLayout.CIRCOM_LOGIT_ACC_INDEX];
    uint256 provedBps = CircomScoreEncoding.scoreBpsFromLogitAcc(logitAcc);
    uint256 tampered = provedBps == 0 ? 1 : provedBps - 1;

    vm.expectRevert(
      abi.encodeWithSelector(CircomScoreEncoding.ScoreMismatch.selector, tampered, provedBps)
    );
    oracle.submitScore(
      RiskOracle.ScoreUpdatePayload({
        modelHash: DemoCommitments.CIRCOM_MODEL_HASH,
        adapterHash: DemoCommitments.CIRCOM_ADAPTER_HASH,
        epoch: epoch,
        scoreBps: tampered,
        borrower: BORROWER,
        proof: proof,
        publicInputs: publicInputs
      })
    );
  }

  function test_applyVerifiedScore_revertsOnBorrowerMismatch() public {
    oracle.submitScore(
      RiskOracle.ScoreUpdatePayload({
        modelHash: DemoCommitments.CIRCOM_MODEL_HASH,
        adapterHash: DemoCommitments.CIRCOM_ADAPTER_HASH,
        epoch: epoch,
        scoreBps: scoreBps,
        borrower: BORROWER,
        proof: proof,
        publicInputs: publicInputs
      })
    );

    address other = makeAddr("other-borrower");
    vm.expectRevert(abi.encodeWithSelector(RiskConsumer.BorrowerMismatch.selector, BORROWER, other));
    consumer.applyVerifiedScore(other, epoch);
  }
}
