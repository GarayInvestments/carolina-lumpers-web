import json
import datetime as dt
from urllib.parse import quote

import google.auth
from google.auth.transport.requests import AuthorizedSession

SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']

creds, project_id = google.auth.default(scopes=SCOPES)
session = AuthorizedSession(creds)

sites_url = 'https://www.googleapis.com/webmasters/v3/sites'
resp = session.get(sites_url, timeout=30)
print(f"Sites HTTP status: {resp.status_code}")

if resp.status_code != 200:
    print(resp.text)
    raise SystemExit(1)

payload = resp.json()
entries = payload.get('siteEntry', [])
if not entries:
    print('No sites returned.')
else:
    print('Sites:')
    for e in entries:
        print(f"- {e.get('siteUrl')} | {e.get('permissionLevel')}")

site_url = 'sc-domain:carolinalumpers.com'
end_date = dt.date.today() - dt.timedelta(days=1)
start_date = end_date - dt.timedelta(days=6)
query_url = f"https://www.googleapis.com/webmasters/v3/sites/{quote(site_url, safe='')}/searchAnalytics/query"
body = {
    'startDate': start_date.isoformat(),
    'endDate': end_date.isoformat(),
    'dimensions': ['query'],
    'rowLimit': 5,
}

qresp = session.post(query_url, json=body, timeout=30)
print(f"Search Analytics HTTP status: {qresp.status_code}")
if qresp.status_code != 200:
    print(qresp.text)
    raise SystemExit(2)

rows = qresp.json().get('rows', [])
print('Top rows:')
if not rows:
    print('(no rows)')
else:
    for i, r in enumerate(rows, 1):
        key = r.get('keys', [''])[0] if r.get('keys') else ''
        clicks = r.get('clicks', 0)
        impressions = r.get('impressions', 0)
        ctr = r.get('ctr', 0)
        position = r.get('position', 0)
        print(f"{i}. query={key!r}, clicks={clicks}, impressions={impressions}, ctr={ctr}, position={position}")
