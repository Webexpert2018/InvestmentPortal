const { Client } = require('pg'); 
const client = new Client({ user: 'postgres', password: 'password', host: 'localhost', database: 'bitcoin_ira' }); 
client.connect()
  .then(() => client.query("SELECT id, email FROM investors WHERE id = '3615c158-a517-4bab-aad0-49f3b6df9145'"))
  .then(res => { console.log("INVESTOR:", res.rows); return client.query("SELECT count(*) FROM investors"); })
  .then(res => { console.log("Total Investors:", res.rows[0].count); client.end() })
  .catch(e => console.error(e));
