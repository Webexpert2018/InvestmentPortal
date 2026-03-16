const http = require('http');

const data = JSON.stringify({
  email: `test_${Date.now()}@example.com`,
  password: 'password123',
  firstName: 'Test',
  lastName: 'User',
  dob: '1990-01-01',
  phone: '+1 (USA) 123-456-7890',
  role: 'investor',
  addressLine1: '123 Test St',
  city: 'Test City',
  state: 'TS',
  zipCode: '12345',
  country: 'USA'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/investor-signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log(`STATUS: ${res.statusCode}\nBODY: ${body}`));
});

req.on('error', (e) => console.error(`Problem: ${e.message}`));
req.write(data);
req.end();
