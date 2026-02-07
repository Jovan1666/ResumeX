const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ========== 工具函数 ==========

function log(msg) {
  console.log(`\n  ${msg}`);
}

function logError(msg) {
  console.error(`\n  [错误] ${msg}`);
}

function openBrowser(url) {
  const platform = process.platform;
  try {
    if (platform === 'win32') {
      execSync(`start "" "${url}"`, { stdio: 'ignore' });
    } else if (platform === 'darwin') {
      execSync(`open "${url}"`, { stdio: 'ignore' });
    } else {
      execSync(`xdg-open "${url}"`, { stdio: 'ignore' });
    }
  } catch {
    log(`请手动在浏览器中打开：${url}`);
  }
}

// ========== 启动流程 ==========

log('====================================');
log('   ResumeX 简历制作工具 - 启动中');
log('====================================');

// 1. 检查 Node.js 版本
const nodeVersion = process.versions.node;
const major = parseInt(nodeVersion.split('.')[0], 10);
if (major < 18) {
  logError(`Node.js 版本过低（当前 v${nodeVersion}），需要 v18 或更高版本`);
  log('请前往 https://nodejs.org/zh-cn 下载最新 LTS 版本');
  process.exit(1);
}
log(`✓ Node.js v${nodeVersion}`);

// 2. 查找界面目录
const baseDir = __dirname;
const uiDir = fs.readdirSync(baseDir).find(d => {
  const fullPath = path.join(baseDir, d);
  if (!fs.statSync(fullPath).isDirectory()) return false;
  return fs.existsSync(path.join(fullPath, 'package.json')) &&
         fs.existsSync(path.join(fullPath, 'src'));
});

if (!uiDir) {
  logError('未找到项目目录，请确认文件完整');
  process.exit(1);
}

const uiPath = path.join(baseDir, uiDir);
log(`✓ 项目目录：${uiDir}/`);

// 3. 自动安装依赖（仅首次）
const nodeModulesPath = path.join(uiPath, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  log('首次运行，正在安装依赖（可能需要 1-3 分钟）...');
  log('');
  try {
    execSync('npm install', {
      cwd: uiPath,
      stdio: 'inherit',
      shell: true
    });
    log('✓ 依赖安装完成');
  } catch (err) {
    logError('依赖安装失败，请检查网络连接后重试');
    process.exit(1);
  }
} else {
  log('✓ 依赖已就绪');
}

// 4. 启动开发服务器
log('');
log('正在启动开发服务器...');
log('');

let browserOpened = false;

const child = spawn('npm', ['run', 'dev'], {
  cwd: uiPath,
  stdio: ['inherit', 'pipe', 'inherit'],
  shell: true
});

// 监听输出，检测到地址后自动打开浏览器
child.stdout.on('data', (data) => {
  const text = data.toString();
  process.stdout.write(text);

  if (!browserOpened) {
    const match = text.match(/https?:\/\/localhost:\d+/);
    if (match) {
      browserOpened = true;
      const url = match[0];
      log('');
      log(`✓ 启动成功！正在打开浏览器...`);
      log(`  地址：${url}`);
      log('');
      log('提示：按 Ctrl+C 可停止服务');
      log('');
      openBrowser(url);
    }
  }
});

child.on('error', (err) => {
  logError(`启动失败：${err.message}`);
  process.exit(1);
});

child.on('exit', (code) => {
  if (code !== null && code !== 0) {
    logError(`服务异常退出（代码 ${code}）`);
  }
  process.exit(code || 0);
});
