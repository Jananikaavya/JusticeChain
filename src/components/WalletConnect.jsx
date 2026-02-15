import { useEffect } from "react";
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useDisconnect } from 'wagmi';

const WalletConnect = ({ onConnect }) => {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Update parent component when wallet connects/disconnects
  useEffect(() => {
    if (isConnected && address) {
      onConnect(address);
    }
  }, [isConnected, address, onConnect]);

  const handleConnect = async () => {
    await open();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <div className="w-full">
      {isConnected ? (
        <div className="space-y-2">
          <button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold"
          >
            Connected: {address.slice(0, 6)}...{address.slice(-4)}
          </button>
          <button
            onClick={handleDisconnect}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-semibold text-sm"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default WalletConnect;
