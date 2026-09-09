@echo off
title Mise a jour de BlueNav
echo ========================================================
echo          MISE A JOUR DE BLUENAV EN 1 CLIC
echo ========================================================
echo.
echo [1/2] Recuperation des dernieres modifications Git...
git pull origin main
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Impossible de recuperer les mises a jour. Verifiez votre connexion.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Verification des dependances...
cd /d "%~dp0bluenav-desktop"
call npm install --prefer-offline --no-audit

echo.
echo ========================================================
echo  [SUCCES] BlueNav est maintenant parfaitement a jour !
echo ========================================================
echo.
pause
