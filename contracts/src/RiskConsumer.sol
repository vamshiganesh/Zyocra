// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRiskOracle} from "./interfaces/IRiskOracle.sol";
import {RiskBuckets} from "./libraries/RiskBuckets.sol";
import {RiskPolicies} from "./libraries/RiskPolicies.sol";

/// @title RiskConsumer
/// @notice Mock lending consumer that tightens collateral policy from verified oracle scores.
/// @dev Not a liquidation bot — policy-only updates (collateral factor, spread, borrow gate).
///      `applyVerifiedScore` is restricted to authorized applicators (owner by default).
contract RiskConsumer {
    using RiskBuckets for uint256;

    IRiskOracle public immutable oracle;
    address public owner;
    mapping(address applicator => bool) public authorizedApplicators;

    /// @notice Per-borrower collateral policy derived from the latest applied epoch.
    struct BorrowerPolicy {
        RiskBuckets.Bucket bucket;
        uint256 collateralFactorBps;
        uint256 borrowSpreadBps;
        bool borrowAllowed;
        bool mitigationFlag;
        uint64 lastEpoch;
    }

    error Unauthorized();
    error UnauthorizedApplicator(address caller);
    error EpochNotVerified(uint64 epoch);
    error AlreadyApplied(address borrower, uint64 epoch);
    error BorrowerMismatch(address expected, address provided);

    event OwnerUpdated(address indexed previousOwner, address indexed newOwner);
    event AuthorizedApplicatorUpdated(address indexed applicator, bool authorized);

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

    constructor(address oracle_, address owner_) {
        oracle = IRiskOracle(oracle_);
        owner = owner_;
        authorizedApplicators[owner_] = true;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyAuthorizedApplicator() {
        if (!authorizedApplicators[msg.sender]) revert UnauthorizedApplicator(msg.sender);
        _;
    }

    /// @notice Transfer consumer ownership (does not auto-grant applicator to the new owner).
    function setOwner(address newOwner) external onlyOwner {
        address previous = owner;
        owner = newOwner;
        emit OwnerUpdated(previous, newOwner);
    }

    /// @notice Grant or revoke permission to call `applyVerifiedScore`.
    function setAuthorizedApplicator(address applicator, bool authorized) external onlyOwner {
        authorizedApplicators[applicator] = authorized;
        emit AuthorizedApplicatorUpdated(applicator, authorized);
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
    /// @dev Only authorized applicators (keeper / deployer) may trigger policy writes.
    /// @param borrower Account whose collateral parameters should be updated.
    /// @param epoch Verified epoch id from `RiskOracle`.
    function applyVerifiedScore(address borrower, uint64 epoch) external onlyAuthorizedApplicator {
        if (!oracle.isEpochVerified(epoch)) revert EpochNotVerified(epoch);

        BorrowerPolicy storage policy = _borrowerPolicies[borrower];
        if (policy.lastEpoch >= epoch) revert AlreadyApplied(borrower, epoch);

        IRiskOracle.ScoreRecord memory score = oracle.getScoreByEpoch(epoch);
        if (score.borrower != borrower) {
            revert BorrowerMismatch(score.borrower, borrower);
        }
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
