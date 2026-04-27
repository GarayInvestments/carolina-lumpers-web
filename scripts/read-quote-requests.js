const https = require('https');
const { execSync } = require('child_process');

const token = execSync('gcloud auth application-default print-access-token').toString().trim();
const sheetId = '1U8hSNREN5fEhskp0UM-Z80iiW39beaOj3oIsaLZyFzk';
const range = 'Quote Requests!A1:AK5';
const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + sheetId + '/values/' + encodeURIComponent(range);

https.get(url, { headers: { Authorization: 'Bearer ' + token } }, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const parsed = JSON.parse(data);
    if (parsed.error) { console.error('API error:', JSON.stringify(parsed.error, null, 2)); return; }
    const rows = parsed.values || [];
    rows.forEach((row, i) => {
      console.log('Row ' + i + ':');
      row.forEach((cell, j) => console.log('  [' + j + '] ' + cell));
    });
  });
}).on('error', e => console.error(e));
