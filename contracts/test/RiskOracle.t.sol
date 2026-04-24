// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RiskOracle} from "../src/RiskOracle.sol";
import {StubRiskScoreVerifier} from "../src/verifiers/StubRiskScoreVerifier.sol";
import {RiskBuckets} from "../src/libraries/RiskBuckets.sol";

contract RiskOracleTest is Test {
    bytes32 internal constant MODEL_HASH = keccak256("zyocra-demo-model-v1");
    bytes32 internal constant ADAPTER_HASH = keccak256("zyocra-demo-adapter-v1");

    address internal owner = makeAddr("owner");
    address internal relayer = makeAddr("relayer");

    StubRiskScoreVerifier internal verifier;
    RiskOracle internal oracle;

    function setUp() public {
        verifier = new StubRiskScoreVerifier(owner);
        oracle = new RiskOracle(owner, address(verifier), MODEL_HASH, ADAPTER_HASH);
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
            proof: hex"deadbeef",
            publicInputs: new uint256[](0)
        });
    }

    function test_submitScore_storesRecordAndUpdatesLatestEpoch() public {
        vm.prank(relayer);
        oracle.submitScore(_payload(202_604_1, 6_200));

        assertEq(oracle.latestEpoch(), 202_604_1);

        RiskOracle.ScoreRecord memory record = oracle.getScoreByEpoch(202_604_1);
        assertEq(record.modelHash, MODEL_HASH);
        assertEq(record.adapterHash, ADAPTER_HASH);
        assertEq(record.epoch, 202_604_1);
        assertEq(record.scoreBps, 6_200);
        assertEq(record.timestamp, uint64(block.timestamp));
        assertEq(record.blockNumber, uint64(block.number));

        RiskOracle.ScoreRecord memory latest = oracle.getLatestScore();
        assertEq(latest.epoch, 202_604_1);
        assertTrue(oracle.isEpochVerified(202_604_1));
    }

    function test_submitScore_emitsScoreVerified() public {
        vm.expectEmit(true, true, true, true);
        emit RiskOracle.ScoreVerified(
            202_604_1, MODEL_HASH, ADAPTER_HASH, 6_200, uint64(block.timestamp)
        );

        vm.prank(relayer);
        oracle.submitScore(_payload(202_604_1, 6_200));
    }

    function test_submitScore_acceptsMonotonicEpochs() public {
        vm.startPrank(relayer);
        oracle.submitScore(_payload(1, 4_000));
        oracle.submitScore(_payload(2, 5_000));
        oracle.submitScore(_payload(3, 7_000));
        vm.stopPrank();

        assertEq(oracle.latestEpoch(), 3);
        assertEq(oracle.getScoreByEpoch(2).scoreBps, 5_000);
    }

    function test_submitScore_revertsOnStaleEpoch() public {
        vm.startPrank(relayer);
        oracle.submitScore(_payload(10, 4_000));

        vm.expectRevert(abi.encodeWithSelector(RiskOracle.StaleEpoch.selector, 10, 10));
        oracle.submitScore(_payload(10, 4_100));

        vm.expectRevert(abi.encodeWithSelector(RiskOracle.StaleEpoch.selector, 5, 10));
        oracle.submitScore(_payload(5, 4_200));
        vm.stopPrank();
    }

    function test_submitScore_revertsWhenVerifierFails() public {
        vm.prank(owner);
        verifier.setVerifyResult(false);

        vm.prank(relayer);
        vm.expectRevert(RiskOracle.VerificationFailed.selector);
        oracle.submitScore(_payload(1, 5_000));
    }

    function test_submitScore_revertsOnHashMismatch() public {
        RiskOracle.ScoreUpdatePayload memory payload = _payload(1, 5_000);
        payload.modelHash = keccak256("wrong-model");

        vm.prank(relayer);
        vm.expectRevert(
            abi.encodeWithSelector(
                RiskOracle.HashMismatch.selector,
                MODEL_HASH,
                ADAPTER_HASH,
                payload.modelHash,
                ADAPTER_HASH
            )
        );
        oracle.submitScore(payload);
    }

    function test_submitScore_revertsOnInvalidScore() public {
        vm.prank(relayer);
        vm.expectRevert(abi.encodeWithSelector(RiskBuckets.InvalidScore.selector, 10_001));
        oracle.submitScore(_payload(1, 10_001));
    }

    function test_getLatestScore_revertsBeforeAnySubmission() public {
        vm.expectRevert(abi.encodeWithSelector(RiskOracle.EpochNotVerified.selector, 0));
        oracle.getLatestScore();
    }

    function test_getScoreByEpoch_revertsForUnknownEpoch() public {
        vm.expectRevert(abi.encodeWithSelector(RiskOracle.EpochNotVerified.selector, 99));
        oracle.getScoreByEpoch(99);
    }

    function test_setVerifier_onlyOwner() public {
        StubRiskScoreVerifier next = new StubRiskScoreVerifier(owner);

        vm.prank(relayer);
        vm.expectRevert(RiskOracle.Unauthorized.selector);
        oracle.setVerifier(address(next));

        vm.prank(owner);
        oracle.setVerifier(address(next));
        assertEq(address(oracle.verifier()), address(next));
    }

    function testFuzz_submitScore_validScoreRange(uint64 epochOffset, uint256 scoreBps) public {
        scoreBps = bound(scoreBps, 0, 10_000);
        uint64 epoch = uint64(epochOffset) + 1;

        vm.prank(relayer);
        oracle.submitScore(_payload(epoch, scoreBps));

        assertEq(oracle.getScoreByEpoch(epoch).scoreBps, scoreBps);
    }
}
