// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RiskOracle} from "../src/RiskOracle.sol";
import {RiskConsumer} from "../src/RiskConsumer.sol";
import {StubRiskScoreVerifier} from "../src/verifiers/StubRiskScoreVerifier.sol";
import {RiskBuckets} from "../src/libraries/RiskBuckets.sol";

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
        uint256 scoreBps = 6_200;

        oracle.submitScore(
            RiskOracle.ScoreUpdatePayload({
                modelHash: MODEL_HASH,
                adapterHash: ADAPTER_HASH,
                epoch: epoch,
                scoreBps: scoreBps,
                proof: hex"cafebabe",
                publicInputs: new uint256[](3)
            })
        );

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
        oracle.submitScore(_payload(1, 4_000));

        StubRiskScoreVerifier next = new StubRiskScoreVerifier(owner);
        vm.prank(owner);
        oracle.setVerifier(address(next));

        oracle.submitScore(_payload(2, 8_100));
        assertEq(oracle.latestEpoch(), 2);
    }

    function test_rejectedProofDoesNotAdvanceEpoch() public {
        oracle.submitScore(_payload(1, 4_000));

        vm.prank(owner);
        verifier.setVerifyResult(false);

        vm.expectRevert(RiskOracle.VerificationFailed.selector);
        oracle.submitScore(_payload(2, 5_000));

        assertEq(oracle.latestEpoch(), 1);
        vm.expectRevert(abi.encodeWithSelector(RiskConsumer.EpochNotVerified.selector, 2));
        consumer.applyVerifiedScore(borrower, 2);
    }

    function _payload(uint64 epoch, uint256 scoreBps)
        internal
        pure
        returns (RiskOracle.ScoreUpdatePayload memory)
    {
        return RiskOracle.ScoreUpdatePayload({
            modelHash: MODEL_HASH,
            adapterHash: ADAPTER_HASH,
            epoch: epoch,
            scoreBps: scoreBps,
            proof: hex"01",
            publicInputs: new uint256[](0)
        });
    }
}
