# WalletConnect Mobile Setup Guide

## What Changed?

Your app now uses **WalletConnect (Web3Modal)** instead of direct MetaMask connection. This allows users to connect their wallet from ANY mobile browser - not just MetaMask's in-app browser!

## Supported Wallets
- MetaMask (mobile & desktop)
- Trust Wallet
- Rainbow
- Coinbase Wallet
- And 300+ other wallets!

## Setup Steps

### 1. Get WalletConnect Project ID (REQUIRED)

1. Visit: https://cloud.walletconnect.com/
2. Sign in with GitHub or Email
3. Click "Create New Project"
4. Enter project name: `Justice Chain`
5. Copy the **Project ID** (looks like: `a1b2c3d4e5f6g7h8...`)

### 2. Add Project ID to Environment

Open `.env.local` file and add your Project ID:

```env
VITE_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here
```

### 3. Test Locally

```bash
npm run dev
```

Open on your Android phone and test the "Connect Wallet" button. It should now:
- Show a modal with multiple wallet options
- Work from ANY mobile browser (Chrome, Firefox, etc.)
- Support QR code scanning to connect desktop wallets

### 4. Deploy to Vercel

After testing locally, deploy to Vercel:

1. Push to GitHub: `git push origin main` (already done!)
2. Go to Vercel dashboard
3. Add environment variable:
   - `VITE_WALLETCONNECT_PROJECT_ID` = your project ID
4. Redeploy

## How It Works

**Old Approach (Direct MetaMask):**
- Only worked if `window.ethereum` was available
- Mobile browsers don't inject `window.ethereum`
- Required MetaMask's in-app browser

**New Approach (WalletConnect):**
- Uses WalletConnect protocol
- Works from any browser
- Shows modal with wallet options
- Mobile users can scan QR code or use deep links

## Files Modified

1. `package.json` - Added @web3modal/wagmi, wagmi, viem, @tanstack/react-query
2. `src/utils/walletConfig.js` - Web3Modal configuration
3. `src/App.jsx` - Wrapped app with WagmiProvider and QueryClientProvider
4. `src/components/WalletConnect.jsx` - Updated to use Web3Modal hooks
5. `.env.local` - Added VITE_WALLETCONNECT_PROJECT_ID

## Testing Checklist

- [ ] Get WalletConnect Project ID
- [ ] Add Project ID to `.env.local`
- [ ] Test locally: `npm run dev`
- [ ] Connect wallet from mobile browser
- [ ] Register case with connected wallet
- [ ] Push to GitHub
- [ ] Add Project ID to Vercel environment variables
- [ ] Deploy and test on live URL

## Need Help?

WalletConnect Documentation: https://docs.walletconnect.com/
Web3Modal React: https://docs.walletconnect.com/web3modal/react/about
