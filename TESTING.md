# Intellify INFT Integration Testing Guide

This guide covers how to run comprehensive integration tests for the Intellify INFT system with 0G Data Availability integration.

## 🎯 What We Test

Our integration test suite verifies:

1. **0G Data Availability Integration**
   - Metadata submission to 0G DA
   - Data retrieval and integrity verification
   - Fallback mechanisms to IPFS

2. **INFT Evolution System**
   - Interaction tracking
   - Automatic evolution triggers
   - Level progression and experience points
   - Metadata updates through evolution

3. **SDK Functionality**
   - INFT creation and minting
   - Interaction recording
   - Status and metadata retrieval
   - Error handling and validation

4. **Backward Compatibility**
   - Legacy method support
   - Graceful degradation
   - API consistency

5. **Performance & Gas Optimization**
   - Batch operations
   - Concurrent interactions
   - Gas usage optimization

6. **Error Handling**
   - Invalid configurations
   - Network failures
   - Edge cases and boundary conditions

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **TypeScript** (installed globally or locally)
4. **0G Testnet access**
5. **Test wallet with testnet tokens**

### Setup

1. **Install Dependencies**
   ```bash
   cd Intellify
   npm install
   
   # Install test dependencies
   cd tests
   npm install
   ```

2. **Configure Test Environment**
   
   Edit `tests/integration-test.ts` and update the `TEST_CONFIG` object:
   
   ```typescript
   const TEST_CONFIG = {
     // ⚠️ TESTNET ONLY - Never use mainnet keys!
     privateKey: 'your_testnet_private_key_here',
     contractAddress: 'your_deployed_contract_address',
     rpcUrl: 'https://evmrpc-testnet.0g.ai',
     zgdaEndpoint: 'https://da-testnet.0g.ai'
   };
   ```

3. **Deploy Contract** (if not already deployed)
   ```bash
   # Deploy to 0G testnet
   npx hardhat deploy --network 0g-testnet
   ```

### Running Tests

#### Option 1: Using the Test Runner (Recommended)

```bash
# Run all tests (compile + execute)
node test-runner.js

# Just compile TypeScript
node test-runner.js --compile-only

# Just run tests (assumes already compiled)
node test-runner.js --run-only

# Show help
node test-runner.js --help
```

#### Option 2: Manual Execution

```bash
# Compile TypeScript
npm run build

# Run tests
node dist/tests/integration-test.js
```

#### Option 3: Using npm Scripts

```bash
cd tests

# Run all tests
npm test

# Compile only
npm run test:compile

# Run only
npm run test:run
```

## 📊 Understanding Test Results

### Test Output Format

```
🚀 Starting Intellify INFT Integration Tests

=== Testing 0G DA Integration ===
✅ 0G DA client initialized
✅ Metadata submitted to 0G DA: 0x1234...
✅ Metadata retrieved from 0G DA
✅ Data integrity verified
✅ 0G DA Integration test PASSED

=== Testing INFT Evolution System ===
✅ Intellify client initialized
✅ Knowledge companion created: 1
Interaction 1: recorded
Interaction 2: recorded
...
Interaction 10: EVOLVED!
✅ Evolution detected at level 2
✅ Evolution status retrieved: { level: 2, experience: 10, nextEvolutionAt: 20 }
✅ Evolution System test PASSED

...

📊 TEST SUMMARY
==================================================
✅ PASS - 0G DA Integration
✅ PASS - Evolution System
✅ PASS - SDK Functionality
✅ PASS - Backward Compatibility
✅ PASS - Error Handling
✅ PASS - Performance

📈 Overall: 6/6 tests passed (100%)
🎉 All integration tests passed! The system is ready for deployment.
```

### Exit Codes

- `0`: All tests passed
- `1`: One or more tests failed
- `130`: Interrupted by user (Ctrl+C)
- `143`: Terminated by system

## 🔧 Troubleshooting

### Common Issues

#### 1. "Contract not deployed" Error

```
❌ Evolution system test failed: Contract not deployed
```

**Solution**: Deploy the contract first:
```bash
npx hardhat deploy --network 0g-testnet
```

#### 2. "Insufficient funds" Error

```
❌ SDK functionality test failed: insufficient funds for intrinsic transaction cost
```

**Solution**: Add testnet tokens to your wallet:
- Visit 0G testnet faucet
- Request tokens for your test address

#### 3. "0G DA endpoint unreachable" Error

```
❌ 0G DA integration test failed: Network error
```

**Solution**: Check network connectivity and endpoint URL:
- Verify `zgdaEndpoint` in `TEST_CONFIG`
- Check if 0G DA testnet is operational
- Try with a different network connection

#### 4. "TypeScript compilation failed" Error

```
❌ TypeScript compilation failed: Cannot find module 'ethers'
```

**Solution**: Install dependencies:
```bash
npm install
cd tests && npm install
```

#### 5. "Private key invalid" Error

```
❌ SDK functionality test failed: invalid private key
```

**Solution**: Ensure private key format:
- Must start with `0x`
- Must be 64 characters (32 bytes) hex
- Example: `0x1234567890abcdef...`

### Debug Mode

For detailed debugging, modify the test file to enable verbose logging:

```typescript
// Add at the top of integration-test.ts
const DEBUG = true;

// Use throughout tests
if (DEBUG) {
  console.log('Debug info:', someVariable);
}
```

### Network Issues

If you encounter network-related issues:

1. **Check RPC endpoint**:
   ```bash
   curl -X POST -H "Content-Type: application/json" \
     --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
     https://evmrpc-testnet.0g.ai
   ```

2. **Verify 0G DA endpoint**:
   ```bash
   curl https://da-testnet.0g.ai/health
   ```

3. **Test wallet connectivity**:
   ```bash
   # Check balance
   npx hardhat run scripts/check-balance.js --network 0g-testnet
   ```

## 🎯 Test Configuration

### Environment Variables

You can also use environment variables instead of hardcoding in the test file:

```bash
# Set environment variables
export INTELLIFY_PRIVATE_KEY="0x..."
export INTELLIFY_CONTRACT_ADDRESS="0x..."
export INTELLIFY_RPC_URL="https://evmrpc-testnet.0g.ai"
export INTELLIFY_ZGDA_ENDPOINT="https://da-testnet.0g.ai"

# Run tests
node test-runner.js
```

Then modify `integration-test.ts`:

```typescript
const TEST_CONFIG = {
  privateKey: process.env.INTELLIFY_PRIVATE_KEY || '0x...',
  contractAddress: process.env.INTELLIFY_CONTRACT_ADDRESS || '0x...',
  rpcUrl: process.env.INTELLIFY_RPC_URL || 'https://evmrpc-testnet.0g.ai',
  zgdaEndpoint: process.env.INTELLIFY_ZGDA_ENDPOINT || 'https://da-testnet.0g.ai'
};
```

### Custom Test Scenarios

To add custom test scenarios, extend the test file:

```typescript
// Add to integration-test.ts
async function testCustomScenario(): Promise<boolean> {
  console.log('\n=== Testing Custom Scenario ===');
  
  try {
    // Your custom test logic here
    return true;
  } catch (error) {
    console.error('❌ Custom scenario test failed:', error);
    return false;
  }
}

// Add to the tests array in runIntegrationTests()
const tests = [
  // ... existing tests
  { name: 'Custom Scenario', fn: testCustomScenario }
];
```

## 📈 Performance Benchmarks

The test suite includes performance benchmarks:

- **INFT Creation**: < 5 seconds per INFT
- **Interaction Recording**: < 2 seconds per interaction
- **Evolution Trigger**: < 10 seconds (includes metadata update)
- **0G DA Upload**: < 15 seconds (network dependent)
- **Batch Operations**: Linear scaling with slight optimization

## 🔒 Security Notes

⚠️ **IMPORTANT SECURITY REMINDERS**:

1. **Never use mainnet private keys in tests**
2. **Never commit private keys to version control**
3. **Use environment variables for sensitive data**
4. **Regularly rotate test wallet keys**
5. **Monitor test wallet for unexpected activity**

## 🤝 Contributing

To contribute to the test suite:

1. **Add new test cases** in `integration-test.ts`
2. **Update this documentation** for new features
3. **Ensure all tests pass** before submitting PR
4. **Follow existing code style** and patterns

### Test Guidelines

- Each test should be **independent** and **idempotent**
- Use **descriptive test names** and **clear error messages**
- **Clean up resources** after tests (if applicable)
- **Handle network timeouts** gracefully
- **Provide meaningful assertions** and validations

## 📚 Additional Resources

- [0G Chain Documentation](https://docs.0g.ai/)
- [0G Data Availability Guide](https://docs.0g.ai/0g-da/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Intellify SDK Documentation](./sdk/README.md)

---

**Happy Testing! 🧪✨**

For questions or issues, please open an issue in the repository or contact the Intellify team.