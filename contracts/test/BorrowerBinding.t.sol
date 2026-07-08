// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RiskOracle} from "../src/RiskOracle.sol";
import {RiskConsumer} from "../src/RiskConsumer.sol";
import {StubRiskScoreVerifier} from "../src/verifiers/StubRiskScoreVerifier.sol";
import {ScoreEncoding} from "../src/libraries/ScoreEncoding.sol";
import {PublicInputLayout} from "../src/libraries/PublicInputLayout.sol";

contract BorrowerBindingTest is Test {
    bytes32 internal constant MODEL_HASH = keccak256("zyocra-demo-model-v1");
    bytes32 internal constant ADAPTER_HASH = keccak256("zyocra-demo-adapter-v1");

    address internal owner = makeAddr("owner");
    address internal borrowerA = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address internal borrowerB = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;

    StubRiskScoreVerifier internal verifier;
    RiskOracle internal oracle;
    RiskConsumer internal consumer;

    function setUp() public {
        verifier = new StubRiskScoreVerifier(owner);
        oracle = new RiskOracle(owner, address(verifier), MODEL_HASH, ADAPTER_HASH);
        consumer = new RiskConsumer(address(oracle), address(this));
    }

    function _payload(address borrower, uint64 epoch, uint256 scoreLimb)
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
            proof: hex"aa",
            publicInputs: inputs
        });
    }

    function test_submitScore_storesBorrowerOnRecord() public {
        vm.prank(owner);
        oracle.submitScore(_payload(borrowerA, 1, 64));

        RiskOracle.ScoreRecord memory record = oracle.getScoreByEpoch(1);
        assertEq(record.borrower, borrowerA);
    }

    function test_applyVerifiedScore_wrongBorrowerReverts() public {
        vm.prank(owner);
        oracle.submitScore(_payload(borrowerA, 2, 64));

        vm.expectRevert(
            abi.encodeWithSelector(RiskConsumer.BorrowerMismatch.selector, borrowerA, borrowerB)
        );
        consumer.applyVerifiedScore(borrowerB, 2);
    }

    function test_crossBorrowerAttack_sameEpochCannotApplyToOtherBorrower() public {
        vm.prank(owner);
        oracle.submitScore(_payload(borrowerA, 3, 77));

        consumer.applyVerifiedScore(borrowerA, 3);

        vm.expectRevert(
            abi.encodeWithSelector(RiskConsumer.BorrowerMismatch.selector, borrowerA, borrowerB)
        );
        consumer.applyVerifiedScore(borrowerB, 3);
    }
}
