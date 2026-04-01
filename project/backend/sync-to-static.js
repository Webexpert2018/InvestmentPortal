const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function syncImages() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  const uploadsDir = path.join(__dirname, 'uploads', 'fund-images');
  const publicDir = path.join(__dirname, 'public', 'fund-images');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const res = await client.query('SELECT id, name, image_url FROM funds');
    const funds = res.rows;

    for (const fund of funds) {
      console.log(`Processing fund: ${fund.name} (${fund.id})`);
      
      // Look for files in uploads directory starting with fund-{id}-
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        const matchingFiles = files.filter(f => f.startsWith(`fund-${fund.id}-`));

        if (matchingFiles.length > 0) {
          // Sort by timestamp (latest first) if multiple
          matchingFiles.sort((a, b) => b.localeCompare(a));
          const sourceFile = matchingFiles[0];
          const ext = path.extname(sourceFile);
          const targetFile = `fund-${fund.id}${ext}`;
          
          const sourcePath = path.join(uploadsDir, sourceFile);
          const targetPath = path.join(publicDir, targetFile);

          fs.copyFileSync(sourcePath, targetPath);
          console.log(`  - Copied ${sourceFile} to ${targetFile}`);

          const newUrl = `/public/fund-images/${targetFile}`;
          await client.query('UPDATE funds SET image_url = $1 WHERE id = $2', [newUrl, fund.id]);
          console.log(`  - Updated DB image_url to: ${newUrl}`);
        } else {
          console.log(`  - ⚠️ No matching files found in uploads for ${fund.id}`);
          
          // Also check the old public dir just in case
          const oldPublicDir = path.join(__dirname, 'public', 'fund-images');
          if (fs.existsSync(oldPublicDir)) {
             const oldFiles = fs.readdirSync(oldPublicDir);
             const oldMatch = oldFiles.find(f => f.startsWith(`fund-${fund.id}-`));
             if (oldMatch) {
                const ext = path.extname(oldMatch);
                const targetFile = `fund-${fund.id}${ext}`;
                fs.copyFileSync(path.join(oldPublicDir, oldMatch), path.join(publicDir, targetFile));
                const newUrl = `/public/fund-images/${targetFile}`;
                await client.query('UPDATE funds SET image_url = $1 WHERE id = $2', [newUrl, fund.id]);
                console.log(`  - Found in public! Copied and updated DB.`);
             }
          }
        }
      }
    }

    console.log('✨ Synchronization complete!');
  } catch (err) {
    console.error('❌ Error during sync:', err);
  } finally {
    await client.end();
  }
}

syncImages();
