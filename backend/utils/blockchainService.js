const Web3 = require('web3');
require('dotenv').config();

// Initialize Web3 - will be configured after contract deployment
let web3;
let contract;
let contractAddress;
const contractABI = require('./JusticeChainABI.json'); // You'll get this from Remix

// Configuration for blockchain service
const BLOCKCHAIN_CONFIG = {
  // Ethereum Sepolia Testnet
  sepolia: {
    rpcUrl: 'https://sepolia.infura.io/v3/' + (process.env.INFURA_API_KEY || ''),
    chainId: 11155111,
    networkName: 'Ethereum Sepolia Testnet'
  },
  // Polygon Mumbai Testnet
  mumbai: {
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    chainId: 80001,
    networkName: 'Polygon Mumbai Testnet'
  }
};

/**
 * Initialize blockchain service with contract address and network
 * @param {string} address - Smart contract address
 * @param {string} network - Network name: 'sepolia' or 'mumbai'
 * @param {string} privateKey - Private key for signing transactions
 */
function initBlockchain(address, network = 'sepolia', privateKey) {
  try {
    if (!BLOCKCHAIN_CONFIG[network]) {
      throw new Error(`Network ${network} not supported. Use 'sepolia' or 'mumbai'`);
    }

    const config = BLOCKCHAIN_CONFIG[network];
    web3 = new Web3(new Web3.providers.HttpProvider(config.rpcUrl));
    contractAddress = address;

    // Load contract ABI
    if (!contractABI || !Array.isArray(contractABI)) {
      throw new Error('Invalid contract ABI. Make sure JusticeChainABI.json exists.');
    }

    contract = new web3.eth.Contract(contractABI, contractAddress);

    console.log(`✅ Blockchain initialized on ${config.networkName}`);
    console.log(`📄 Contract Address: ${contractAddress}`);
    
    return true;
  } catch (error) {
    console.error('❌ Blockchain initialization failed:', error.message);
    return false;
  }
}

/**
 * Create case on blockchain
 * @param {string} policeAddress - Police officer's wallet address
 * @param {string} privateKey - Private key for signing
 */
async function createCaseOnBlockchain(policeAddress, privateKey) {
  try {
    if (!contract) throw new Error('Blockchain not initialized');

    const from = policeAddress.toLowerCase();
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);

    // Estimate gas
    const gas = await contract.methods.createCase().estimateGas({ from });

    // Build transaction
    const tx = {
      from: account.address,
      to: contractAddress,
      data: contract.methods.createCase().encodeABI(),
      gas: Math.ceil(gas * 1.2), // Add 20% buffer
      gasPrice: await web3.eth.getGasPrice(),
      chainId: process.env.CHAIN_ID || 11155111
    };

    // Sign transaction
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

    // Send transaction
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
    console.log(`✅ Case created on blockchain. TX: ${receipt.transactionHash}`);
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed
    };
  } catch (error) {
    console.error('❌ Error creating case on blockchain:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Add evidence to case on blockchain
 * @param {number} caseId - Case ID
 * @param {string} ipfsHash - IPFS hash of evidence
 * @param {string} policeAddress - Police officer's wallet
 * @param {string} privateKey - Private key for signing
 */
async function addEvidenceOnBlockchain(caseId, ipfsHash, policeAddress, privateKey) {
  try {
    if (!contract) throw new Error('Blockchain not initialized');

    const account = web3.eth.accounts.privateKeyToAccount(privateKey);

    // Estimate gas
    const gas = await contract.methods.addEvidence(caseId, ipfsHash).estimateGas({ 
      from: account.address 
    });

    // Build transaction
    const tx = {
      from: account.address,
      to: contractAddress,
      data: contract.methods.addEvidence(caseId, ipfsHash).encodeABI(),
      gas: Math.ceil(gas * 1.2),
      gasPrice: await web3.eth.getGasPrice(),
      chainId: process.env.CHAIN_ID || 11155111
    };

    // Sign and send
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
    console.log(`✅ Evidence added on blockchain. TX: ${receipt.transactionHash}`);
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      ipfsHash: ipfsHash
    };
  } catch (error) {
    console.error('❌ Error adding evidence on blockchain:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Submit forensic report on blockchain
 * @param {number} caseId - Case ID
 * @param {string} ipfsHash - IPFS hash of forensic report
 * @param {string} forensicAddress - Forensic officer's wallet
 * @param {string} privateKey - Private key for signing
 */
async function submitForensicReportOnBlockchain(caseId, ipfsHash, forensicAddress, privateKey) {
  try {
    if (!contract) throw new Error('Blockchain not initialized');

    const account = web3.eth.accounts.privateKeyToAccount(privateKey);

    // Estimate gas
    const gas = await contract.methods.submitForensicReport(caseId, ipfsHash).estimateGas({ 
      from: account.address 
    });

    // Build transaction
    const tx = {
      from: account.address,
      to: contractAddress,
      data: contract.methods.submitForensicReport(caseId, ipfsHash).encodeABI(),
      gas: Math.ceil(gas * 1.2),
      gasPrice: await web3.eth.getGasPrice(),
      chainId: process.env.CHAIN_ID || 11155111
    };

    // Sign and send
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
    console.log(`✅ Forensic report submitted on blockchain. TX: ${receipt.transactionHash}`);
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      caseId: caseId
    };
  } catch (error) {
    console.error('❌ Error submitting forensic report on blockchain:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Give verdict on case - marks as immutable on blockchain
 * @param {number} caseId - Case ID
 * @param {string} decision - Verdict decision (GUILTY, NOT_GUILTY, DISMISSED)
 * @param {string} judgeAddress - Judge's wallet address
 * @param {string} privateKey - Private key for signing
 */
async function giveVerdictOnBlockchain(caseId, decision, judgeAddress, privateKey) {
  try {
    if (!contract) throw new Error('Blockchain not initialized');

    const account = web3.eth.accounts.privateKeyToAccount(privateKey);

    // Estimate gas
    const gas = await contract.methods.giveVerdict(caseId, decision).estimateGas({ 
      from: account.address 
    });

    // Build transaction
    const tx = {
      from: account.address,
      to: contractAddress,
      data: contract.methods.giveVerdict(caseId, decision).encodeABI(),
      gas: Math.ceil(gas * 1.2),
      gasPrice: await web3.eth.getGasPrice(),
      chainId: process.env.CHAIN_ID || 11155111
    };

    // Sign and send
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
    console.log(`✅ Verdict recorded on blockchain. TX: ${receipt.transactionHash}`);
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      caseId: caseId,
      decision: decision,
      isImmutable: true,
      verifiedAt: new Date()
    };
  } catch (error) {
    console.error('❌ Error giving verdict on blockchain:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Log access to case for audit trail
 * @param {number} caseId - Case ID
 * @param {string} userAddress - User's wallet address
 * @param {string} privateKey - Private key for signing
 */
async function logAccessOnBlockchain(caseId, userAddress, privateKey) {
  try {
    if (!contract) throw new Error('Blockchain not initialized');

    const account = web3.eth.accounts.privateKeyToAccount(privateKey);

    // Estimate gas
    const gas = await contract.methods.logAccess(caseId).estimateGas({ 
      from: account.address 
    });

    // Build transaction
    const tx = {
      from: account.address,
      to: contractAddress,
      data: contract.methods.logAccess(caseId).encodeABI(),
      gas: Math.ceil(gas * 1.2),
      gasPrice: await web3.eth.getGasPrice(),
      chainId: process.env.CHAIN_ID || 11155111
    };

    // Sign and send
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
    console.log(`✅ Access logged on blockchain. TX: ${receipt.transactionHash}`);
    return {
      success: true,
      transactionHash: receipt.transactionHash
    };
  } catch (error) {
    console.error('❌ Error logging access on blockchain:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify evidence hash on blockchain
 * @param {number} caseId - Case ID
 * @param {number} index - Evidence index
 */
async function verifyEvidenceOnBlockchain(caseId, index) {
  try {
    if (!contract) throw new Error('Blockchain not initialized');

    const hash = await contract.methods.verifyEvidence(caseId, index).call();
    return {
      success: true,
      hash: hash
    };
  } catch (error) {
    console.error('❌ Error verifying evidence on blockchain:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get case details from blockchain
 * @param {number} caseId - Case ID
 */
async function getCaseFromBlockchain(caseId) {
  try {
    if (!contract) throw new Error('Blockchain not initialized');

    const caseData = await contract.methods.cases(caseId).call();
    return {
      success: true,
      caseId: caseData.caseId,
      policeOfficer: caseData.policeOfficer,
      forensicOfficer: caseData.forensicOfficer,
      judgeOfficer: caseData.judgeOfficer,
      approved: caseData.approved,
      closed: caseData.closed
    };
  } catch (error) {
    console.error('❌ Error getting case from blockchain:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  initBlockchain,
  createCaseOnBlockchain,
  addEvidenceOnBlockchain,
  submitForensicReportOnBlockchain,
  giveVerdictOnBlockchain,
  logAccessOnBlockchain,
  verifyEvidenceOnBlockchain,
  getCaseFromBlockchain,
  web3,
  contract,
  contractAddress
};
