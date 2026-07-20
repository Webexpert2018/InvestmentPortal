const { chromium } = require('playwright');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// S3 Client setup
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'investor-portal-old-docs';
const processedFiles = new Set();
const processedUrls = new Set();

async function handleDownload(download, db, tempDir) {
    try {
        const suggestedFilename = download.suggestedFilename();
        if (processedFiles.has(suggestedFilename)) {
            return;
        }
        processedFiles.add(suggestedFilename);

        const tempPath = path.join(tempDir, `${Date.now()}_${suggestedFilename}`);
        await download.saveAs(tempPath);
        console.log(`\n📥 Download caught: ${suggestedFilename}`);

        // Read file
        const fileContent = fs.readFileSync(tempPath);
        const fileSize = fileContent.length;

        // Generate S3 Key
        const cleanName = suggestedFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const s3Key = `legacy-docs/aleksandr-ilyayev/${Date.now()}_${cleanName}`;

        // Upload to S3
        console.log(`☁️ Uploading ${suggestedFilename} to S3 bucket '${BUCKET_NAME}'...`);
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fileContent,
            ContentType: 'application/pdf',
        }));

        const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;
        console.log(`✅ Uploaded to S3: ${s3Url}`);

        // Infer tax year if in filename
        const taxYearMatch = suggestedFilename.match(/\b(20\d\d)\b/);
        const taxYear = taxYearMatch ? parseInt(taxYearMatch[1], 10) : null;

        // Save to old_investor_documents
        await db.query(`
            INSERT INTO old_investor_documents 
            (investor_profile_id, investor_profile_legal_name, email_address, file_name, file_url, s3_key, document_type, tax_year, file_size)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            3053475,
            'Aleksandr Ilyayev',
            'sholom7799@yahoo.com',
            suggestedFilename,
            s3Url,
            s3Key,
            'Tax Documents',
            taxYear,
            fileSize
        ]);

        console.log(`💾 Recorded in database table 'old_investor_documents'.\n`);

        // Clean up temp file
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch (err) {
        if (!err.message.includes('canceled')) {
            console.error('❌ Error handling download:', err.message);
        }
    }
}

async function handleResponse(response, db, context) {
    try {
        const url = response.url();
        if (processedUrls.has(url)) return;

        const headers = response.headers();
        const contentType = headers['content-type'] || '';
        const disposition = headers['content-disposition'] || '';

        const isPdf = contentType.includes('application/pdf') || disposition.includes('attachment') || (url.toLowerCase().includes('.pdf') && !url.includes('.html'));

        if (!isPdf) return;

        processedUrls.add(url);

        let filename = `document_${Date.now()}.pdf`;
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match) {
            filename = match[1];
        } else {
            const urlParts = url.split('/');
            const lastPart = urlParts[urlParts.length - 1].split('?')[0];
            if (lastPart.toLowerCase().endsWith('.pdf')) filename = lastPart;
        }

        if (processedFiles.has(filename)) return;

        console.log(`\n📄 PDF Network Response Detected: ${filename} (${url.substring(0, 80)}...)`);

        let buffer;
        try {
            buffer = await response.body();
        } catch (e) {
            // Fallback: fetch via context API request
            try {
                const req = await context.request.get(url);
                buffer = await req.body();
            } catch (errReq) {
                console.error(`⚠️ Could not retrieve body for ${filename}:`, errReq.message);
                return;
            }
        }

        if (!buffer || buffer.length === 0) return;

        processedFiles.add(filename);

        const fileSize = buffer.length;
        const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const s3Key = `legacy-docs/aleksandr-ilyayev/${Date.now()}_${cleanName}`;

        console.log(`☁️ Uploading ${filename} to S3 bucket '${BUCKET_NAME}'...`);
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: buffer,
            ContentType: 'application/pdf',
        }));

        const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;
        console.log(`✅ Uploaded to S3: ${s3Url}`);

        const taxYearMatch = filename.match(/\b(20\d\d)\b/);
        const taxYear = taxYearMatch ? parseInt(taxYearMatch[1], 10) : null;

        await db.query(`
            INSERT INTO old_investor_documents 
            (investor_profile_legal_name, email_address, file_name, file_url, s3_key, document_type, tax_year, file_size)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            'Aleksandr Ilyayev',
            'sholom7799@yahoo.com',
            filename,
            s3Url,
            s3Key,
            'Tax Documents',
            taxYear,
            fileSize
        ]);

        console.log(`💾 Recorded in database table 'old_investor_documents'.\n`);
    } catch (err) {
        console.error('❌ Error handling PDF response:', err.message);
    }
}

async function setupPageListeners(page, db, tempDir, context) {
    page.on('download', (download) => handleDownload(download, db, tempDir));
    page.on('response', (response) => handleResponse(response, db, context));
}

async function run() {
    console.log('🚀 Starting Legacy Document Scraper for Aleksandr Ilyayev...');
    console.log(`📦 Target S3 Bucket: ${BUCKET_NAME}`);

    // DB Connection
    const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: false,
    });
    await db.connect();

    const tempDir = path.join(__dirname, '../tmp_downloads');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    // Launch Browser with download & popup options enabled
    const browser = await chromium.launch({
        headless: false,
        args: [
            '--start-maximized',
            '--disable-popup-blocking',
            '--disable-pdf-viewer'
        ]
    });

    const context = await browser.newContext({ 
        viewport: null, 
        acceptDownloads: true 
    });

    // Listen to new tabs/pages opened
    context.on('page', (newPage) => {
        setupPageListeners(newPage, db, tempDir, context);
    });

    const page = await context.newPage();
    await setupPageListeners(page, db, tempDir, context);

    console.log('\n-------------------------------------------------------------');
    console.log('🔑 Opening Legacy Portal Login Page...');
    console.log('👉 Please log in manually in the opened browser window!');
    console.log('-------------------------------------------------------------\n');

    const legacyUrl = process.env.LEGACY_PORTAL_URL || 'https://admin.imscre.net/#/login';
    console.log(`Navigating to legacy portal: ${legacyUrl}`);
    await page.goto(legacyUrl).catch(() => {});

    console.log('\n=============================================================');
    console.log('📌 READY:');
    console.log(' 1. Log into IMS CRE (admin.imscre.net) in the opened browser.');
    console.log(' 2. Open Aleksandr Ilyayev\'s Documents.');
    console.log(' 3. Click any document download link or view button.');
    console.log('    All downloads & PDF views across ALL tabs are automatically');
    console.log('    captured, uploaded to S3, and stored in DB.');
    console.log('=============================================================\n');

    console.log('Press ENTER when you are done capturing all documents to exit.');
    await new Promise((resolve) => {
        process.stdin.once('data', () => resolve());
    });

    await db.end();
    await browser.close();
    console.log('🎉 Scraping and S3 upload process completed!');
}

run().catch(console.error);
