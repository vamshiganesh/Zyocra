// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ScoreEncoding} from "../src/libraries/ScoreEncoding.sol";
import {PublicInputLayout} from "../src/libraries/PublicInputLayout.sol";

contract ScoreEncodingHarness {
    function requireMatch(uint256 scoreBps, uint256[] memory publicInputs) external pure {
        ScoreEncoding.requireScoreMatchesPublicInput(scoreBps, publicInputs);
    }
}

contract ScoreEncodingTest is Test {
    ScoreEncodingHarness internal harness;

    function setUp() public {
        harness = new ScoreEncodingHarness();
    }

    function test_scoreBpsFromEzklLimb_demoReference() public pure {
        assertEq(ScoreEncoding.scoreBpsFromEzklLimb(23), 1797);
    }

    function test_requireScoreMatchesPublicInput_acceptsAlignedPayload() public pure {
        uint256[] memory inputs = new uint256[](7);
        inputs[6] = 23;

        ScoreEncoding.requireScoreMatchesPublicInput(1797, inputs);
    }

    function test_requireScoreMatchesPublicInput_revertsOnMismatch() public {
        uint256[] memory inputs = new uint256[](7);
        inputs[6] = 23;

        vm.expectRevert(abi.encodeWithSelector(ScoreEncoding.ScoreMismatch.selector, 6200, 1797));
        harness.requireMatch(6200, inputs);
    }

    function test_requireScoreMatchesPublicInput_revertsOnWrongLength() public {
        uint256[] memory inputs = new uint256[](3);

        vm.expectRevert(
            abi.encodeWithSelector(PublicInputLayout.InvalidPublicInputs.selector, 7, 3)
        );
        harness.requireMatch(1000, inputs);
    }

    function testFuzz_roundTrip_limbToBps(uint256 limb) public pure {
        limb = bound(limb, 0, 128);
        uint256 bps = ScoreEncoding.scoreBpsFromEzklLimb(limb);
        assertLe(bps, 10_000);
    }
}
