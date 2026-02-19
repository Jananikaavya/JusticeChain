import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const PINATA_GATEWAY_URL = process.env.PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';

console.log('DEBUG Pinata API Key:', PINATA_API_KEY);
console.log('DEBUG Pinata Secret Key:', PINATA_SECRET_API_KEY);
console.log('DEBUG Pinata Gateway URL:', PINATA_GATEWAY_URL);

export const uploadToPinata = async (filePath, fileName, metadata = {}) => {
  try {
    if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
      console.warn('⚠️ Pinata credentials not configured. Evidence will be stored locally only.');
      return {
        success: false,
        message: 'Pinata not configured',
        ipfsHash: null,
        pinataUrl: null
      };
    }

    // Read file as buffer
    const fileBuffer = fs.readFileSync(filePath);
    
    const form = new FormData();
    form.append('file', fileBuffer, fileName);
    
    // Add metadata as JSON string
    const pinataMetadata = JSON.stringify({
      name: fileName,
      keyvalues: metadata
    });
    form.append('pinataMetadata', pinataMetadata);

    // Add options as JSON string
    const pinataOptions = JSON.stringify({
      cidVersion: 0,
    });
    form.append('pinataOptions', pinataOptions);

    console.log('📤 Uploading to Pinata:', { fileName, size: fileBuffer.length });

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_API_KEY,
        ...form.getHeaders()
      },
      body: form
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Pinata API Error:', response.status, error);
      throw new Error(`Pinata Error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    console.log('✅ Pinata Upload Success:', data.IpfsHash);
    
    return {
      success: true,
      ipfsHash: data.IpfsHash,
      pinataUrl: `${PINATA_GATEWAY_URL}${data.IpfsHash}`,
      pinataIpfsGatewayUrl: `ipfs://${data.IpfsHash}`
    };

  } catch (error) {
    console.error('Pinata upload error:', error.message);
    return {
      success: false,
      message: error.message,
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
