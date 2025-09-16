/**
 * Simple Test Runner for Intellify INFT Integration Tests
 * 
 * This script provides an easy way to run integration tests
 * without requiring a full test framework setup.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPrerequisites() {
  colorLog('cyan', '🔍 Checking prerequisites...');
  
  // Check if Node.js modules are installed
  const packageJsonPath = path.join(__dirname, 'package.json');
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  
  if (!fs.existsSync(packageJsonPath)) {
    colorLog('red', '❌ package.json not found. Please run npm init first.');
    return false;
  }
  
  if (!fs.existsSync(nodeModulesPath)) {
    colorLog('yellow', '⚠️  node_modules not found. Please run npm install first.');
    return false;
  }
  
  // Check if TypeScript is available
  try {
    require.resolve('typescript');
    colorLog('green', '✅ TypeScript found');
  } catch (error) {
    colorLog('yellow', '⚠️  TypeScript not found globally. Using local version if available.');
  }
  
  // Check if test file exists
  const testFilePath = path.join(__dirname, 'tests', 'integration-test.ts');
  if (!fs.existsSync(testFilePath)) {
    colorLog('red', '❌ Integration test file not found at tests/integration-test.ts');
    return false;
  }
  
  colorLog('green', '✅ Prerequisites check passed');
  return true;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function compileTypeScript() {
  colorLog('cyan', '🔨 Compiling TypeScript...');
  
  try {
    // Try to use local TypeScript first, then global
    const tscPath = path.join(__dirname, 'node_modules', '.bin', 'tsc');
    const useLocalTsc = fs.existsSync(tscPath);
    
    const command = useLocalTsc ? tscPath : 'tsc';
    const args = [
      '--target', 'ES2020',
      '--module', 'commonjs',
      '--moduleResolution', 'node',
      '--esModuleInterop',
      '--allowSyntheticDefaultImports',
      '--skipLibCheck',
      '--outDir', './dist',
      './tests/integration-test.ts'
    ];
    
    await runCommand(command, args);
    colorLog('green', '✅ TypeScript compilation successful');
    return true;
  } catch (error) {
    colorLog('red', `❌ TypeScript compilation failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  colorLog('cyan', '🧪 Running integration tests...');
  
  try {
    // Run the compiled JavaScript
    await runCommand('node', ['./dist/tests/integration-test.js']);
    colorLog('green', '✅ Tests completed successfully');
    return true;
  } catch (error) {
    colorLog('red', `❌ Tests failed: ${error.message}`);
    return false;
  }
}

function printUsage() {
  colorLog('bright', '\n📖 Intellify INFT Test Runner');
  colorLog('bright', '================================');
  console.log('');
  console.log('Usage: node test-runner.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --compile-only Compile TypeScript without running tests');
  console.log('  --run-only     Run tests without compiling (assumes already compiled)');
  console.log('');
  console.log('Examples:');
  console.log('  node test-runner.js                 # Full test run (compile + test)');
  console.log('  node test-runner.js --compile-only   # Just compile TypeScript');
  console.log('  node test-runner.js --run-only       # Just run tests');
  console.log('');
  colorLog('yellow', '⚠️  Important: Update TEST_CONFIG in integration-test.ts with your:');
  console.log('   - Contract address');
  console.log('   - Private key (testnet only!)');
  console.log('   - RPC URL');
  console.log('   - 0G DA endpoint');
  console.log('');
}

function printBanner() {
  colorLog('magenta', '\n' + '='.repeat(60));
  colorLog('magenta', '🚀 INTELLIFY INFT INTEGRATION TEST RUNNER');
  colorLog('magenta', '='.repeat(60));
  console.log('');
  colorLog('cyan', '🎯 Testing 0G DA integration, INFT evolution, and SDK functionality');
  console.log('');
}

async function main() {
  const args = process.argv.slice(2);
  
  // Handle help
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }
  
  printBanner();
  
  // Check prerequisites
  if (!checkPrerequisites()) {
    colorLog('red', '\n❌ Prerequisites check failed. Please fix the issues above.');
    process.exit(1);
  }
  
  console.log('');
  
  try {
    const compileOnly = args.includes('--compile-only');
    const runOnly = args.includes('--run-only');
    
    if (runOnly) {
      // Just run tests
      const success = await runTests();
      process.exit(success ? 0 : 1);
    } else {
      // Compile TypeScript
      const compileSuccess = await compileTypeScript();
      if (!compileSuccess) {
        process.exit(1);
      }
      
      if (compileOnly) {
        colorLog('green', '\n✅ Compilation completed successfully!');
        process.exit(0);
      }
      
      // Run tests
      console.log('');
      const testSuccess = await runTests();
      
      if (testSuccess) {
        colorLog('green', '\n🎉 All tests completed successfully!');
        colorLog('cyan', '\n📋 Next steps:');
        console.log('   1. Review test results above');
        console.log('   2. Fix any failing tests');
        console.log('   3. Deploy to mainnet when ready');
        console.log('   4. Update SDK documentation');
      } else {
        colorLog('red', '\n❌ Some tests failed. Please review and fix.');
      }
      
      process.exit(testSuccess ? 0 : 1);
    }
  } catch (error) {
    colorLog('red', `\n💥 Unexpected error: ${error.message}`);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  colorLog('yellow', '\n\n⚠️  Test runner interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  colorLog('yellow', '\n\n⚠️  Test runner terminated');
  process.exit(143);
});

// Run main function
if (require.main === module) {
  main().catch((error) => {
    colorLog('red', `\n💥 Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  checkPrerequisites,
  compileTypeScript,
  runTests,
  runCommand
};