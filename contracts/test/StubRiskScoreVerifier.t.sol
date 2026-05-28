// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StubRiskScoreVerifier} from "../src/verifiers/StubRiskScoreVerifier.sol";

contract StubRiskScoreVerifierTest is Test {
    address internal owner = makeAddr("owner");
    address internal stranger = makeAddr("stranger");

    StubRiskScoreVerifier internal verifier;

    function setUp() public {
        verifier = new StubRiskScoreVerifier(owner);
    }

    function test_verify_defaultsTrue() public view {
        assertTrue(verifier.verify(hex"01", new uint256[](0)));
    }

    function test_setVerifyResult_onlyOwner() public {
        vm.prank(stranger);
        vm.expectRevert(StubRiskScoreVerifier.Unauthorized.selector);
        verifier.setVerifyResult(false);

        vm.prank(owner);
        verifier.setVerifyResult(false);
        assertFalse(verifier.verify(hex"01", new uint256[](0)));
    }

    function test_setVerifyResult_emitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit StubRiskScoreVerifier.VerifyResultSet(false);

        vm.prank(owner);
        verifier.setVerifyResult(false);
    }
}
