// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/IntellifyINFT.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();
        
        // Deploy IntellifyINFT contract
        IntellifyINFT intellifyINFT = new IntellifyINFT();
        
        vm.stopBroadcast();
        
        console.log("IntellifyINFT deployed to:", address(intellifyINFT));
        console.log("Deployer address:", msg.sender);
        console.log("Network:", block.chainid);
    }
}