const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying IntellifyINFT contract...");

  // Get the contract factory
  const IntellifyINFT = await ethers.getContractFactory("IntellifyINFT");

  // Deploy the contract
  const intellifyINFT = await IntellifyINFT.deploy();

  // Wait for deployment to complete
  await intellifyINFT.waitForDeployment();

  const contractAddress = await intellifyINFT.getAddress();
  console.log("IntellifyINFT deployed to:", contractAddress);

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: hre.network.name,
    deployer: (await ethers.getSigners())[0].address,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  console.log("Deployment Info:", deploymentInfo);

  // Verify contract on 0G testnet (if applicable)
  if (hre.network.name === "0g-testnet") {
    console.log("Contract deployed on 0G testnet!");
    console.log("Contract Address:", contractAddress);
    console.log("Network:", hre.network.name);
    console.log("Chain ID:", hre.network.config.chainId);
  }

  return contractAddress;
}

// Execute deployment
main()
  .then((address) => {
    console.log("Deployment completed successfully!");
    console.log("Contract address:", address);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });