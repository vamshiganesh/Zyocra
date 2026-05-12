// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RiskOracle} from "../src/RiskOracle.sol";
import {RiskConsumer} from "../src/RiskConsumer.sol";
import {StubRiskScoreVerifier} from "../src/verifiers/StubRiskScoreVerifier.sol";
import {RiskBuckets} from "../src/libraries/RiskBuckets.sol";
import {ScoreEncoding} from "../src/libraries/ScoreEncoding.sol";
import {PublicInputLayout} from "../src/libraries/PublicInputLayout.sol";

/// @notice End-to-end flow mirroring epoch-2026-041 demo data (MEDIUM bucket).
contract IntegrationTest is Test {
    bytes32 internal constant MODEL_HASH = keccak256("zyocra-demo-model-v1");
    bytes32 internal constant ADAPTER_HASH = keccak256("zyocra-demo-adapter-v1");

    address internal owner = makeAddr("owner");
    address internal borrower = makeAddr("borrower-demo");

    StubRiskScoreVerifier internal verifier;
    RiskOracle internal oracle;
    RiskConsumer internal consumer;

    function setUp() public {
        verifier = new StubRiskScoreVerifier(owner);
        oracle = new RiskOracle(owner, address(verifier), MODEL_HASH, ADAPTER_HASH);
        consumer = new RiskConsumer(address(oracle));
    }

    function test_epochDemoFlow_oracleThenConsumer() public {
        uint64 epoch = 202_604_1;
        uint256 scoreLimb = 79;
        uint256 scoreBps = ScoreEncoding.scoreBpsFromEzklLimb(scoreLimb);

        vm.prank(owner);
        oracle.submitScore(_payload(epoch, scoreLimb));

        assertEq(oracle.latestEpoch(), epoch);
        assertEq(oracle.getLatestScore().scoreBps, scoreBps);

        consumer.applyVerifiedScore(borrower, epoch);

        RiskConsumer.BorrowerPolicy memory policy = consumer.getBorrowerPolicy(borrower);
        assertEq(uint8(policy.bucket), uint8(RiskBuckets.Bucket.MEDIUM));
        assertEq(policy.collateralFactorBps, 7_200);
        assertEq(policy.borrowSpreadBps, 45);
        assertTrue(policy.borrowAllowed);
    }

    function test_verifierSwap_allowsNewSubmissions() public {
        vm.prank(owner);
        oracle.submitScore(_payload(1, 51));

        StubRiskScoreVerifier next = new StubRiskScoreVerifier(owner);
        vm.prank(owner);
        oracle.setVerifier(address(next));

        vm.prank(owner);
        oracle.submitScore(_payload(2, 90));
        assertEq(oracle.latestEpoch(), 2);
    }

    function test_rejectedProofDoesNotAdvanceEpoch() public {
        vm.prank(owner);
        oracle.submitScore(_payload(1, 51));

        vm.prank(owner);
        verifier.setVerifyResult(false);

        vm.prank(owner);
        vm.expectRevert(RiskOracle.VerificationFailed.selector);
        oracle.submitScore(_payload(2, 64));

        assertEq(oracle.latestEpoch(), 1);
        vm.expectRevert(abi.encodeWithSelector(RiskConsumer.EpochNotVerified.selector, 2));
        consumer.applyVerifiedScore(borrower, 2);
    }

    function _payload(uint64 epoch, uint256 scoreLimb)
        internal
        view
        returns (RiskOracle.ScoreUpdatePayload memory)
    {
        uint256 scoreBps = ScoreEncoding.scoreBpsFromEzklLimb(scoreLimb);
        uint256[] memory inputs = new uint256[](PublicInputLayout.EZKL_PUBLIC_INPUT_COUNT);
        inputs[PublicInputLayout.EZKL_SCORE_INDEX] = scoreLimb;

        return RiskOracle.ScoreUpdatePayload({
            modelHash: MODEL_HASH,
            adapterHash: ADAPTER_HASH,
            epoch: epoch,
            scoreBps: scoreBps,
            proof: hex"01",
            publicInputs: inputs
        });
    }
}
