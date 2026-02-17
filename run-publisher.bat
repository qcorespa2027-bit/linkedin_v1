@echo off
:: run-publisher.bat
:: Ejecuta el publicador. Programar en Task Scheduler de Windows.

cd /d "%~dp0"
node src\publish.js
