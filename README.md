# ResumeX - 免费专业简历制作工具

一款开源免费的中文简历制作软件（Windows 桌面应用为主，浏览器为辅）。支持 8 套国内简历模板、实时预览、PDF / Word / PNG 导出、GitHub 自动更新，所有数据本地存储，无需注册登录。

## 快速开始（推荐：装 Windows 安装包）

1. 到 [Releases](https://github.com/Jovan1666/ResumeX/releases) 页面下载最新版安装包 `ResumeX-Setup-<version>.exe`
2. 双击安装，桌面生成「ResumeX」快捷方式
3. 打开即可创建简历，点击右上角「导出」生成 PDF / Word / PNG

> 数据保存在本机（安装后不会丢），不同设备 / 浏览器之间数据互不相通。
> 没有安装包时也可以直接用浏览器打开（见下方「源码开发」）。

## 已发布版本说明

- **v1.0.0** 老安装包**不能**自动更新到本线（那版没有 `latest.yml`），需要手动下载并安装 **v1.1.0** 底包。
- 从 **v1.1.0** 开始，软件能感知 GitHub 上的新版本，界面顶栏（桌面版）会显示「检查更新 / 发现新版本 / 立即更新」，点击即可覆盖安装。

## 功能

- **8 套国内简历模板**：校招通用、社招通用、商务深蓝、体制公文、技术简洁、极简黑白（ATS 网申友好）、双栏紧凑（进阶）、英文简洁
- **实时预览**：左侧编辑右侧 A4，所见即所得
- **多格式导出**：PDF（桌面端文字可选中）、PNG、Word(.docx)
- **自动更新**：GitHub Releases 发版后桌面端提示更新
- **数据本地存储**：IndexedDB，照片单独 Blob 存储，不上传服务器；支持备份 / 恢复
- **多简历管理**：创建、复制、删除、拖拽排序
- **撤销 / 重做**：顶栏按钮 + 快捷键（输入框内 Ctrl+Z 保留给文字编辑）
- **国内排版默认值**：校招教育在前、岗位可显示政治面貌 / 籍贯、微信字段

## 源码开发（可选）

要求 Node.js 18+：

```bash
cd 界面
npm install
npm run dev        # 开发服务器 http://localhost:5173
```

应用代码在 `界面/`；npm 命令必须在 `界面/` 下执行。

## 构建 Windows 安装包（开发者）

```bash
# 根目录：先安装依赖
npm install

# 本地构建（产出 release/installer/ResumeX-Setup-<version>.exe + latest.yml）
node build-setup.js

# CI 发版（GitHub Actions：push tag v* 自动发布）
node build-setup.js --publish
```

## 发版流程

1. 修改根 `package.json` 的 `version`（与 tag 一致，如 1.2.0）
2. 打 tag：`git tag v1.2.0 && git push origin v1.2.0`
3. GitHub Actions 自动构建并发布 Release（exe + latest.yml + blockmap）
4. 用户桌面端收到更新提示 → 点「使用此模板」或直接更新

> 注意：更新器只认 GitHub Release + `latest.yml`，普通 push 不会触发更新。

## 技术栈（开发者参考）

React 18 · TypeScript · Vite · Tailwind CSS 4 · Zustand (persist + immer + IndexedDB) · React Router 7 (HashRouter) · Electron 33 · electron-builder (NSIS) · electron-updater · docx · html-to-image

## 常见问题

**浏览器版和安装包数据通吗？** 不同。`localhost:5173` 与运行在 `file://` 的安装包是两个存储空间，数据互不相通（安装包的数据在 `%APPDATA%\ResumeX`）。

**为什么本地 `npm run dev` 时看不到「检查更新」？** 开发模式不检查更新（只有安装包会），这是刻意的。

**照片会占很多空间吗？** 不会。照片裁切后压缩为 ≤150KB JPEG 单独存 IndexedDB，不进入简历 JSON。

## License

MIT License
