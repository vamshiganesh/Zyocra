// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ScoreEncoding} from "../src/libraries/ScoreEncoding.sol";
import {PublicInputLayout} from "../src/libraries/PublicInputLayout.sol";

contract ScoreEncodingTest is Test {
    function test_scoreBpsFromEzklLimb_demoReference() public pure {
        assertEq(ScoreEncoding.scoreBpsFromEzklLimb(23), 1797);
    }

    function test_requireScoreMatchesPublicInput_acceptsAlignedPayload() public {
        uint256[] memory inputs = new uint256[](7);
        inputs[6] = 23;
        _requireMatch(1797, inputs);
    }

    function test_requireScoreMatchesPublicInput_revertsOnMismatch() public {
        uint256[] memory inputs = new uint256[](7);
        inputs[6] = 23;

        vm.expectRevert(abi.encodeWithSelector(ScoreEncoding.ScoreMismatch.selector, 6200, 1797));
        _requireMatch(6200, inputs);
    }

    function test_requireScoreMatchesPublicInput_revertsOnWrongLength() public {
        uint256[] memory inputs = new uint256[](3);

        vm.expectRevert(
            abi.encodeWithSelector(PublicInputLayout.InvalidPublicInputs.selector, 7, 3)
        );
        _requireMatch(1000, inputs);
    }

    function _requireMatch(uint256 scoreBps, uint256[] memory inputs) internal pure {
        uint256[] calldataInputs;
        assembly {
            calldataInputs.offset := inputs
            calldataInputs.length := mload(inputs)
        }
        ScoreEncoding.requireScoreMatchesPublicInput(scoreBps, calldataInputs);
    }

    function testFuzz_roundTrip_limbToBps(uint256 limb) public pure {
        limb = bound(limb, 0, 12_800);
        uint256 bps = ScoreEncoding.scoreBpsFromEzklLimb(limb);
        assertLe(bps, 10_000);
    }
}
