/**
 * 生成 ResumeX 应用图标
 * 
 * 用法：node scripts/generate-icon.js
 * 输出：electron/icon.ico + electron/icon.png
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/** 将多个 PNG Buffer 合成一个 ICO 文件 */
function buildIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;

  // ICONDIR header
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);      // reserved
  header.writeUInt16LE(1, 2);      // type: 1 = ICO
  header.writeUInt16LE(count, 4);  // image count

  const entries = [];
  for (const png of pngBuffers) {
    const entry = Buffer.alloc(16);
    // 从 PNG IHDR 读取宽高（偏移 16-23）
    const w = png.readUInt32BE(16);
    const h = png.readUInt32BE(20);
    entry.writeUInt8(w >= 256 ? 0 : w, 0);   // width (0 = 256)
    entry.writeUInt8(h >= 256 ? 0 : h, 1);   // height
    entry.writeUInt8(0, 2);                    // color palette
    entry.writeUInt8(0, 3);                    // reserved
    entry.writeUInt16LE(1, 4);                 // color planes
    entry.writeUInt16LE(32, 6);                // bits per pixel
    entry.writeUInt32LE(png.length, 8);        // image size
    entry.writeUInt32LE(offset, 12);           // offset
    entries.push(entry);
    offset += png.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

const OUT_DIR = path.join(__dirname, '..', 'electron');
const SIZE = 512;

// SVG 图标：蓝色圆角方块 + 白色文档图形 + "R" 字母
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6"/>
      <stop offset="100%" style="stop-color:#2563EB"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#1E40AF" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- 背景圆角矩形 -->
  <rect x="32" y="32" width="448" height="448" rx="96" ry="96" fill="url(#bg)" filter="url(#shadow)"/>
  
  <!-- 文档主体（白色圆角矩形） -->
  <rect x="152" y="96" width="240" height="310" rx="20" ry="20" fill="white" opacity="0.95"/>
  
  <!-- 折角效果 -->
  <path d="M332 96 L392 156 L332 156 Z" fill="#DBEAFE"/>
  <path d="M332 96 L392 156" stroke="white" stroke-width="2" fill="none" opacity="0.5"/>
  
  <!-- 文档内横线（模拟简历文字） -->
  <rect x="188" y="180" width="150" height="10" rx="5" fill="#3B82F6" opacity="0.7"/>
  <rect x="188" y="210" width="168" height="8" rx="4" fill="#93C5FD" opacity="0.5"/>
  <rect x="188" y="234" width="130" height="8" rx="4" fill="#93C5FD" opacity="0.5"/>
  
  <rect x="188" y="270" width="100" height="10" rx="5" fill="#3B82F6" opacity="0.7"/>
  <rect x="188" y="296" width="168" height="8" rx="4" fill="#93C5FD" opacity="0.5"/>
  <rect x="188" y="320" width="145" height="8" rx="4" fill="#93C5FD" opacity="0.5"/>
  <rect x="188" y="344" width="160" height="8" rx="4" fill="#93C5FD" opacity="0.5"/>
  
  <!-- 左侧装饰条 -->
  <rect x="172" y="180" width="4" height="50" rx="2" fill="#2563EB" opacity="0.8"/>
  <rect x="172" y="270" width="4" height="82" rx="2" fill="#2563EB" opacity="0.8"/>
  
  <!-- 底部 "X" 标识 -->
  <text x="256" y="450" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="bold" fill="white" opacity="0.9">RX</text>
</svg>
`;

async function generate() {
  // 生成多尺寸 PNG
  const sizes = [16, 32, 48, 64, 128, 256, 512];
  const pngBuffers = [];

  for (const size of sizes) {
    const buf = await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toBuffer();
    pngBuffers.push(buf);
  }

  // 保存 256px PNG（用于 electron-builder）
  const png256 = await sharp(Buffer.from(svg))
    .resize(256, 256)
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(OUT_DIR, 'icon.png'), png256);
  console.log('  ✓ icon.png (256x256)');

  // 生成 ICO（包含多尺寸）
  const icoBuffer = buildIco(pngBuffers);
  fs.writeFileSync(path.join(OUT_DIR, 'icon.ico'), icoBuffer);
  console.log('  ✓ icon.ico (multi-size)');

  console.log('\n  图标已生成到 electron/ 目录');
}

generate().catch(err => {
  console.error('生成图标失败:', err);
  process.exit(1);
});
