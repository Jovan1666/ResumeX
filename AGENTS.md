# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

ResumeX — 一款开源免费的在线简历制作工具。纯前端 SPA，数据存储在浏览器 localStorage，无后端服务。支持 35+ 模板、实时预览、PDF/PNG/Word 导出。

## Repository Layout

项目根目录包含启动脚本（`start.js`、`启动.bat`、`start.command`），实际应用代码全部在 `界面/` 子目录中。所有 npm 命令必须在 `界面/` 目录下执行。

## Build & Dev Commands

```bash
# 进入应用目录
cd 界面

# 安装依赖
npm install

# 启动开发服务器 (Vite, 默认 http://localhost:5173)
npm run dev

# 类型检查
npm run type-check    # 等价于 tsc --noEmit

# 构建生产版本
npm run build         # tsc -b && vite build

# 预览构建产物
npm run preview

# 运行测试 (Vitest)
npm run test          # vitest run

# 运行单个测试文件
npx vitest run src/app/utils/exportFilename.test.ts

# Lint
npm run lint          # eslint
```

## Architecture

### Tech Stack
React 18 + TypeScript + Vite + Tailwind CSS 4 + Zustand + React Router 7

### Routing (React Router, BrowserRouter)
- `/` — LandingPage（落地页）
- `/dashboard` — Dashboard（简历列表管理）
- `/editor` — EditorLayout（核心编辑器，左侧表单 + 右侧实时预览）

所有路由组件使用 `React.lazy` + `Suspense` 懒加载，且内置网络故障自动重试。

### State Management (Zustand + Immer + Persist)
单一 store：`界面/src/app/store/useResumeStore.ts`
- 使用 `zustand/middleware/immer` 实现不可变更新
- 使用 `zustand/middleware/persist` 持久化到 localStorage（key: `resume-storage`）
- 支持多简历管理：`resumes: Record<string, ResumeData>` + `activeResumeId`
- 内置撤销/重做：每个简历有独立的 `UndoRedoManager` 实例（`界面/src/app/hooks/useUndoRedo.ts`）
- **性能要求**：组件必须使用细粒度 selector（如 `state => state.resumes[state.activeResumeId]?.settings.themeColor`），禁止订阅整个 store

### Template System
35+ 模板位于 `界面/src/app/components/templates/`，全部通过 `ResumeRenderer.tsx` 统一调度：
- 所有模板按需懒加载（`React.lazy`），已加载的缓存在 `lazyComponentCache` Map 中
- 每个模板接收 `{ data: ResumeData }` props
- 主题色通过 `ThemeWrapper` 注入 CSS 变量（`--color-primary`、`--color-secondary` 等），模板**必须**使用 `var(--color-primary)` 等 CSS 变量，禁止硬编码颜色

### Adding a New Template
1. 在 `界面/src/app/components/templates/` 创建 `XxxTemplate.tsx`，导出命名组件
2. 在 `界面/src/app/types/resume.ts` 的 `TemplateId` union 中添加新 ID
3. 如需新主题色，在 `界面/src/app/types/theme.ts` 的 `themes` 对象中添加
4. 在 `界面/src/app/components/templates/ResumeRenderer.tsx` 的 `templateLoaders` 中注册懒加载
5. 在 `界面/src/app/components/editor/TemplateModal.tsx` 中添加模板选项卡片

### Type System
- `界面/src/app/types/resume.ts` — 核心数据类型（`ResumeData`、`ResumeModule`、`TemplateId`、`ModuleType`）
- `界面/src/app/types/theme.ts` — 主题配置（`ThemeColor`、`GlobalSettings`、12 种预设主题色）
- 模块分两种：`SkillsModule`（技能标签）和 `ContentModule`（经历条目），使用类型守卫 `isSkillsModule()` / `isContentModule()` 区分

### Export System
三种导出格式，逻辑分散在不同文件：
- **PDF**：`EditorLayout.tsx` 内 `handleExportPdf`，使用 `html-to-image` (toCanvas) + `jsPDF` 分页渲染
- **PNG**：`界面/src/app/utils/export.ts` 的 `exportToPng`，使用 `html-to-image` (toPng)
- **Word**：`界面/src/app/utils/exportDocx.ts` 的 `exportToDocx`，使用 `docx` 库程序化构建文档
- **文件名生成**：`界面/src/app/utils/exportFilename.ts` 统一生成 `姓名_求职意向_简历.格式`，自动清理非法字符

### UI Components
`界面/src/app/components/ui/` 下约 47 个 Radix UI 基础组件（shadcn/ui 风格），使用 `class-variance-authority` + `tailwind-merge` + `clsx` 做样式管理。工具函数 `cn()` 位于 `界面/src/app/lib/utils.ts`。

### Path Alias
`@/` 映射到 `界面/src/`（在 `tsconfig.json` 和 `vite.config.ts` 中配置）

## Code Conventions

- 描述内容渲染统一使用 `split('\n')` + 子弹点方式
- 使用 `React.memo` 包裹组件，配合细粒度 Zustand selector 优化性能
- 深拷贝使用 `safeDeepClone()`（优先 `structuredClone`，fallback `JSON.parse(JSON.stringify())`）兼容 Immer Proxy
- TypeScript 严格模式启用（`strict: true`、`noUnusedLocals`、`noUnusedParameters`）
- 所有代码和注释使用中文
