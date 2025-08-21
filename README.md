# Intellify - AI-Powered NFT Platform

**Intellify** is a cutting-edge NFT platform that combines artificial intelligence with blockchain technology, built on the 0G Network testnet. The platform enables users to create, mint, and manage AI-enhanced NFTs with advanced knowledge integration capabilities.

## 🚀 Deployed Contract

**Contract Address**: `0xdc6c396319895dA489b0Cd145A4c5D660b9e10F6`  
**Network**: 0G Testnet (Chain ID: 16601)  
**Transaction Hash**: `0x193f3ea69353f0a6a89610152644e8ab579cd4d685c7ce1d53bae6d7a4961fad`  
**Block**: 5330601  

## 🛠 Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Wallet Integration**: Reown (WalletConnect v2)
- **Smart Contracts**: Solidity, OpenZeppelin v5
- **Development Tools**: Foundry, Hardhat
- **Blockchain**: 0G Network Testnet

## 📋 Features

- 🎨 AI-powered NFT creation and minting
- 🔗 Seamless wallet connection with Reown
- 🧠 Knowledge hash integration for AI state management
- 🔒 Secure smart contract with OpenZeppelin standards
- 🌐 Built on 0G Network for enhanced performance

## 🏗 Development Tools

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## 📚 Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
# Deploy to 0G testnet
$ forge script script/Deploy.s.sol:DeployScript --rpc-url 0g_testnet --broadcast --private-key <your_private_key>

# Example deployment (already completed)
$ forge script script/Deploy.s.sol:DeployScript --rpc-url 0g_testnet --broadcast --private-key 73456a197074a8a7d3cb069745cc6c58fd750604aba0a9d89d54ebbb9865cb08
```

### Frontend Development

```shell
# Install dependencies
$ npm install

# Start development server
$ npm run dev

# Build for production
$ npm run build
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
