// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RiskOracle} from "../src/RiskOracle.sol";
import {RiskConsumer} from "../src/RiskConsumer.sol";
import {StubRiskScoreVerifier} from "../src/verifiers/StubRiskScoreVerifier.sol";
import {RiskBuckets} from "../src/libraries/RiskBuckets.sol";
import {RiskPolicies} from "../src/libraries/RiskPolicies.sol";
import {ScoreEncoding} from "../src/libraries/ScoreEncoding.sol";
import {PublicInputLayout} from "../src/libraries/PublicInputLayout.sol";

contract RiskConsumerTest is Test {
    bytes32 internal constant MODEL_HASH = keccak256("zyocra-demo-model-v1");
    bytes32 internal constant ADAPTER_HASH = keccak256("zyocra-demo-adapter-v1");

    address internal owner = makeAddr("owner");
    address internal borrower = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;

    StubRiskScoreVerifier internal verifier;
    RiskOracle internal oracle;
    RiskConsumer internal consumer;

    function setUp() public {
        verifier = new StubRiskScoreVerifier(owner);
        oracle = new RiskOracle(owner, address(verifier), MODEL_HASH, ADAPTER_HASH);
        consumer = new RiskConsumer(address(oracle), owner);
        vm.prank(owner);
        consumer.setAuthorizedApplicator(address(this), true);
    }

    function _submit(uint64 epoch, uint256 scoreLimb) internal {
        uint256 scoreBps = ScoreEncoding.scoreBpsFromEzklLimb(scoreLimb);
        uint256[] memory inputs = new uint256[](PublicInputLayout.EZKL_PUBLIC_INPUT_COUNT);
        inputs[PublicInputLayout.EZKL_SCORE_INDEX] = scoreLimb;
        inputs[PublicInputLayout.EZKL_BORROWER_INDEX] = uint256(uint160(borrower));

        RiskOracle.ScoreUpdatePayload memory payload = RiskOracle.ScoreUpdatePayload({
            modelHash: MODEL_HASH,
            adapterHash: ADAPTER_HASH,
            epoch: epoch,
            scoreBps: scoreBps,
            borrower: borrower,
            proof: hex"01",
            publicInputs: inputs
        });
        vm.prank(owner);
        oracle.submitScore(payload);
    }

    function test_previewBucket_mapsThresholds() public view {
        assertEq(uint8(consumer.previewBucket(0)), uint8(RiskBuckets.Bucket.LOW));
        assertEq(uint8(consumer.previewBucket(5_499)), uint8(RiskBuckets.Bucket.LOW));
        assertEq(uint8(consumer.previewBucket(5_500)), uint8(RiskBuckets.Bucket.MEDIUM));
        assertEq(uint8(consumer.previewBucket(7_999)), uint8(RiskBuckets.Bucket.MEDIUM));
        assertEq(uint8(consumer.previewBucket(8_000)), uint8(RiskBuckets.Bucket.HIGH));
        assertEq(uint8(consumer.previewBucket(9_199)), uint8(RiskBuckets.Bucket.HIGH));
        assertEq(uint8(consumer.previewBucket(9_200)), uint8(RiskBuckets.Bucket.CRITICAL));
        assertEq(uint8(consumer.previewBucket(10_000)), uint8(RiskBuckets.Bucket.CRITICAL));
    }

    function test_previewPolicy_mediumMatchesUiPlaceholder() public view {
        RiskPolicies.Policy memory policy = consumer.previewPolicy(RiskBuckets.Bucket.MEDIUM);
        assertEq(policy.collateralFactorBps, 7_200);
        assertEq(policy.borrowSpreadBps, 45);
        assertTrue(policy.borrowAllowed);
        assertFalse(policy.mitigationFlag);
    }

    function test_applyVerifiedScore_updatesMediumBucket() public {
        _submit(202_604_1, 79);

        vm.expectEmit(true, true, false, true);
        emit RiskConsumer.RiskBucketChanged(
            borrower, RiskBuckets.Bucket.LOW, RiskBuckets.Bucket.MEDIUM, 202_604_1
        );

        vm.expectEmit(true, true, false, true);
        emit RiskConsumer.CollateralParamsUpdated(
            borrower, 202_604_1, RiskBuckets.Bucket.MEDIUM, 7_200, 45, true, false
        );

        consumer.applyVerifiedScore(borrower, 202_604_1);

        RiskConsumer.BorrowerPolicy memory policy = consumer.getBorrowerPolicy(borrower);
        assertEq(uint8(policy.bucket), uint8(RiskBuckets.Bucket.MEDIUM));
        assertEq(policy.collateralFactorBps, 7_200);
        assertEq(policy.borrowSpreadBps, 45);
        assertTrue(policy.borrowAllowed);
        assertFalse(policy.mitigationFlag);
        assertEq(policy.lastEpoch, 202_604_1);
    }

    function test_applyVerifiedScore_lowBucket() public {
        _submit(1, 38);
        consumer.applyVerifiedScore(borrower, 1);

        RiskConsumer.BorrowerPolicy memory policy = consumer.getBorrowerPolicy(borrower);
        assertEq(uint8(policy.bucket), uint8(RiskBuckets.Bucket.LOW));
        assertEq(policy.collateralFactorBps, 8_000);
        assertEq(policy.borrowSpreadBps, 0);
        assertTrue(policy.borrowAllowed);
    }

    function test_applyVerifiedScore_highBucketFreezesBorrow() public {
        _submit(2, 109);
        consumer.applyVerifiedScore(borrower, 2);

        RiskConsumer.BorrowerPolicy memory policy = consumer.getBorrowerPolicy(borrower);
        assertEq(uint8(policy.bucket), uint8(RiskBuckets.Bucket.HIGH));
        assertFalse(policy.borrowAllowed);
        assertFalse(policy.mitigationFlag);
        assertEq(policy.collateralFactorBps, 6_500);
    }

    function test_applyVerifiedScore_criticalSetsMitigationFlag() public {
        _submit(3, 118);
        consumer.applyVerifiedScore(borrower, 3);

        RiskConsumer.BorrowerPolicy memory policy = consumer.getBorrowerPolicy(borrower);
        assertEq(uint8(policy.bucket), uint8(RiskBuckets.Bucket.CRITICAL));
        assertFalse(policy.borrowAllowed);
        assertTrue(policy.mitigationFlag);
    }

    function test_getBorrowerPolicy_zeroBeforeApply() public view {
        RiskConsumer.BorrowerPolicy memory policy = consumer.getBorrowerPolicy(borrower);
        assertEq(policy.lastEpoch, 0);
        assertEq(uint8(policy.bucket), uint8(RiskBuckets.Bucket.LOW));
    }

    function test_previewPolicy_allBuckets() public view {
        RiskPolicies.Policy memory low = consumer.previewPolicy(RiskBuckets.Bucket.LOW);
        assertEq(low.collateralFactorBps, 8_000);

        RiskPolicies.Policy memory high = consumer.previewPolicy(RiskBuckets.Bucket.HIGH);
        assertEq(high.collateralFactorBps, 6_500);
        assertFalse(high.borrowAllowed);

        RiskPolicies.Policy memory critical = consumer.previewPolicy(RiskBuckets.Bucket.CRITICAL);
        assertEq(critical.borrowSpreadBps, 250);
        assertTrue(critical.mitigationFlag);
    }

    function test_applyVerifiedScore_revertsOnBorrowerMismatch() public {
        _submit(9, 77);
        address other = makeAddr("other");

        vm.expectRevert(
            abi.encodeWithSelector(RiskConsumer.BorrowerMismatch.selector, borrower, other)
        );
        consumer.applyVerifiedScore(other, 9);
    }

    function test_applyVerifiedScore_revertsWhenLastEpochGreater() public {
        _submit(9, 77);
        _submit(10, 83);
        consumer.applyVerifiedScore(borrower, 10);

        vm.expectRevert(abi.encodeWithSelector(RiskConsumer.AlreadyApplied.selector, borrower, 9));
        consumer.applyVerifiedScore(borrower, 9);
    }

    function test_applyVerifiedScore_revertsIfEpochNotVerified() public {
        vm.expectRevert(abi.encodeWithSelector(RiskConsumer.EpochNotVerified.selector, 1));
        consumer.applyVerifiedScore(borrower, 1);
    }

    function test_applyVerifiedScore_revertsIfAlreadyApplied() public {
        _submit(5, 77);
        consumer.applyVerifiedScore(borrower, 5);

        vm.expectRevert(abi.encodeWithSelector(RiskConsumer.AlreadyApplied.selector, borrower, 5));
        consumer.applyVerifiedScore(borrower, 5);
    }

    function test_applyVerifiedScore_allowsNewerEpoch() public {
        _submit(1, 38);
        _submit(2, 83);

        consumer.applyVerifiedScore(borrower, 1);

        RiskConsumer.BorrowerPolicy memory afterFirst = consumer.getBorrowerPolicy(borrower);
        assertEq(uint8(afterFirst.bucket), uint8(RiskBuckets.Bucket.LOW));

        consumer.applyVerifiedScore(borrower, 2);

        RiskConsumer.BorrowerPolicy memory afterSecond = consumer.getBorrowerPolicy(borrower);
        assertEq(uint8(afterSecond.bucket), uint8(RiskBuckets.Bucket.MEDIUM));
        assertEq(afterSecond.lastEpoch, 2);
    }

    function test_applyVerifiedScore_updatesPolicyWhenBucketUnchanged() public {
        _submit(1, 77);
        _submit(2, 83);

        consumer.applyVerifiedScore(borrower, 1);
        RiskConsumer.BorrowerPolicy memory mid = consumer.getBorrowerPolicy(borrower);
        assertEq(uint8(mid.bucket), uint8(RiskBuckets.Bucket.MEDIUM));

        consumer.applyVerifiedScore(borrower, 2);

        RiskConsumer.BorrowerPolicy memory afterSecond = consumer.getBorrowerPolicy(borrower);
        assertEq(uint8(afterSecond.bucket), uint8(RiskBuckets.Bucket.MEDIUM));
        assertEq(afterSecond.lastEpoch, 2);
        assertEq(afterSecond.collateralFactorBps, 7_200);
    }

    function test_applyVerifiedScore_revertsForUnauthorizedApplicator() public {
        _submit(20, 79);
        address stranger = makeAddr("stranger");
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(RiskConsumer.UnauthorizedApplicator.selector, stranger));
        consumer.applyVerifiedScore(borrower, 20);
    }

    function test_setAuthorizedApplicator_onlyOwner() public {
        address keeper = makeAddr("keeper");
        vm.prank(keeper);
        vm.expectRevert(RiskConsumer.Unauthorized.selector);
        consumer.setAuthorizedApplicator(keeper, true);

        vm.prank(owner);
        consumer.setAuthorizedApplicator(keeper, true);

        _submit(21, 79);
        vm.prank(keeper);
        consumer.applyVerifiedScore(borrower, 21);
        assertEq(consumer.getBorrowerPolicy(borrower).lastEpoch, 21);
    }
}
