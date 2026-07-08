"""Chain read helpers via cast / web3."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any, Literal

from eth_abi import encode
from web3 import Web3

from ..config import settings
from ..util.rpc import redact_rpc_url, rpc_display_label

DEMO_BORROWER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
ProverKind = Literal["ezkl", "circom"]

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
        "name": "authorizedProvers",
        "type": "function",
        "stateMutability": "view",
        "inputs": [{"name": "prover", "type": "address"}],
        "outputs": [{"type": "bool"}],
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


def load_deployment(prover: ProverKind = "ezkl") -> dict[str, Any]:
    path = settings.contracts_dir / "deployments" / settings.deploy_json_name_for(prover)
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))

    fallback_name = (
        "anvil-circom-oracle-latest.json" if prover == "circom" else "anvil-ezkl-latest.json"
    )
    fallback = settings.contracts_dir / "deployments" / fallback_name
    if fallback.exists():
        return json.loads(fallback.read_text(encoding="utf-8"))
    return {}


def _loop_json_name(prover: ProverKind) -> str:
    sepolia = settings.active_chain == "sepolia"
    if prover == "circom":
        return "sepolia-circom-loop-latest.json" if sepolia else "circom-loop-latest.json"
    return "sepolia-loop-latest.json" if sepolia else "phase1-loop-latest.json"


def artifacts_summary(prover: ProverKind = "ezkl") -> dict[str, Any]:
    deploy = load_deployment(prover)
    loop_path = settings.contracts_dir / "deployments" / _loop_json_name(prover)
    loop: dict[str, Any] = {}
    if loop_path.exists():
        loop = json.loads(loop_path.read_text(encoding="utf-8"))

    if prover == "circom":
        payload_path = settings.repo_root / "circuits-custom" / "proofs" / "oracle-payload.json"
    else:
        payload_path = settings.repo_root / "circuits-baseline" / "proofs" / "oracle-payload.json"

    payload_hashes: dict[str, Any] = {}
    if payload_path.exists():
        payload = json.loads(payload_path.read_text(encoding="utf-8"))
        payload_hashes = {
            "modelHash": payload.get("modelHash", ""),
            "adapterHash": payload.get("adapterHash", ""),
            "borrower": payload.get("borrower", DEMO_BORROWER),
            "epoch": payload.get("epoch"),
            "scoreBps": payload.get("scoreBps"),
        }

    return {
        "chain": settings.active_chain,
        "rpcUrl": redact_rpc_url(settings.effective_rpc_url),
        "rpcLabel": rpc_display_label(settings.effective_rpc_url, settings.active_chain),
        "prover": prover,
        "deployJson": settings.deploy_json_name_for(prover),
        "hasDeployment": bool(deploy.get("oracle")),
        "addresses": {
            "oracle": deploy.get("oracle"),
            "consumer": deploy.get("consumer"),
            "halo2Verifier": deploy.get("halo2Verifier"),
            "ezklVerifier": deploy.get("ezklVerifier"),
            "circomVerifier": deploy.get("circomVerifier"),
            "groth16Verifier": deploy.get("groth16Verifier"),
        },
        "commitments": {
            "modelHash": deploy.get("modelHash"),
            "adapterHash": deploy.get("adapterHash"),
        },
        "payloadHashes": payload_hashes,
        "hasOnChain": bool(loop.get("epoch")),
        "loop": loop,
        "sepoliaConfigured": bool(settings.sepolia_rpc_url and settings.deployer_private_key),
    }


def chain_status(prover: ProverKind = "ezkl") -> dict[str, Any]:
    summary = artifacts_summary(prover)
    oracle_addr = summary["addresses"].get("oracle")
    consumer_addr = summary["addresses"].get("consumer")

    if not oracle_addr:
        return {**summary, "live": None, "error": "oracle address not configured"}

    try:
        w3 = Web3(
            Web3.HTTPProvider(settings.effective_rpc_url, request_kwargs={"timeout": 10})
        )
        if not w3.is_connected():
            return {
                **summary,
                "live": None,
                "error": f"cannot connect to {summary['rpcUrl']}",
            }

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


def _encode_circom_proof(proof_path: Path) -> bytes:
    proof = json.loads(proof_path.read_text(encoding="utf-8"))
    pi_a = [int(proof["pi_a"][0]), int(proof["pi_a"][1])]
    pi_b_raw = proof["pi_b"]
    # EVM Groth16 verifiers expect Fq2 limb swap on pi_b.
    pi_b = [
        [int(pi_b_raw[0][1]), int(pi_b_raw[0][0])],
        [int(pi_b_raw[1][1]), int(pi_b_raw[1][0])],
    ]
    pi_c = [int(proof["pi_c"][0]), int(proof["pi_c"][1])]
    return encode(["uint256[2]", "uint256[2][2]", "uint256[2]"], [pi_a, pi_b, pi_c])


def _load_circom_public_inputs(public_path: Path, borrower: str) -> list[int]:
    public = json.loads(public_path.read_text(encoding="utf-8"))
    inputs = [int(x) for x in public]
    if len(inputs) != 10:
        raise ValueError(f"expected 10 in-circuit Circom public signals, got {len(inputs)}")
    borrower_limb = int(Web3.to_checksum_address(borrower), 16)
    if inputs[9] != borrower_limb:
        raise ValueError(
            "public.json borrower limb does not match payload borrower — regenerate Circom proof"
        )
    return inputs


def submit_payload(prover: ProverKind = "ezkl") -> dict[str, Any]:
    """Return a wallet-ready ScoreUpdatePayload + consumer apply args."""
    deploy = load_deployment(prover)
    oracle = deploy.get("oracle")
    consumer = deploy.get("consumer")
    if not oracle or not consumer:
        raise FileNotFoundError(
            f"deployment missing for {prover} on {settings.active_chain} "
            f"({settings.deploy_json_name_for(prover)})"
        )

    if prover == "circom":
        payload_path = settings.repo_root / "circuits-custom" / "proofs" / "oracle-payload.json"
        proof_path = settings.repo_root / "circuits-custom" / "proofs" / "proof.json"
        public_path = settings.repo_root / "circuits-custom" / "proofs" / "public.json"
        if not payload_path.exists() or not proof_path.exists() or not public_path.exists():
            raise FileNotFoundError("circuits-custom/proofs/{oracle-payload,proof,public}.json required")
        meta = json.loads(payload_path.read_text(encoding="utf-8"))
        borrower = meta.get("borrower") or DEMO_BORROWER
        proof_bytes = _encode_circom_proof(proof_path)
        public_inputs = _load_circom_public_inputs(public_path, borrower)
    else:
        payload_path = settings.repo_root / "circuits-baseline" / "proofs" / "oracle-payload.json"
        if not payload_path.exists():
            raise FileNotFoundError("circuits-baseline/proofs/oracle-payload.json required")
        meta = json.loads(payload_path.read_text(encoding="utf-8"))
        borrower = meta.get("borrower") or DEMO_BORROWER
        proof_hex = meta.get("proofHex")
        if not proof_hex:
            raise ValueError("oracle-payload.json missing proofHex")
        proof_bytes = bytes.fromhex(proof_hex[2:] if proof_hex.startswith("0x") else proof_hex)
        public_inputs = [int(x) for x in meta["publicInputs"]]

    epoch = int(meta["epoch"])
    # Prefer live latestEpoch bump when operator RPC is reachable.
    try:
        w3 = Web3(
            Web3.HTTPProvider(settings.effective_rpc_url, request_kwargs={"timeout": 8})
        )
        if w3.is_connected():
            oracle_c = w3.eth.contract(address=Web3.to_checksum_address(oracle), abi=ORACLE_ABI)
            latest = int(oracle_c.functions.latestEpoch().call())
            if epoch <= latest:
                epoch = latest + 1
    except Exception:  # noqa: BLE001
        pass

    model_hash = meta["modelHash"]
    adapter_hash = meta["adapterHash"]
    # Prefer deployment commitments when present (must match on-chain immutable hashes).
    if deploy.get("modelHash"):
        model_hash = deploy["modelHash"]
    if deploy.get("adapterHash"):
        adapter_hash = deploy["adapterHash"]

    return {
        "prover": prover,
        "chain": settings.active_chain,
        "chainId": 11_155_111 if settings.active_chain == "sepolia" else 31_337,
        "oracle": oracle,
        "consumer": consumer,
        "payload": {
            "modelHash": model_hash,
            "adapterHash": adapter_hash,
            "epoch": epoch,
            "scoreBps": int(meta["scoreBps"]),
            "borrower": borrower,
            "proof": "0x" + proof_bytes.hex(),
            "publicInputs": [str(x) for x in public_inputs],
        },
        "apply": {
            "borrower": borrower,
            "epoch": epoch,
        },
        "note": (
            "Wallet must be an authorizedProver on RiskOracle (deployer/owner by default). "
            "Borrower binding limb stays the demo borrower unless proofs are regenerated."
        ),
    }


def cast_call(contract: str, signature: str) -> str:
    result = subprocess.run(
        ["cast", "call", contract, signature, "--rpc-url", settings.effective_rpc_url],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip())
    return result.stdout.strip()
