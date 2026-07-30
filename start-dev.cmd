@echo off
setlocal
cd /d "%~dp0"
echo Starting MermaidGenerator from "%CD%"
call npm.cmd run dev

