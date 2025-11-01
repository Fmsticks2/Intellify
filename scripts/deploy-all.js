const { ethers } = require("hardhat");
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function upsertEnv(filePath, entries) {
  let existing = {};
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
      const idx = line.indexOf("=");
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1);
      existing[key] = val;
    }
  }
  for (const [k, v] of Object.entries(entries)) {
    existing[k] = v;
  }
  const out = Object.entries(existing)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  fs.writeFileSync(filePath, out + "\n");
}

async function main() {
  console.log("Deploying all contracts to:", hre.network.name || (await ethers.provider.getNetwork()).name || "custom network");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Deploy IntellifyToken
  const IntellifyToken = await ethers.getContractFactory("IntellifyToken");
  const token = await IntellifyToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("IntellifyToken:", tokenAddress);
  await maybeConfirmAndVerify(token, [], "IntellifyToken");

  // Deploy IntellifyINFT
  const IntellifyINFT = await ethers.getContractFactory("IntellifyINFT");
  const inft = await IntellifyINFT.deploy();
  await inft.waitForDeployment();
  const inftAddress = await inft.getAddress();
  console.log("IntellifyINFT:", inftAddress);
  await maybeConfirmAndVerify(inft, [], "IntellifyINFT");

  // Deploy IntellifyGovernance
  const IntellifyGovernance = await ethers.getContractFactory("IntellifyGovernance");
  const gov = await IntellifyGovernance.deploy(inftAddress);
  await gov.waitForDeployment();
  const govAddress = await gov.getAddress();
  console.log("IntellifyGovernance:", govAddress);
  await maybeConfirmAndVerify(gov, [inftAddress], "IntellifyGovernance");

  // Deploy IntellifyStaking
  const IntellifyStaking = await ethers.getContractFactory("IntellifyStaking");
  const staking = await IntellifyStaking.deploy(inftAddress, tokenAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("IntellifyStaking:", stakingAddress);
  await maybeConfirmAndVerify(staking, [inftAddress, tokenAddress], "IntellifyStaking");

  // Deploy AIModelMarketplace
  const AIModelMarketplace = await ethers.getContractFactory("AIModelMarketplace");
  const market = await AIModelMarketplace.deploy();
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log("AIModelMarketplace:", marketAddress);
  await maybeConfirmAndVerify(market, [], "AIModelMarketplace");

  // Deploy ZKPrivacy (verification key from env or zero)
  const ZKPrivacy = await ethers.getContractFactory("ZKPrivacy");
  const vk = process.env.ZK_VERIFICATION_KEY || "0x" + "0".repeat(64);
  const zk = await ZKPrivacy.deploy(vk);
  await zk.waitForDeployment();
  const zkAddress = await zk.getAddress();
  console.log("ZKPrivacy:", zkAddress);
  await maybeConfirmAndVerify(zk, [vk], "ZKPrivacy");

  // Write addresses JSON
  const { chainId } = await ethers.provider.getNetwork();
  const addressesDir = path.join(process.cwd(), "addresses");
  if (!fs.existsSync(addressesDir)) fs.mkdirSync(addressesDir);
  const addressesPath = path.join(addressesDir, `${chainId}.json`);
  const info = {
    chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    IntellifyToken: tokenAddress,
    IntellifyINFT: inftAddress,
    IntellifyGovernance: govAddress,
    IntellifyStaking: stakingAddress,
    AIModelMarketplace: marketAddress,
    ZKPrivacy: zkAddress,
  };
  fs.writeFileSync(addressesPath, JSON.stringify(info, null, 2));
  console.log("Saved addresses:", addressesPath);

  // Update frontend env files
  const envEntries = {
    NEXT_PUBLIC_INTELLIFY_CONTRACT_ADDRESS: inftAddress,
    NEXT_PUBLIC_INFT_CONTRACT_ADDRESS: inftAddress,
    NEXT_PUBLIC_INTELLIFY_TOKEN_ADDRESS: tokenAddress,
    NEXT_PUBLIC_INTELLIFY_GOVERNANCE_ADDRESS: govAddress,
    NEXT_PUBLIC_INTELLIFY_STAKING_ADDRESS: stakingAddress,
    NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS: marketAddress,
    NEXT_PUBLIC_ZK_PRIVACY_CONTRACT_ADDRESS: zkAddress,
  };

  const envLocalPath = path.join(process.cwd(), ".env.local");
  await upsertEnv(envLocalPath, envEntries);
  console.log("Updated .env.local");

  const envPath = path.join(process.cwd(), ".env");
  await upsertEnv(envPath, envEntries);
  console.log("Updated .env");

  const envProdPath = path.join(process.cwd(), ".env.production");
  await upsertEnv(envProdPath, envEntries);
  console.log("Updated .env.production");

  return info;
}

async function maybeConfirmAndVerify(contract, constructorArgs, name) {
  try {
    const networkName = hre.network.name;
    const tx = contract.deploymentTransaction && contract.deploymentTransaction();
    if (tx && tx.hash) {
      const confirmations = networkName === "0g-mainnet" ? 5 : 2;
      await ethers.provider.waitForTransaction(tx.hash, confirmations);
    }
    // Only attempt verification on known explorers
    if (["0g-mainnet", "0g-testnet", "0g-galileo"].includes(networkName)) {
      console.log(`Verifying ${name}...`);
      await hre.run("verify:verify", {
        address: await contract.getAddress(),
        constructorArguments: constructorArgs,
      });
      console.log(`Verified ${name}`);
    }
  } catch (err) {
    console.warn(`Verification skipped/failed for ${name}:`, err.message || err);
  }
}

main()
  .then((res) => {
    console.log("Deployment completed.");
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error("Deployment failed:", err);
    process.exit(1);
  });