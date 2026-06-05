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
}

contract CircomScoreEncodingTest is Test {
    CircomScoreEncodingHarness internal harness;

    function setUp() public {
        harness = new CircomScoreEncodingHarness();
    }

    function test_scoreBpsFromLogitAcc_demoFixture() public view {
        assertEq(harness.scoreBps(29), 5002);
    }

    function test_scoreBpsFromLogitAcc_saturatesHigh() public view {
        assertEq(harness.scoreBps(1_678_334), 10_000);
    }

    function test_requireScoreMatchesPublicInput_acceptsFixtureLayout() public view {
        uint256[] memory inputs = new uint256[](CircomPublicInputLayout.CIRCOM_PUBLIC_INPUT_COUNT);
        inputs[CircomPublicInputLayout.CIRCOM_LOGIT_ACC_INDEX] = 29;
        harness.requireMatch(5002, inputs);
    }

    function test_requireScoreMatchesPublicInput_revertsOnMismatch() public {
        uint256[] memory inputs = new uint256[](CircomPublicInputLayout.CIRCOM_PUBLIC_INPUT_COUNT);
        inputs[CircomPublicInputLayout.CIRCOM_LOGIT_ACC_INDEX] = 29;

        vm.expectRevert(abi.encodeWithSelector(CircomScoreEncoding.ScoreMismatch.selector, 6000, 5002));
        harness.requireMatch(6000, inputs);
    }
}
