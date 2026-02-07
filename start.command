#!/bin/bash
cd "$(dirname "$0")"

echo ""
echo "  正在启动 ResumeX 简历制作工具..."
echo ""

if ! command -v node &> /dev/null; then
    echo "  [错误] 未检测到 Node.js，请先安装！"
    echo ""
    echo "  下载地址：https://nodejs.org/zh-cn"
    echo "  安装完成后重新双击此文件即可。"
    echo ""
    read -p "  按回车键退出..."
    exit 1
fi

node start.js

if [ $? -ne 0 ]; then
    echo ""
    echo "  [错误] 启动失败，请查看上方的错误信息。"
    echo ""
    read -p "  按回车键退出..."
fi
