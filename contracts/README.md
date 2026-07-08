# contracts

Foundry + Solidity: risk oracle, verifier adapter, and mock lending consumer.

## Quick start

```bash
cd contracts
forge build
forge test
```

From repo root: `make test` runs Foundry when `foundry.toml` is present.

## Layout


| Path | Purpose |
|------|---------|
| `src/` | `RiskOracle`, `RiskConsumer`, interfaces, libraries |
| `src/verifiers/` | `StubRiskScoreVerifier`, `EzklRiskScoreVerifier`, `Halo2Verifier` |
| `script/` | `Deploy.s.sol` (stub), `DeployEzkl.s.sol`, `SubmitAndApply.s.sol` |
| `test/` | Oracle, consumer, stub integration, EZKL integration |

## Deploy (local)

**Stub path** (unit tests / quick demos):

```bash
anvil &
cd contracts
forge script script/Deploy.s.sol:Deploy \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

**EZKL path** (full Phase 1 loop): see [`../docs/e2e-phase1.md`](../docs/e2e-phase1.md) or run `bash scripts/e2e_phase1.sh` from repo root.

## Documentation

- [`../docs/contracts.md`](../docs/contracts.md) — design, buckets, stub verifier
- [`../docs/e2e-phase1.md`](../docs/e2e-phase1.md) — EZKL proof → oracle → consumer demo
