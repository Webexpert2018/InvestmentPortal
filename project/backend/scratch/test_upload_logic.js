const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
  const form = new FormData();
  form.append('file', Buffer.from('test file content'), 'test.pdf');
  form.append('document_type', 'tax_document');
  form.append('tax_year', '2025');

  try {
    // We need a token. I'll try to get one from the DB or just use a known admin email if possible.
    // Actually, I'll just run the logic directly in a script to avoid auth issues.
    console.log('Testing upload logic directly...');
    
    // I will mock the controller logic but with real DB/Cloudinary if possible, 
    // or just the DB part which is more likely to fail.
  } catch (err) {
    console.error(err);
  }
}
