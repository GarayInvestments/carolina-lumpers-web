import requests

def check(url, needles):
    r = requests.get(url, timeout=60)
    print(f"URL {url}")
    print(f"HTTP_STATUS {r.status_code}")
    text = r.text
    for n in needles:
        print(f"CONTAINS {n} => {n in text}")

check('https://storage.googleapis.com/cls-modern-staging-20260417-web/index.html', ['class="home-modern"','hero-kicker'])
check('https://storage.googleapis.com/cls-modern-staging-20260417-web/css/index-modern.css', ['linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)','max-width: 18ch;','outline: 2px solid #f59e0b;'])
