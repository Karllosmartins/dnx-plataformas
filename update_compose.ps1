$file = "docker-compose.monorepo.local.yml"
$content = Get-Content $file -Raw
$search = "npx next start"
$replace = "cp -r public .next/standalone/public && cp -r .next/static .next/standalone/.next/static && node .next/standalone/server.js"
$newContent = $content -replace [regex]::Escape($search), $replace
Set-Content $file $newContent -NoNewline
Write-Host "File updated successfully"
