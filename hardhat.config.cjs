require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    "0g-testnet": {
      url: "https://evmrpc-testnet.0g.ai",
      chainId: 16600,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gas: 2100000,
      gasPrice: 8000000000,
    },
    "0g-mainnet": {
      url: process.env.OG_MAINNET_RPC_URL || "https://evmrpc.0g.ai",
      chainId: 16661,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    "0g-galileo": {
      url: process.env.OG_GALILEO_RPC_URL || process.env.NEXT_PUBLIC_0G_RPC_URL || "https://evmrpc-testnet.0g.ai",
      chainId: 16602,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
    customChains: [
      {
        network: "0g-mainnet",
        chainId: 16661,
        urls: {
          apiURL: process.env.OG_MAINNET_EXPLORER_API_URL || "https://chainscan.0g.ai/api",
          browserURL: process.env.OG_MAINNET_EXPLORER_URL || "https://chainscan.0g.ai",
        },
      },
      {
        network: "0g-testnet",
        chainId: 16600,
        urls: {
          apiURL: process.env.OG_TESTNET_EXPLORER_API_URL || "https://chainscan-testnet.0g.ai/api",
          browserURL: process.env.OG_TESTNET_EXPLORER_URL || "https://chainscan-testnet.0g.ai",
        },
      },
      {
        network: "0g-galileo",
        chainId: 16602,
        urls: {
          apiURL: process.env.OG_GALILEO_EXPLORER_API_URL || "https://chainscan-galileo.0g.ai/api",
          browserURL: process.env.OG_GALILEO_EXPLORER_URL || "https://chainscan-galileo.0g.ai",
        },
      },
    ],
  },
};