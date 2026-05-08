@echo off
title WebSoft POS - Generador de EXE
color 0B
echo.
echo  ==========================================
echo   WebSoft POS - Generar Instalador .exe
echo  ==========================================
echo.
echo  NOTA: GENERAR_EXE.bat es para developers.
echo  Para instalar el sistema usa INSTALAR.bat
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js no instalado.
    echo  Descarga desde: https://nodejs.org
    pause
    exit /b 1
)

echo  [OK] Node.js detectado
echo.
echo  1 - Probar la app (npm start)
echo  2 - Generar instalador .exe (npm run build)
echo  3 - Salir
echo.
set /p op="Opcion: "

if "%op%"=="1" npm start
if "%op%"=="2" (
    npm install
    npm run build
    if exist dist (
        echo.
        echo  [OK] Instalador generado en dist\
        explorer dist
    )
)
pause
