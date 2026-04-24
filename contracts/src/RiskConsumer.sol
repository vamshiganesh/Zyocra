// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRiskOracle} from "./interfaces/IRiskOracle.sol";
import {RiskBuckets} from "./libraries/RiskBuckets.sol";
import {RiskPolicies} from "./libraries/RiskPolicies.sol";

/// @title RiskConsumer
/// @notice Mock lending consumer that tightens collateral policy from verified oracle scores.
/// @dev Not a liquidation bot — policy-only updates (collateral factor, spread, borrow gate).
///      Call `applyVerifiedScore` after `RiskOracle.submitScore` in the same epoch.
contract RiskConsumer {
    using RiskBuckets for uint256;

    IRiskOracle public immutable oracle;

    /// @notice Per-borrower collateral policy derived from the latest applied epoch.
    struct BorrowerPolicy {
        RiskBuckets.Bucket bucket;
        uint256 collateralFactorBps;
        uint256 borrowSpreadBps;
        bool borrowAllowed;
        bool mitigationFlag;
        uint64 lastEpoch;
    }

    error EpochNotVerified(uint64 epoch);
    error AlreadyApplied(address borrower, uint64 epoch);

    event RiskBucketChanged(
        address indexed borrower,
        RiskBuckets.Bucket previousBucket,
        RiskBuckets.Bucket newBucket,
        uint64 indexed epoch
    );

    event CollateralParamsUpdated(
        address indexed borrower,
        uint64 indexed epoch,
        RiskBuckets.Bucket bucket,
        uint256 collateralFactorBps,
        uint256 borrowSpreadBps,
        bool borrowAllowed,
        bool mitigationFlag
    );

    constructor(address oracle_) {
        oracle = IRiskOracle(oracle_);
    }

    /// @notice Preview the bucket for a score without reading oracle state.
    function previewBucket(uint256 scoreBps) external pure returns (RiskBuckets.Bucket) {
        return scoreBps.bucketForScore();
    }

    /// @notice Preview policy parameters for a bucket (testing / integrators).
    function previewPolicy(RiskBuckets.Bucket bucket)
        external
        pure
        returns (RiskPolicies.Policy memory)
    {
        return RiskPolicies.policyFor(bucket);
    }

    /// @notice Read stored borrower policy (zero epoch if never updated).
    function getBorrowerPolicy(address borrower) external view returns (BorrowerPolicy memory) {
        return _borrowerPolicies[borrower];
    }

    /// @notice Apply verified oracle score for an epoch to a borrower account.
    /// @param borrower Account whose collateral parameters should be updated.
    /// @param epoch Verified epoch id from `RiskOracle`.
    function applyVerifiedScore(address borrower, uint64 epoch) external {
        if (!oracle.isEpochVerified(epoch)) revert EpochNotVerified(epoch);

        BorrowerPolicy storage policy = _borrowerPolicies[borrower];
        if (policy.lastEpoch >= epoch) revert AlreadyApplied(borrower, epoch);

        IRiskOracle.ScoreRecord memory score = oracle.getScoreByEpoch(epoch);
        RiskBuckets.Bucket newBucket = score.scoreBps.bucketForScore();
        RiskPolicies.Policy memory params = RiskPolicies.policyFor(newBucket);

        RiskBuckets.Bucket previousBucket = policy.bucket;
        if (previousBucket != newBucket || policy.lastEpoch == 0) {
            emit RiskBucketChanged(borrower, previousBucket, newBucket, epoch);
        }

        policy.bucket = newBucket;
        policy.collateralFactorBps = params.collateralFactorBps;
        policy.borrowSpreadBps = params.borrowSpreadBps;
        policy.borrowAllowed = params.borrowAllowed;
        policy.mitigationFlag = params.mitigationFlag;
        policy.lastEpoch = epoch;

        emit CollateralParamsUpdated(
            borrower,
            epoch,
            newBucket,
            params.collateralFactorBps,
            params.borrowSpreadBps,
            params.borrowAllowed,
            params.mitigationFlag
        );
    }

    mapping(address borrower => BorrowerPolicy) private _borrowerPolicies;
}
