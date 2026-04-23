const cloudinary = require('cloudinary').v2;
const axios = require('axios');

// Using the credentials from your .env
cloudinary.config({
  cloud_name: 'dgryu0jxy',
  api_key: '942283546856981',
  api_secret: '2pldpJ334UIDx2GE-o8dCvx0E1w',
  secure: true
});

const PUBLIC_ID = 'investment-portal/fund-documents/doc-1776925309307-sn4b56i7qzs';

async function testAuth() {
  console.log('--- Cloudinary Auth Test ---');
  
  try {
    // 1. Test Admin API (Locating the asset)
    console.log(`1. Locating asset: ${PUBLIC_ID}...`);
    const resource = await cloudinary.api.resource(PUBLIC_ID, { resource_type: 'image' });
    console.log('✅ Asset found via Admin API!');
    console.log(`   Type: ${resource.type}, ResourceType: ${resource.resource_type}, Format: ${resource.format}`);

    // 2. Test specialized signature (private_download_url)
    console.log('\n2. Generating specialized signed URL...');
    const signedUrl = cloudinary.utils.private_download_url(resource.public_id, resource.format, {
      resource_type: resource.resource_type,
      type: resource.type,
      version: resource.version
    });
    console.log(`🔗 Generated URL: ${signedUrl}`);

    // 3. Attempt to fetch the file using this URL (like the proxy does)
    console.log('\n3. Attempting to fetch file via signed URL...');
    const response = await axios.get(signedUrl, { 
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (response.status === 200) {
      console.log('✅ SUCCESS! The file is accessible with this signature.');
    } else {
      console.log(`❌ FAILED! Status: ${response.status}`);
    }

  } catch (error) {
    console.error('❌ ERROR during testing:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    } else {
      console.error(`   Message: ${error.message}`);
    }
  }
}

testAuth();
