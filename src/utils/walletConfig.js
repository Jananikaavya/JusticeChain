import { defaultWagmiConfig } from '@web3modal/wagmi';
import { sepolia } from 'wagmi/chains';

// Get projectId from WalletConnect Cloud: https://cloud.walletconnect.com
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// Define chains
const chains = [sepolia];

// Define metadata
const metadata = {
  name: 'Justice Chain',
  description: 'Criminal Record & Evidence Management System',
  url: window.location.origin,
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// Create wagmi config
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: false,
});
