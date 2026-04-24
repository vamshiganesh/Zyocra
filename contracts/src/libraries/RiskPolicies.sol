// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RiskBuckets} from "./RiskBuckets.sol";

/// @title RiskPolicies
/// @notice Collateral and borrow policy parameters per risk bucket.
/// @dev Values mirror the Protocol Impact UI placeholders (LOW baseline, MEDIUM demo path).
library RiskPolicies {
    struct Policy {
        uint256 collateralFactorBps;
        uint256 borrowSpreadBps;
        bool borrowAllowed;
        bool mitigationFlag;
    }

    /// @notice Return the consumer policy for a classified risk bucket.
    function policyFor(RiskBuckets.Bucket bucket) internal pure returns (Policy memory) {
        if (bucket == RiskBuckets.Bucket.LOW) {
            return Policy({
                collateralFactorBps: 8_000,
                borrowSpreadBps: 0,
                borrowAllowed: true,
                mitigationFlag: false
            });
        }

        if (bucket == RiskBuckets.Bucket.MEDIUM) {
            return Policy({
                collateralFactorBps: 7_200,
                borrowSpreadBps: 45,
                borrowAllowed: true,
                mitigationFlag: false
            });
        }

        if (bucket == RiskBuckets.Bucket.HIGH) {
            return Policy({
                collateralFactorBps: 6_500,
                borrowSpreadBps: 120,
                borrowAllowed: false,
                mitigationFlag: false
            });
        }

        return Policy({
            collateralFactorBps: 5_000,
            borrowSpreadBps: 250,
            borrowAllowed: false,
            mitigationFlag: true
        });
    }
}
