# AGENTS.md

本文件为在 ResumeX 仓库工作的智能体/开发者提供指引。

## 项目概述

ResumeX — 开源免费的**中文简历制作桌面软件**（Windows 安装包为主，浏览器为辅）。纯前端 SPA（React 18 + TS + Vite + Tailwind CSS 4 + Zustand）+ 很薄的 Electron 壳，无后端服务。数据本地存储（IndexedDB，key `resumex-db`），照片以 Blob 单独存储。内置 GitHub 自动更新（electron-updater + latest.yml）。

## 仓库布局

- 应用代码全部在 `界面/` 子目录；npm 命令必须在 `界面/` 下执行
- 根目录：`electron/main.js`（主进程）、`build-setup.js`（NSIS 安装包构建）、`package.json`（根 version = 发版 tag）、`.github/workflows/release.yml`（tag 发版）
- 开发方案与执行记录在 `开发方案/`（注意：`docs/` 被 gitignore，不要写进那里）

## 构建与开发命令

```bash
# 应用目录（所有前端/测试命令）
cd 界面
npm install
npm run dev            # Vite 开发服务器 http://localhost:5173
npm run type-check     # tsc --noEmit
npm run build          # tsc -b && vite build
npm run test           # vitest run
npm run lint           # eslint

# 根目录（Windows 安装包）
node build-setup.js    # 产出 release/installer/ResumeX-Setup-<version>.exe + latest.yml
```

## 架构关键点（与 02 规格一致，过时信息以 `开发方案/02-产品规格.md` 为准）

### 路由

- **HashRouter**（Electron `loadFile` 必须）：`#/` 落地页、`#/dashboard` 简历列表、`#/editor` 编辑器
- 404 与错误边界：用 `Link to="/"` / `navigate('/')` 或 `<a href="#/">`；**禁止** `<a href="/">` 与 `navigate('#/')`

### 存储（不要回退到 localStorage 存简历）

- 简历库在 IndexedDB（idb-keyval，库名 `resumex-db`），persist `version: 3`
- 照片 Blob 单独存 idb（`avatar.ts`：`saveAvatar/loadAvatar/deleteAvatar/cloneAvatar`），UI 只用 `useAvatarObjectUrl`
- persist setItem 失败必须可见（toast + 红点）；hydrate 失败进入 `RecoveryScreen` 全屏只读恢复，**禁止**用演示数据（李明）覆盖
- `localhost:5173` 与安装包 `file://` 是两个 origin，数据不通、不同步（README 已写明）

### 模板系统

固定 8 套（`TemplateId`）：`campusClean`（默认）/ `jobClean` / `navyBiz` / `civilFile` / `techPlain` / `atsMono` / `compactSplit` / `enSimple`。共享原语在 `components/templates/_primitives/`。

硬性禁止：

- 模板组件内使用 `sm:`/`md:`/`lg:` 等视口断点（窄窗口导出会丢照片）
- `.resume-page` 上任何 padding；全局 `fonts.css` 里 `.resume-page[data-margin] > div { padding: … !important }` 整段**已删除**，不可恢复
- 技能条/百分比、时间线圆点轨道、大渐变、中文模板英文全大写栏目、`uppercase tracking-widest` 作用在中文标题
- 模板强调色只允许 `var(--color-primary)` 等 CSS 变量（ThemeWrapper 注入）；未知主题 fallback `ink`，**禁止** `tech-orange`

切模板同时切该模板默认主题（映射见 02 §5.4）。旧 TemplateId 在 persist migrate 中映射到最近新 id（映射表见 02 §5.1，逐字照抄）。

### 撤销（Undo）

- 历史存**变更前**快照：store action 变更前 `push(prev)`；EditorLayout **禁止**对 deferred 数据 debounce 调 `pushHistory`
- 焦点在 input/textarea/select/[contenteditable] 时：Ctrl/Cmd+Z/Y **永远**不 preventDefault、不调简历 undo；简历撤销走顶栏按钮与 Ctrl+Alt+Z / Ctrl+Shift+Z（非输入焦点）
- 冷却只跳过 undo/redo 触发的下一次 push，禁止 2000ms 吞用户输入

### 导出

- 桌面 PDF：`webContents.printToPDF`，**禁止**对含编辑器的整窗直接打印（先 print-mode 只显示 `.resume-page`）；margins 用英寸字段 `{ top, bottom, left, right }`，**禁止**写 `margins.marginType`（那是 `webContents.print()` 的字段）
- 浏览器 PDF：`window.print`（print-mode）或明确标注「图片型 PDF」
- 文件名：`姓名_求职意向_简历.ext`（`exportFilename.ts`）
- `print.css` **禁止** `header { display:none }`（可能隐藏简历姓名头）；用 `.editor-chrome { display:none }`

### 其它约定

- 单 store `界面/src/app/store/useResumeStore.ts`；组件必须细粒度 selector
- 深拷贝用 `safeDeepClone()`（structuredClone → JSON fallback）
- 新简历默认空个人信息（禁止李明）；模块空则纸面不渲染标题
- 代码和注释用中文；TypeScript 严格模式
