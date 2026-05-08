# WebSoft POS - Setup Automatico
# Ejecuta este script como Administrador

$ErrorActionPreference = "Stop"
$host.UI.RawUI.WindowTitle = "WebSoft POS - Setup"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  WebSoft POS - Setup Automatico" -ForegroundColor Cyan
Write-Host "  WebSoft Solutions Guatemala" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeDir = Join-Path $scriptDir "node-portable"
$nodeExe = Join-Path $nodeDir "node.exe"
$npmCmd  = Join-Path $nodeDir "npm.cmd"

# ── Verificar si ya tiene Node instalado ─────────────────────────────────────
$nodeInstalled = $false
try {
    $v = & node --version 2>$null
    if ($v) { $nodeInstalled = $true; Write-Host "[OK] Node.js encontrado: $v" -ForegroundColor Green }
} catch {}

# ── Descargar Node.js portable si no existe ──────────────────────────────────
if (-not $nodeInstalled -and -not (Test-Path $nodeExe)) {
    Write-Host "[1/4] Descargando Node.js portable (puede tardar unos minutos)..." -ForegroundColor Yellow
    
    $nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip"
    $nodeZip = Join-Path $scriptDir "node-portable.zip"
    
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $wc = New-Object System.Net.WebClient
        $wc.DownloadFile($nodeUrl, $nodeZip)
        
        Write-Host "    Extrayendo Node.js..." -ForegroundColor Yellow
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($nodeZip, $scriptDir)
        
        # Renombrar carpeta extraida
        $extractedDir = Join-Path $scriptDir "node-v20.11.0-win-x64"
        if (Test-Path $extractedDir) {
            Rename-Item $extractedDir $nodeDir
        }
        Remove-Item $nodeZip -Force
        Write-Host "[OK] Node.js portable listo" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] No se pudo descargar Node.js" -ForegroundColor Red
        Write-Host "   Descargalo manualmente desde: https://nodejs.org" -ForegroundColor Yellow
        Write-Host "   Instala la version LTS y vuelve a ejecutar INSTALAR.bat" -ForegroundColor Yellow
        Read-Host "Presiona Enter para salir"
        exit 1
    }
} elseif (Test-Path $nodeExe) {
    Write-Host "[OK] Node.js portable encontrado" -ForegroundColor Green
}

# Configurar PATH con node portable si aplica
if (Test-Path $nodeExe) {
    $env:PATH = "$nodeDir;" + $env:PATH
    $env:Path = "$nodeDir;" + $env:Path
}

# ── Instalar dependencias ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/4] Instalando dependencias (primera vez tarda 2-5 min)..." -ForegroundColor Yellow

Set-Location $scriptDir
try {
    & npm install --prefer-offline 2>&1 | ForEach-Object { 
        if ($_ -match "error|warn" -and $_ -notmatch "optional") { Write-Host "    $_" -ForegroundColor DarkYellow }
    }
    Write-Host "[OK] Dependencias instaladas" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Fallo al instalar dependencias: $_" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# ── Generar instalador ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "[3/4] Generando instalador .exe para Windows..." -ForegroundColor Yellow
Write-Host "      (Esto puede tardar entre 5 y 15 minutos)" -ForegroundColor DarkYellow
Write-Host ""

try {
    & npm run build 2>&1 | ForEach-Object {
        if ($_ -match "error" -and $_ -notmatch "optional") { Write-Host "    $_" -ForegroundColor Red }
        elseif ($_ -match "packag|build|creat") { Write-Host "    $_" -ForegroundColor DarkCyan }
    }
} catch {
    Write-Host "[ERROR] Fallo al generar el instalador" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# ── Verificar resultado ───────────────────────────────────────────────────────
$distDir = Join-Path $scriptDir "dist"
$exeFile = Get-ChildItem $distDir -Filter "*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1

Write-Host ""
if ($exeFile) {
    Write-Host "[4/4] INSTALADOR GENERADO EXITOSAMENTE!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Archivo: $($exeFile.Name)" -ForegroundColor White
    Write-Host "  Tamano:  $([math]::Round($exeFile.Length/1MB, 1)) MB" -ForegroundColor White
    Write-Host "  Ubicacion: $distDir" -ForegroundColor White
    Write-Host ""
    Write-Host "  Ese .exe lo puedes copiar a cualquier PC con Windows" -ForegroundColor Cyan
    Write-Host "  y se instalara sin necesidad de Node.js ni nada extra." -ForegroundColor Cyan
    Write-Host ""
    
    $open = Read-Host "Abrir la carpeta dist\ ahora? (s/n)"
    if ($open -eq "s" -or $open -eq "S") {
        Start-Process explorer.exe $distDir
    }
} else {
    Write-Host "[AVISO] No se encontro el .exe en dist\" -ForegroundColor Yellow
    Write-Host "  Revisa si hay errores arriba." -ForegroundColor Yellow
    if (Test-Path $distDir) {
        Write-Host "  Contenido de dist\:" -ForegroundColor Gray
        Get-ChildItem $distDir | ForEach-Object { Write-Host "    $($_.Name)" -ForegroundColor Gray }
    }
}

Write-Host ""
Read-Host "Presiona Enter para salir"
