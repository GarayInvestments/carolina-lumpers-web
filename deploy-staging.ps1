$ErrorActionPreference = "Continue"
$gcloud = "C:/Users/Steve Garay/AppData/Local/Google/Cloud SDK/google-cloud-sdk/bin/gcloud.cmd"
$project = "cls-operations-hub"
$bucket = "gs://cls-modern-variant-a-20260420-web"

if (-not (Test-Path $gcloud)) {
  Write-Host "ERROR: gcloud not found at $gcloud"
  exit 1
}

Write-Host "Deploy target: $bucket (project: $project)"

# Best-effort bucket clear
Write-Host "Clearing existing bucket objects (best-effort)..."
& $gcloud storage rm "$bucket/**" --recursive --project=$project 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "WARN: Bucket clear returned non-zero exit code ($LASTEXITCODE). Continuing."
}

$rootFiles = @(
  "index.html","services.html","about.html","contact.html","apply.html","privacy.html","privacyApp.html","eula.html",
  "employeelogin.html","employeeDashboard.html","employeeSignup.html","w9Form.html","w9Guest.html","w9Status.html",
  "clear-cache.html","manifest-employee.json","robots.txt","sitemap.xml","CNAME"
)

$dirs = @("assets","css","js","components","api","config","vercel-proxy")

Write-Host "Uploading allowlisted root files..."
foreach ($f in $rootFiles) {
  if (Test-Path $f) {
    Write-Host "  + $f"
    & $gcloud storage cp $f "$bucket/$f" --project=$project
  } else {
    Write-Host "  - missing: $f"
  }
}

Write-Host "Syncing allowlisted directories..."
foreach ($d in $dirs) {
  if (Test-Path $d -PathType Container) {
    Write-Host "  + $d/"
    & $gcloud storage rsync $d "$bucket/$d" --recursive --project=$project
  } else {
    Write-Host "  - missing dir: $d"
  }
}

Write-Host "Ensuring public readability for uploaded objects..."
& $gcloud storage buckets update $bucket --clear-pap --project=$project 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "WARN: Could not clear public access prevention. Continuing with object ACL updates."
}

& $gcloud storage objects update "$bucket/**" --add-acl-grant=entity=AllUsers,role=READER --project=$project --quiet
if ($LASTEXITCODE -ne 0) {
  Write-Host "WARN: Public object ACL update returned non-zero exit code ($LASTEXITCODE)."
} else {
  Write-Host "Public object ACL update completed."
}

$healthUrls = @(
  "https://storage.googleapis.com/cls-modern-variant-a-20260420-web/index.html",
  "https://storage.googleapis.com/cls-modern-variant-a-20260420-web/css/index-fresh-variant.css",
  "https://storage.googleapis.com/cls-modern-variant-a-20260420-web/assets/CLS-003%20(1)%20dark.webp"
)

Write-Host "Public URL health checks:"
foreach ($url in $healthUrls) {
  try {
    $res = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 30 -ErrorAction Stop
    Write-Host "  OK $($res.StatusCode) $url"
  } catch {
    if ($_.Exception.Response) {
      Write-Host "  ERR $([int]$_.Exception.Response.StatusCode) $url"
    } else {
      Write-Host "  ERR unknown $url"
    }
  }
}

Write-Host "Staging URLs:"
Write-Host "  https://storage.googleapis.com/cls-modern-variant-a-20260420-web/index.html"
Write-Host "  https://storage.googleapis.com/cls-modern-variant-a-20260420-web/services.html"
Write-Host "  https://storage.googleapis.com/cls-modern-variant-a-20260420-web/css/style.css"

