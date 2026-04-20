import urllib.request

checks = [
    (
        'HTML',
        'https://storage.googleapis.com/cls-modern-staging-20260417-web/index.html',
        ['css/index-modern.css?v=2026-fresh-home-v1', 'class="fresh-hero"']
    ),
    (
        'CSS',
        'https://storage.googleapis.com/cls-modern-staging-20260417-web/css/index-modern.css',
        ['--home-bg: #f6f8fb;', '.home-modern .service-card:hover,']
    )
]
for name, url, needles in checks:
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            status = r.status
            body = r.read().decode('utf-8', errors='replace')
        print(f'{name}_STATUS={status}')
        for n in needles:
            print(f'{name}_HAS::{n}={str(n in body)}')
    except Exception as e:
        print(f'{name}_ERROR={type(e).__name__}: {e}')
