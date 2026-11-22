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
set "PROJECT_ROOT=D:\E_Data\Huflit Study\CNPM_NC\Self-Drive-Car-Rental-Management"

echo [1/4] Kiem tra may ao Android %AVD_NAME%...
del /f /q "%USERPROFILE%\.android\avd\%AVD_NAME%.avd\*.lock" 2>nul

adb devices | findstr /i "emulator-" >nul
if %errorlevel% equ 0 goto wait_boot

echo [Dang mo cua so may ao Android tren man hinh (Cold Boot), vui long doi...]
start "" /d "%EMU_DIR%" "%EMU_DIR%\emulator.exe" -avd %AVD_NAME% -no-snapshot-load

echo [Dang cho may ao ket noi ADB...]
adb wait-for-device

:wait_boot
echo [Dang cho he dieu hanh Android khoi dong hoan tat...]
:boot_loop
for /f "delims=" %%a in ('adb shell getprop sys.boot_completed 2^>nul') do set "BOOT_DONE=%%a"
if not "%BOOT_DONE%"=="1" (
    ping 127.0.0.1 -n 3 >nul
    goto boot_loop
)
echo [May ao Android da san sang 100%%!]

set "EMU_SERIAL="
for /f "tokens=1" %%d in ('adb devices ^| findstr /i "emulator-"') do set "EMU_SERIAL=%%d"
echo [Thiet bi phat hien: %EMU_SERIAL%]

echo.
echo [2/4] Kiem tra Backend API tai cong 5171...
netstat -ano | findstr ":5171" | findstr "LISTENING" >nul
if %errorlevel% equ 0 goto api_running

echo [CANH BAO] Backend API chua chay! Dang tu dong bat Backend API...
start "VELORA Backend API" cmd /k "cd /d "%PROJECT_ROOT%\CarRental.API" && dotnet run --urls http://0.0.0.0:5171"
ping 127.0.0.1 -n 6 >nul
goto run_flutter

:api_running
echo [Backend API dang chay san sang tren cong 5171!]

:run_flutter
echo.
echo [3/4] Dang dong bo goi va bien dich ban code MOI NHAT...
cd /d "%PROJECT_ROOT%\CarRental.Mobile"
call flutter pub get

echo.
echo [4/4] Dang cai dat va mo ung dung VELORA moi nhat tren %EMU_SERIAL%...
if defined EMU_SERIAL (
    call flutter run -d %EMU_SERIAL%
) else (
    call flutter run
)

echo.
echo Ung dung da dung lai.
pause
