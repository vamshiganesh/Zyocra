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
| `src/verifiers/` | `StubRiskScoreVerifier` (Phase 1 local stub) |
| `script/` | `Deploy.s.sol` for Anvil |
| `test/` | Oracle, consumer, and integration tests |

## Deploy (local)

```bash
anvil &
cd contracts
forge script script/Deploy.s.sol:Deploy \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

## Documentation

Full contract design, bucket thresholds, and Milestone 2+ verifier wiring: [`../docs/contracts.md`](../docs/contracts.md).
