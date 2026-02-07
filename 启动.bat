@echo off
chcp 65001 >nul 2>&1
title ResumeX 简历制作工具

echo.
echo   正在启动 ResumeX 简历制作工具...
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo   [错误] 未检测到 Node.js，请先安装！
    echo.
    echo   下载地址：https://nodejs.org/zh-cn
    echo   安装完成后重新双击此文件即可。
    echo.
    pause
    exit /b 1
)

node "%~dp0start.js"

if errorlevel 1 (
    echo.
    echo   [错误] 启动失败，请查看上方的错误信息。
    echo.
    pause
)
