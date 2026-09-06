# 开发方案内部一致性审查

> 规划智能体已按 C1–C9、A1–A9 改过 `00`–`05`、`03`（persist v3、loader 别名、printToPDF 英寸边距、ErrorBoundary、spawn 工具名、视觉截图路径、主题表、删除旧模板、1.1.0）。本文件保留原文便于对照。


审查范围：`开发方案/` 下全部 md（`research/` 仍空，属预期）。抽查仓库：`AGENTS.md`、根 `package.json`、`electron/main.js`、`界面/src/app/store/useResumeStore.ts`、`界面/src/styles/fonts.css`，以及 `App.tsx`、`ResumeRenderer.tsx`、`ErrorBoundary.tsx`、`EditorLayout.tsx`、`useUndoRedo.ts`、`build-setup.js`、`界面/src/app/types/resume.ts`。

每条均为开放问题。**blocker / high 不修就不要开执行智能体。**

---

### C1

- **Severity:** blocker
- **Section:** `02` §5.1 / `03` Task 2.1 / 提交切分 commit 2 vs 3
- **Description:** 默认模板 id `campusClean` 在阶段 2/3 之间会白屏。`02` 已锁全表映射（含 `tech→techPlain`、`vibrant/freshGrad/generalRed/gradBlue→campusClean`），并写「禁止 `templateLoaders[campusClean]` 为 undefined」。但 `03` Task 2.1 仍给三条互斥路：(1) 占位 id + fallback 到 `recruitBk`；(2)「更好是阶段 2 末才切默认 id，与阶段 3 同一 PR」；(3)「旧 TemplateId 映射表……阶段 3 定最终表，这里先列草稿」。`03` 提交切分把「数据模型」和「模板重建」分成两笔可运行 commit。若执行者按 `02` 在阶段 2 就把 persist/新简历写成 `campusClean`，同时按 `03` 把真模板留到阶段 3：`TemplateId` 一加上新 id，`Record<TemplateId, loader>` 必须有对应项；写成 `import('./CampusCleanTemplate')` 而文件不存在时，Vite 打不出 chunk，运行时 lazy 失败 → `ErrorBoundary` → Electron 下 `href="/"` 进 `file:///` 空白。当前 `ResumeRenderer` 只 fallback 到 `templateLoaders.tech`，对 union 里已有、loader 抛错的 id 无效。
- **Suggestion:** 删掉 `03`「阶段 3 定最终表 / 同一 PR 再切 id」的摇摆句。改成硬门：阶段 2 改 `TemplateId` / `initialResumeData` / persist migrate 的**同一 diff**里，8 个新 id 的 loader 必须是现有文件别名（`campusClean/jobClean/atsMono`→`RecruitBkTemplate`，`civilFile`→`CivilServiceTemplate` 等），禁止 import 不存在的路径。阶段 3 再把别名换成原语实现。验收：阶段 2 结束后用旧 `tech` 数据打开不白屏，新建简历也不白屏。
- **Status:** open

---

### C2

- **Severity:** blocker
- **Section:** `02` §4.5 / `03` Task 1.1
- **Description:** persist `version: 2` 被两阶段重复占用。阶段 1 就要 `version: 2`（IndexedDB 适配）；阶段 2 又要用 `version: 2` + `migrate` 做 TemplateId/ModuleType/缺字段。Zustand persist 只在**已存 version ≠ 当前 version**时调 `migrate`。旧用户 key 无 version 时按 0 处理，阶段 1 完成后盘上已是 `version: 2`；阶段 2 仍写 `version: 2` 则映射表永不跑，老用户继续持有 `template: 'tech'`。若阶段 3 已从 union 删掉 `tech`，运行时类型/loader 对不上，轻则错模板，重则白屏。另：现有 `resume-storage` 是 persist 信封 `{ state, version }`，不是裸 `resumes`；`03` 的 `storage.ts`「读 localStorage → idb → 删旧 key」没说要拆信封。拆错会把整包当 state，hydrate 失败。失败路径上现 store 的 `onRehydrateStorage` 会在 `resumes` 为空时**写回李明**（`useResumeStore.ts` 361–368 行），与「禁止李明覆盖」直接打架。异步 IndexedDB 下初始内存态仍是 `initialResumeData`（李明），hydrate 完成前若有 persist 写回，旧用户会被演示数据覆盖。
- **Suggestion:** 锁单一版本阶梯：阶段 1 **不要**占 `version: 2`，只换异步 storage + 一次性把 `resume-storage` 信封迁到 idb（失败保留旧 key）。阶段 2 设 `version: 2`，`migrate(persisted, 0)` 一次做完 TemplateId 全表、缺字段、自定义字段补 `id`。若坚持两笔 commit 都可运行：阶段 1 = v2 只做存储形状，阶段 2 = **v3** 做模型。并写明：初始 state 用空 `resumes` + `skipHydration`/水合门闩，禁止用李明占位；hydrate 失败只设 `hydrationError`，不得 `set` 演示简历。
- **Status:** open

---

### C3

- **Severity:** blocker
- **Section:** `03` Task 5.2 / `04` R4 / `02` §8
- **Description:** `printToPDF` 示例对象是错的，却写得像可粘贴代码。`03`：`printToPDF({ pageSize: 'A4', printBackground: true, margins: { marginType: 'none' } })（字段以阶段 0 文档为准）`。Electron 当前（含 33）文档里 **`webContents.printToPDF` 的 `margins` 只有 `top/bottom/left/right`（英寸，默认约 1cm）**，没有 `marginType`。`marginType: 'default' | 'none' | ...` 属于 **`webContents.print()`**，不是 printToPDF。未知字段会被忽略，于是「页边 0」实际变成默认 ~1cm，HTML 里已有 12–20mm 边距会再套一圈，双栏出血再次失败。括号「以调研为准」挡不住执行者复制对象。另：`对当前 win 或隐藏 win` 是未决分叉——打当前窗口会打到整页编辑器；现有 `print.css` 虽藏了部分 chrome，但选择器是 `header/nav/.sidebar` 等，与真实 `EditorLayout` class 未必对应。`ResumexDesktop.exportPdf()` 无 HTML/简历 id 参数，等于默认「打当前窗」，却没要求必须先 `scale(1)` + 校验 print chrome 已隐藏。
- **Suggestion:** 从 `03` 删掉带 `marginType` 的对象，改成「禁止在阶段 0 前写死字段；阶段 0b 把 Electron 33 的实际 options 贴进 `02` §12」。预期正确形态（仍须 R4 打开官方文档确认）：`pageSize: 'A4'`、`printBackground: true`、`margins: { top: 0, bottom: 0, left: 0, right: 0 }`，并评估 `preferCSSPageSize`。锁死一条主路径：优先当前窗 + 可靠 `@media print` 隐藏 chrome；隐藏窗必须另写 `#/print` 路由和加载方式，不能「或」了事。
- **Status:** open

---

### C4

- **Severity:** blocker
- **Section:** `00` §5 / `AGENTS.md` / `02` §10
- **Description:** 执行纪律要求「遵循根目录 `AGENTS.md` 的技术栈」，但 `AGENTS.md` 与仓库和方案三重不一致：写的是 **BrowserRouter**、localStorage、`35+` 模板、新增模板要往 35 套体系里加文件。真实仓库已是 `HashRouter` + `base: './'`（`App.tsx`、`vite.config.ts`）。`AGENTS.md` 要到阶段 6 才更新，阶段 1–5 执行者可能把路由「改回」BrowserRouter，或按旧手册继续堆模板。这不是文档过时这么简单，是 `00` 把过时文件写成了必须遵守的规范。
- **Suggestion:** `00` 改成「以 `开发方案/02` 为准；`AGENTS.md` 与方案冲突时先改 `AGENTS.md`」。把更新 `AGENTS.md`（HashRouter、IndexedDB、8 套、禁止视口 class）从阶段 6 挪到阶段 1 开头。
- **Status:** open

---

### C5

- **Severity:** blocker
- **Section:** `00` §6 / `02` §3 / `App.tsx`
- **Description:** 「ErrorBoundary 用 `Link to="/"` / `navigate('/')`」在当前树里不可执行。`App.tsx` 是 `ErrorBoundary` **包住** `HashRouter`。错误 UI 不在 Router 上下文里，`Link`/`useNavigate` 会炸或无效。404 页在 Router 内，改 `Link` 可以；ErrorBoundary 不行。执行者按字面改完，一捕到模板加载错误就再次失败。仓库里两处 `href="/"`：`App.tsx` 404、`ErrorBoundary.tsx` 返回首页。
- **Suggestion:** 规格改为二选一并写进 `03` Task 1.5：(a) 把 `ErrorBoundary` 移到 `HashRouter` 内部；或 (b) ErrorBoundary 用 `window.location.hash = '#/'` / `<a href="#/">`，**不要**用 `Link`。禁止只写「改成路由内跳转」而不提这层结构。
- **Status:** open

---

### C6

- **Severity:** blocker
- **Section:** `00` §2 / `04` 统一要求 / `03` 阶段 0
- **Description:** 「必须 spawn 子智能体」**没有**写到不能被跳过。`00`：「必须真正 `spawn_subagent`……失败就换查询词重开，**不能跳过**。」`04`：「最多 3 轮，仍失败则……采用 `02` 的默认值。」这两句互相作废：后者就是官方跳过通道。工具名写死 `spawn_subagent`，执行环境若只有 `spawn` / 没有子智能体工具，会被理解成「做不到，用默认值」。阶段 0 只挡住阶段 3 画模板，阶段 1–2 可先做完再补空 research。V1 视觉审查写「可选 spawn」。产出门闩是「6 个文件存在且有 URL」，自己 `web_search` 写文件即可冒充 spawn。`执行记录.md` 在工作开始前就把「未完成项」写成「无」。
- **Suggestion:** 统一跳过政策：没有 6 份带 URL 的 `research/*.md` + `执行记录` 里 6 个真实子智能体 id，**禁止进入阶段 1**（不只禁阶段 3）。工具名改成「系统提供的子智能体工具（名称以当前环境为准）」；若环境没有 spawn，必须在执行记录写「无法 spawn」，然后**亲自**按任务卡检索并写满 6 文件，禁止凭训练记忆。删除 `04`「3 轮后用默认值」或改成「默认值只允许填 mm/pt/hex，不允许跳过 R3/R4 的可粘贴配置」。V1 对每 2 套模板改为必须。
- **Status:** open

---

### C7

- **Severity:** high
- **Section:** `00` 决策 10 / `02` §2 与 §5.3 / `03` Task 3.1 / `fonts.css`
- **Description:** `fonts.css` 现况（仓库属实）：

```css
.resume-page[data-margin="standard"] > div {
  padding: 14mm 20mm !important;
}
```

`ResumeRenderer` 把模板根当作 `.resume-page > div`，所以 `compactSplit` 左栏色条被白框包一圈——这就是 `01` T-1。方案要拆这层 padding，但用词会让人把 padding 挪到包装层：`02` §2「模板自己控制」vs §5.3「由 `.resume-page` 的**外层包装**或 CSS 变量控制」vs `03`「在包装层设置 `--rx-page-padding`」。若执行者写成 `.resume-page { padding: var(--rx-page-padding) }`，双栏子元素仍到不了纸边（纸是 `bg-white`）。`fonts.css` 里字体/行距同样是 `> div { … !important }`，只删 padding 段可以，但若模板根不再是单一 `div`（Fragment/多根），整套 data-* 映射失效。数字也不一致：css 现 10/14/18mm，规格默认 16mm（紧凑 12 / 宽松 20）。
- **Suggestion:** 写死算法：`.resume-page` **padding 恒为 0**；`--rx-page-padding` 只作变量；单栏原语自己读变量当内边距；`compactSplit` 外层 `padding: 0`、左栏背景铺满、左右内文各自 padding。删除 `> div { padding: !important }` 整段，不要改成打在 `.resume-page` 上。阶段 3.1 验收必须含 `compactSplit` 出血，不能只看 recruitBk 单栏。
- **Status:** open

---

### C8

- **Severity:** high
- **Section:** `00` 决策 8 / `02` §9.2 §9.5 §9.6 / `03` Task 6.2 6.4 / 根 `package.json` / `build-setup.js`
- **Description:** GitHub 空格→点号问题**讲了一半**。`00`/`01` 正确指出当前默认产物 `ResumeX Setup 1.0.0.exe` 在 Release 上变成 `ResumeX.Setup.1.0.0.exe`，与 `latest.yml` 对不上。新名 `ResumeX-Setup-${version}.${ext}` 方向对。缺口：(1) NSIS 目标默认模板就是 `` `${productName} Setup ${version}.${ext}` ``，只写顶层 `build.artifactName` 在部分 electron-builder 版本会被 target 默认盖掉，应同时写 `build.nsis.artifactName`；(2) `latest.yml` **只在 publish 时生成**（官方 troubleshooting）；现 `build-setup.js` 是 `npx electron-builder --win --x64`，无 `--publish never/always`。一旦 `package.json` 加上 `publish.github`，本地无 token 会失败，CI 上 `node build-setup.js 且 publish` 也没说把 flag 传进脚本；(3) 验收未要求打开 `latest.yml` 的 `path` 与 exe **逐字节一致**，也未提 `.blockmap`；(4) 旧 1.0.0 不能热更已写清，这点够用。
- **Suggestion:** `02` §9.2 写成完整片段：顶层 + `nsis.artifactName` 同为 `ResumeX-Setup-${version}.${ext}`。`build-setup.js`：本地 `--publish never`，CI `--publish always`，且 **pack 成功后再删 `webapp/`**。验收：产物文件名无空格、无点号替换；`latest.yml` 的 `path` 等于该文件名。R3 必须打开 electron-builder issue「spaces → dots」类材料并写进 research。
- **Status:** open

---

### C9

- **Severity:** high
- **Section:** `02` §6.2 / `03` Task 1.2 1.4 / `EditorLayout.tsx` / `ValidatedInput.tsx`
- **Description:** 「输入框原生撤销 vs 简历撤销」**可实现**，但 `02` 措辞会做成错误产品。现状：`EditorLayout` 对所有 Ctrl+Z `preventDefault` 再调 store `undo`；`push` 存的是变更后快照；`_skipHistoryUntil` 2 秒。`03` 1.4 正确：「输入框内 Ctrl+Z 不 preventDefault」。`02` 写成「**第一次** Ctrl+Z 交给浏览器」，执行者会做成第一次原生、第二次整份简历——这比现在更难用。受控 + 防抖下原生 Ctrl+Z 一般会触发 `onChange`，可以工作；但 `ValidatedInput` 只要 `value` 变就 `setLocalValue(external)` 并清 timer，简历级 undo 与输入法中间态仍会抢字。store 未暴露 `canUndo/canRedo`，顶栏禁用态无法接。`useUndoRedo.ts` 里的 React hook 与 store 用的 `UndoRedoManager` 是两套，任务卡只说改 hook 文件，容易改错对象。
- **Suggestion:** 删「第一次」。锁：焦点在 `input/textarea/select/[contenteditable]` 时 Ctrl/Cmd+Z/Y **永远**不 `preventDefault`、不调简历 undo；简历撤销只走顶栏按钮和 Ctrl+Alt+Z。历史存变更前快照；冷却只跳过 undo/redo 引起的**下一次** push。store 增加 `canUndo/canRedo`。任务卡写明改 `UndoRedoManager` + `useResumeStore`，不是改那个未使用的 hook。补一条：原生 undo 触发的 `onChange` 必须写入 store，echo 仅当 `incoming === local` 才忽略。
- **Status:** open

---

### C10

- **Severity:** medium
- **Section:** `02` §5.2 / `03` 阶段 3 / `01` T-7 T-8 / 模板目录
- **Description:** 「8 套替换 35 套」的**删除**工作量不大（36 个 `*Template.tsx` + `ResumeRenderer` 注册 + `TemplateModal` 长列表），真正低估的是：共享原语、8×4 态视觉自审、全引用点、旧 id 产品映射。`quickStartPresets.ts` 仍指向 `creative`/`freshGrad`/`tech`；落地页写死 `tech/business/vibrant`；`ThemeColor` 12 个旧 id（默认 `tech-orange`）规格改 6 色却没给新 token。`02` 映射把 `enBw`→`atsMono`（应更接近 `enSimple`），`professional/hr/accountant/medical/teacher`→`compactSplit`；若 R5 把 `compactSplit` 藏进「更多」，这批旧用户打开的是进阶双栏。`01` 要把 `recruitBk/eduDark/generalRed` 当改造起点，映射表却把前两个送去 `atsMono`。阶段 3 四条任务没有列出 `LandingPage`/`quickStartPresets`/`theme.ts`/`exportDocx.ts`。`ContentModule` 的 type 联合仍是 `experience|education|projects|custom`，只扩 `ModuleType` 会让 `campus`/`honors` 在类型和 `switch(type)` 上消失。
- **Suggestion:** 阶段 3 加「引用点清扫」清单（上述文件）。映射表改到产品合理：`enBw→enSimple`，行业大色块侧栏→`jobClean`/`navyBiz` 而非一律 `compactSplit`。明确 `ThemeColor` 新 id 以及旧主题 migrate。规定模板必须渲染 `campus`/`honors`（不要「可用 custom 凑合」而不改渲染）。视觉自审按 8×4 估时间，不要当删文件。
- **Status:** open

---

### C11

- **Severity:** medium
- **Section:** `00` §2 阶段 1 / `03` Task 2.2
- **Description:** 照片体积在 `00` 属于阶段 1 P0（配额），实现却在阶段 2（≤150KB、idb blob）。阶段 1 只把整包 JSON 搬到 IndexedDB，旧 5MB dataURL 仍在库里，配额问题只是从 5MB 变成「比较大的 idb」，与「照片单独存」不一致。备份导入/复制简历如何克隆 blob 未写。`duplicateResume` 现会复制同一 `avatar` 字符串，改成 `idb:avatar:<resumeId>` 后复制会共用或断引用。
- **Suggestion:** 阶段 1 至少：persist 失败可见 + 新选照片拒绝 >150KB 或压缩后再写。阶段 2 再迁旧 dataURL→blob。写清 duplicate/import 时复制 blob 并换 key。
- **Status:** open

---

### C12

- **Severity:** medium
- **Section:** `02` §7 / `03` Task 1.1
- **Description:** 损坏存储：`02` 要「只读恢复屏」，`03` 只要 `hydrationError` 条。执行者会做一条 banner 就算完。文件地图没有恢复页组件。`hasOnboarded` 仍规划进 localStorage，与「主存储离开 localStorage」并列，未说明配额/隐私。
- **Suggestion:** 锁一个 UI：全屏只读恢复（导出原始损坏数据 / 清空后新建），Dashboard/Editor 进不去。`hasOnboarded` 进同一 idb 或接受单独 key 并写明。
- **Status:** open

---

### C13

- **Severity:** medium
- **Section:** `03` 文件地图 / `04` R6
- **Description:** 要新增 `idb-keyval`、`electron-updater`，但文件地图没有 `界面/package.json`（idb-keyval 应装在前端）。根 `package.json` 现仅 `electron`/`electron-builder`/`png-to-ico`/`sharp`，无 `repository`/`publish`/`dependencies`。preload 的 `webPreferences.preload` 绝对/相对路径、`sandbox` 未写。`02` 8 套主题色是 hex，没有 `ThemeColor` union 怎么改。
- **Suggestion:** 文件地图补 `界面/package.json`、`theme.ts`、恢复页、`UpdateBar.tsx`（阶段 6 有）。preload 写 `path.join(__dirname, 'preload.js')`。阶段 0b 锁 ThemeColor id。
- **Status:** open

---

### C14

- **Severity:** medium
- **Section:** `02` §3 / `03` Task 1.5 / `00` §6
- **Description:** HashRouter vs `navigate('#/')`：`00`/`02` **已经改对**——必须 `Link to="/"` 或 `navigate('/')`，禁止 `navigate('#/')`（会变成 `#/#/`）。`03` Task 1.5 仍只说「所有 `href="/"` 改路由内跳转」，未点名禁止 `#/`。执行者若先读 `03` 仍可能写 `navigate('#/')`。配合 C4/C5，这题还没闭环。
- **Suggestion:** `03` 1.5 复制 `00` 那句禁令，并加 ErrorBoundary 结构约束（见 C5）。
- **Status:** open

---

### C15

- **Severity:** low
- **Section:** `04` R5/R6 / `02` §5.2 vs 6～8 / `05` / `执行记录.md`
- **Description:** R5 产出 `research/06-…`、R6 产出 `research/05-…`，编号对调，容易写错文件。规格表锁死 8 套，全文又写 6～8；R5 可把 `compactSplit` 藏掉则变 7，与「最多 8 张卡」仍兼容但默认列表长度不稳。`05` 否决「英文全大写栏目出现在中文模板」，`enSimple` 是英文模板，未开例外。`执行记录` 预先写「未完成项：无」。行距规格 1.25 vs `fonts.css` 1.35/1.5/1.75。`04` 要求打开的 electron.build URL 路径可能 404（文档多次搬家），虽允许换镜像，但「必须打开」写死了旧路径。
- **Suggestion:** 文件名与任务号对齐；产品句统一「默认 8 套，R5 可把 compactSplit 移出默认列表，不得再加第 9 套」；`05` 给 `enSimple` 开英文栏目标题例外；执行记录「未完成项」改为「规划完成，执行未开始」；R1 锁行距后改 css；R3 URL 改为当前 `electron.build` 路径并写「404 则搜标题」。
- **Status:** open

---

## 与仓库抽查对照（非方案内部矛盾，供修规格时对准）

| 点 | 方案说 | 仓库现在 |
|---|---|---|
| 路由 | HashRouter，禁 `href="/"` | `App.tsx` 确是 HashRouter；404/ErrorBoundary 仍 `href="/"`；`AGENTS.md` 仍写 BrowserRouter |
| persist | 将 `version: 2` + IndexedDB | `name: 'resume-storage'`，无 `version`/`migrate`，失败补李明 |
| 默认模板 | `campusClean` | `initialData.ts` `template: 'tech'`，主题 `tech-orange` |
| fonts.css | 废除 `> div` padding `!important` | `standard` 仍是 `14mm 20mm !important` |
| Electron | 无 preload/IPC/updater | `electron/main.js` 单窗 `loadFile(webapp/index.html)`，`show: false` + `ready-to-show`，无 `did-fail-load` |
| 安装包名 | 无空格 | 根 `package.json` 无 `artifactName`；`build-setup.js` 注释仍是 `ResumeX Setup 1.0.0.exe` |
| 撤销 | 输入框原生 / 按钮简历 | 全局 Ctrl+Z `preventDefault` + 2s 冷却 + push 后快照 |
| 模板数 | 6～8 | `TemplateId` 36 个；`ResumeRenderer` fallback 仅 `tech` |

---

## 能否交给执行智能体

**修完这些才能。**

至少先改掉 C1–C6（白屏顺序、persist 版本、printToPDF 错 API、过时 AGENTS.md 纪律、ErrorBoundary 不在 Router 内、spawn 纪律自相矛盾）。C7、C8、C9 建议同一轮改完，否则双栏、更新器、撤销仍会按字面做错。

未修就开跑的典型后果：阶段 2 默认 `campusClean` 白屏；旧用户 migrate 不跑仍是 `tech`；PDF 多 1cm 边；执行者遵守 `AGENTS.md` 改回 BrowserRouter；宣称「搜不到，用默认值」跳过 R3/R4。
