# WebSoft POS - Instalador Profesional
# Instala en C:\Program Files (x86)\POS System
# Descarga todo desde GitHub automaticamente

param([switch]$Silent)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# ── CONFIGURACION ─────────────────────────────────────────────────────────────
$APP_NAME     = "POS System"
$REPO_URL     = "https://github.com/jEduardoEs/websoft-pos.git"
$INSTALL_DIR  = "C:\Program Files (x86)\POS System"
$NODE_VERSION = "v20.11.0"
$NODE_URL     = "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-win-x64.zip"
$NODE_DIR     = "$INSTALL_DIR\node"
$APP_DIR      = "$INSTALL_DIR\app"
$LOGS_DIR     = "$INSTALL_DIR\logs"
$LOG_FILE     = "$LOGS_DIR\install.log"

# ── FUNCIONES ─────────────────────────────────────────────────────────────────
function Write-Log {
    param($msg, $color="White")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $line = "[$timestamp] $msg"
    Write-Host $line -ForegroundColor $color
    if(Test-Path $LOGS_DIR) { Add-Content $LOG_FILE $line }
}

function Show-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║           WebSoft POS - Instalador               ║" -ForegroundColor Cyan
    Write-Host "  ║           WebSoft Solutions Guatemala             ║" -ForegroundColor Cyan
    Write-Host "  ║           Tel: 3671-4377                         ║" -ForegroundColor Cyan
    Write-Host "  ╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Directorio de instalacion: $INSTALL_DIR" -ForegroundColor Gray
    Write-Host ""
}

function Show-Progress {
    param($step, $total, $msg)
    $pct = [math]::Round(($step/$total)*100)
    $bar = "█" * [math]::Round($pct/5)
    $empty = "░" * (20 - [math]::Round($pct/5))
    Write-Host "`r  [$bar$empty] $pct% - $msg" -NoNewline -ForegroundColor Cyan
    if($step -eq $total) { Write-Host "" }
}

function Test-Admin {
    $current = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($current)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Create-Shortcut {
    param($Name, $Target, $Args, $Icon, $Location)
    try {
        $WshShell = New-Object -ComObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut("$Location\$Name.lnk")
        $Shortcut.TargetPath = $Target
        if($Args) { $Shortcut.Arguments = $Args }
        if($Icon) { $Shortcut.IconLocation = $Icon }
        $Shortcut.WorkingDirectory = $APP_DIR
        $Shortcut.Save()
        return $true
    } catch { return $false }
}

# ── INICIO ────────────────────────────────────────────────────────────────────
Show-Banner

# Verificar administrador
if(-not (Test-Admin)) {
    Write-Host "  [ERROR] Este instalador requiere permisos de Administrador." -ForegroundColor Red
    Write-Host "  Click derecho -> Ejecutar como administrador" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "  Presiona Enter para salir"
    exit 1
}

# Verificar internet
Write-Log "Verificando conexion a internet..." "Yellow"
try {
    $null = Invoke-WebRequest -Uri "https://github.com" -UseBasicParsing -TimeoutSec 10
    Write-Log "[OK] Conexion a internet disponible" "Green"
} catch {
    Write-Host ""
    Write-Host "  [ERROR] No hay conexion a internet." -ForegroundColor Red
    Write-Host "  Este instalador requiere internet para descargar los archivos." -ForegroundColor Yellow
    Read-Host "  Presiona Enter para salir"
    exit 1
}

# Confirmacion
if(-not $Silent) {
    Write-Host "  Este instalador realizara las siguientes acciones:" -ForegroundColor White
    Write-Host "   1. Crear directorio: $INSTALL_DIR" -ForegroundColor Gray
    Write-Host "   2. Descargar Node.js $NODE_VERSION (portable)" -ForegroundColor Gray
    Write-Host "   3. Descargar el sistema desde GitHub" -ForegroundColor Gray
    Write-Host "   4. Instalar dependencias automaticamente" -ForegroundColor Gray
    Write-Host "   5. Crear acceso directo en el Escritorio" -ForegroundColor Gray
    Write-Host "   6. Crear acceso directo en el Menu de Inicio" -ForegroundColor Gray
    Write-Host ""
    $confirm = Read-Host "  Continuar? (S/N)"
    if($confirm -ne "S" -and $confirm -ne "s") { exit 0 }
}

Write-Host ""

# ── PASO 1: CREAR DIRECTORIOS ──────────────────────────────────────────────────
Show-Progress 1 6 "Creando directorios..."
Write-Log "Creando estructura de directorios..."
New-Item -ItemType Directory -Force -Path $INSTALL_DIR | Out-Null
New-Item -ItemType Directory -Force -Path $NODE_DIR    | Out-Null
New-Item -ItemType Directory -Force -Path $APP_DIR     | Out-Null
New-Item -ItemType Directory -Force -Path $LOGS_DIR    | Out-Null
Write-Log "[OK] Directorios creados en: $INSTALL_DIR" "Green"

# ── PASO 2: DESCARGAR NODE.JS ──────────────────────────────────────────────────
Show-Progress 2 6 "Descargando Node.js..."
$nodeZip = "$INSTALL_DIR\node.zip"

if(Test-Path "$NODE_DIR\node.exe") {
    Write-Log "[OK] Node.js ya instalado, omitiendo descarga" "Green"
} else {
    Write-Log "Descargando Node.js $NODE_VERSION portable..."
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $wc = New-Object System.Net.WebClient
        $wc.DownloadFile($NODE_URL, $nodeZip)
        
        Write-Log "Extrayendo Node.js..."
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($nodeZip, "$INSTALL_DIR\node_temp")
        
        # Mover contenido al directorio node
        $extracted = Get-ChildItem "$INSTALL_DIR\node_temp" | Select-Object -First 1
        Move-Item "$($extracted.FullName)\*" $NODE_DIR -Force
        Remove-Item "$INSTALL_DIR\node_temp" -Recurse -Force
        Remove-Item $nodeZip -Force
        Write-Log "[OK] Node.js instalado correctamente" "Green"
    } catch {
        Write-Log "[ERROR] No se pudo descargar Node.js: $_" "Red"
        Read-Host "Presiona Enter para salir"
        exit 1
    }
}

# Configurar PATH para esta sesion
$env:PATH = "$NODE_DIR;" + $env:PATH
$nodePath = "$NODE_DIR\node.exe"
$npmPath  = "$NODE_DIR\npm.cmd"

# ── PASO 3: DESCARGAR DESDE GITHUB ────────────────────────────────────────────
Show-Progress 3 6 "Descargando sistema desde GitHub..."
Write-Log "Descargando WebSoft POS desde GitHub..."

# Si ya existe, actualizar. Si no, clonar
if(Test-Path "$APP_DIR\.git") {
    Write-Log "Actualizando instalacion existente..."
    try {
        # Use git if available, otherwise download zip
        $gitExe = Get-Command git -ErrorAction SilentlyContinue
        if($gitExe) {
            Set-Location $APP_DIR
            & git pull origin main 2>&1 | Out-Null
            Write-Log "[OK] Sistema actualizado desde GitHub" "Green"
        }
    } catch {
        Write-Log "[WARN] No se pudo actualizar, continuando con version actual" "Yellow"
    }
} else {
    # Download as ZIP (no git needed)
    $zipUrl  = "https://github.com/jEduardoEs/websoft-pos/archive/refs/heads/main.zip"
    $zipFile = "$INSTALL_DIR\app.zip"
    try {
        Write-Log "Descargando repositorio..."
        $wc2 = New-Object System.Net.WebClient
        $wc2.DownloadFile($zipUrl, $zipFile)
        
        Write-Log "Extrayendo archivos..."
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $tempDir = "$INSTALL_DIR\app_temp"
        [System.IO.Compression.ZipFile]::ExtractToDirectory($zipFile, $tempDir)
        
        # Move extracted content to app dir
        $extracted2 = Get-ChildItem $tempDir | Select-Object -First 1
        $files = Get-ChildItem $extracted2.FullName
        foreach($file in $files) {
            $dest = Join-Path $APP_DIR $file.Name
            if(Test-Path $dest) { Remove-Item $dest -Recurse -Force }
            Move-Item $file.FullName $dest
        }
        Remove-Item $tempDir -Recurse -Force
        Remove-Item $zipFile -Force
        Write-Log "[OK] Archivos descargados correctamente" "Green"
    } catch {
        Write-Log "[ERROR] No se pudo descargar el sistema: $_" "Red"
        Read-Host "Presiona Enter para salir"
        exit 1
    }
}

# ── PASO 4: INSTALAR DEPENDENCIAS ─────────────────────────────────────────────
Show-Progress 4 6 "Instalando dependencias..."
Write-Log "Instalando dependencias de Node.js..."
Set-Location $APP_DIR
try {
    $result = & $npmPath install --prefer-offline 2>&1
    Write-Log "[OK] Dependencias instaladas" "Green"
} catch {
    Write-Log "[ERROR] Fallo al instalar dependencias: $_" "Red"
    Read-Host "Presiona Enter para salir"
    exit 1
}

# ── PASO 5: CREAR LANZADOR ────────────────────────────────────────────────────
Show-Progress 5 6 "Creando accesos directos..."
Write-Log "Creando lanzador de la aplicacion..."

# Crear script launcher
$launcherContent = @"
@echo off
cd /d "$APP_DIR"
set PATH=$NODE_DIR;%PATH%
start "" "$NODE_DIR\node_modules\.bin\electron.cmd" .
"@

# Check if electron is in node_modules
$electronBin = "$APP_DIR\node_modules\.bin\electron.cmd"
$launcherContent2 = @"
@echo off
title POS System - WebSoft Solutions
cd /d "$APP_DIR"
set PATH=$NODE_DIR;%PATH%
"$NODE_DIR\node.exe" "$APP_DIR\node_modules\electron\dist\electron.exe" .
if %errorlevel% neq 0 (
    echo Error al iniciar. Verificar instalacion.
    pause
)
"@
Set-Content "$INSTALL_DIR\POS System.bat" $launcherContent2 -Encoding ASCII

# Crear VBScript launcher (sin ventana CMD)
$vbsContent = @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run """$INSTALL_DIR\POS System.bat""", 0, False
"@
Set-Content "$INSTALL_DIR\POS System.vbs" $vbsContent -Encoding ASCII

# ── PASO 6: ACCESOS DIRECTOS ──────────────────────────────────────────────────
Write-Log "Creando accesos directos..."

# Escritorio (todos los usuarios)
$desktopAll = [Environment]::GetFolderPath("CommonDesktopDirectory")
$desktopUser = [Environment]::GetFolderPath("Desktop")

# Acceso directo en escritorio
try {
    $WshShell = New-Object -ComObject WScript.Shell
    
    # Escritorio
    $sc = $WshShell.CreateShortcut("$desktopAll\POS System.lnk")
    $sc.TargetPath = "wscript.exe"
    $sc.Arguments  = """$INSTALL_DIR\POS System.vbs"""
    $sc.WorkingDirectory = $APP_DIR
    $sc.Description = "WebSoft POS System"
    $sc.Save()
    
    # Menu de Inicio
    $startMenu = [Environment]::GetFolderPath("CommonStartMenu")
    $startMenuDir = "$startMenu\Programs\POS System"
    New-Item -ItemType Directory -Force -Path $startMenuDir | Out-Null
    
    $sc2 = $WshShell.CreateShortcut("$startMenuDir\POS System.lnk")
    $sc2.TargetPath = "wscript.exe"
    $sc2.Arguments  = """$INSTALL_DIR\POS System.vbs"""
    $sc2.WorkingDirectory = $APP_DIR
    $sc2.Save()
    
    # Acceso directo para desinstalar
    $uninstallContent = @"
@echo off
echo Desinstalando POS System...
rmdir /s /q "$INSTALL_DIR"
del "%USERPROFILE%\Desktop\POS System.lnk" 2>nul
echo Desinstalado correctamente.
pause
"@
    Set-Content "$startMenuDir\Desinstalar POS System.bat" $uninstallContent -Encoding ASCII
    
    Write-Log "[OK] Accesos directos creados" "Green"
} catch {
    Write-Log "[WARN] No se pudieron crear algunos accesos directos: $_" "Yellow"
}

# ── REGISTRO DE WINDOWS (para Agregar o quitar programas) ─────────────────────
try {
    $regPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\POSSystem"
    New-Item -Path $regPath -Force | Out-Null
    Set-ItemProperty -Path $regPath -Name "DisplayName"      -Value "POS System - WebSoft Solutions"
    Set-ItemProperty -Path $regPath -Name "DisplayVersion"   -Value "1.0.0"
    Set-ItemProperty -Path $regPath -Name "Publisher"        -Value "WebSoft Solutions Guatemala"
    Set-ItemProperty -Path $regPath -Name "InstallLocation"  -Value $INSTALL_DIR
    Set-ItemProperty -Path $regPath -Name "UninstallString"  -Value "$INSTALL_DIR\Desinstalar.bat"
    Set-ItemProperty -Path $regPath -Name "URLInfoAbout"     -Value "https://github.com/jEduardoEs/websoft-pos"
    Write-Log "[OK] Registrado en Agregar o quitar programas" "Green"
} catch {
    Write-Log "[WARN] No se pudo registrar en Windows: $_" "Yellow"
}

Show-Progress 6 6 "Instalacion completada"

# ── FINALIZAR ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║        INSTALACION COMPLETADA EXITOSAMENTE       ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Instalado en: $INSTALL_DIR" -ForegroundColor White
Write-Host "  Acceso directo creado en el Escritorio" -ForegroundColor White
Write-Host "  Menu de Inicio -> POS System" -ForegroundColor White
Write-Host ""
Write-Host "  Credenciales por defecto:" -ForegroundColor Yellow
Write-Host "   Usuario: admin     Contrasena: admin123" -ForegroundColor White
Write-Host "   Usuario: cajero    Contrasena: cajero123" -ForegroundColor White
Write-Host ""

Write-Log "Instalacion completada exitosamente" "Green"

if(-not $Silent) {
    $launch = Read-Host "  Iniciar POS System ahora? (S/N)"
    if($launch -eq "S" -or $launch -eq "s") {
        Write-Log "Iniciando POS System..."
        Start-Process "wscript.exe" -ArgumentList """$INSTALL_DIR\POS System.vbs"""
    }
}

Write-Host ""
Write-Host "  Soporte: WhatsApp 3671-4377" -ForegroundColor Cyan
Write-Host ""
