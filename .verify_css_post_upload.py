import urllib.request

url = 'https://storage.googleapis.com/cls-modern-staging-20260417-web/css/index-modern.css'
needles = [
    '.home-modern .home-page {',
    'padding: 1.35rem 0 2rem;',
    '.home-modern .home-shell {',
    'gap: 0.85rem;',
    '.home-modern #footer-container {',
    '.home-modern footer {',
    '--home-text-muted: #334155;'
]
old_marker = 'Phase A variant: light, basic shadcn-like styling for homepage only.'

try:
    with urllib.request.urlopen(url, timeout=30) as r:
        status = r.status
        body = r.read().decode('utf-8', errors='replace')
    print(f'HTTP_STATUS={status}')
    print(f'CSS_LENGTH={len(body)}')
    for n in needles:
        print(f'HAS::{n}={n in body}')
    print(f'OLD_MARKER_ABSENT={old_marker not in body}')
except Exception as e:
    print(f'ERROR={type(e).__name__}: {e}')
