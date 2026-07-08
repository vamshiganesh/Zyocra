# Zyocra — Smart Contracts (Phase 1)

Phase 1 delivers a minimal, production-minded on-chain flow: verified scores land in `RiskOracle`, and `RiskConsumer` (mock lending module) maps them to collateral policy. zk verification is **not** faked inside the oracle — a pluggable `IRiskScoreVerifier` adapter gates submissions.

## Layout

```text
contracts/
├── src/
│   ├── interfaces/
│   │   ├── IRiskOracle.sol          # read API for verified scores
│   │   └── IRiskScoreVerifier.sol   # verifier adapter (EZKL / Circom hookup)
│   ├── libraries/
│   │   ├── RiskBuckets.sol          # score → bucket thresholds
│   │   ├── RiskPolicies.sol         # bucket → collateral parameters
│   │   ├── PublicInputLayout.sol    # EZKL public input indices
│   │   ├── ScoreEncoding.sol        # Q8.8 limb ↔ scoreBps
│   │   ├── ProofJsonLib.sol         # EZKL proof.json parser
│   │   └── CircomProofJsonLib.sol   # snarkjs Groth16 parser
│   ├── verifiers/
│   │   ├── StubRiskScoreVerifier.sol    # local dev stub
│   │   ├── EzklRiskScoreVerifier.sol    # Halo2 adapter
│   │   └── CircomRiskScoreVerifier.sol  # Groth16 adapter (standalone)
│   ├── RiskOracle.sol
│   └── RiskConsumer.sol
├── script/
│   └── Deploy.s.sol                 # Anvil deploy
└── test/
    ├── RiskOracle.t.sol
    ├── RiskConsumer.t.sol
    └── Integration.t.sol
```

## Contracts

### `RiskOracle`

Stores verified liquidation-risk scores after proof verification.

| Responsibility | Detail |
|----------------|--------|
| Accept score payload | `submitScore(ScoreUpdatePayload)` |
| Persist commitments | `modelHash`, `adapterHash`, `epoch`, `scoreBps`, `timestamp`, `blockNumber` |
| Expose getters | `latestEpoch`, `getLatestScore`, `getScoreByEpoch`, `isEpochVerified` |
| Verifier gate | Calls `IRiskScoreVerifier.verify(proof, publicInputs)` before storage |
| Score binding | `scoreBps` must match EZKL public output limb at index 6 (`ScoreEncoding`) |
| Prover ACL | `authorizedProvers`; owner `setAuthorizedProver(address, bool)` |
| Stale protection | Rejects `epoch <= latestEpoch` |
| Hash binding | Submissions must match immutable `committedModelHash` / `committedAdapterHash` |
| Verifier rotation | Owner `setVerifier(address)` for EZKL/Circom rollout |

**Score encoding:** basis points, `10_000 = 1.00` liquidation risk (matches UI copy).

**Events:** `ScoreVerified`, `VerifierUpdated`.

### `RiskConsumer`

Mock lending consumer — **policy tightening only**, not liquidation.

| Responsibility | Detail |
|----------------|--------|
| Read oracle | `applyVerifiedScore(borrower, epoch)` after oracle submission (authorized applicators only) |
| Map bucket | Uses `RiskBuckets` thresholds (aligned with `frontend/src/data/content.ts`) |
| Adjust parameters | Collateral factor, borrow spread, borrow gate, mitigation flag |
| Emit state | `CollateralParamsUpdated`, `RiskBucketChanged` |

**Per-borrower replay guard:** `lastEpoch` must advance; cannot re-apply the same or older epoch.

### `IRiskScoreVerifier`

```solidity
function verify(bytes calldata proof, uint256[] calldata publicInputs)
    external view returns (bool valid);
```

Milestone 2+ deploys a generated EZKL or Circom verifier at this interface. Unit tests use `StubRiskScoreVerifier`; the e2e demo uses `EzklRiskScoreVerifier` + `Halo2Verifier`.

## Risk buckets & policy

| Bucket | Score range (bps) | Collateral factor | Borrow spread | New borrow | Mitigation flag |
|--------|-------------------|-------------------|---------------|------------|-----------------|
| LOW | 0 – 5_499 | 8_000 (0.80) | 0 bps | allowed | false |
| MEDIUM | 5_500 – 7_999 | 7_200 (0.72) | +45 bps | allowed | false |
| HIGH | 8_000 – 9_199 | 6_500 (0.65) | +120 bps | **frozen** | false |
| CRITICAL | 9_200 – 10_000 | 5_000 (0.50) | +250 bps | **frozen** | **true** |

Threshold boundaries are **inclusive** on the lower bound (e.g. `5_500` → MEDIUM), matching UI “0.55 – 0.80” copy.

## End-to-end flow

```text
Off-chain prover
      │ proof + publicInputs
      ▼
IRiskScoreVerifier.verify ──► RiskOracle.submitScore
      │                              │
      │ valid                        │ ScoreVerified
      ▼                              ▼
RiskConsumer.applyVerifiedScore(borrower, epoch)
      │
      └──► CollateralParamsUpdated
```

Demo epoch `2026041` with score `6200` bps → **MEDIUM** bucket (UI placeholder path).

## Local commands

```bash
# from repo root
make test          # runs forge test when contracts/foundry.toml exists

# contracts only
cd contracts
forge build
forge test -vv
forge fmt

# deploy to Anvil
anvil &
forge script script/Deploy.s.sol:Deploy \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

Environment:

| Variable | Purpose |
|----------|---------|
| `DEPLOYER` | Broadcast sender (defaults to script `msg.sender`) |

## Test coverage

| Suite | Cases |
|-------|-------|
| `RiskOracle.t.sol` | Valid submit, monotonic epochs, stale epoch, verifier fail, hash mismatch, invalid score, getters, owner verifier swap, fuzz |
| `RiskConsumer.t.sol` | Bucket thresholds, MEDIUM UI values, LOW/HIGH/CRITICAL policy, unverified epoch, double-apply, epoch progression |
| `Integration.t.sol` | Full oracle → consumer demo flow, verifier swap, rejected proof does not advance epoch |

## Milestone 2+ integration notes

1. Generate Solidity verifier from EZKL (`circuits-baseline/`) or Circom (`circuits-custom/`).
2. Deploy verifier; call `RiskOracle.setVerifier(verifierAddress)`.
3. Encode `publicInputs` to match the circuit public signal layout (score, hashes, epoch).
4. Replace `StubRiskScoreVerifier` in deploy script with the real verifier address.
5. Wire `make prove` / frontend verify page to broadcast `submitScore` on Anvil.

## Threat model alignment

| Guarantee | Phase 1 status |
|-----------|----------------|
| Oracle accepts only verified proofs | Enforced via `IRiskScoreVerifier` (stub locally, real verifier later) |
| Consumer updates only from verified epochs | `isEpochVerified` + `getScoreByEpoch` |
| Stale score replay rejected | Monotonic `epoch` on oracle |

**Non-guarantees unchanged:** model quality, data honesty, market manipulation resistance.
