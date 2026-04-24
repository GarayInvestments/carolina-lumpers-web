# CLS CLI Auth Check
# Run this at the start of a session to verify all CLIs are connected.
# Usage: .\scripts\check-cli-auth.ps1

Write-Host "`n=== CLS CLI Auth Check ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm')`n"

# --- gcloud PATH fix ---
$gcloudPath = "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin"
if (Test-Path $gcloudPath) {
    $env:PATH = "$gcloudPath;$env:PATH"
}

$checks = @(
    @{ Name = "GitHub (CarolinaLumpers)"; Cmd = { gh auth status 2>&1 | Select-String "CarolinaLumpers" } ; Ok = "CarolinaLumpers" },
    @{ Name = "Vercel";                   Cmd = { npx vercel whoami 2>&1 }                                ; Ok = "carolinalumpers" },
    @{ Name = "Fly.io";                   Cmd = { flyctl auth whoami 2>&1 }                               ; Ok = "@" },
    @{ Name = "Supabase";                 Cmd = { npx supabase projects list 2>&1 }                       ; Ok = "REFERENCE ID" },
    @{ Name = "Cloudflare (wrangler)";    Cmd = { npx wrangler whoami 2>&1 | Select-String "s.garay" }   ; Ok = "s.garay" },
    @{ Name = "Google Cloud (gcloud)";    Cmd = { gcloud config get-value account 2>&1 }                  ; Ok = "carolinalumpers.com" },
    @{ Name = "clasp (GAS)";              Cmd = { npx clasp whoami 2>&1 }                                 ; Ok = "@" }
)

foreach ($check in $checks) {
    $result = & $check.Cmd | Out-String
    if ($result -match [regex]::Escape($check.Ok) -or $result -match $check.Ok) {
        Write-Host "  ✅  $($check.Name)" -ForegroundColor Green
    } else {
        Write-Host "  ❌  $($check.Name) — needs re-auth" -ForegroundColor Red
        Write-Host "      Output: $($result.Trim() | Select-Object -First 1)" -ForegroundColor DarkGray
    }
}

Write-Host "`nRe-auth commands if needed:"
Write-Host "  GitHub:     gh auth login -h github.com"
Write-Host "  Vercel:     npx vercel login"
Write-Host "  Fly.io:     flyctl auth login"
Write-Host "  Supabase:   npx supabase login"
Write-Host "  Cloudflare: npx wrangler login"
Write-Host "  gcloud:     gcloud auth login"
Write-Host "  clasp:      npx clasp login`n"
