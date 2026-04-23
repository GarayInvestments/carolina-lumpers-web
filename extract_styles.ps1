$u = 'https://www.priority1.com/'
$html = (Invoke-WebRequest -Uri $u -UseBasicParsing).Content
$pattern = '<link[^>]*rel=["'']stylesheet["''][^>]*href=["'']([^"''>]+)["'']'
[regex]::Matches($html, $pattern, 'IgnoreCase') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
