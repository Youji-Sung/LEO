@echo off
setlocal
chcp 65001 >nul
title LEO Update - Keep Existing Address
pushd "%~dp0"
if errorlevel 1 (
  echo Cannot open the LEO project folder.
  pause
  exit /b 1
)
where node.exe >nul 2>nul
if errorlevel 1 (
  echo Node.js 24 or later is required. Install Node.js and try again.
  pause
  popd
  exit /b 1
)
node "%~dp0scripts\launch-deploy.mjs" %*
set "LEO_DEPLOY_EXIT=%ERRORLEVEL%"
popd
if not "%LEO_DEPLOY_EXIT%"=="0" pause
exit /b %LEO_DEPLOY_EXIT%
