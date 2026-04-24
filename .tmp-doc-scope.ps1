$root=(Get-Location).Path
$exclude='(?i)(^|[\\/])(archive|node_modules|[^\\/]*variant[^\\/]*)([\\/]|$)'
function Rel($p){ $p.Substring($root.Length+1) -replace '\\','/' }
function PrintScope($name,[array]$files){ $u=@($files|Where-Object{$_}|Sort-Object -Unique); "[$name] Count=$($u.Count)"; $u|ForEach-Object{" - $_"}; "" }
$g1=Get-ChildItem .github -File -Filter *.md -ErrorAction SilentlyContinue|ForEach-Object{Rel $_.FullName}|Where-Object{$_ -notmatch $exclude}
$g2=Get-ChildItem docs -File -ErrorAction SilentlyContinue|Where-Object{$_.Extension -match '^(?i)\.(md|html|xlsx)$'}|ForEach-Object{Rel $_.FullName}|Where-Object{$_ -notmatch $exclude}
$g3=Get-ChildItem react-portal/docs -Recurse -File -Filter *.md -ErrorAction SilentlyContinue|ForEach-Object{Rel $_.FullName}|Where-Object{$_ -notmatch $exclude}
$g4=if(Test-Path react-portal/README.md){'react-portal/README.md'}else{@()}
$g5=if(Test-Path README.md){'README.md'}else{@()}
$gasAll=Get-ChildItem GoogleAppsScripts -Recurse -File -ErrorAction SilentlyContinue|Where-Object{(Rel $_.FullName) -notmatch $exclude}
$g6=$gasAll|Where-Object Name -eq 'README.md'|ForEach-Object{Rel $_.FullName}
$g7=$gasAll|Where-Object Name -eq 'START_HERE.md'|ForEach-Object{Rel $_.FullName}
$g8=$gasAll|Where-Object Name -eq 'INDEX.md'|ForEach-Object{Rel $_.FullName}
$g9=$gasAll|Where-Object Name -like 'DEPLOYMENT*.md'|ForEach-Object{Rel $_.FullName}
$g10=$gasAll|Where-Object Name -like 'MIGRATION*.md'|ForEach-Object{Rel $_.FullName}
$g11=$gasAll|Where-Object Name -like 'IMPLEMENTATION*.md'|ForEach-Object{Rel $_.FullName}
PrintScope '.github/*.md' $g1
PrintScope 'docs/* (md/html/xlsx in docs root)' $g2
PrintScope 'react-portal/docs/**/*.md' $g3
PrintScope 'react-portal/README.md' $g4
PrintScope 'README.md' $g5
PrintScope 'GoogleAppsScripts/**/README.md' $g6
PrintScope 'GoogleAppsScripts/**/START_HERE.md' $g7
PrintScope 'GoogleAppsScripts/**/INDEX.md' $g8
PrintScope 'GoogleAppsScripts/**/DEPLOYMENT*.md' $g9
PrintScope 'GoogleAppsScripts/**/MIGRATION*.md' $g10
PrintScope 'GoogleAppsScripts/**/IMPLEMENTATION*.md' $g11
