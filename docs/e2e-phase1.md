# Phase 1 end-to-end loop

Local-first demonstration of the full Zyocra Phase 1 path:

```text
sample features → EZKL inference → proof → Halo2Verifier → RiskOracle → RiskConsumer
```

## Prerequisites

```bash
make install
cd ml-base && bash scripts/run_pipeline.sh   # ONNX + features (once)
```

Anvil on `http://127.0.0.1:8545` (started automatically by the demo script if missing).

## One command

From repo root:

```bash
bash scripts/e2e_phase1.sh
```

Stages (logged):

| Step | Action |
|------|--------|
| 1 | EZKL demo — prove + verify off-chain (`circuits-baseline/scripts/demo.py`) |
| 2 | Regenerate + sync `Halo2Verifier.sol` into `contracts/` |
| 3 | `forge build` |
| 4 | Anvil (reuse or start) |
| 5 | Deploy `Halo2Verifier` → `EzklRiskScoreVerifier` → `RiskOracle` → `RiskConsumer` |
| 6 | `submitScore` + `applyVerifiedScore` |
| 7 | Print consumer policy summary |
| 8 | Write `contracts/deployments/phase1-loop-latest.json` |

## Reruns

- Same Anvil chain: epoch auto-bumps (`latestEpoch + 1`) when `2026041` is already used.
- Fresh chain: deterministic epoch `2026041`, sample row `0`, score ≈ **1797 bps** (LOW bucket).
- Proof artifacts must match the deployed verifier — the script regenerates the EVM verifier each run.

## Manual steps

### Deploy EZKL stack

```bash
cd contracts
forge script script/DeployEzkl.s.sol:DeployEzkl \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

Addresses: `contracts/deployments/anvil-ezkl-latest.json` (or `broadcast/DeployEzkl.s.sol/31337/run-latest.json`).

### Submit proof + apply consumer

```bash
export ORACLE_ADDRESS=0x...
export CONSUMER_ADDRESS=0x...
forge script script/SubmitAndApply.s.sol:SubmitAndApply \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## Architecture

```text
circuits-baseline/proofs/proof.json
        │ ProofJsonLib (proof bytes + public inputs >> 248)
        ▼
EzklRiskScoreVerifier.verify ──► RiskOracle.submitScore
        │                              │ ScoreVerified
        ▼                              ▼
RiskConsumer.applyVerifiedScore(0x7099…79C8, epoch)
        │
        └──► CollateralParamsUpdated, RiskBucketChanged
```

### Contracts added for integration

| Contract | Role |
|----------|------|
| `Halo2Verifier.sol` | EZKL-generated verifier (synced from `circuits-baseline/verifiers/`) |
| `EzklRiskScoreVerifier.sol` | `IRiskScoreVerifier` adapter |
| `DemoCommitments.sol` | EZKL model/adapter hashes |
| `ProofJsonLib.sol` | Parse `proof.json` for on-chain submission |

### Demo borrower

Anvil account **#1**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`

### Expected policy (sample row 0)

| Field | Value |
|-------|-------|
| scoreBps | 1797 (~0.18 risk) |
| bucket | LOW |
| collateralFactorBps | 8000 (0.80) |
| borrowSpreadBps | 0 |
| borrowAllowed | true |

## Events (frontend-ready)

| Contract | Event | Indexed fields |
|----------|-------|----------------|
| `RiskOracle` | `ScoreVerified` | `epoch`, `modelHash`, `adapterHash` |
| `RiskConsumer` | `CollateralParamsUpdated` | `borrower`, `epoch` |
| `RiskConsumer` | `RiskBucketChanged` | `borrower`, `epoch` |
| `EzklRiskScoreVerifier` | `Halo2VerifierLinked` | `halo2Verifier` |

Read logs on Anvil:

```bash
cast logs --from-block 0 --address $ORACLE_ADDRESS 'ScoreVerified(uint64,bytes32,bytes32,uint256,uint64)'
cast logs --from-block 0 --address $CONSUMER_ADDRESS 'CollateralParamsUpdated(address,uint64,uint8,uint256,uint256,bool,bool)'
```

## Tests

```bash
cd contracts && forge test -vv
```

EZKL integration tests (`EzklIntegration.t.sol`) require `circuits-baseline/proofs/proof.json` from the EZKL pipeline. They are skipped if artifacts are missing.

## Important: public input encoding

EZKL `proof.json` stores 32-byte padded field elements in `instances`. The on-chain `Halo2Verifier` expects decomposed values:

```solidity
publicInput = uint256(hexInstance) >> 248;
```

`ProofJsonLib` applies this shift. Using raw padded integers will cause `verifyProof` to revert.

## Stub vs EZKL deploy

| Script | Verifier | Model hashes |
|--------|----------|--------------|
| `script/Deploy.s.sol` | `StubRiskScoreVerifier` | `keccak256("zyocra-demo-model-v1")` |
| `script/DeployEzkl.s.sol` | `EzklRiskScoreVerifier` | `DemoCommitments.EZKL_*` |

Phase 1 E2E uses the EZKL path only.
