# Zyocra — common local commands (Ubuntu WSL, no cloud).
# Run from repo root: make <target>

.PHONY: help install dev operator test lint benchmark check-tools

help: ## Show available targets
	@awk 'BEGIN {FS = ":.*##"; printf "Zyocra commands:\n" } \
		/^[a-zA-Z_-]+:.*?##/ { printf "  make %-12s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

install: ## Verify host tools; create ml-base/.venv; install PyTorch CPU, ONNX, EZKL
	@./scripts/install.sh

dev: ## Start operator API + frontend dev servers
	@./scripts/dev.sh

operator: ## Start FastAPI operator service on OPERATOR_PORT (default 8787)
	@./scripts/operator.sh

test: ## Run Foundry / Python / frontend tests that exist
	@./scripts/test.sh

lint: ## Lightweight local lint (shell syntax, forge fmt, pnpm lint, optional ruff)
	@./scripts/lint.sh

benchmark: ## Run EZKL vs Circom benchmark harness (writes bench-latest.* + plots)
	@./scripts/benchmark.sh

head-benchmark: ## Export EZKL head ONNX, compile, run benchmark with ezkl_head, sync frontend
	@cd ml-base && .venv/bin/python scripts/export_head_onnx.py
	@cd circuits-baseline && ../ml-base/.venv/bin/python scripts/prepare_head.py
	@./scripts/benchmark.sh
	@./scripts/sync-frontend-data.sh
	@python3 -c "import json; from pathlib import Path; d=json.loads(Path('benchmarks/raw-results/bench-latest.json').read_text()); h=d.get('workloads',{}).get('ezkl_head'); c=d.get('workloads',{}).get('circom'); assert h and h.get('prove_ms_median') is not None, 'ezkl_head missing — abort'; eh=float(h['prove_ms_median']); ch=float(c['prove_ms_median']); print(f'head gate: ezkl_head={eh:.0f}ms circom={ch:.0f}ms'); assert eh > ch, f'ABORT: Circom head slower than EZKL head ({ch} vs {eh}) — do not lead with matched-head framing'"

check-tools: ## Print versions of host tools and ml-base venv packages
	@echo "node:    $$(node -v 2>/dev/null || echo missing)"
	@echo "pnpm:    $$(pnpm -v 2>/dev/null || echo missing)"
	@echo "python3: $$(python3 --version 2>/dev/null || echo missing)"
	@echo "rustc:   $$(rustc --version 2>/dev/null || echo missing)"
	@echo "forge:   $$(forge --version 2>/dev/null | head -1 || echo missing)"
	@echo "circom:  $$(circom --version 2>/dev/null | head -1 || echo missing)"
	@if [ -x ml-base/.venv/bin/python ]; then \
		echo "ezkl:    $$(ml-base/.venv/bin/python -c 'import ezkl; print(getattr(ezkl, "__version__", "import-ok"))' 2>/dev/null || echo missing)"; \
	else \
		echo "ezkl:    missing (run make install)"; \
	fi
