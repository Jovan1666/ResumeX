@echo off
chcp 65001 >nul 2>&1
title ResumeX 简历制作工具

echo.
echo   ====================================
echo     ResumeX 简历制作工具
echo   ====================================
echo.
echo   正在启动...
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

:: 切换到脚本所在目录，避免中文路径问题
cd /d "%~dp0"

node start.js

if errorlevel 1 (
    echo.
    echo   [错误] 启动失败，请查看上方的错误信息。
    echo.
    echo   常见解决方法：
    echo   1. 确认已安装 Node.js v18 或更高版本
    echo   2. 尝试将项目移到一个没有中文的路径下（如 D:\ResumeX）
    echo   3. 检查网络连接是否正常
    echo.
    pause
)
