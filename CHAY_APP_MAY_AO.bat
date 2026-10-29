@echo off
chcp 65001 >nul
title VELORA Car Rental - Android Runner
echo ========================================================
echo   VELORA CAR RENTAL - KHOI DONG MAY AO VA CHAY FLUTTER
echo ========================================================
echo.

set "PATH=D:\flutter\bin;C:\Users\Khoi\AppData\Local\Android\Sdk\platform-tools;%PATH%"
set "EMU_DIR=C:\Users\Khoi\AppData\Local\Android\Sdk\emulator"
set "AVD_NAME=Pixel_7_API_34"

echo [1/3] Kiem tra may ao Android %AVD_NAME%...
del /f /q "%USERPROFILE%\.android\avd\%AVD_NAME%.avd\*.lock" 2>nul

adb devices | findstr /i "emulator" >nul
if %errorlevel% equ 0 goto emu_running

echo [Dang mo cua so may ao Android tren man hinh, vui long doi giay lat...]
start "" /d "%EMU_DIR%" "%EMU_DIR%\emulator.exe" -avd %AVD_NAME%

echo [Dang cho may ao ket noi ADB...]
adb wait-for-device
goto check_api

:emu_running
echo [May ao da dang chay va ket noi thanh cong!]

:check_api
echo.
echo [2/3] Kiem tra Backend API tai cong 5171...
netstat -ano | findstr ":5171" | findstr "LISTENING" >nul
if %errorlevel% equ 0 goto api_running

echo [CANH BAO] Backend API chua chay!
echo [Dang tu dong bat Backend API trong cua so rieng...]
start "VELORA Backend API" cmd /k "cd /d D:\E_Data\Huflit Study\CNPM_NC\Self-Drive-Car-Rental-Management\CarRental.API && dotnet run --urls http://0.0.0.0:5171"
ping 127.0.0.1 -n 5 >nul
goto run_flutter

:api_running
echo [Backend API dang chay san sang tren cong 5171!]

:run_flutter
echo.
echo [3/3] Khoi chay ung dung Flutter tren may ao...
cd /d "D:\E_Data\Huflit Study\CNPM_NC\Self-Drive-Car-Rental-Management\CarRental.Mobile"
call flutter run -d emulator-5554

echo.
echo Ung dung da dung lai.
pause
