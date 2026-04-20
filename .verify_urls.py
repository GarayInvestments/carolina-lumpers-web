import requests

checks = [
    (
        'HTML',
        'https://storage.googleapis.com/cls-modern-staging-20260417-web/index.html?nocache=verify1',
        [
            'css/style.css?v=2026-home-modern-gating-v1',
            'css/index-modern.css?v=2026-fresh-home-v3',
        ],
    ),
    (
        'STYLE',
        'https://storage.googleapis.com/cls-modern-staging-20260417-web/css/style.css?nocache=verify1',
        [
            'body:not(.home-modern) #overview p {',
            'body:not(.home-modern) #services {',
        ],
    ),
    (
        'LAYOUT',
        'https://storage.googleapis.com/cls-modern-staging-20260417-web/css/layout.css?nocache=verify1',
        [
            'body:not(.home-modern) .section-container p,',
            'body:not(.home-modern) main .section-container',
        ],
    ),
]

for label, url, needles in checks:
    r = requests.get(url, timeout=30)
    text = r.text
    print(f'{label}_STATUS {r.status_code}')
    for i, n in enumerate(needles, 1):
        print(f'{label}_HAS_{i} {n in text}')
