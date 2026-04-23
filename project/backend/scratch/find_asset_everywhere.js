const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dgryu0jxy',
  api_key: '942283546856981',
  api_secret: '2pldpJ334UIDx2GE-o8dCvx0E1w',
  secure: true
});

async function findAssetEverywhere() {
  const ID = 'kyc-1775627641409-y658vhyenmm';
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      max_results: 100
    });
    console.log(`Searching for ${ID} in the last 100 uploads...`);
    const found = result.resources.find(r => r.public_id.includes(ID));
    if (found) {
      console.log(`✅ FOUND! Public ID: ${found.public_id}, Type: ${found.resource_type}`);
    } else {
      console.log('❌ Not found in last 100 uploads.');
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

findAssetEverywhere();
