import re
import requests
from urllib.parse import urljoin

html_url = "https://storage.googleapis.com/cls-modern-staging-20260417-web/index.html?nocache=wa-debug"
fallback_url = "https://storage.googleapis.com/cls-modern-staging-20260417-web/assets/og/cls-share-v2.png"

resp = requests.get(html_url, timeout=30)
html = resp.text

m_image = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', html, re.IGNORECASE)
m_type = re.search(r'<meta[^>]+property=["\']og:image:type["\'][^>]*>', html, re.IGNORECASE)

og_image = m_image.group(1).strip() if m_image else ""
if og_image and og_image.startswith('/'):
    og_image = urljoin('https://storage.googleapis.com/cls-modern-staging-20260417-web/', og_image.lstrip('/'))

print(f"OG_IMAGE {og_image if og_image else 'NOT_FOUND'}")
print((m_type.group(0).strip() if m_type else "OG_IMAGE_TYPE_LINE NOT_FOUND"))


def check(url):
    try:
        r = requests.get(url, timeout=30, allow_redirects=True)
        ctype = r.headers.get('Content-Type', '').strip() or 'unknown'
        print(f"STATUS {url} {r.status_code}")
        print(f"CONTENT_TYPE {url} {ctype}")
        return r.status_code, ctype
    except Exception as e:
        print(f"STATUS {url} ERROR")
        print(f"CONTENT_TYPE {url} unknown")
        print(f"NOTE {url} request_failed {type(e).__name__}: {e}")
        return None, None

if og_image:
    code, ctype = check(og_image)
    if (code is None) or (not (200 <= code < 400)):
        print("NOTE first_url_unreachable")
    elif not ctype.lower().startswith('image/'):
        print("NOTE first_url_not_image")
else:
    print("NOTE first_url_unreachable (og:image not found)")

check(fallback_url)
