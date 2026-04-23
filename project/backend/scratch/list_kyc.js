const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dgryu0jxy',
  api_key: '942283546856981',
  api_secret: '2pldpJ334UIDx2GE-o8dCvx0E1w',
  secure: true
});

async function listKycDocs() {
  console.log('--- Listing assets in kyc-docs folder ---');
  try {
    const resourceTypes = ['image', 'raw', 'video'];
    for (const rType of resourceTypes) {
      console.log(`Checking ${rType}...`);
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'investment-portal/kyc-docs/',
        resource_type: rType,
        max_results: 10
      });
      if (result.resources.length > 0) {
        console.log(`Found ${result.resources.length} resources of type ${rType}:`);
        result.resources.forEach(r => console.log(`- ${r.public_id} (${r.format})`));
      }
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

listKycDocs();
