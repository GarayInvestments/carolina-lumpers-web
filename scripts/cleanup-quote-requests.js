/**
 * Cleans up the Quote Requests sheet:
 * - Deletes columns: Signature (col 33), Signature Date (col 34), Client StartedAt ms (col 35)
 * - Also removes the orphaned "ID" column (col 0) which Apps Script never writes
 * Uses gcloud ADC (must have Drive/Sheets scope via: gcloud auth login --enable-gdrive-access --update-adc)
 */
const https = require('https');
const { execSync } = require('child_process');

const SHEET_ID = '1U8hSNREN5fEhskp0UM-Z80iiW39beaOj3oIsaLZyFzk';
const SPREADSHEET_TITLE = 'Quote Requests';

function getToken() {
  return execSync('gcloud auth application-default print-access-token').toString().trim();
}

function apiRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'sheets.googleapis.com',
      path: '/v4/spreadsheets/' + SHEET_ID + path,
      method,
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  const token = getToken();

  // 1. Get sheet metadata to find the sheetId (numeric) for "Quote Requests"
  const meta = await apiRequest('GET', '', null, token);
  if (meta.error) { console.error('Metadata error:', meta.error); process.exit(1); }
  const sheet = meta.sheets.find(s => s.properties.title === SPREADSHEET_TITLE);
  if (!sheet) { console.error('Sheet not found:', SPREADSHEET_TITLE); process.exit(1); }
  const sheetId = sheet.properties.sheetId;
  console.log('Found sheet:', SPREADSHEET_TITLE, 'sheetId:', sheetId);

  // 2. Read current headers to confirm column positions
  const range = await apiRequest('GET', '/values/' + encodeURIComponent(SPREADSHEET_TITLE + '!A1:AK1'), null, token);
  const headers = (range.values && range.values[0]) || [];
  console.log('Current header count:', headers.length);
  headers.forEach((h, i) => console.log('  [' + i + ']', h));

  // Columns to delete (0-indexed), sorted descending so deletions don't shift indices
  // Col 0 = "ID" (orphaned, Apps Script doesn't write this)
  // Col 33 = "Signature", Col 34 = "Signature Date", Col 35 = "Client StartedAt (ms)"
  const colsToDelete = [35, 34, 33, 0];
  
  // Verify they are what we expect
  const expected = { 0: 'ID', 33: 'Signature', 34: 'Signature Date', 35: 'Client StartedAt (ms)' };
  let ok = true;
  for (const [idx, name] of Object.entries(expected)) {
    if (headers[idx] !== name) {
      console.warn('WARNING: Col', idx, 'expected "' + name + '" but got "' + headers[idx] + '"');
      ok = false;
    }
  }
  if (!ok) {
    console.error('Column mismatch — aborting. Re-check indices.');
    process.exit(1);
  }

  // 3. Build batchUpdate requests to delete each column (descending order = safe)
  const requests = colsToDelete.map(colIdx => ({
    deleteDimension: {
      range: {
        sheetId,
        dimension: 'COLUMNS',
        startIndex: colIdx,
        endIndex: colIdx + 1,
      },
    },
  }));

  const result = await apiRequest('POST', ':batchUpdate', { requests }, token);
  if (result.error) {
    console.error('batchUpdate error:', JSON.stringify(result.error, null, 2));
    process.exit(1);
  }
  console.log('\n✅ Deleted columns: ID (0), Signature (33), Signature Date (34), Client StartedAt ms (35)');

  // 4. Verify final headers
  const verify = await apiRequest('GET', '/values/' + encodeURIComponent(SPREADSHEET_TITLE + '!A1:AK1'), null, token);
  const finalHeaders = (verify.values && verify.values[0]) || [];
  console.log('\nFinal headers (' + finalHeaders.length + ' columns):');
  finalHeaders.forEach((h, i) => console.log('  [' + i + ']', h));
}

main().catch(e => { console.error(e); process.exit(1); });
