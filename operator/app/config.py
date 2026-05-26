"""Operator service configuration from environment."""

from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    repo_root: Path = Path(__file__).resolve().parents[2]
    operator_port: int = 8787
    rpc_url: str = "http://127.0.0.1:8545"
    private_key: str = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    deploy_chain: str = "anvil"

    @property
    def python(self) -> Path:
        return self.repo_root / "ml-base" / ".venv" / "bin" / "python"

    @property
    def contracts_dir(self) -> Path:
        return self.repo_root / "contracts"

    @property
    def deploy_json_name(self) -> str:
        if self.deploy_chain == "sepolia":
            return "sepolia-ezkl-latest.json"
        return "anvil-ezkl-latest.json"

    @property
    def deploy_json_path(self) -> Path:
        return self.contracts_dir / "deployments" / self.deploy_json_name

    def needs_broadcast_key(self) -> bool:
        return bool(self.private_key and self.private_key.startswith("0x"))


settings = Settings()
