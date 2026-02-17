@echo off
:: setup-scheduler.bat
:: Crea tarea programada en Windows Task Scheduler.
:: Ejecutar como Administrador.
:: Revisa cada 10 minutos si hay posts listos y los publica.

echo.
echo ========================================
echo  LinkedIn Publisher - Programar tarea
echo ========================================
echo.

:: Eliminar tarea existente si la hay
schtasks /delete /tn "LinkedIn_Publisher_SmartStudent" /f >nul 2>&1

:: Crear tarea que corre cada 10 minutos
schtasks /create ^
  /tn "LinkedIn_Publisher_SmartStudent" ^
  /tr "\"%~dp0run-publisher.bat\"" ^
  /sc MINUTE ^
  /mo 10 ^
  /f

if %errorlevel% equ 0 (
  echo.
  echo OK! Tarea creada exitosamente:
  echo.
  echo    Nombre:     LinkedIn_Publisher_SmartStudent
  echo    Frecuencia: Cada 10 minutos
  echo    Script:     run-publisher.bat
  echo.
  echo La tarea correra automaticamente, incluso si
  echo cierras la terminal o el navegador.
  echo Solo necesitas que el PC este encendido.
  echo.
  echo Comandos utiles:
  echo    Ver tarea:     schtasks /query /tn "LinkedIn_Publisher_SmartStudent"
  echo    Eliminar:      schtasks /delete /tn "LinkedIn_Publisher_SmartStudent" /f
  echo    Correr ahora:  schtasks /run /tn "LinkedIn_Publisher_SmartStudent"
) else (
  echo.
  echo ERROR: Ejecuta este .bat como Administrador.
  echo    Click derecho sobre setup-scheduler.bat
  echo    y selecciona "Ejecutar como administrador"
)

echo.
pause
