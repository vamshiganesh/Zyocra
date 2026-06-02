// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title DemoCommitments
/// @notice Model / adapter commitments for the EZKL baseline + oracle integration path.
/// @dev Hashes align with `circuits-baseline/zyocra_ezkl/config.py` and oracle payload JSON.
library DemoCommitments {
  bytes32 internal constant EZKL_MODEL_HASH =
    0x2fe8f38e2a8992e0546762c67f073e737f12419ac3f13004598e08c7d978f627;
  bytes32 internal constant EZKL_ADAPTER_HASH =
    0x5c840159cf800e89cc2fc5ff33164ec8aee75b5a20c7e15cbdc612c31d47993c;

  /// @dev Circom head path commitments (distinct from EZKL full-graph hashes).
  bytes32 internal constant CIRCOM_MODEL_HASH = keccak256("zyocra-circom-head-model-v1");
  bytes32 internal constant CIRCOM_ADAPTER_HASH = keccak256("zyocra-circom-head-adapter-v1");

  /// @dev Output-head bias (WAD) applied after dequantizing logit_acc. Zero for demo fixture.
  int256 internal constant CIRCOM_OUTPUT_BIAS_WAD = 0;

  /// @dev Phase 1 stub path (keccak labels) — kept for unit tests.
  bytes32 internal constant STUB_MODEL_HASH = keccak256("zyocra-demo-model-v1");
  bytes32 internal constant STUB_ADAPTER_HASH = keccak256("zyocra-demo-adapter-v1");

  uint64 internal constant DEMO_EPOCH = 202_604_1;
}
