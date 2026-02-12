/**
 * ResumeX 安装包构建脚本
 *
 * 用法：node build-setup.js
 *
 * 流程：
 * 1. 构建 React 应用（界面/ → 界面/dist/）
 * 2. 复制 dist/ 到 webapp/（避免中文路径问题）
 * 3. 使用 electron-builder 打包为 Windows 安装包
 *
 * 输出：release/installer/ResumeX Setup 1.0.0.exe
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const UI_DIR = path.join(ROOT, '界面');
const DIST_DIR = path.join(UI_DIR, 'dist');
const WEBAPP_DIR = path.join(ROOT, 'webapp');

function log(msg) {
  console.log(`\n  [构建] ${msg}`);
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
  fs.rmSync(dir, { recursive: true, force: true });
}

try {
  // 1. 确保 Electron 依赖已安装
  if (!fs.existsSync(path.join(ROOT, 'node_modules', 'electron'))) {
    log('安装 Electron 构建依赖（首次需要下载，请耐心等待）...');
    execSync('npm install', { cwd: ROOT, stdio: 'inherit', shell: true });
  }

  // 2. 构建 React 应用
  log('构建 React 应用...');
  execSync('npm run build', { cwd: UI_DIR, stdio: 'inherit', shell: true });

  if (!fs.existsSync(DIST_DIR)) {
    throw new Error('React 构建失败：dist/ 目录未生成');
  }

  // 3. 复制 dist/ → webapp/（避免 electron-builder 处理中文路径问题）
  log('准备打包资源...');
  rmDirSync(WEBAPP_DIR);
  copyDirSync(DIST_DIR, WEBAPP_DIR);
  log(`已复制 ${fs.readdirSync(WEBAPP_DIR).length} 个文件/目录到 webapp/`);

  // 4. 构建安装包
  log('正在打包 Windows 安装程序（首次需要下载 NSIS 等工具）...');
  execSync('npx electron-builder --win --x64', { cwd: ROOT, stdio: 'inherit', shell: true });

  // 5. 清理临时 webapp/
  rmDirSync(WEBAPP_DIR);

  // 6. 查找生成的安装包
  const installerDir = path.join(ROOT, 'release', 'installer');
  const exeFiles = fs.existsSync(installerDir)
    ? fs.readdirSync(installerDir).filter(f => f.endsWith('.exe'))
    : [];

  log('====================================');
  log('  安装包构建完成！');
  log('====================================');
  log('');
  if (exeFiles.length > 0) {
    log(`安装包：${path.join(installerDir, exeFiles[0])}`);
  } else {
    log(`输出目录：${installerDir}`);
  }
  log('');
} catch (err) {
  console.error(`\n  [错误] 构建失败：${err.message}`);
  process.exit(1);
}
