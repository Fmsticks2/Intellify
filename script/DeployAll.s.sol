// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/StdJson.sol";
import "forge-std/console2.sol";

import {IntellifyToken} from "../contracts/IntellifyToken.sol";
import {IntellifyINFT} from "../contracts/IntellifyINFT.sol";
import {IntellifyGovernance} from "../contracts/IntellifyGovernance.sol";
import {IntellifyStaking} from "../contracts/IntellifyStaking.sol";
import {AIModelMarketplace} from "../contracts/AIModelMarketplace.sol";
import {ZKPrivacy} from "../contracts/ZKPrivacy.sol";

contract DeployAll is Script {
    using stdJson for string;

    function run() external {
        // Optional ZK verification key via env; defaults to 0
        bytes32 verificationKey;
        try vm.envBytes32("ZK_VERIFICATION_KEY") returns (bytes32 vk) {
            verificationKey = vk;
        } catch {
            verificationKey = bytes32(0);
        }

        vm.startBroadcast();

        IntellifyToken token = new IntellifyToken();
        IntellifyINFT inft = new IntellifyINFT();
        IntellifyGovernance gov = new IntellifyGovernance(address(inft));
        IntellifyStaking staking = new IntellifyStaking(address(inft), address(token));
        AIModelMarketplace market = new AIModelMarketplace();
        ZKPrivacy zk = new ZKPrivacy(verificationKey);

        vm.stopBroadcast();

        // Log addresses
        console2.log("IntellifyToken:", address(token));
        console2.log("IntellifyINFT:", address(inft));
        console2.log("IntellifyGovernance:", address(gov));
        console2.log("IntellifyStaking:", address(staking));
        console2.log("AIModelMarketplace:", address(market));
        console2.log("ZKPrivacy:", address(zk));
        console2.log("Deployer:", tx.origin);
        console2.log("ChainId:", block.chainid);

        // Write JSON with addresses for later consumption
        string memory json = "{}";
        json = json.serialize("chainId", block.chainid);
        json = json.serialize("deployer", tx.origin);
        json = json.serialize("timestamp", block.timestamp);
        json = json.serialize("IntellifyToken", address(token));
        json = json.serialize("IntellifyINFT", address(inft));
        json = json.serialize("IntellifyGovernance", address(gov));
        json = json.serialize("IntellifyStaking", address(staking));
        json = json.serialize("AIModelMarketplace", address(market));
        json = json.serialize("ZKPrivacy", address(zk));

        string memory path = string.concat("addresses/", vm.toString(block.chainid), ".json");
        vm.writeJson(json, path);
    }
}