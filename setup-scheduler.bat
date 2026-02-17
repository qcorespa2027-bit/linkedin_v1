@echo off
:: setup-scheduler.bat
:: Crea tarea programada en Windows. Ejecutar como Administrador.

echo.
echo ========================================
echo  LinkedIn Publisher - Programar tarea
echo ========================================
echo.

schtasks /create ^
  /tn "LinkedIn_Publisher_SmartStudent" ^
  /tr "\"%~dp0run-publisher.bat\"" ^
  /sc HOURLY ^
  /mo 1 ^
  /st 08:00 ^
  /et 20:00 ^
  /d MON,TUE,WED,THU,FRI ^
  /f

if %errorlevel% equ 0 (
  echo.
  echo OK! Tarea creada:
  echo    Nombre: LinkedIn_Publisher_SmartStudent
  echo    Cada hora, 8am-8pm, Lun-Vie
  echo.
  echo Para eliminar: schtasks /delete /tn "LinkedIn_Publisher_SmartStudent" /f
) else (
  echo.
  echo ERROR: Ejecuta este .bat como Administrador.
)

pause
