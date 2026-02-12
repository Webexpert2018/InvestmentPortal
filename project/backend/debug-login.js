require('dotenv').config();
const fetch = global.fetch || require('node-fetch');

const base = `http://localhost:${process.env.PORT || 3001}`;
const payload = { email: 'admin@bitcoinira.com', password: 'Admin@123' };

(async () => {
	try {
		const res = await fetch(`${base}/api/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Accept: '*/*' },
			body: JSON.stringify(payload),
		});
		console.log('Status:', res.status, res.statusText);
		console.log('Headers:');
		for (const [k, v] of res.headers) console.log(`${k}: ${v}`);
		const text = await res.text();
		console.log('Body:', text);
	} catch (err) {
		console.error('Request error:', err);
	}
})();
