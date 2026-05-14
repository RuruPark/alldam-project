$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$port = if ($env:PORT) { $env:PORT } else { "8000" }
$condaExe = "C:\Users\user\anaconda3\Scripts\conda.exe"

if (-not (Test-Path $condaExe)) {
  throw "Anaconda conda.exe not found: $condaExe"
}

Set-Location $projectRoot
Write-Host "Starting Alldam UI at http://localhost:$port"
& $condaExe run -n alldam python -m http.server $port
