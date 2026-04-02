import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import * as dotenv from 'dotenv';

// Load env vars only in local development
if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
  dotenv.config();
}

// Debugging (Safe logic)
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  dotenv.config(); // Force load if missing
}

console.log('☁️ Cloudinary: Initializing with Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
if (process.env.CLOUDINARY_API_SECRET) {
  console.log('☁️ Cloudinary: API Secret found (Starts with', process.env.CLOUDINARY_API_SECRET.substring(0, 4) + '...)');
} else {
  console.error('❌ Cloudinary: API Secret MISSING!');
}

// Configuration
cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
  api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
  api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
});

// Storage for Profile Images
export const profileImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'investment-portal/profile-images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    public_id: (req: any, file: any) => {
      const userId = req.user?.userId || 'unknown';
      return `user-${userId}-${Date.now()}`;
    },
  } as any,
});

// Storage for Fund Images
export const fundImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'investment-portal/fund-images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    public_id: (req: any, file: any) => {
      const fundId = req.params.id || 'unknown';
      return `fund-${fundId}`;
    },
  } as any,
});

// Storage for Fund Documents (PDF, Word, etc.)
export const fundDocumentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'investment-portal/fund-documents',
    resource_type: 'auto', // Important for non-image files like PDF
    public_id: (req: any, file: any) => {
      const randomName = Math.random().toString(36).substring(2, 15);
      return `doc-${Date.now()}-${randomName}`;
    },
  } as any,
});

export { cloudinary };
