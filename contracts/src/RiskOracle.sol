// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRiskOracle} from "./interfaces/IRiskOracle.sol";
import {IRiskScoreVerifier} from "./interfaces/IRiskScoreVerifier.sol";
import {RiskBuckets} from "./libraries/RiskBuckets.sol";
import {ScoreEncoding} from "./libraries/ScoreEncoding.sol";
import {CircomScoreEncoding} from "./libraries/CircomScoreEncoding.sol";
import {PublicInputLayout} from "./libraries/PublicInputLayout.sol";
import {CircomPublicInputLayout} from "./libraries/CircomPublicInputLayout.sol";

/// @title RiskOracle
/// @notice Stores verified liquidation-risk scores after proof verification.
/// @dev Verifier integration is modular: `submitScore` delegates to `IRiskScoreVerifier`.
///      Epoch ids must be strictly increasing to reject stale replays.
contract RiskOracle is IRiskOracle {
    using RiskBuckets for uint256;

    /// @notice Payload required to commit a new verified score.
    struct ScoreUpdatePayload {
        bytes32 modelHash;
        bytes32 adapterHash;
        uint64 epoch;
        uint256 scoreBps;
        address borrower;
        bytes proof;
        uint256[] publicInputs;
    }

    address public owner;
    IRiskScoreVerifier public verifier;
    bytes32 public immutable committedModelHash;
    bytes32 public immutable committedAdapterHash;

    uint64 public latestEpoch;
    mapping(uint64 epoch => ScoreRecord) private _scores;
    mapping(address prover => bool) public authorizedProvers;

    error Unauthorized();
    error UnauthorizedProver(address caller);
    error VerificationFailed();
    error StaleEpoch(uint64 provided, uint64 latest);
    error HashMismatch(
        bytes32 expectedModel,
        bytes32 expectedAdapter,
        bytes32 providedModel,
        bytes32 providedAdapter
    );
    error EpochNotVerified(uint64 epoch);

    event VerifierUpdated(address indexed previousVerifier, address indexed newVerifier);
    event AuthorizedProverUpdated(address indexed prover, bool authorized);
    event ScoreVerified(
        uint64 indexed epoch,
        bytes32 indexed modelHash,
        bytes32 indexed adapterHash,
        uint256 scoreBps,
        uint64 timestamp
    );

    constructor(address owner_, address verifier_, bytes32 modelHash_, bytes32 adapterHash_) {
        owner = owner_;
        verifier = IRiskScoreVerifier(verifier_);
        committedModelHash = modelHash_;
        committedAdapterHash = adapterHash_;
        authorizedProvers[owner_] = true;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyAuthorizedProver() {
        if (!authorizedProvers[msg.sender]) revert UnauthorizedProver(msg.sender);
        _;
    }

    /// @notice Point the oracle at a new verifier contract (EZKL / Circom rollout).
    function setVerifier(address newVerifier) external onlyOwner {
        address previous = address(verifier);
        verifier = IRiskScoreVerifier(newVerifier);
        emit VerifierUpdated(previous, newVerifier);
    }

    /// @notice Grant or revoke permission to call `submitScore`.
    function setAuthorizedProver(address prover, bool authorized) external onlyOwner {
        authorizedProvers[prover] = authorized;
        emit AuthorizedProverUpdated(prover, authorized);
    }

    /// @notice Submit a score after on-chain proof verification.
    /// @param payload Model commitments, epoch, score, proof bytes, and public inputs.
    function submitScore(ScoreUpdatePayload calldata payload) external onlyAuthorizedProver {
        if (payload.modelHash != committedModelHash || payload.adapterHash != committedAdapterHash)
        {
            revert HashMismatch(
                committedModelHash, committedAdapterHash, payload.modelHash, payload.adapterHash
            );
        }

        payload.scoreBps.bucketForScore();

        if (payload.epoch <= latestEpoch) {
            revert StaleEpoch(payload.epoch, latestEpoch);
        }

        if (!verifier.verify(payload.proof, payload.publicInputs)) {
            revert VerificationFailed();
        }

        _requireBindingChecks(payload);

        uint64 timestamp = uint64(block.timestamp);
        ScoreRecord memory record = ScoreRecord({
            modelHash: payload.modelHash,
            adapterHash: payload.adapterHash,
            epoch: payload.epoch,
            scoreBps: payload.scoreBps,
            borrower: payload.borrower,
            timestamp: timestamp,
            blockNumber: uint64(block.number)
        });

        _scores[payload.epoch] = record;
        latestEpoch = payload.epoch;

        emit ScoreVerified(
            payload.epoch, payload.modelHash, payload.adapterHash, payload.scoreBps, timestamp
        );
    }

    /// @inheritdoc IRiskOracle
    function getLatestScore() external view returns (ScoreRecord memory) {
        if (latestEpoch == 0) revert EpochNotVerified(0);
        return _scores[latestEpoch];
    }

    /// @inheritdoc IRiskOracle
    function getScoreByEpoch(uint64 epoch) external view returns (ScoreRecord memory) {
        if (!_isVerified(epoch)) revert EpochNotVerified(epoch);
        return _scores[epoch];
    }

    /// @inheritdoc IRiskOracle
    function isEpochVerified(uint64 epoch) external view returns (bool) {
        return _isVerified(epoch);
    }

    function _isVerified(uint64 epoch) private view returns (bool) {
        return epoch != 0 && epoch <= latestEpoch && _scores[epoch].timestamp != 0;
    }

    function _requireBindingChecks(ScoreUpdatePayload calldata payload) private pure {
        uint256 len = payload.publicInputs.length;
        if (len == PublicInputLayout.EZKL_PUBLIC_INPUT_COUNT) {
            ScoreEncoding.requireScoreMatchesPublicInput(payload.scoreBps, payload.publicInputs);
            ScoreEncoding.requireBorrowerMatchesPublicInput(payload.borrower, payload.publicInputs);
            return;
        }
        if (
            len == CircomPublicInputLayout.CIRCOM_PUBLIC_INPUT_COUNT
                || len == CircomPublicInputLayout.CIRCOM_EXTENDED_INPUT_COUNT
        ) {
            CircomScoreEncoding.requireScoreMatchesPublicInput(payload.scoreBps, payload.publicInputs);
            CircomScoreEncoding.requireBorrowerMatchesPublicInput(payload.borrower, payload.publicInputs);
            return;
        }
        revert PublicInputLayout.InvalidPublicInputs(PublicInputLayout.EZKL_PUBLIC_INPUT_COUNT, len);
    }
}
