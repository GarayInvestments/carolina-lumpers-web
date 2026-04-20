import re
import requests

url = "https://storage.googleapis.com/cls-modern-staging-20260417-web/index.html?nocache=og-v2b"
resp = requests.get(url, timeout=30)
html = resp.text

print(f"STATUS html {resp.status_code}")
print(f"HAS html og_image_type_key {'og:image:type' in html}")
print(f"HAS html image_png_value {'image/png' in html}")

line = next((ln for ln in html.splitlines() if 'og:image:type' in ln), None)
if not line:
    m = re.search(r'<meta[^>]*property=\"og:image:type\"[^>]*>', html)
    line = m.group(0) if m else None
if line:
    print(line)
