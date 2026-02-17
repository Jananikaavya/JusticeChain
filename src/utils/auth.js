import { ethers } from "ethers";

// Session management utility
export const setSession = (user) => {
  localStorage.setItem("session", JSON.stringify(user));
};

export const getSession = () => {
  const session = localStorage.getItem("session");
  const storedUser = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  const parsedSession = session ? JSON.parse(session) : null;
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;

  const merged = parsedSession || parsedUser;
  if (!merged) {
    return null;
  }

  if (token && !merged.token) {
    merged.token = token;
  }

  return merged;
};

export const clearSession = () => {
  localStorage.removeItem("session");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("roleVerified");
  localStorage.removeItem("verificationError");
};

export const isLoggedIn = () => {
  return getSession() !== null;
};

export const isAdmin = () => {
  const session = getSession();
  return session && session.role === "ADMIN";
};

export const getUserRole = () => {
  const session = getSession();
  return session ? session.role : null;
};

/**
 * Verify user role on blockchain
 * @param {string} walletAddress - User's wallet address
 * @param {string} role - User's role (POLICE, FORENSIC, JUDGE)
 * @returns {Promise<{verified: boolean, error: string|null}>}
 */
export const verifyRoleOnBlockchain = async (walletAddress, role) => {
  try {
    if (!walletAddress || !role) {
      return { verified: false, error: "Missing wallet or role" };
    }

    const contractAddress = import.meta.env.VITE_JUSTICECHAIN_CONTRACT;
    if (!contractAddress) {
      return { verified: false, error: "Contract address not configured" };
    }

    // Contract ABI for role verification functions
    const CONTRACT_ABI = [
      "function police(address) view returns (bool)",
      "function forensic(address) view returns (bool)",
      "function judge(address) view returns (bool)"
    ];

    // Use Infura RPC to read from blockchain without requiring user wallet
    const provider = new ethers.JsonRpcProvider(
      "https://sepolia.infura.io/v3/59fdc70c62514158a761187b8c0988a7"
    );

    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);

    // Map role to contract method
    const roleMethodMap = {
      POLICE: "police",
      FORENSIC: "forensic",
      JUDGE: "judge"
    };

    const methodName = roleMethodMap[String(role).toUpperCase()];
    if (!methodName) {
      return { verified: false, error: "Invalid role" };
    }

    // Call the contract method to check if wallet has the role
    const isVerified = await contract[methodName](walletAddress);

    if (isVerified) {
      localStorage.setItem("roleVerified", "true");
      localStorage.removeItem("verificationError");
      return { verified: true, error: null };
    } else {
      const error = `Wallet not registered as ${role} on blockchain`;
      localStorage.setItem("roleVerified", "false");
      localStorage.setItem("verificationError", error);
      return { verified: false, error };
    }
  } catch (error) {
    const errorMsg = error.message || "Failed to verify role on blockchain";
    localStorage.setItem("roleVerified", "false");
    localStorage.setItem("verificationError", errorMsg);
    console.error("Blockchain verification error:", error);
    return { verified: false, error: errorMsg };
  }
};

export const getRoleVerificationStatus = () => {
  const verified = localStorage.getItem("roleVerified") === "true";
  const error = localStorage.getItem("verificationError");
  return { verified, error };
};
