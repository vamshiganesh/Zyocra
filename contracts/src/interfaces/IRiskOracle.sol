// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IRiskOracle
/// @notice Read API for verified risk scores committed by the oracle.
interface IRiskOracle {
    /// @notice Immutable record of a verified epoch score.
    struct ScoreRecord {
        bytes32 modelHash;
        bytes32 adapterHash;
        uint64 epoch;
        uint256 scoreBps;
        address borrower;
        uint64 timestamp;
        uint64 blockNumber;
    }

    /// @notice Most recently verified epoch id.
    function latestEpoch() external view returns (uint64);

    /// @notice Latest verified score snapshot.
    function getLatestScore() external view returns (ScoreRecord memory);

    /// @notice Score committed for a specific epoch (reverts if never verified).
    function getScoreByEpoch(uint64 epoch) external view returns (ScoreRecord memory);

    /// @notice Whether an epoch has a verified score on record.
    function isEpochVerified(uint64 epoch) external view returns (bool);
}
