@echo off
chcp 65001 >nul
title Mo May Ao Android Pixel 7
echo ========================================================
echo         DANG KHOI DONG MAY AO ANDROID PIXEL 7
echo ========================================================
echo.
del /f /q "%USERPROFILE%\.android\avd\Pixel_7_API_34.avd\*.lock" 2>nul
echo Cua so may ao dang duoc mo len man hinh Windows cua ban...
start "" "C:\Users\Khoi\AppData\Local\Android\Sdk\emulator\emulator.exe" -avd Pixel_7_API_34
echo.
echo [Hoan tat] Hay kiem tra tren thanh Taskbar hoac man hinh Desktop!
timeout /t 5
