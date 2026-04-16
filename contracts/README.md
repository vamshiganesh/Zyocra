# contracts

Foundry + Solidity: risk oracle verifier integration and mock lending consumer.

## Layout

| Path | Purpose |
|------|---------|
| `src/` | Oracle + consumer contracts |
| `script/` | Local deploy scripts (Anvil) |
| `test/` | Verifier accept/reject and consumer parameter-update tests |

## Planned contracts

**Oracle** stores model hash, adapter hash, epoch/timestamp, verified risk score, and proof metadata. Rejects submissions that fail verification against the expected verifier and public inputs.

**Consumer** is a mock lending-risk module (not a liquidation bot). Verified risk buckets adjust collateral parameters:

| Bucket | Action |
|--------|--------|
| Low | Standard collateral factor |
| Medium | Lower collateral factor, higher borrow spread |
| High | Freeze new borrowing, tighten thresholds |
| Critical | Flag for delayed mitigation (not instant liquidation) |

Milestones 2–4 implement verifiers and consumer wiring. Placeholders only for now.

```bash
# after Foundry project is initialized
cd contracts && forge build && forge test
cd contracts && anvil   # local chain, free
```
