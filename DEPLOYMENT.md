# Deployment Guide - Intellify Wave 2

This guide provides comprehensive instructions for deploying the Intellify Wave 2 application to various platforms.

## 📋 Prerequisites

Before deploying, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- Git repository access
- 0G Network testnet tokens
- Required API keys and contract addresses

## 🔧 Environment Configuration

### Required Environment Variables

Create a `.env.local` file with the following variables:

```bash
# 0G Network Configuration
NEXT_PUBLIC_0G_RPC_URL=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_CHAIN_ID=16602
NEXT_PUBLIC_CHAIN_NAME=0G-Galileo-Testnet
NEXT_PUBLIC_NATIVE_CURRENCY_NAME=OG Token
NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL=OG
NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS=18

# Contract Addresses
NEXT_PUBLIC_INTELLIFY_CONTRACT_ADDRESS=0x37525E8B82C776F608eCA8A49C000b98a456fBdD
NEXT_PUBLIC_INFT_CONTRACT_ADDRESS=0x37525E8B82C776F608eCA8A49C000b98a456fBdD

# Application Configuration
NEXT_PUBLIC_APP_NAME=Intellify
NEXT_PUBLIC_APP_DESCRIPTION=Decentralized AI Knowledge Companion

# Optional: WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# 0G Compute Configuration
NEXT_PUBLIC_0G_COMPUTE_ENDPOINT=https://compute-testnet.0g.ai
NEXT_PUBLIC_0G_COMPUTE_API_KEY=your_compute_api_key_here

# 0G DA Configuration
NEXT_PUBLIC_0G_DA_RPC_ENDPOINT=https://rpc-testnet.0g.ai
NEXT_PUBLIC_0G_DA_GRPC_ENDPOINT=https://grpc-testnet.0g.ai
NEXT_PUBLIC_0G_DA_ENTRANCE_CONTRACT=0x37525E8B82C776F608eCA8A49C000b98a456fBdD
NEXT_PUBLIC_0G_DA_SIGNERS_CONTRACT=0x37525E8B82C776F608eCA8A49C000b98a456fBdD

# Block Explorer
NEXT_PUBLIC_BLOCK_EXPLORER_URL=https://chainscan-galileo.0g.ai

# Development/Debug
NEXT_PUBLIC_DEBUG=false
```

## 🚀 Vercel Deployment (Recommended)

### Automatic Deployment

1. **Connect Repository to Vercel**
   ```bash
   # Push your code to GitHub
   git add .
   git commit -m "Deploy to Vercel"
   git push origin main
   ```

2. **Import Project in Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure project settings

3. **Environment Variables Setup**
   In Vercel dashboard, add all environment variables from `.env.local`:
   - Go to Project Settings → Environment Variables
   - Add each variable with appropriate values
   - Use Vercel's secret management for sensitive data

4. **Deploy**
   - Vercel will automatically deploy on every push to main branch
   - Monitor deployment logs for any issues

### Manual Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables (if not set in dashboard)
vercel env add NEXT_PUBLIC_0G_RPC_URL
vercel env add NEXT_PUBLIC_INTELLIFY_CONTRACT_ADDRESS
# ... add all other variables
```

## 🐳 Docker Deployment

### Build Docker Image

```bash
# Create Dockerfile (already included in project)
docker build -t intellify-wave2 .

# Run container
docker run -p 3000:3000 --env-file .env.local intellify-wave2
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  intellify:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    restart: unless-stopped
```

```bash
# Deploy with Docker Compose
docker-compose up -d
```

## ☁️ AWS Deployment

### AWS Amplify

1. **Connect Repository**
   - Go to AWS Amplify Console
   - Connect your GitHub repository
   - Configure build settings

2. **Build Configuration**
   ```yaml
   # amplify.yml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci --legacy-peer-deps
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Environment Variables**
   - Add all required environment variables in Amplify console
   - Configure custom domain if needed

### AWS EC2

```bash
# Connect to EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-instance

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone your-repository-url
cd intellify

# Install dependencies
npm install --legacy-peer-deps

# Build application
npm run build

# Install PM2 for process management
npm install -g pm2

# Start application with PM2
pm2 start npm --name "intellify" -- start
pm2 startup
pm2 save
```

## 🌐 Netlify Deployment

1. **Connect Repository**
   - Go to Netlify dashboard
   - Connect GitHub repository

2. **Build Settings**
   ```bash
   # Build command
   npm run build

   # Publish directory
   .next
   ```

3. **Environment Variables**
   - Add all environment variables in Netlify dashboard
   - Configure redirects if needed

## 📊 Performance Optimization

### Bundle Analysis

```bash
# Analyze bundle size
npm run analyze

# This will open bundle analyzer in browser
# Identify large dependencies and optimize accordingly
```

### Performance Checklist

- ✅ Enable SWC minification
- ✅ Configure image optimization
- ✅ Implement proper caching headers
- ✅ Use compression middleware
- ✅ Optimize bundle size
- ✅ Enable tree shaking
- ✅ Implement code splitting

## 🔒 Security Configuration

### Security Headers

The application includes security headers in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### Environment Security

- Never commit `.env.local` to version control
- Use platform-specific secret management
- Rotate API keys regularly
- Monitor for exposed secrets

## 🧪 Testing Deployment

### Pre-deployment Checklist

```bash
# Run TypeScript check
npm run type-check

# Run linting
npm run lint

# Build locally
npm run build

# Test production build
npm start
```

### Post-deployment Verification

1. **Functionality Testing**
   - Wallet connection works
   - INFT creation and management
   - Marketplace functionality
   - Analytics dashboard
   - Social features

2. **Performance Testing**
   - Page load times
   - Bundle size analysis
   - Core Web Vitals
   - Mobile responsiveness

3. **Security Testing**
   - HTTPS enforcement
   - Security headers
   - No exposed secrets
   - Proper error handling

## 🔧 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

2. **Environment Variable Issues**
   - Ensure all required variables are set
   - Check variable naming (NEXT_PUBLIC_ prefix for client-side)
   - Verify values are correct

3. **Dependency Conflicts**
   ```bash
   # Use legacy peer deps flag
   npm install --legacy-peer-deps
   ```

4. **TypeScript Errors**
   ```bash
   # Check for type errors
   npx tsc --noEmit
   ```

## 📞 Support

For deployment issues:

1. Check the deployment logs
2. Verify environment variables
3. Test locally first
4. Review this documentation
5. Check platform-specific documentation

## 🔄 Continuous Deployment

### GitHub Actions (Optional)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci --legacy-peer-deps
      - name: Build
        run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

This deployment guide ensures a smooth and secure deployment process for the Intellify Wave 2 application across multiple platforms.