# Zyocra — common local commands (Ubuntu WSL, no cloud).
# Run from repo root: make <target>

.PHONY: help install dev test lint benchmark check-tools

help: ## Show available targets
	@awk 'BEGIN {FS = ":.*##"; printf "Zyocra commands:\n" } \
		/^[a-zA-Z_-]+:.*?##/ { printf "  make %-12s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

install: ## Verify host tools; create ml-base/.venv; install PyTorch CPU, ONNX, EZKL
	@./scripts/install.sh

dev: ## Start optional frontend dev server when frontend/ exists
	@./scripts/dev.sh

test: ## Run Foundry / Python / frontend tests that exist
	@./scripts/test.sh

lint: ## Lightweight local lint (shell syntax, forge fmt, pnpm lint, optional ruff)
	@./scripts/lint.sh

benchmark: ## Run EZKL vs Circom benchmark harness (writes bench-latest.* + plots)
	@./scripts/benchmark.sh

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
