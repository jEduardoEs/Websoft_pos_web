@echo off
title WebSoft POS - Instalador
color 0B

echo.
echo  ==========================================
echo   WebSoft POS - Instalador Profesional
echo   WebSoft Solutions Guatemala
echo  ==========================================
echo.
echo  Este instalador requiere conexion a internet
echo  y permisos de Administrador.
echo.

:: Verificar si ya esta corriendo como admin
net session >nul 2>&1
if %errorlevel% == 0 (
    goto :run_install
)

:: Solicitar elevacion a admin
echo  Solicitando permisos de administrador...
echo.
PowerShell -Command "Start-Process '%~f0' -Verb RunAs"
exit /b

:run_install
echo  [OK] Ejecutando como Administrador
echo.
PowerShell -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALAR_SISTEMA.ps1"

if %errorlevel% neq 0 (
    echo.
    echo  Ocurrio un error durante la instalacion.
    echo  Revisa el log en:
    echo  C:\Program Files (x86)\POS System\logs\install.log
    echo.
    pause
)
