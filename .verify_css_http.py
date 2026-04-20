import requests
url = "https://storage.googleapis.com/cls-modern-staging-20260417-web/css/index-modern.css"
needles = [
    ".home-modern .home-page {",
    "padding: 1.35rem 0 2rem;",
    ".home-modern .home-shell {",
    "gap: 0.85rem;",
    ".home-modern .home-section:first-of-type {",
    ".home-modern #overview .section-heading {",
    ".home-modern .nav-links a {",
    "font-size: 17px !important;",
    ".home-modern footer {",
]
r = requests.get(url, timeout=60)
text = r.text
print(f"HTTP_STATUS={r.status_code}")
print(f"CSS_LENGTH={len(text)}")
for n in needles:
    print(f"CHECK|{n}|{str(n in text)}")
