// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {RiskOracle} from "../src/RiskOracle.sol";
import {RiskConsumer} from "../src/RiskConsumer.sol";
import {StubRiskScoreVerifier} from "../src/verifiers/StubRiskScoreVerifier.sol";

/// @title Deploy
/// @notice Local Anvil deployment for Phase 1 contracts.
/// @dev Example:
///      anvil &
///      cd contracts && forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast
contract Deploy is Script {
    bytes32 internal constant MODEL_HASH = keccak256("zyocra-demo-model-v1");
    bytes32 internal constant ADAPTER_HASH = keccak256("zyocra-demo-adapter-v1");

    function run() external returns (address verifierAddr, address oracleAddr, address consumerAddr) {
        address deployer = vm.envOr("DEPLOYER", msg.sender);

        vm.startBroadcast(deployer);

        StubRiskScoreVerifier verifier = new StubRiskScoreVerifier(deployer);
        RiskOracle oracle = new RiskOracle(deployer, address(verifier), MODEL_HASH, ADAPTER_HASH);
        RiskConsumer consumer = new RiskConsumer(address(oracle));

        vm.stopBroadcast();

        verifierAddr = address(verifier);
        oracleAddr = address(oracle);
        consumerAddr = address(consumer);

        console2.log("StubRiskScoreVerifier", verifierAddr);
        console2.log("RiskOracle", oracleAddr);
        console2.log("RiskConsumer", consumerAddr);
        console2.log("modelHash", vm.toString(MODEL_HASH));
        console2.log("adapterHash", vm.toString(ADAPTER_HASH));
    }
}
