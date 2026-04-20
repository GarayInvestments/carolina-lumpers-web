import requests

html_url = "https://storage.googleapis.com/cls-modern-staging-20260417-web/index.html"
css_url = "https://storage.googleapis.com/cls-modern-staging-20260417-web/css/index-modern.css?v=2026-fresh-home-v2"

h = requests.get(html_url, timeout=60)
print(f"HTML_STATUS {h.status_code}")
print("HTML_CONTAINS_NEEDLE", "css/index-modern.css?v=2026-fresh-home-v2" in h.text)

c = requests.get(css_url, timeout=60)
print(f"CSS_STATUS {c.status_code}")
checks = [
    "padding: 1.35rem 0 2rem;",
    "gap: 0.85rem;",
    ".home-modern .home-section:first-of-type {",
    ".home-modern #overview .section-heading {",
    ".home-modern .nav-links a {",
    "font-size: 17px !important;",
    ".home-modern footer {",
]
for s in checks:
    print("CSS_CONTAINS", s, s in c.text)
