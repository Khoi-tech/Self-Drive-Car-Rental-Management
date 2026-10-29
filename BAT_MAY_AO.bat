@echo off
chcp 65001 >nul
title Mo May Ao Android Pixel 7
echo ========================================================
echo         DANG KHOI DONG MAY AO ANDROID PIXEL 7
echo ========================================================
echo.

set "EMU_DIR=C:\Users\Khoi\AppData\Local\Android\Sdk\emulator"
set "AVD_NAME=Pixel_7_API_34"

del /f /q "%USERPROFILE%\.android\avd\%AVD_NAME%.avd\*.lock" 2>nul
echo Cua so may ao Pixel 7 dang duoc bat len man hinh Windows cua ban...
start "" /d "%EMU_DIR%" "%EMU_DIR%\emulator.exe" -avd %AVD_NAME%

echo.
echo [Hoan tat] Hay kiem tra tren man hinh hoac thanh Taskbar!
ping 127.0.0.1 -n 4 >nul
