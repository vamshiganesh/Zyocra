// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRiskScoreVerifier} from "../interfaces/IRiskScoreVerifier.sol";

/// @title StubRiskScoreVerifier
/// @notice Local-only verifier stub for Phase 1 development and tests.
/// @dev Replace with EZKL- or Circom-generated verifiers in Milestone 2+. The oracle
///      calls `IRiskScoreVerifier.verify` only — swap this contract address at deploy time.
contract StubRiskScoreVerifier is IRiskScoreVerifier {
    address public owner;
    bool public verifyResult = true;

    error Unauthorized();

    event VerifyResultSet(bool verifyResult);

    constructor(address owner_) {
        owner = owner_;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    /// @notice Configure pass/fail behavior for local demos and negative tests.
    function setVerifyResult(bool result) external onlyOwner {
        verifyResult = result;
        emit VerifyResultSet(result);
    }

    /// @inheritdoc IRiskScoreVerifier
    function verify(bytes calldata, uint256[] calldata) external returns (bool valid) {
        return verifyResult;
    }
}
