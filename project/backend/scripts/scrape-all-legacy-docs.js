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
const processingLock = new Set();

let currentActiveInvestor = '';

function slugify(text) {
    if (!text || text === 'Unknown Investor' || text === 'No Notifications') return 'general';
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

function inferDocumentType(filename) {
    const fn = (filename || '').toLowerCase();
    if (
        fn.includes('k1') || fn.includes('k-1') || fn.includes('tax') || 
        fn.includes('1099') || fn.includes('w9') || fn.includes('w-9') ||
        fn.includes('return')
    ) {
        return 'Tax Documents';
    }
    if (
        fn.includes('agreement') || fn.includes('signed') || fn.includes('operating') || 
        fn.includes('subscription') || fn.includes('sub_doc') || fn.includes('executed') || 
        fn.includes('signature') || fn.includes('questionnaire') || fn.includes('amendment') ||
        fn.includes('loa') || fn.includes('power_of_attorney') || fn.includes('plan') || fn.includes('db_plan')
    ) {
        return 'Signed Documents';
    }
    return 'Tax Documents';
}

async function closeModalIfPresent(page) {
    try {
        if (!page || page.isClosed()) return;
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(300);

        const closeBtn = page.locator('.md-dialog-container button[aria-label="Close"], md-dialog button, button.close, [class*="modal"] button[aria-label*="close"], button:has-text("Close"), button:has-text("×")').first();
        if (await closeBtn.isVisible({ timeout: 500 })) {
            await closeBtn.click({ force: true }).catch(() => {});
            await page.waitForTimeout(300);
        }
    } catch (e) {}
}

async function lookupOldInvestorDetails(db, investorName) {
    if (!investorName || investorName === 'Unknown Investor' || investorName === 'No Notifications') {
        return { profileId: null, email: null };
    }
    try {
        const res = await db.query(`
            SELECT investor_profile_id, email_address 
            FROM old_investments 
            WHERE investor_profile_legal_name ILIKE $1 
               OR investor_profile_legal_name ILIKE $2
            LIMIT 1
        `, [investorName.trim(), `%${investorName.trim()}%`]);
        
        if (res.rows.length > 0) {
            return {
                profileId: res.rows[0].investor_profile_id || null,
                email: res.rows[0].email_address || null
            };
        }
    } catch (e) {
        // Ignore lookup errors
    }
    return { profileId: null, email: null };
}

async function detectCurrentInvestorName(page) {
    if (currentActiveInvestor && currentActiveInvestor !== 'Unknown Investor' && currentActiveInvestor !== 'No Notifications') {
        return currentActiveInvestor;
    }

    try {
        if (!page || page.isClosed()) return 'Unknown Investor';
        
        const text = await page.evaluate(() => {
            const ignoreList = [
                'no notifications', 'notification', 'documents', 'investor profiles',
                'personal & project documents', 'manage batches', 'upload document',
                'search documents', 'realpage ims', 'ovalla capital', 'home',
                'projects', 'crm', 'task manager', 'exports', 'market overviews',
                'nitin yadav', 'admin'
            ];

            const breadcrumbElements = Array.from(document.querySelectorAll('.breadcrumb li, .breadcrumb a, [class*="breadcrumb"] *'));
            for (let i = breadcrumbElements.length - 1; i >= 0; i--) {
                const txt = breadcrumbElements[i].innerText ? breadcrumbElements[i].innerText.trim() : '';
                if (txt && !ignoreList.some(item => txt.toLowerCase().includes(item))) {
                    return txt;
                }
            }

            const mainContent = document.querySelector('main, #content, .content, .main-container, [role="main"]') || document.body;
            const headers = Array.from(mainContent.querySelectorAll('h1, h2, h3, .folder-title, .page-title, tr.active, .selected'));
            for (const h of headers) {
                const txt = h.innerText.trim();
                if (txt && !ignoreList.some(item => txt.toLowerCase().includes(item))) {
                    return txt;
                }
            }

            return null;
        });

        if (text) return text;
    } catch (e) {
        // Ignore evaluation errors
    }
    return 'Unknown Investor';
}

async function handleDownload(download, db, tempDir, page) {
    try {
        const suggestedFilename = download.suggestedFilename();
        const baseName = suggestedFilename.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        if (processedFiles.has(suggestedFilename) || processingLock.has(baseName)) {
            return;
        }

        processingLock.add(baseName);
        processedFiles.add(suggestedFilename);

        const tempPath = path.join(tempDir, `${Date.now()}_${suggestedFilename}`);
        await download.saveAs(tempPath);

        const fileContent = fs.readFileSync(tempPath);
        const fileSize = fileContent.length;

        const investorName = await detectCurrentInvestorName(page);
        const investorSlug = slugify(investorName);

        const cleanName = suggestedFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const s3Key = `legacy-docs/${investorSlug}/${Date.now()}_${cleanName}`;
        const docType = inferDocumentType(suggestedFilename);

        console.log(`\n📥 Download caught: ${suggestedFilename}`);
        console.log(`☁️ Uploading ${suggestedFilename} for '${investorName}' [Type: ${docType}] to S3 (${s3Key})...`);

        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fileContent,
            ContentType: 'application/pdf',
        }));

        const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;
        console.log(`✅ Uploaded to S3: ${s3Url}`);

        const taxYearMatch = suggestedFilename.match(/\b(20\d\d)\b/);
        const taxYear = taxYearMatch ? parseInt(taxYearMatch[1], 10) : null;

        const { profileId, email } = await lookupOldInvestorDetails(db, investorName);

        await db.query(`
            INSERT INTO old_investor_documents 
            (investor_profile_id, investor_profile_legal_name, email_address, file_name, file_url, s3_key, document_type, tax_year, file_size)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            profileId,
            investorName,
            email,
            suggestedFilename,
            s3Url,
            s3Key,
            docType,
            taxYear,
            fileSize
        ]);

        console.log(`💾 Recorded in DB for '${investorName}' (ID: ${profileId || 'N/A'}, Email: ${email || 'N/A'}, Type: ${docType}).\n`);

        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch (err) {
        if (!err.message.includes('canceled')) {
            console.error('❌ Error handling download:', err.message);
        }
    }
}

async function handleResponse(response, db, context, page) {
    try {
        const url = response.url();
        if (processedUrls.has(url)) return;

        const headers = response.headers();
        const contentType = headers['content-type'] || '';
        const disposition = headers['content-disposition'] || '';

        const isPdf = contentType.includes('application/pdf') || disposition.includes('attachment') || (url.toLowerCase().includes('.pdf') && !url.includes('.html'));

        if (!isPdf) return;

        let filename = `document_${Date.now()}.pdf`;
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match) {
            filename = match[1];
        } else {
            const urlParts = url.split('/');
            const lastPart = urlParts[urlParts.length - 1].split('?')[0];
            if (lastPart.toLowerCase().endsWith('.pdf')) filename = lastPart;
        }

        const baseName = filename.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        if (processedFiles.has(filename) || processingLock.has(baseName)) {
            return;
        }

        processedUrls.add(url);
        processingLock.add(baseName);

        let buffer;
        try {
            buffer = await response.body();
        } catch (e) {
            try {
                const req = await context.request.get(url);
                buffer = await req.body();
            } catch (errReq) {
                processingLock.delete(baseName);
                return;
            }
        }

        if (!buffer || buffer.length === 0) {
            processingLock.delete(baseName);
            return;
        }

        processedFiles.add(filename);

        const fileSize = buffer.length;
        const investorName = await detectCurrentInvestorName(page);
        const investorSlug = slugify(investorName);

        const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const s3Key = `legacy-docs/${investorSlug}/${Date.now()}_${cleanName}`;
        const docType = inferDocumentType(filename);

        console.log(`\n📄 PDF Response Detected: ${filename}`);
        console.log(`☁️ Uploading ${filename} for '${investorName}' [Type: ${docType}] to S3 (${s3Key})...`);

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

        const { profileId, email } = await lookupOldInvestorDetails(db, investorName);

        await db.query(`
            INSERT INTO old_investor_documents 
            (investor_profile_id, investor_profile_legal_name, email_address, file_name, file_url, s3_key, document_type, tax_year, file_size)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            profileId,
            investorName,
            email,
            filename,
            s3Url,
            s3Key,
            docType,
            taxYear,
            fileSize
        ]);

        console.log(`💾 Recorded in DB for '${investorName}' (ID: ${profileId || 'N/A'}, Email: ${email || 'N/A'}, Type: ${docType}).\n`);
    } catch (err) {
        console.error('❌ Error handling PDF response:', err.message);
    }
}

function setupPageListeners(page, db, tempDir, context) {
    page.on('download', (download) => handleDownload(download, db, tempDir, page));
    page.on('response', (response) => handleResponse(response, db, context, page));
}

async function setMaxPageSizeIfAvailable(page) {
    try {
        const select = page.locator('select[ng-model*="pageSize"], select.page-size-selector, select[aria-label*="per page"]').first();
        if (await select.isVisible({ timeout: 1000 })) {
            const options = await select.locator('option').allInnerTexts();
            const maxValOption = options.find(o => o.includes('100') || o.includes('500') || o.includes('All'));
            if (maxValOption) {
                await select.selectOption({ label: maxValOption.trim() }).catch(() => {});
                await page.waitForTimeout(2000);
            }
        }
    } catch (e) {}
}

async function processFolderDocuments(page, folderName) {
    await setMaxPageSizeIfAvailable(page);

    let hasNextPage = true;
    let pageNum = 1;

    while (hasNextPage) {
        await closeModalIfPresent(page);

        const docCount = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('tr td a, .document-link, a[href*="download"], a[href*="file"], [class*="link"]'));
            return links.filter(a => {
                const txt = a.innerText.trim();
                return txt && !txt.toLowerCase().includes('name') && !txt.toLowerCase().includes('modified');
            }).length;
        });

        if (docCount === 0 && pageNum === 1) {
            console.log(`ℹ️ No documents found for ${folderName}.`);
            break;
        }

        console.log(`📄 Page ${pageNum}: Processing ${docCount} document link(s) in ${folderName}...`);

        for (let k = 0; k < docCount; k++) {
            // Ensure previous modal dialog and backdrop are completely gone before checking visibility
            await closeModalIfPresent(page);
            await page.waitForSelector('.md-dialog-container', { state: 'detached', timeout: 4000 }).catch(() => {});
            await page.waitForSelector('.md-backdrop', { state: 'detached', timeout: 4000 }).catch(() => {});

            try {
                const fileLink = page.locator('tr td a, .document-link, a[href*="download"], a[href*="file"], [class*="link"]').nth(k);
                
                // Wait up to 5000ms for link to be visible and stable
                if (await fileLink.isVisible({ timeout: 5000 })) {
                    // Set up promise to wait for PDF network response
                    const networkResponsePromise = page.waitForResponse(
                        res => {
                            const ct = res.headers()['content-type'] || '';
                            const cd = res.headers()['content-disposition'] || '';
                            return ct.includes('pdf') || cd.includes('attachment') || res.url().toLowerCase().includes('.pdf');
                        },
                        { timeout: 8000 }
                    ).catch(() => null);

                    await fileLink.click({ force: true, timeout: 5000 }).catch(() => {});
                    await networkResponsePromise;
                    await page.waitForTimeout(1500);
                    await closeModalIfPresent(page);
                }
            } catch (e) {
                await closeModalIfPresent(page);
            }
        }

        // Check for next page button
        try {
            const nextBtn = page.locator('ul.pagination li:not(.disabled) a:has-text(">"), a[aria-label="Next"]:not(.disabled), button.next:not([disabled])').first();
            if (await nextBtn.isVisible({ timeout: 1000 })) {
                pageNum++;
                console.log(`➡️ Moving to page ${pageNum} for ${folderName}...`);
                await nextBtn.click({ force: true });
                await page.waitForTimeout(2500);
            } else {
                hasNextPage = false;
            }
        } catch (e) {
            hasNextPage = false;
        }
    }
}

async function autoCrawlInvestorFolders(page) {
    console.log('\n🤖 Starting automated crawl through ALL Investor Profile folders...');
    try {
        await closeModalIfPresent(page);
        await page.goto('https://admin.imscre.net/#/documents/folder/investor_profiles').catch(() => {});
        await page.waitForTimeout(3000);

        await setMaxPageSizeIfAvailable(page);

        // Gather ALL folder names from table rows
        const folderItems = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('tr, .folder-item'));
            const results = [];
            for (const r of rows) {
                const link = r.querySelector('a');
                if (link && link.innerText) {
                    const text = link.innerText.trim();
                    if (text && !text.toLowerCase().includes('name') && !text.toLowerCase().includes('modified')) {
                        results.push(text);
                    }
                }
            }
            return results;
        });

        console.log(`📋 Discovered ${folderItems.length} Total Investor Folders:`, folderItems);

        for (let i = 0; i < folderItems.length; i++) {
            const folderName = folderItems[i];
            currentActiveInvestor = folderName;

            console.log(`\n=============================================================`);
            console.log(`📂 [${i + 1}/${folderItems.length}] Opening Investor Folder: ${folderName}`);
            console.log(`=============================================================`);

            await closeModalIfPresent(page);

            if (!page.url().includes('folder/investor_profiles')) {
                await page.goto('https://admin.imscre.net/#/documents/folder/investor_profiles').catch(() => {});
                await page.waitForTimeout(2500);
            }

            try {
                const folderLink = page.locator(`a:has-text("${folderName}")`).first();
                if (await folderLink.isVisible({ timeout: 5000 })) {
                    await folderLink.click({ force: true });
                    await page.waitForTimeout(3000);

                    // Process all documents inside this folder (with pagination support)
                    await processFolderDocuments(page, folderName);
                }
            } catch (err) {
                console.error(`⚠️ Could not auto-process ${folderName}:`, err.message);
                await closeModalIfPresent(page);
            } finally {
                currentActiveInvestor = '';
            }
        }
    } catch (err) {
        console.error('⚠️ Auto-crawl error:', err.message);
    }
}

async function run() {
    console.log('🚀 Starting Automated Multi-Investor Document Scraper...');
    console.log(`📦 Target S3 Bucket: ${BUCKET_NAME}`);

    const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: false,
    });
    await db.connect();

    // Clean up any invalid "No Notifications" entries from previous runs
    await db.query(`DELETE FROM old_investor_documents WHERE investor_profile_legal_name = 'No Notifications'`);

    const tempDir = path.join(__dirname, '../tmp_downloads');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

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

    context.on('page', (newPage) => {
        setupPageListeners(newPage, db, tempDir, context);
    });

    const page = await context.newPage();
    setupPageListeners(page, db, tempDir, context);

    console.log('\n-------------------------------------------------------------');
    console.log('🔑 Opening Legacy Portal Login Page...');
    console.log('👉 Please log in manually in the opened browser window!');
    console.log('-------------------------------------------------------------\n');

    const legacyUrl = process.env.LEGACY_PORTAL_URL || 'https://admin.imscre.net/#/login';
    await page.goto(legacyUrl).catch(() => {});

    console.log('\n=============================================================');
    console.log('📌 INSTRUCTIONS:');
    console.log(' 1. Log into IMS CRE in the opened browser.');
    console.log(' 2. PRESS ENTER in this terminal to automatically crawl all');
    console.log('    investor folders starting from folder 1 (Aleksandr Ilyayev).');
    console.log(' 3. Or navigate & click documents manually — any file opened/clicked');
    console.log('    will automatically be saved under its investor folder in S3!');
    console.log('=============================================================\n');

    await new Promise((resolve) => {
        process.stdin.once('data', () => resolve());
    });

    // Run auto crawl when user hits enter after login
    await autoCrawlInvestorFolders(page);

    console.log('\nPress ENTER again when finished to close browser.');
    await new Promise((resolve) => {
        process.stdin.once('data', () => resolve());
    });

    await db.end();
    await browser.close();
    console.log('🎉 Scraping completed successfully!');
}

run().catch(console.error);
