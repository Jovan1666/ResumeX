/**
 * ResumeX 发布包构建脚本
 * 
 * 用法：node build-release.js
 * 
 * 功能：
 * 1. 在 界面/ 下执行 npm run build 生成静态文件
 * 2. 创建 release/ResumeX/ 目录，包含：
 *    - dist/            构建产物（静态文件）
 *    - server.js        零依赖本地 HTTP 服务器
 *    - 启动.bat          Windows 启动脚本
 *    - start.command    macOS 启动脚本
 *    - 说明.txt          使用说明
 * 
 * 用户只需安装 Node.js，双击启动脚本即可使用，无需 npm install。
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const UI_DIR = path.join(ROOT, '界面');
const DIST_DIR = path.join(UI_DIR, 'dist');
const RELEASE_DIR = path.join(ROOT, 'release');
const PACKAGE_DIR = path.join(RELEASE_DIR, 'ResumeX');
const PACKAGE_DIST = path.join(PACKAGE_DIR, 'dist');

// ========== 工具函数 ==========

function log(msg) {
  console.log(`\n  [构建] ${msg}`);
}

function logError(msg) {
  console.error(`\n  [错误] ${msg}`);
}

/** 递归复制目录 */
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/** 递归删除目录 */
function rmDirSync(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      rmDirSync(fullPath);
    } else {
      fs.unlinkSync(fullPath);
    }
  }
  fs.rmdirSync(dir);
}

// ========== 零依赖静态服务器内容 ==========

const SERVER_JS = `\
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5678;
const DIST = path.join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.eot':  'application/vnd.ms-fontobject',
  '.webp': 'image/webp',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.txt':  'text/plain; charset=utf-8',
};

function getMime(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(DIST, urlPath);

  // 安全检查：防止路径穿越
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // 对于 SPA，所有非文件请求返回 index.html
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(DIST, 'index.html'), (e2, html) => {
          if (e2) {
            res.writeHead(404);
            res.end('Not Found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(html);
        });
        return;
      }
      res.writeHead(500);
      res.end('Internal Server Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': getMime(filePath) });
    res.end(data);
  });
});

server.listen(PORT, () => {
  const url = 'http://localhost:' + PORT;
  console.log('');
  console.log('  ====================================');
  console.log('    ResumeX 简历制作工具');
  console.log('  ====================================');
  console.log('');
  console.log('  ✓ 启动成功！');
  console.log('  地址：' + url);
  console.log('');
  console.log('  提示：按 Ctrl+C 可停止服务');
  console.log('');

  // 自动打开浏览器
  try {
    const platform = process.platform;
    if (platform === 'win32') {
      require('child_process').execSync('start "" "' + url + '"', { stdio: 'ignore' });
    } else if (platform === 'darwin') {
      require('child_process').execSync('open "' + url + '"', { stdio: 'ignore' });
    } else {
      require('child_process').execSync('xdg-open "' + url + '"', { stdio: 'ignore' });
    }
  } catch {
    console.log('  请手动在浏览器中打开：' + url);
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('  [错误] 端口 ' + PORT + ' 已被占用，请关闭占用该端口的程序后重试');
  } else {
    console.error('  [错误] 启动失败：' + err.message);
  }
  process.exit(1);
});
`;

// ========== 启动脚本 ==========

const BAT_CONTENT = `@echo off
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
    echo   安装后重新双击此文件即可。
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0"
node server.js

if errorlevel 1 (
    echo.
    echo   [错误] 启动失败，请查看上方的错误信息。
    echo.
    pause
)
`;

const COMMAND_CONTENT = `#!/bin/bash
cd "$(dirname "$0")"

echo ""
echo "  正在启动 ResumeX 简历制作工具..."
echo ""

if ! command -v node &> /dev/null; then
    echo "  [错误] 未检测到 Node.js，请先安装！"
    echo ""
    echo "  下载地址：https://nodejs.org/zh-cn"
    echo "  安装后重新双击此文件即可。"
    echo ""
    read -p "  按回车键退出..."
    exit 1
fi

node server.js

if [ $? -ne 0 ]; then
    echo ""
    echo "  [错误] 启动失败，请查看上方的错误信息。"
    echo ""
    read -p "  按回车键退出..."
fi
`;

const README_CONTENT = `ResumeX - 免费专业简历制作工具
==============================

【使用方法】

第 1 步：安装 Node.js（如已安装可跳过）
  打开 https://nodejs.org/zh-cn
  点击左边绿色按钮（LTS 版本）下载安装，一路点「下一步」即可。

第 2 步：启动
  Windows 用户：双击「启动.bat」
  macOS 用户：双击「start.command」

  浏览器会自动打开，即可开始制作简历！

【注意事项】
  - 简历数据保存在浏览器中，不会上传到任何服务器
  - 关闭浏览器后，下次打开数据仍在
  - 如需关闭服务，在命令行窗口按 Ctrl+C

【常见问题】
  Q: 双击启动后提示「未检测到 Node.js」？
  A: 请先安装 Node.js，地址：https://nodejs.org/zh-cn

  Q: 提示「端口 5678 已被占用」？
  A: 可能上次未正确关闭，请关闭之前的命令行窗口后重试。
`;

// ========== 构建流程 ==========

try {
  // 1. 安装依赖（如果 node_modules 不存在）
  const nodeModules = path.join(UI_DIR, 'node_modules');
  if (!fs.existsSync(nodeModules)) {
    log('安装依赖...');
    execSync('npm install', { cwd: UI_DIR, stdio: 'inherit', shell: true });
  }

  // 2. 构建
  log('正在构建生产版本...');
  execSync('npm run build', { cwd: UI_DIR, stdio: 'inherit', shell: true });

  if (!fs.existsSync(DIST_DIR)) {
    logError('构建失败：dist/ 目录未生成');
    process.exit(1);
  }

  // 3. 清理旧的 release 目录
  if (fs.existsSync(PACKAGE_DIR)) {
    log('清理旧的发布包...');
    rmDirSync(PACKAGE_DIR);
  }
  fs.mkdirSync(PACKAGE_DIR, { recursive: true });

  // 4. 复制 dist
  log('复制构建产物...');
  copyDirSync(DIST_DIR, PACKAGE_DIST);

  // 5. 写入 server.js
  log('生成服务器脚本...');
  fs.writeFileSync(path.join(PACKAGE_DIR, 'server.js'), SERVER_JS, 'utf-8');

  // 6. 写入启动脚本
  log('生成启动脚本...');
  fs.writeFileSync(path.join(PACKAGE_DIR, '启动.bat'), BAT_CONTENT, 'utf-8');
  fs.writeFileSync(path.join(PACKAGE_DIR, 'start.command'), COMMAND_CONTENT, { encoding: 'utf-8', mode: 0o755 });

  // 7. 写入说明文件
  fs.writeFileSync(path.join(PACKAGE_DIR, '说明.txt'), README_CONTENT, 'utf-8');

  // 完成
  log('====================================');
  log('  发布包构建完成！');
  log('====================================');
  log('');
  log(`输出目录：${PACKAGE_DIR}`);
  log('');
  log('后续步骤：');
  log('1. 将 release/ResumeX/ 文件夹压缩为 ResumeX.zip');
  log('2. 在 GitHub 仓库 → Releases → Create new release');
  log('3. 上传 ResumeX.zip 作为 Release Asset');
  log('');

} catch (err) {
  logError(`构建失败：${err.message}`);
  process.exit(1);
}
