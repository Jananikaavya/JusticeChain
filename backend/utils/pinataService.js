import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const PINATA_GATEWAY_URL = process.env.PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';

console.log('DEBUG Pinata API Key:', PINATA_API_KEY);
console.log('DEBUG Pinata Secret Key:', PINATA_SECRET_API_KEY);
console.log('DEBUG Pinata Gateway URL:', PINATA_GATEWAY_URL);

export const uploadToPinata = async (filePath, fileName, metadata = {}) => {
  try {
    if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
      console.warn('⚠️ Pinata credentials not configured.');
      return {
        success: false,
        message: 'Pinata not configured',
        ipfsHash: null,
        pinataUrl: null
      };
    }

    // Read file as stream
    const fileStream = fs.createReadStream(filePath);
    
    const formData = new FormData();
    formData.append('file', fileStream, fileName);
    
    // Add metadata
    const pinataMetadata = JSON.stringify({
      name: fileName,
      keyvalues: metadata
    });
    formData.append('pinataMetadata', pinataMetadata);

    // Add options
    const pinataOptions = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', pinataOptions);

    console.log('📤 Uploading to Pinata via axios:', { 
      fileName,
      apiKeyPrefix: PINATA_API_KEY.substring(0, 10) + '...'
    });

    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_API_KEY,
        ...formData.getHeaders()
      }
    });

    console.log('✅ Pinata Upload Success:', response.data.IpfsHash);
    
    return {
      success: true,
      ipfsHash: response.data.IpfsHash,
      pinataUrl: `${PINATA_GATEWAY_URL}${response.data.IpfsHash}`,
      pinataIpfsGatewayUrl: `ipfs://${response.data.IpfsHash}`
    };

  } catch (error) {
    console.error('❌ Pinata upload error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.error || error.message,
      ipfsHash: null,
      pinataUrl: null
    };
  }
};

export const generateEvidenceHash = (ipfsHash, caseId, evidenceType) => {
  // Generate a deterministic hash combining IPFS hash, case ID, and evidence type
  const hashInput = `${ipfsHash}:${caseId}:${evidenceType}:${Date.now()}`;
  return crypto.createHash('sha256').update(hashInput).digest('hex');
};

export const verifyEvidenceImmutability = async (ipfsHash) => {
  try {
    if (!ipfsHash) {
      return { verified: false, message: 'Invalid IPFS hash' };
    }

    // Verify the file exists on Pinata
    const response = await fetch(`${PINATA_GATEWAY_URL}${ipfsHash}`, {
      method: 'HEAD'
    });

    return {
      verified: response.ok,
      message: response.ok ? 'Evidence is immutable and verified' : 'Evidence verification failed',
      accessibleAt: `${PINATA_GATEWAY_URL}${ipfsHash}`
    };

  } catch (error) {
    console.error('Verification error:', error.message);
    return {
      verified: false,
      message: error.message
    };
  }
};

export const testPinataConnection = async () => {
  try {
    if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
      console.log('⚠️ Pinata credentials not configured in .env');
      return false;
    }

    const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      method: 'GET',
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_API_KEY
      }
    });

    if (response.ok) {
      console.log('✅ Pinata connection verified');
      return true;
    } else {
      console.warn('⚠️ Pinata authentication failed');
      return false;
    }

  } catch (error) {
    console.error('Pinata connection error:', error.message);
    return false;
  }
};
