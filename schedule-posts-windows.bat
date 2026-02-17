@echo off
:: schedule-posts-windows.bat
:: Lee posts.json y crea una tarea de Windows Task Scheduler
:: para CADA post pendiente, a su hora exacta.
:: Ejecutar como Administrador.

echo.
echo =============================================
echo  LinkedIn Publisher - Programar posts exactos
echo =============================================
echo.

cd /d "%~dp0"

:: Usar Node.js para leer posts.json y generar comandos schtasks
node -e "const p=require('./data/posts.json');const posts=p.posts.filter(x=>x.status==='scheduled');if(!posts.length){console.log('No hay posts pendientes.');process.exit(0);}posts.forEach(x=>{const d=x.scheduledDate.replace(/-/g,'/');const t=x.scheduledTime||'09:00';const name='LinkedIn_Post_'+x.id;console.log('schtasks /create /tn \"'+name+'\" /tr \"\"'+process.cwd()+'\\run-publisher.bat\"\" /sc ONCE /sd '+d+' /st '+t+' /f');});console.log('echo.');console.log('echo Total: '+posts.length+' tareas creadas');" > _temp_schedule.bat

if exist _temp_schedule.bat (
  echo Creando tareas programadas...
  echo.
  call _temp_schedule.bat
  del _temp_schedule.bat
  echo.
  echo Listo! Cada post se publicara a su hora exacta.
  echo.
  echo Para ver las tareas creadas:
  echo    schtasks /query /fo TABLE ^| findstr LinkedIn_Post
  echo.
  echo Para eliminar todas:
  echo    for /f "tokens=1" %%a in ('schtasks /query /fo LIST ^| findstr LinkedIn_Post') do schtasks /delete /tn %%a /f
) else (
  echo ERROR: No se pudo generar el archivo de tareas.
  echo Asegurate de tener Node.js instalado.
)

echo.
pause
