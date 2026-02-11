import { useEffect, useState } from "react";

const WalletConnect = ({ onConnect }) => {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState("");

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError("MetaMask not detected. Please install MetaMask.");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setAccount(accounts[0]);
      onConnect(accounts[0]);
    } catch (err) {
      console.error(err);
      setError("Wallet connection failed.");
    }
  };

  // Listen for account change
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        setAccount(accounts[0]);
        onConnect(accounts[0]);
      });
    }
  }, []);

  return (
    <div className="w-full">
      <button
        onClick={connectWallet}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold"
      >
        {account
          ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
          : "Connect MetaMask"}
      </button>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};

export default WalletConnect;
