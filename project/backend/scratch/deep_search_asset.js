const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dgryu0jxy',
  api_key: '942283546856981',
  api_secret: '2pldpJ334UIDx2GE-o8dCvx0E1w',
  secure: true
});

const ID = 'investment-portal/kyc-docs/kyc-1775627641409-y658vhyenmm';

async function deepSearch() {
  const resourceTypes = ['image', 'raw'];
  const deliveryTypes = ['upload', 'private', 'authenticated'];

  for (const rType of resourceTypes) {
    for (const dType of deliveryTypes) {
      try {
        console.log(`Searching for [${ID}] as rType:${rType}, dType:${dType}...`);
        const resource = await cloudinary.api.resource(ID, { 
          resource_type: rType,
          type: dType
        });
        if (resource) {
          console.log(`✅ FOUND!`);
          console.log(JSON.stringify(resource, null, 2));
          return;
        }
      } catch (e) {
        // console.log(`   Not found: ${e.message}`);
      }
    }
  }
  console.log('❌ Asset NOT FOUND in any combination.');
}

deepSearch();
