// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RiskBuckets
/// @notice Maps fixed-point liquidation-risk scores to discrete policy bands.
/// @dev Scores use basis points where 10_000 = 1.00 (100%). Thresholds align with
///      `frontend/src/data/content.ts` bucket copy and consumer UI placeholders.
library RiskBuckets {
    /// @dev Maximum representable score (1.00 liquidation risk).
    uint256 internal constant MAX_SCORE_BPS = 10_000;

    /// @dev Inclusive lower bound for MEDIUM; scores below are LOW.
    uint256 internal constant THRESHOLD_MEDIUM = 5_500;

    /// @dev Inclusive lower bound for HIGH; scores below are MEDIUM.
    uint256 internal constant THRESHOLD_HIGH = 8_000;

    /// @dev Inclusive lower bound for CRITICAL; scores below are HIGH.
    uint256 internal constant THRESHOLD_CRITICAL = 9_200;

    /// @notice Discrete risk bands used by the mock lending consumer.
    enum Bucket {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    error InvalidScore(uint256 scoreBps);

    /// @notice Classify a verified score into a risk bucket.
    /// @param scoreBps Fixed-point score in basis points (0 – 10_000).
    function bucketForScore(uint256 scoreBps) internal pure returns (Bucket) {
        if (scoreBps > MAX_SCORE_BPS) revert InvalidScore(scoreBps);

        if (scoreBps < THRESHOLD_MEDIUM) return Bucket.LOW;
        if (scoreBps < THRESHOLD_HIGH) return Bucket.MEDIUM;
        if (scoreBps < THRESHOLD_CRITICAL) return Bucket.HIGH;
        return Bucket.CRITICAL;
    }
}
