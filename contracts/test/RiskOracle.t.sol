// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RiskOracle} from "../src/RiskOracle.sol";
import {StubRiskScoreVerifier} from "../src/verifiers/StubRiskScoreVerifier.sol";
import {RiskBuckets} from "../src/libraries/RiskBuckets.sol";
import {ScoreEncoding} from "../src/libraries/ScoreEncoding.sol";
import {PublicInputLayout} from "../src/libraries/PublicInputLayout.sol";

contract RiskOracleTest is Test {
    bytes32 internal constant MODEL_HASH = keccak256("zyocra-demo-model-v1");
    bytes32 internal constant ADAPTER_HASH = keccak256("zyocra-demo-adapter-v1");

    address internal owner = makeAddr("owner");
    address internal relayer = makeAddr("relayer");
    address internal stranger = makeAddr("stranger");
    address internal borrower = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;

    StubRiskScoreVerifier internal verifier;
    RiskOracle internal oracle;

    function setUp() public {
        verifier = new StubRiskScoreVerifier(owner);
        oracle = new RiskOracle(owner, address(verifier), MODEL_HASH, ADAPTER_HASH);

        vm.prank(owner);
        oracle.setAuthorizedProver(relayer, true);
    }

    function _payload(uint64 epoch, uint256 scoreLimb)
        internal
        pure
        returns (RiskOracle.ScoreUpdatePayload memory)
    {
        uint256 scoreBps = ScoreEncoding.scoreBpsFromEzklLimb(scoreLimb);
        uint256[] memory inputs = new uint256[](PublicInputLayout.EZKL_PUBLIC_INPUT_COUNT);
        inputs[PublicInputLayout.EZKL_SCORE_INDEX] = scoreLimb;
        inputs[PublicInputLayout.EZKL_BORROWER_INDEX] = uint256(uint160(borrower));

        return RiskOracle.ScoreUpdatePayload({
            modelHash: MODEL_HASH,
            adapterHash: ADAPTER_HASH,
            epoch: epoch,
            scoreBps: scoreBps,
            borrower: borrower,
            proof: hex"deadbeef",
            publicInputs: inputs
        });
    }

    function test_submitScore_storesRecordAndUpdatesLatestEpoch() public {
        uint256 scoreLimb = 79;
        uint256 scoreBps = ScoreEncoding.scoreBpsFromEzklLimb(scoreLimb);

        vm.prank(relayer);
        oracle.submitScore(_payload(202_604_1, scoreLimb));

        assertEq(oracle.latestEpoch(), 202_604_1);

        RiskOracle.ScoreRecord memory record = oracle.getScoreByEpoch(202_604_1);
        assertEq(record.modelHash, MODEL_HASH);
        assertEq(record.adapterHash, ADAPTER_HASH);
        assertEq(record.epoch, 202_604_1);
        assertEq(record.scoreBps, scoreBps);
        assertEq(record.borrower, borrower);
        assertEq(record.timestamp, uint64(block.timestamp));
        assertEq(record.blockNumber, uint64(block.number));

        RiskOracle.ScoreRecord memory latest = oracle.getLatestScore();
        assertEq(latest.epoch, 202_604_1);
        assertTrue(oracle.isEpochVerified(202_604_1));
    }

    function test_submitScore_emitsScoreVerified() public {
        uint256 scoreLimb = 79;
        uint256 scoreBps = ScoreEncoding.scoreBpsFromEzklLimb(scoreLimb);

        vm.expectEmit(true, true, true, true);
        emit RiskOracle.ScoreVerified(
            202_604_1, MODEL_HASH, ADAPTER_HASH, scoreBps, uint64(block.timestamp)
        );

        vm.prank(relayer);
        oracle.submitScore(_payload(202_604_1, scoreLimb));
    }

    function test_submitScore_acceptsMonotonicEpochs() public {
        vm.startPrank(relayer);
        oracle.submitScore(_payload(1, 51));
        oracle.submitScore(_payload(2, 64));
        oracle.submitScore(_payload(3, 90));
        vm.stopPrank();

        assertEq(oracle.latestEpoch(), 3);
        assertEq(oracle.getScoreByEpoch(2).scoreBps, ScoreEncoding.scoreBpsFromEzklLimb(64));
    }

    function test_submitScore_revertsOnStaleEpoch() public {
        vm.startPrank(relayer);
        oracle.submitScore(_payload(10, 51));

        vm.expectRevert(abi.encodeWithSelector(RiskOracle.StaleEpoch.selector, 10, 10));
        oracle.submitScore(_payload(10, 52));

        vm.expectRevert(abi.encodeWithSelector(RiskOracle.StaleEpoch.selector, 5, 10));
        oracle.submitScore(_payload(5, 53));
        vm.stopPrank();
    }

    function test_submitScore_revertsWhenVerifierFails() public {
        vm.prank(owner);
        verifier.setVerifyResult(false);

        vm.prank(relayer);
        vm.expectRevert(RiskOracle.VerificationFailed.selector);
        oracle.submitScore(_payload(1, 64));
    }

    function test_submitScore_revertsOnAdapterHashMismatch() public {
        RiskOracle.ScoreUpdatePayload memory payload = _payload(1, 64);
        payload.adapterHash = keccak256("wrong-adapter");

        vm.prank(relayer);
        vm.expectRevert(
            abi.encodeWithSelector(
                RiskOracle.HashMismatch.selector,
                MODEL_HASH,
                ADAPTER_HASH,
                MODEL_HASH,
                payload.adapterHash
            )
        );
        oracle.submitScore(payload);
    }

    function test_submitScore_revertsOnInvalidPublicInputLength() public {
        RiskOracle.ScoreUpdatePayload memory payload = _payload(1, 64);
        payload.publicInputs = new uint256[](7);

        vm.prank(relayer);
        vm.expectRevert(
            abi.encodeWithSelector(PublicInputLayout.InvalidPublicInputs.selector, 8, 7)
        );
        oracle.submitScore(payload);
    }

    function test_submitScore_revertsOnBorrowerMismatch() public {
        RiskOracle.ScoreUpdatePayload memory payload = _payload(1, 64);
        payload.borrower = makeAddr("other-borrower");

        vm.prank(relayer);
        vm.expectRevert(
            abi.encodeWithSelector(
                ScoreEncoding.BorrowerMismatch.selector, payload.borrower, borrower
            )
        );
        oracle.submitScore(payload);
    }

    function test_setVerifier_emitsEvent() public {
        StubRiskScoreVerifier next = new StubRiskScoreVerifier(owner);

        vm.expectEmit(true, true, true, true);
        emit RiskOracle.VerifierUpdated(address(verifier), address(next));

        vm.prank(owner);
        oracle.setVerifier(address(next));
    }

    function test_setAuthorizedProver_emitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit RiskOracle.AuthorizedProverUpdated(stranger, true);

        vm.prank(owner);
        oracle.setAuthorizedProver(stranger, true);
    }

    function test_submitScore_revertsOnHashMismatch() public {
        RiskOracle.ScoreUpdatePayload memory payload = _payload(1, 64);
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
        RiskOracle.ScoreUpdatePayload memory payload = _payload(1, 64);
        payload.scoreBps = 10_001;

        vm.prank(relayer);
        vm.expectRevert(abi.encodeWithSelector(RiskBuckets.InvalidScore.selector, 10_001));
        oracle.submitScore(payload);
    }

    function test_submitScore_revertsOnScoreMismatch() public {
        RiskOracle.ScoreUpdatePayload memory payload = _payload(1, 64);
        payload.scoreBps = 1_000;

        vm.prank(relayer);
        vm.expectRevert(
            abi.encodeWithSelector(ScoreEncoding.ScoreMismatch.selector, 1_000, ScoreEncoding.scoreBpsFromEzklLimb(64))
        );
        oracle.submitScore(payload);
    }

    function test_submitScore_revertsForUnauthorizedProver() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(RiskOracle.UnauthorizedProver.selector, stranger));
        oracle.submitScore(_payload(1, 64));
    }

    function test_setAuthorizedProver_onlyOwner() public {
        vm.prank(stranger);
        vm.expectRevert(RiskOracle.Unauthorized.selector);
        oracle.setAuthorizedProver(stranger, true);

        vm.prank(owner);
        oracle.setAuthorizedProver(stranger, true);
        assertTrue(oracle.authorizedProvers(stranger));

        vm.prank(stranger);
        oracle.submitScore(_payload(1, 64));
        assertEq(oracle.latestEpoch(), 1);
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

    function testFuzz_submitScore_validScoreRange(uint256 scoreLimb) public {
        scoreLimb = bound(scoreLimb, 0, 12_800);
        uint256 scoreBps = ScoreEncoding.scoreBpsFromEzklLimb(scoreLimb);
        vm.assume(scoreBps <= 10_000);

        uint64 epoch = oracle.latestEpoch() + 1;

        vm.prank(relayer);
        oracle.submitScore(_payload(epoch, scoreLimb));

        assertEq(oracle.getScoreByEpoch(epoch).scoreBps, scoreBps);
    }
}
