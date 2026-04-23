const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dgryu0jxy',
  api_key: '942283546856981',
  api_secret: '2pldpJ334UIDx2GE-o8dCvx0E1w',
  secure: true
});

async function listAllKyc() {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'investment-portal/kyc-docs/',
      max_results: 50
    });
    console.log(`Found ${result.resources.length} resources:`);
    result.resources.forEach(r => console.log(`- ${r.public_id} (${r.resource_type})`));
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

listAllKyc();
