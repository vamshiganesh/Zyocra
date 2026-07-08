// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CircomScoreEncoding} from "../src/libraries/CircomScoreEncoding.sol";
import {CircomPublicInputLayout} from "../src/libraries/CircomPublicInputLayout.sol";

contract CircomScoreEncodingHarness {
    function scoreBps(uint256 logitAcc) external pure returns (uint256) {
        return CircomScoreEncoding.scoreBpsFromLogitAcc(logitAcc);
    }

    function requireMatch(uint256 expectedScoreBps, uint256[] memory publicInputs) external pure {
        CircomScoreEncoding.requireScoreMatchesPublicInput(expectedScoreBps, publicInputs);
    }

    function requireBorrower(address borrower, uint256[] memory publicInputs) external pure {
        CircomScoreEncoding.requireBorrowerMatchesPublicInput(borrower, publicInputs);
    }
}

contract CircomScoreEncodingTest is Test {
    CircomScoreEncodingHarness internal harness;
    address internal constant BORROWER = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;

    function setUp() public {
        harness = new CircomScoreEncodingHarness();
    }

    function _layout(uint256 logitAcc) internal pure returns (uint256[] memory inputs) {
        inputs = new uint256[](CircomPublicInputLayout.CIRCOM_PUBLIC_INPUT_COUNT);
        inputs[CircomPublicInputLayout.CIRCOM_BORROWER_INDEX] = uint256(uint160(BORROWER));
        inputs[CircomPublicInputLayout.CIRCOM_LOGIT_ACC_INDEX] = logitAcc;
    }

    function test_scoreBpsFromLogitAcc_demoFixture() public view {
        assertEq(harness.scoreBps(29), 5002);
    }

    function test_scoreBpsFromLogitAcc_saturatesHigh() public view {
        assertEq(harness.scoreBps(1_678_334), 10_000);
    }

    function test_scoreBpsFromLogitAcc_cubicBetterThanLinearAtOne() public view {
        // x = 1.0 → true σ≈0.731; cubic ≈ 0.5+0.25-1/48 ≈ 0.729; linear was 0.75
        uint256 logitAcc = 128 * 256; // exactly x=1 after dequant
        uint256 bps = harness.scoreBps(logitAcc);
        assertEq(bps, 7291);
    }

    function test_scoreBpsFromLogitAcc_signedNegative() public view {
        uint256 p = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        uint256 negOneAcc = p - (128 * 256); // x ≈ -1
        uint256 bps = harness.scoreBps(negOneAcc);
        assertEq(bps, 2708);
    }

    function test_requireScoreMatchesPublicInput_acceptsFixtureLayout() public view {
        harness.requireMatch(5002, _layout(29));
    }

    function test_requireScoreMatchesPublicInput_revertsOnMismatch() public {
        vm.expectRevert(abi.encodeWithSelector(CircomScoreEncoding.ScoreMismatch.selector, 6000, 5002));
        harness.requireMatch(6000, _layout(29));
    }

    function test_requireBorrowerMatchesPublicInput_accepts() public view {
        harness.requireBorrower(BORROWER, _layout(29));
    }

    function test_requireBorrowerMatchesPublicInput_revertsOnMismatch() public {
        address other = address(0xBEEF);
        vm.expectRevert(
            abi.encodeWithSelector(CircomScoreEncoding.BorrowerMismatch.selector, other, BORROWER)
        );
        harness.requireBorrower(other, _layout(29));
    }
}
