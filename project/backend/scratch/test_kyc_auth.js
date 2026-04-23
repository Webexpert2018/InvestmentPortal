const cloudinary = require('cloudinary').v2;
const axios = require('axios');

cloudinary.config({
  cloud_name: 'dgryu0jxy',
  api_key: '942283546856981',
  api_secret: '2pldpJ334UIDx2GE-o8dCvx0E1w',
  secure: true
});

const PUBLIC_ID = 'investment-portal/kyc-docs/kyc-1775627641409-y658vhyenmm';

async function testKYC() {
  console.log('--- Cloudinary KYC Auth Test ---');
  
  try {
    const resourceTypes = ['image', 'raw'];
    let resource = null;

    for (const rType of resourceTypes) {
      try {
        console.log(`Searching as ${rType}...`);
        resource = await cloudinary.api.resource(PUBLIC_ID, { resource_type: rType });
        if (resource) break;
      } catch (e) {}
    }

    if (!resource) {
      console.log('❌ Asset NOT FOUND via Admin API!');
      return;
    }

    console.log('✅ Asset found!');
    console.log(JSON.stringify(resource, null, 2));

    // Test 1: private_download_url (What we have now)
    console.log('\n--- Strategy 1: private_download_url ---');
    const signedUrl1 = cloudinary.utils.private_download_url(resource.public_id, resource.format, {
      resource_type: resource.resource_type,
      type: resource.type,
    });
    console.log(`🔗 URL 1: ${signedUrl1}`);
    try {
      const res1 = await axios.get(signedUrl1);
      console.log(`✅ Success (1)! Status: ${res1.status}`);
    } catch (e) {
      console.log(`❌ Failed (1)! Status: ${e.response?.status}`);
      console.log(`   Error: ${e.response?.headers['x-cld-error']}`);
    }

    // Test 2: cloudinary.url (Alternative)
    console.log('\n--- Strategy 2: cloudinary.url with sign_url ---');
    const signedUrl2 = cloudinary.url(resource.public_id, {
      resource_type: resource.resource_type,
      type: resource.type,
      sign_url: true,
      secure: true
    });
    console.log(`🔗 URL 2: ${signedUrl2}`);
    try {
      const res2 = await axios.get(signedUrl2);
      console.log(`✅ Success (2)! Status: ${res2.status}`);
    } catch (e) {
      console.log(`❌ Failed (2)! Status: ${e.response?.status}`);
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

testKYC();
