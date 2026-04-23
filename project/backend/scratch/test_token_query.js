const axios = require('axios');

const ID = '310d5997-4b7d-4ffc-acc0-51d3c49c6e3c';
const TOKEN = 'YOUR_ACTUAL_TOKEN_HERE'; // User would need to provide this or I'd find it

async function testQueryParamAuth() {
  try {
    const url = `http://localhost:3001/api/documents/${ID}/download?token=${TOKEN}`;
    console.log('Testing URL:', url);
    const response = await axios.get(url);
    console.log('Status:', response.status);
  } catch (err) {
    console.error('Error status:', err.response?.status);
    console.error('Error body:', err.response?.data);
  }
}

// testQueryParamAuth();
