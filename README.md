# Intellify Wave 2 - Decentralized AI Knowledge Companion

A cutting-edge decentralized application that combines AI and blockchain technology to create intelligent NFTs (INFTs) on the 0G Network.

## Features

- 🤖 **AI-Powered INFTs**: Create intelligent NFTs with embedded AI capabilities
- 🔗 **0G Network Integration**: Built on the high-performance 0G blockchain
- 🎨 **Professional UI**: Modern, responsive design with professional icons
- 💼 **Wallet Integration**: Seamless wallet connection with address management
- 📱 **Mobile Responsive**: Optimized for all device sizes
- 🔒 **Secure**: Privacy-first approach with decentralized storage

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

```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask wallet
- 0G Network testnet tokens

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd intellify
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Update the environment variables in `.env.local` with your configuration.

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment to Vercel

### Automatic Deployment (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on every push

### Manual Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

### Environment Variables for Vercel

Configure these environment variables in your Vercel dashboard:

- `NEXT_PUBLIC_0G_RPC_URL`
- `NEXT_PUBLIC_INTELLIFY_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (optional)
- Other variables from `.env.example`

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
