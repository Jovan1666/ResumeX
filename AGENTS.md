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

**7 套**（`TEMPLATE_IDS` 在 `界面/src/app/types/resume.ts`，是模板 id 的**唯一真相来源**）：
`classic`（简洁通用，单栏）/ `sidebar`（侧栏双栏）/ `banner`（顶部横幅）/ `frame`（线框档案）/ `atsMono`（极简黑白）/ `enSimple`（英文简洁）/ `civilFile`（体制公文）。

新增/删除模板只改 `TEMPLATE_IDS`；`ResumeRenderer` 的 loader 表、store 的 `isValidTemplateId` 校验与 `TEMPLATE_ID_MIGRATE` 都跟着它。被吸收的旧 id（campusClean/jobClean/navyBiz/techPlain → classic；navySidebar/sidebarRight/compactSplit/twoColumnEqual → sidebar；bannerCampus → banner；lineFrame/greenFresh → frame）必须留在迁移表里。

**字号换算**：纸面上所有字号必须走 `_primitives/ResumeChrome.tsx` 导出的 `fs(pt)`（→ `calc(Npt * var(--rx-fs,1))`）。写绝对 pt 字面量会让「字号」设置和「智能适应一页」静默失效。行距同理：`ResumeChrome` **不得**内联 `lineHeight`，否则盖掉 `fonts.css` 的 `.resume-page[data-line-height]`。

硬性禁止：

- 模板组件内使用 `sm:`/`md:`/`lg:` 等视口断点（窄窗口导出会丢照片）
- `.resume-page` 上任何 padding；页边距一律 `var(--rx-page-padding)`（12/16/20mm）
- 技能条/百分比、时间线圆点轨道、大渐变、中文模板英文全大写栏目、`uppercase tracking-widest` 作用在中文标题
- 模板强调色只允许 `var(--color-primary)` 等 CSS 变量（ThemeWrapper 注入）；未知主题 fallback `ink`，**禁止** `tech-orange`
- 文本节点缺 `min-w-0` + `break-words`（长邮箱/英文项目名会溢出并被打印裁掉）

切模板同时切该模板默认主题（`TEMPLATE_THEME`）；用户可在样式面板的「主题色」改回来。

### 撤销（Undo）

- 历史存**变更前**快照：store action 变更前 `push(prev)`；EditorLayout **禁止**对 deferred 数据 debounce 调 `pushHistory`
- `updateSettings(partial, { transient: true })` 表示连续手势的中间态，**不写历史**；调用方必须在手势开始时先 `pushHistory()` 一次（滑块、一键适应都依赖这个，否则一次拖动灌满 30 条上限）
- 焦点在 input/textarea/select/[contenteditable] 时：**只有撤销/重做**（Ctrl/Cmd+Z、Ctrl+Y、Ctrl+Shift+Z）永不 preventDefault、不调简历 undo；**Ctrl+S / Ctrl+P 在输入框内必须照常工作**
- 简历撤销走顶栏按钮与 Ctrl+Alt+Z / Ctrl+Shift+Z（非输入焦点）

### 导出

- **print-mode 会真的作用于屏幕**（Electron 的 `printToPDF` 打的是当前窗口）。钩子只有两个：`editor-chrome`（要隐藏的部件）和 `print-branch`（从根到纸面的每一层包裹，用于解除 flex/overflow/缩放）。**严禁**回到 `body.print-mode > * { display:none }` 那种把 `#root` 整个干掉的做法——那会导致白屏 + 空白 PDF
- `print.css` 的分页钩子：`break-inside:avoid` 只打在 `.rx-item`（单条目），**禁止**打在 `.rx-section`（整模块）上，否则整段经历被推到下页留半页空白；标题用 `.rx-section-title` + `break-after:avoid`
- 桌面 PDF：`webContents.printToPDF`，margins 用英寸字段 `{ top, bottom, left, right }`，**禁止**写 `margins.marginType`（那是 `webContents.print()` 的字段）
- 浏览器 PDF：`window.print`（print-mode）或明确标注「图片型 PDF」
- Word/PNG/备份走渲染进程 `<a download>`，由 `electron/main.js` 的 `session.on('will-download')` 统一弹原生「另存为」；**禁止**静默落 Downloads
- 文件名：`姓名_求职意向_简历.ext`（`exportFilename.ts`）
- `print.css` **禁止** `header { display:none }`（可能隐藏简历姓名头）；用 `.editor-chrome { display:none }`

### 存储与首启

- **`/` 就是简历列表**（Dashboard）；`/about` 是「帮助/关于」；`#/dashboard` 重定向到 `/`。**没有落地页、没有快速开始向导**，新建简历直接进编辑器
- 备份是**含照片的 .zip**（`utils/backup.ts`），导出与导入必须自洽；`storage.ts` 里那套 JSON `exportBackup/importBackup` 是待废弃的第二份真相
- `storage.load()` 在「数据存在但解析不出来」时必须 **throw `CorruptedDataError`**，绝不返回 null——返回 null 会被当成空库，用户新建后把空 state 写回即毁数据
- `migrateResumeData` 每次启动都会跑，因此**必须幂等且非破坏**：已是合法 `TemplateId`/`ThemeColor` 就原样保留，只有旧值才查迁移表（回归测试在 `storage.test.ts`）
- `saveStatus` 是真实状态机（`saving`/`saved`/`error`/`idle`），`idle` 显示「自动保存」而不是「已保存」；在 `setItem` 内改状态必须走 `setSaveStatus()`，否则和 persist 订阅形成无限写盘回环
- Electron 已加 `requestSingleInstanceLock`：整库是「内存副本 + 整条覆盖写盘」，开第二个窗口会静默清掉第一个窗口的全部简历

### 其它约定

- 单 store `界面/src/app/store/useResumeStore.ts`；组件必须细粒度 selector
- 深拷贝用 `safeDeepClone()`（structuredClone → JSON fallback）
- 新简历默认空个人信息（禁止李明）；模块空则纸面不渲染标题
- 代码和注释用中文；TypeScript 严格模式
