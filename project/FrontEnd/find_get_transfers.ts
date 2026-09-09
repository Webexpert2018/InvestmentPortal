import fs from 'fs';
const content = fs.readFileSync('lib/api/client.ts', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex((l: any) => l.includes('getFundTransfers()'));
console.log(lines.slice(idx, idx+15).join('\n'));
