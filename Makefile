# Zyocra — common local commands (Ubuntu WSL, no cloud).
# Run from repo root: make <target>
#
# Each target delegates to scripts/ so behavior stays identical in CI-less local use.

.PHONY: help install dev test lint benchmark check-tools

help: ## Show available targets
	@awk 'BEGIN {FS = ":.*##"; printf "Zyocra commands:\n" } \
		/^[a-zA-Z_-]+:.*?##/ { printf "  make %-12s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

install: ## Verify host tools; create model/.venv; install PyTorch CPU, ONNX, EZKL
	@./scripts/install.sh

dev: ## Start local frontend dev server when frontend/ exists
	@./scripts/dev.sh

test: ## Run Foundry / Python / frontend tests that exist
	@./scripts/test.sh

lint: ## Lightweight local lint (shell syntax, forge fmt, pnpm lint, optional ruff)
	@./scripts/lint.sh

benchmark: ## Write env snapshot + timing placeholders to benchmarks/results/
	@./scripts/benchmark.sh

check-tools: ## Print versions of phase-1 host tools
	@echo "node:    $$(node -v 2>/dev/null || echo missing)"
	@echo "pnpm:    $$(pnpm -v 2>/dev/null || echo missing)"
	@echo "python3: $$(python3 --version 2>/dev/null || echo missing)"
	@echo "rustc:   $$(rustc --version 2>/dev/null || echo missing)"
	@echo "forge:   $$(forge --version 2>/dev/null | head -1 || echo missing)"
	@echo "circom:  $$(circom --version 2>/dev/null | head -1 || echo missing)"
	@if [ -x model/.venv/bin/python ]; then \
		echo "ezkl:    $$(model/.venv/bin/python -c 'import ezkl; print(getattr(ezkl, "__version__", "import-ok"))' 2>/dev/null || echo missing)"; \
	else \
		echo "ezkl:    missing (run make install)"; \
	fi
