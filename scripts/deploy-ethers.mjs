import fs from "fs";
import path from "path";
import solc from "solc";
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config({ override: true });

const root = process.cwd();
const contractsDir = path.join(root, "contracts");
const ozDir = path.join(root, "lib", "openzeppelin-contracts", "contracts");

function findImports(importPath) {
  try {
    let resolved;
    if (importPath.startsWith("@openzeppelin/contracts")) {
      const sub = importPath.replace("@openzeppelin/contracts", "");
      resolved = path.join(ozDir, sub);
    } else if (importPath.startsWith("contracts/")) {
      resolved = path.join(root, importPath);
    } else if (importPath.startsWith("./")) {
      // Assume relative to contracts root
      resolved = path.join(contractsDir, importPath.slice(2));
    } else if (importPath.startsWith("../")) {
      // Relative up from contracts dir
      resolved = path.join(contractsDir, importPath);
    } else {
      // Fallback: try under contracts
      resolved = path.join(contractsDir, importPath);
    }
    const contents = fs.readFileSync(resolved, "utf8");
    return { contents };
  } catch (e) {
    return { error: `Import not found: ${importPath}` };
  }
}

function readContractSource(rel) {
  const p = path.join(contractsDir, rel);
  return fs.readFileSync(p, "utf8");
}

function compileAll() {
  const input = {
    language: "Solidity",
    sources: {
      "contracts/IntellifyToken.sol": { content: readContractSource("IntellifyToken.sol") },
      "contracts/IntellifyINFT.sol": { content: readContractSource("IntellifyINFT.sol") },
      "contracts/IntellifyGovernance.sol": { content: readContractSource("IntellifyGovernance.sol") },
      "contracts/IntellifyStaking.sol": { content: readContractSource("IntellifyStaking.sol") },
      "contracts/AIModelMarketplace.sol": { content: readContractSource("AIModelMarketplace.sol") },
      "contracts/ZKPrivacy.sol": { content: readContractSource("ZKPrivacy.sol") },
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
      outputSelection: {
        "*": { "*": ["abi", "evm.bytecode", "evm.deployedBytecode"] },
      },
    },
  };
  console.log("Compiling contracts with solc 0.8.20...");
  console.time("solc_compile");
  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
  console.timeEnd("solc_compile");
  if (output.errors) {
    const fatal = output.errors.filter((e) => e.severity === "error");
    fatal.forEach((e) => console.error(e.formattedMessage || e.message));
    if (fatal.length > 0) throw new Error("Solc compilation failed");
  }
  return output.contracts;
}

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

function getArtifact(contracts, sourcePath, name) {
  const src = contracts[sourcePath];
  if (!src || !src[name]) throw new Error(`Missing artifact for ${name}`);
  const { abi, evm } = src[name];
  const bytecode = evm && evm.bytecode && evm.bytecode.object;
  if (!bytecode || bytecode.length === 0) throw new Error(`Empty bytecode for ${name}`);
  return { abi, bytecode };
}

async function main() {
  const rpc = process.env.OG_MAINNET_RPC_URL || process.env.NEXT_PUBLIC_0G_RPC_URL || "https://evmrpc-testnet.0g.ai";
  const provider = new ethers.JsonRpcProvider(rpc);
  const network = await provider.getNetwork();
  console.log("Network:", network.chainId);

  const pk = process.env.PRIVATE_KEY || process.env.OG_PRIVATE_KEY || process.env.OG_PRIVATEKEY || process.env.OG_PRIVATE_KEY || process.env.OG_PRIVATE_KEY;
  if (!pk) throw new Error("Missing PRIVATE_KEY in env");
  const wallet = new ethers.Wallet(pk, provider);
  console.log("Deployer:", wallet.address);

  const contracts = compileAll();

  const deploy = async (sourcePath, name, args = []) => {
    const { abi, bytecode } = getArtifact(contracts, sourcePath, name);
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy(...args);
    await contract.waitForDeployment();
    const addr = await contract.getAddress();
    console.log(`${name}:`, addr);
    return addr;
  };

  const tokenAddress = await deploy("contracts/IntellifyToken.sol", "IntellifyToken");
  const inftAddress = await deploy("contracts/IntellifyINFT.sol", "IntellifyINFT");
  const govAddress = await deploy("contracts/IntellifyGovernance.sol", "IntellifyGovernance", [inftAddress]);
  const stakingAddress = await deploy("contracts/IntellifyStaking.sol", "IntellifyStaking", [inftAddress, tokenAddress]);
  const marketAddress = await deploy("contracts/AIModelMarketplace.sol", "AIModelMarketplace");
  const vk = process.env.ZK_VERIFICATION_KEY || "0x" + "0".repeat(64);
  const zkAddress = await deploy("contracts/ZKPrivacy.sol", "ZKPrivacy", [vk]);

  const info = {
    chainId: Number(network.chainId),
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    IntellifyToken: tokenAddress,
    IntellifyINFT: inftAddress,
    IntellifyGovernance: govAddress,
    IntellifyStaking: stakingAddress,
    AIModelMarketplace: marketAddress,
    ZKPrivacy: zkAddress,
  };

  const addressesDir = path.join(root, "addresses");
  if (!fs.existsSync(addressesDir)) fs.mkdirSync(addressesDir);
  const addressesPath = path.join(addressesDir, `${info.chainId}.json`);
  fs.writeFileSync(addressesPath, JSON.stringify(info, null, 2));
  console.log("Saved addresses:", addressesPath);

  const envEntries = {
    NEXT_PUBLIC_INTELLIFY_CONTRACT_ADDRESS: inftAddress,
    NEXT_PUBLIC_INFT_CONTRACT_ADDRESS: inftAddress,
    NEXT_PUBLIC_INTELLIFY_TOKEN_ADDRESS: tokenAddress,
    NEXT_PUBLIC_INTELLIFY_GOVERNANCE_ADDRESS: govAddress,
    NEXT_PUBLIC_INTELLIFY_STAKING_ADDRESS: stakingAddress,
    NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS: marketAddress,
    NEXT_PUBLIC_ZK_PRIVACY_CONTRACT_ADDRESS: zkAddress,
  };

  await upsertEnv(path.join(root, ".env.local"), envEntries);
  await upsertEnv(path.join(root, ".env"), envEntries);
  await upsertEnv(path.join(root, ".env.production"), envEntries);
  console.log("Updated .env.local and .env");
  console.log("Updated .env.production");

  console.log("Deployment completed.");
  console.log(JSON.stringify(info, null, 2));
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});