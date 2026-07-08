"""Operator service configuration from environment."""

from __future__ import annotations

from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

ChainMode = Literal["anvil", "sepolia"]
ANVIL_DEFAULT_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
ANVIL_DEFAULT_RPC = "http://127.0.0.1:8545"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    repo_root: Path = Path(__file__).resolve().parents[2]
    operator_port: int = 8787

    rpc_url: str = ANVIL_DEFAULT_RPC
    private_key: str = ANVIL_DEFAULT_KEY
    deploy_chain: str = "anvil"

    sepolia_rpc_url: str | None = None
    deployer_private_key: str | None = None

    # Process-lifetime override from POST /api/chain/mode
    runtime_chain: ChainMode | None = None

    @property
    def active_chain(self) -> ChainMode:
        mode = self.runtime_chain or self.deploy_chain
        return "sepolia" if mode == "sepolia" else "anvil"

    def set_chain_mode(self, mode: ChainMode) -> None:
        if mode not in ("anvil", "sepolia"):
            raise ValueError("chain mode must be anvil or sepolia")
        if mode == "sepolia":
            if not self.sepolia_rpc_url:
                raise ValueError("SEPOLIA_RPC_URL is required for Sepolia operator mode")
            if not self.deployer_private_key:
                raise ValueError("DEPLOYER_PRIVATE_KEY is required for Sepolia operator mode")
        self.runtime_chain = mode

    @property
    def effective_rpc_url(self) -> str:
        if self.active_chain == "sepolia":
            assert self.sepolia_rpc_url
            return self.sepolia_rpc_url
        return self.rpc_url or ANVIL_DEFAULT_RPC

    @property
    def effective_private_key(self) -> str:
        if self.active_chain == "sepolia":
            assert self.deployer_private_key
            return self.deployer_private_key
        return self.private_key or ANVIL_DEFAULT_KEY

    @property
    def python(self) -> Path:
        return self.repo_root / "ml-base" / ".venv" / "bin" / "python"

    @property
    def contracts_dir(self) -> Path:
        return self.repo_root / "contracts"

    def deploy_json_name_for(self, prover: str = "ezkl") -> str:
        sepolia = self.active_chain == "sepolia"
        if prover == "circom":
            return "sepolia-circom-oracle-latest.json" if sepolia else "anvil-circom-oracle-latest.json"
        return "sepolia-ezkl-latest.json" if sepolia else "anvil-ezkl-latest.json"

    @property
    def deploy_json_name(self) -> str:
        return self.deploy_json_name_for("ezkl")

    @property
    def deploy_json_path(self) -> Path:
        return self.contracts_dir / "deployments" / self.deploy_json_name

    def needs_broadcast_key(self) -> bool:
        return bool(self.effective_private_key and self.effective_private_key.startswith("0x"))


settings = Settings()
