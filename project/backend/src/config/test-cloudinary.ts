import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Force load env from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('--- Cloudinary Credential Test ---');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY);
console.log('API Secret (Masked):', process.env.CLOUDINARY_API_SECRET ? (process.env.CLOUDINARY_API_SECRET.substring(0, 4) + '...') : 'MISSING');

cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
  api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
  api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
});

async function test() {
  try {
    console.log('Testing Cloudinary Ping...');
    const result = await cloudinary.api.ping();
    console.log('✅ API Ping Success:', result);
    
    console.log('Attempting sample upload...');
    const uploadResult = await cloudinary.uploader.upload('https://cloudinary-res.cloudinary.com/image/upload/dphin3idclbc8y9v18z6.jpg', {
      folder: 'test-folder',
    });
    console.log('✅ Sample Upload Success:', uploadResult.secure_url);
  } catch (error: any) {
    console.error('❌ Cloudinary Test Failed!');
    console.error('Error Code:', error.http_code);
    console.error('Error Message:', error.message);
    if (error.message.includes('Invalid Signature')) {
       console.error('TIP: This means the API Secret or Key is WRONG.');
    }
  }
}

test();
