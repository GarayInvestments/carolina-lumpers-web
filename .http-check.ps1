$urls = @(
  "https://storage.googleapis.com/clsweb/index.html",
  "https://storage.googleapis.com/clsweb/services.html",
  "https://storage.googleapis.com/clsweb/css/style.css"
)
foreach ($u in $urls) {
  try {
    $r = Invoke-WebRequest -Uri $u -Method Get -TimeoutSec 30 -ErrorAction Stop
    $status = [int]$r.StatusCode
    if ($u -match "\.html$") {
      $title80 = ""
      $m = [regex]::Match($r.Content, "(?is)<title[^>]*>(.*?)</title>")
      if ($m.Success) {
        $title = ($m.Groups[1].Value -replace "\s+"," ").Trim()
        if ($title.Length -gt 80) { $title80 = $title.Substring(0,80) } else { $title80 = $title }
      }
      Write-Output ("CHECK`t" + $u + "`t" + $status + "`tTITLE80=" + $title80)
    } else {
      Write-Output ("CHECK`t" + $u + "`t" + $status)
    }
  } catch {
    $status = -1
    if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
    Write-Output ("CHECK`t" + $u + "`t" + $status + "`tERROR")
  }
}
