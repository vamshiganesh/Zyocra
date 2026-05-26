"""Chain read helpers via cast / web3."""

from __future__ import annotations

import json
import subprocess
from typing import Any

from web3 import Web3

from ..config import settings

DEMO_BORROWER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

ORACLE_ABI = [
    {
        "name": "latestEpoch",
        "type": "function",
        "stateMutability": "view",
        "inputs": [],
        "outputs": [{"type": "uint64"}],
    },
    {
        "name": "committedModelHash",
        "type": "function",
        "stateMutability": "view",
        "inputs": [],
        "outputs": [{"type": "bytes32"}],
    },
    {
        "name": "committedAdapterHash",
        "type": "function",
        "stateMutability": "view",
        "inputs": [],
        "outputs": [{"type": "bytes32"}],
    },
    {
        "name": "getLatestScore",
        "type": "function",
        "stateMutability": "view",
        "inputs": [],
        "outputs": [
            {
                "type": "tuple",
                "components": [
                    {"name": "modelHash", "type": "bytes32"},
                    {"name": "adapterHash", "type": "bytes32"},
                    {"name": "epoch", "type": "uint64"},
                    {"name": "scoreBps", "type": "uint256"},
                    {"name": "borrower", "type": "address"},
                    {"name": "timestamp", "type": "uint64"},
                    {"name": "blockNumber", "type": "uint64"},
                ],
            }
        ],
    },
]

CONSUMER_ABI = [
    {
        "name": "getBorrowerPolicy",
        "type": "function",
        "stateMutability": "view",
        "inputs": [{"name": "borrower", "type": "address"}],
        "outputs": [
            {
                "type": "tuple",
                "components": [
                    {"name": "bucket", "type": "uint8"},
                    {"name": "collateralFactorBps", "type": "uint256"},
                    {"name": "borrowSpreadBps", "type": "uint256"},
                    {"name": "borrowAllowed", "type": "bool"},
                    {"name": "mitigationFlag", "type": "bool"},
                    {"name": "lastEpoch", "type": "uint64"},
                ],
            }
        ],
    },
]


def load_deployment() -> dict[str, Any]:
    path = settings.deploy_json_path
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))

    fallback = settings.contracts_dir / "deployments" / "anvil-ezkl-latest.json"
    if fallback.exists():
        return json.loads(fallback.read_text(encoding="utf-8"))
    return {}


def artifacts_summary() -> dict[str, Any]:
    deploy = load_deployment()
    loop_path = settings.contracts_dir / "deployments" / "phase1-loop-latest.json"
    loop: dict[str, Any] = {}
    if loop_path.exists():
        loop = json.loads(loop_path.read_text(encoding="utf-8"))

    payload_path = settings.repo_root / "circuits-baseline" / "proofs" / "oracle-payload.json"
    payload_hashes: dict[str, str] = {}
    if payload_path.exists():
        payload = json.loads(payload_path.read_text(encoding="utf-8"))
        payload_hashes = {
            "modelHash": payload.get("modelHash", ""),
            "adapterHash": payload.get("adapterHash", ""),
            "borrower": payload.get("borrower", DEMO_BORROWER),
        }

    return {
        "chain": settings.deploy_chain,
        "rpcUrl": settings.rpc_url,
        "hasDeployment": bool(deploy.get("oracle")),
        "addresses": {
            "oracle": deploy.get("oracle"),
            "consumer": deploy.get("consumer"),
            "halo2Verifier": deploy.get("halo2Verifier"),
            "ezklVerifier": deploy.get("ezklVerifier"),
        },
        "commitments": {
            "modelHash": deploy.get("modelHash"),
            "adapterHash": deploy.get("adapterHash"),
        },
        "payloadHashes": payload_hashes,
        "hasOnChain": bool(loop.get("epoch")),
        "loop": loop,
    }


def chain_status() -> dict[str, Any]:
    summary = artifacts_summary()
    oracle_addr = summary["addresses"].get("oracle")
    consumer_addr = summary["addresses"].get("consumer")

    if not oracle_addr:
        return {**summary, "live": None, "error": "oracle address not configured"}

    try:
        w3 = Web3(Web3.HTTPProvider(settings.rpc_url, request_kwargs={"timeout": 10}))
        if not w3.is_connected():
            return {**summary, "live": None, "error": f"cannot connect to {settings.rpc_url}"}

        oracle = w3.eth.contract(address=Web3.to_checksum_address(oracle_addr), abi=ORACLE_ABI)
        live: dict[str, Any] = {
            "latestEpoch": int(oracle.functions.latestEpoch().call()),
            "modelHash": oracle.functions.committedModelHash().call().hex(),
            "adapterHash": oracle.functions.committedAdapterHash().call().hex(),
        }

        if live["latestEpoch"] > 0:
            record = oracle.functions.getLatestScore().call()
            live["score"] = {
                "epoch": int(record[2]),
                "scoreBps": int(record[3]),
                "borrower": record[4],
                "timestamp": int(record[5]),
                "blockNumber": int(record[6]),
            }

        if consumer_addr:
            consumer = w3.eth.contract(
                address=Web3.to_checksum_address(consumer_addr), abi=CONSUMER_ABI
            )
            policy = consumer.functions.getBorrowerPolicy(
                Web3.to_checksum_address(DEMO_BORROWER)
            ).call()
            live["borrowerPolicy"] = {
                "borrower": DEMO_BORROWER,
                "bucket": int(policy[0]),
                "collateralFactorBps": int(policy[1]),
                "borrowSpreadBps": int(policy[2]),
                "borrowAllowed": bool(policy[3]),
                "mitigationFlag": bool(policy[4]),
                "lastEpoch": int(policy[5]),
            }

        return {**summary, "live": live, "error": None}
    except Exception as exc:  # noqa: BLE001
        return {**summary, "live": None, "error": str(exc)}


def cast_call(contract: str, signature: str) -> str:
    result = subprocess.run(
        ["cast", "call", contract, signature, "--rpc-url", settings.rpc_url],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip())
    return result.stdout.strip()
