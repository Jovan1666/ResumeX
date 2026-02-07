const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 使用相对路径找到界面目录
const baseDir = __dirname;
const dirs = fs.readdirSync(baseDir);
console.log('Project root contents:', dirs);

// 找到界面目录（可能包含中文字符）
const uiDir = dirs.find(d => {
  const fullPath = path.join(baseDir, d);
  if (!fs.statSync(fullPath).isDirectory()) return false;
  // 检查是否包含 package.json 和 src 目录
  return fs.existsSync(path.join(fullPath, 'package.json')) && 
         fs.existsSync(path.join(fullPath, 'src'));
});

if (!uiDir) {
  console.error('Could not find the UI directory!');
  process.exit(1);
}

const uiPath = path.join(baseDir, uiDir);
console.log('Found UI directory:', uiPath);
console.log('Starting dev server...\n');

const child = spawn('npm', ['run', 'dev'], {
  cwd: uiPath,
  stdio: 'inherit',
  shell: true
});

child.on('error', (err) => {
  console.error('Failed to start:', err);
});

child.on('exit', (code) => {
  process.exit(code);
});
