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

Write-Host "Staging URLs:"
Write-Host "  https://storage.googleapis.com/cls-modern-variant-a-20260420-web/index.html"
Write-Host "  https://storage.googleapis.com/cls-modern-variant-a-20260420-web/services.html"
Write-Host "  https://storage.googleapis.com/cls-modern-variant-a-20260420-web/css/style.css"

