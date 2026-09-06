# ResumeX 开发方案完整性审查

- 审查对象：`开发方案/` 下全部 md（`00`–`05`、`README.md`、`执行记录.md`；`research/` 为空，属执行阶段产出，不记为方案缺口）
- 审查立场：另一个执行智能体只拿这一包 + 仓库代码，能否独立把 ResumeX 建成「能流畅用的国内简历桌面软件」
- 结论：**方向对、01/04/05 可用，但还不能保证独立做完。** Critical 不补就开工，会在撤销、照片、PDF、默认主题、更新基线、视觉自审上做错或漏做。
- 所有条目 Status 均为 **open**（本文件只审查，不改方案正文）

---

## 特别检查（用户点名的 6 项）

| 检查 | 结论 |
|---|---|
| 01 的 P0/P1 是否都能在 03 找到对应任务 | **不完全能。** P0 四条和多数 P1 有落点；P1-1 的根因文件 `EditorLayout.tsx` 1s debounce **没有**写进 Task 1.2；E-5 Google Fonts 只在 03 文件地图、无 checkbox；P1-10 只靠「重建模板」间接覆盖；`settings.language` / `filename.ts` 死代码 / ICO 512 **03 无任务**。对照表见文末。 |
| 旧 TemplateId 映射是否足够避免白屏 | **02 第 5.1 全表覆盖当前 36 个 id，足够避免白屏。** 但 03 Task 2.1 仍写「阶段 3 定最终表，这里先列草稿」，执行智能体会抛开 02 自己编表，或阶段 2 把 `templateLoaders[campusClean]` 留成 `undefined`。 |
| Electron 与 Web 存储是否说清 | **只说清「都用 IndexedDB」，没说清 origin、照片生命周期、备份是否含 blob、userData 备份 IPC。** 03 阶段 6 API 没有 `saveBackupFile`。`localhost:5173` 与 `file://` 两套库互不同步，方案没写，执行可能会去「做同步」。 |
| v1.0.0 不能热更是否写清 | **02 §9.5、03 Task 6.4、04 R3-9 已写清。** 00 的「已锁定决策」里没有这一句，只读 00 会漏。03 也没把「根 `package.json` version 改为 `1.1.0`」写成 checkbox。 |
| 会不会让执行智能体又去实现 35 套模板 | **默认不会再画 35 套西方新模板。** 风险是 03「删除**或**停止导出」+「临时指到 RecruitBk」+ 02「保留改造起点」→ 旧 36 个 tsx 继续留着、选择器或 fallback 仍渲染畸形模板。 |
| 00 是否可复制为第一条用户消息 | **基本可以复制，但不能原样保证成功。** 缺冲突优先级、子智能体工具别名、视觉截图方法、v1.0.0 不能热更。且写死 `spawn_subagent`，环境里若没有这个函数名，阶段 0 会卡死或自己搜完交差。 |

---

## A. Critical（执行会做错或漏做）

### A1. 00 写死 `spawn_subagent`，阶段 0 可能整段跳过

- **Status:** open
- **所在文件:** `00-执行总提示词.md` 第 2 节；`03-实现计划.md` 开头；`04-子智能体任务卡.md` 统一要求
- **为什么会害:** 用户明确要求「执行智能体要自己开子智能体上网搜」。执行环境里的工具名经常是 `Task` / `general-purpose` / MCP `tasks`，不一定叫 `spawn_subagent`。智能体会判定「没有这个工具」→ 自己用训练记忆填 research，或把阶段 0 标完成。模板审美就会回到 Canva / 西方 CV。
- **建议改成:** 在 `00` 第 2 节把「必须真正 `spawn_subagent`」整句换成：

> 阶段 0 必须**并行开启 6 个子智能体**（R1–R6），每个子智能体的第一条消息 = `04-子智能体任务卡.md` 里对应卡片的全文。工具名以你当前环境为准（`Task`、`general-purpose`、`spawn_subagent`、或等价并行 agent 均可）。**禁止**用你自己的 `web_search` 把 6 张卡搜完来代替 spawn。某个工具调用失败：换工具名再开同一张卡，最多 3 轮；仍失败才允许采用 `02` 里标注的默认值，并在 `执行记录.md` 写失败原因。

---

### A2. 视觉自审没有「如何得到图」——会变成读代码脑补

- **Status:** open
- **所在文件:** `00-执行总提示词.md` 第 5 节；`05-视觉自审清单.md` 全文（尤其 E 节）
- **为什么会害:** 用户要求「有视觉模型必须自审奇不奇怪」。05 说「看整页不是看组件代码」，但全程没说截图存哪、用什么打开编辑器、视觉模型读哪张图。执行会贴一段 TSX 自评「通过」，畸形版式原样上线。
- **建议改成:** 在 `00` 第 5 节追加：

> 必须把用户能看见的画面**截成图片再交给视觉模型**，禁止只读 TSX。步骤：`cd 界面 && npm run dev` → 用应届/社招/空数据填一份 → 将 `.resume-page` 导出 PNG 或系统截图，保存到 `开发方案/research/visual/<模板id>-<应届|社招|空>.png` → 用读图能力对照 `05` 逐条勾选。编辑器 chrome、落地页、更新条同样截整窗。连续打回两次仍怪：停下来对照 `research/02-竞品审美`，不要再叠特效。没有截图路径的「视觉自审」视为未做。

在 `05` E 节记录格式里把「vis 模型看到的问题」改成必须带图片路径。

---

### A3. 第一次撤销的根因文件不在 Task 1.2

- **Status:** open
- **所在文件:** `01-现状审计与问题清单.md` P1-1；`03-实现计划.md` Task 1.2；对照代码 `界面/src/app/components/editor/EditorLayout.tsx`（`deferredResumeData` 后 1s 才 `pushHistory`）+ `useResumeStore.ts`（`push` 的是改完后快照）
- **为什么会害:** 01 已经写明：Manager 推的是改完后快照 **并且** EditorLayout 对 deferred 数据 1s debounce 才 push。03 Task 1.2 的 Files 只有 `useUndoRedo.ts`、`useResumeStore.ts`、`undo.test.ts`，**没有** `EditorLayout.tsx`。执行会只改 Manager，第一次点撤销仍然是空操作，「网页端不流畅」主因还在。
- **建议改成:** Task 1.2 增加：

> **Files 必须包括** `EditorLayout.tsx`。历史必须在 **store 变更前** 推入（在 `updateProfile` / `updateModuleItem` 等 action 内部 `push(prev)`），不要等 EditorLayout 对 `deferredResumeData` 的 1s `setTimeout`。若保留 debounce，只能 debounce UI，不能 debounce 快照语义。测试：从 A 改到 B，第一次 undo 回到 A，不经过「再等 1 秒」。

---

### A4. 桌面 PDF 会打出整窗编辑器，或打出 0 边距白纸

- **Status:** open
- **所在文件:** `02-产品规格.md` §8；`03-实现计划.md` Task 5.2 / 5.1；对照 `界面/src/styles/print.css`（`.resume-page { padding: 0 !important }`，并且全局隐藏 `header`）
- **为什么会害:** 03 写 `ipcMain.handle('export-pdf')` 对「当前 win 或隐藏 win」`printToPDF`。当前窗口含左侧表单、顶栏、缩放 transform，导出会变成「软件截图」。若走 `window.print` + 现有 `print.css`：`@page margin:0` + `.resume-page { padding: 0 }` 会把页边距清掉；`header { display:none }` 会把简历姓名头也藏掉（只要原语用 `<header>`）。验收 11「文字可选中」即使过了，纸面仍怪。
- **建议改成:** 在 `02` §8 和 `03` Task 5.2 写死：

> 禁止对含编辑器 chrome 的当前窗口直接 `printToPDF`。必须二选一：（1）进入 print-mode：只显示 `.resume-page`，`transform:scale(1)`，chrome 全部 `no-print`；（2）隐藏 `BrowserWindow` 加载一份**只有简历 HTML** 的页面再 `printToPDF`。`print.css` **禁止** `header { display:none }`（改为 `.editor-chrome { display:none }`）；**禁止**再给 `.resume-page` 设 `padding: 0 !important` 把 `--rx-page-padding` 打掉。IPC 必须把 PDF Buffer 交给渲染进程另存，不能依赖系统打印对话框当「导出成功」。

---

### A5. 照片存 idb 后，模板 / 备份 / 复制 / 导出没有读图协议

- **Status:** open
- **所在文件:** `02-产品规格.md` §6.4、§7；`03-实现计划.md` Task 2.2（只有「照片输出 ≤150KB JPEG；存 idb」一句）
- **为什么会害:** 现在模板和 `BasicInfoForm` 都把 `profile.avatar` 当 `img src`。改成 `idb:avatar:<resumeId>` 后，预览、PNG、Word、仪表盘缩略图全部裂图。`duplicateResume` 不复制 blob，删简历不删 blob。`exportBackup` 若只 dump JSON，恢复后照片没了，验收 3「含照片」失败。执行会要么继续塞 dataURL（P0-1 复现），要么只改存储不管显示。
- **建议改成:** 在 `02` §6.4 和 `03` Task 2.2 追加：

> 新增 `界面/src/app/store/avatar.ts`：`saveAvatar(resumeId, blob)` / `loadAvatar(resumeId)` / `deleteAvatar(resumeId)` / `cloneAvatar(fromId, toId)`。UI 只用 `useAvatarObjectUrl(resumeId)` 得到 `blob:` URL，卸载时 `revoke`。模板禁止直接 `src={profile.avatar}`。migrate：旧 dataURL 写入 idb 后把 `profile.avatar` 改成 key。`exportBackup` 必须带上全部照片（建议 zip：`state.json` + `avatars/<resumeId>.jpg`）；`importBackup` 先写 blob 再写 state，persist 期间暂停自动保存。`duplicateResume` / `deleteResume` 必须处理 blob。

---

### A6. 新 8 套没有 `templateThemeMap`，默认色仍可能是科技橙红

- **Status:** open
- **所在文件:** `02-产品规格.md` §5.2 / §5.4；`03-实现计划.md` Task 2.3；对照 `ThemeWrapper.tsx` 未知主题 fallback `themes['tech-orange']`；`theme.ts` 仍是 12 个英文 id
- **为什么会害:** 用户不要畸形西方风，默认 `tech` + `tech-orange` 正是根因。02 给了 6 个 hex，但没有「8 套 id → ThemeColor id」表，也没有旧 12 色 migrate。执行会：保留 `tech-orange` 当 fallback；或删掉 `tech-orange` 后 `themes[old]` 为 `undefined` 再 fallback 橙红；或 Sidebar 继续摆 12 个色点。验收 6「默认打开不是西方橙红」会挂。
- **建议改成:** 在 `02` §5.4 贴死表（R1/R2 只许改 hex，不许改默认倾向）：

> ThemeColor 收敛为 6 个：`ink` `#1A1A1A`、`navy` `#1E4E8C`、`campus` `#2B6CB0`、`rust` `#B42318`、`pine` `#2F6F4E`、`slate` `#4A5568`。  
> 切模板默认色：`campusClean→campus`，`jobClean→navy`，`navyBiz→navy`，`civilFile→ink`，`techPlain→slate`，`atsMono→ink`，`compactSplit→navy`，`enSimple→ink`。  
> 旧主题 migrate：`tech-orange/vibrant-red/warm-amber/elegant-gold/creative-purple/indigo-data → rust`（再由模板 id 覆盖为上表）；`business-blue/pro-blue/navy-compact/fresh-teal → navy`；`minimal-bw → ink`；`emerald-green → pine`。  
> `ThemeWrapper` 未知主题 fallback **改为 `ink`，禁止 `tech-orange`**。Sidebar 只渲染这 6 个色。

---

### A7. persist version 与「阶段 2 才切默认模板」会让中间态白屏

- **Status:** open
- **所在文件:** `02-产品规格.md` §5.1 末段（临时壳）；`03-实现计划.md` Task 2.1「阶段 3 定最终表，这里先列草稿」、Task 3.3「旧 id fallback」
- **为什么会害:** 02 已经有 36→8 全表，03 仍叫「草稿」。执行按 03 会：把 `TemplateId` 改成 8 个新 id、删掉 `templateLoaders.tech`，但 migrate 还没抄全表 → 老用户 `template: 'tech'` → `getLazyTemplate` 取到 `undefined` → 白屏。或阶段 2 把默认改成 `campusClean` 却还没注册 loader。
- **建议改成:** 删掉 03「这里先列草稿」。改成：

> migrate **必须逐字复制** `02` §5.1 旧→新全表，禁止再发明。`TemplateId` union **只保留 8 个新 id**；运行时若仍遇到未知字符串，Renderer `normalizeTemplateId()` 返回 `campusClean`，**禁止**再 fallback 到 `tech`。阶段 2 若新模板文件未落地：`templateLoaders` 的 8 个新 id 全部临时指向 `RecruitBkTemplate`（`civilFile` 可临时指 `CivilServiceTemplate`），直到阶段 3 替换。中间态不允许 `templateLoaders[id]` 为 undefined。persist `version`：本次上线只发 **一个** version（建议 `3`，一次 migrate 做完 idb + 字段 + TemplateId + ThemeColor）；不要 stage1 写 version 2、stage2 再改 schema 却不 bump。

---

### A8. 00 把「照片体积」放进阶段 1，03 放进 2.2，P0 存储未真正闭环

- **Status:** open
- **所在文件:** `00-执行总提示词.md` 阶段 1 括号；`01` P0-1；`03` Task 1.1 vs 2.2
- **为什么会害:** 01 写明头像 base64 进整库会撑爆配额。00 说阶段 1 含「照片体积」，03 阶段 1 完全没有照片任务。执行若严格按 03：阶段 1 宣称「一保存就丢」已修，但 5MB dataURL 仍在，QuotaExceeded 仍会发生。
- **建议改成:** 二选一，必须写死同一边。推荐把 00 阶段 1 括号改成「存储、撤销、校验、HashRouter」，并在 03 Task 1.1 加一条硬约束：

> 在照片 idb 落地前，persist 的 JSON **禁止**写入长度 > 20KB 的 `profile.avatar`（migrate 时丢掉超大 dataURL 并 toast「照片请重新上传」）。真正的 ≤150KB JPEG + idb 在 Task 2.2 完成；没有这条，阶段 1 不得勾验收。

---

### A9. 00 作为第一条用户消息缺「冲突优先级」，执行会跟错 AGENTS.md

- **Status:** open
- **所在文件:** `00-执行总提示词.md` 纪律 5（遵循 `AGENTS.md`）；根目录 `AGENTS.md` 仍写 BrowserRouter、35+ 模板、localStorage；`开发方案/README.md`
- **为什么会害:** 00 可复制，但纪律 5 让执行把过时的 `AGENTS.md` 当技术栈真相（BrowserRouter、35 套、localStorage）。与 02 HashRouter / 6–8 套 / IndexedDB 直接冲突。执行会「按 AGENTS 改回路由」或「保留 35 套因为 AGENTS 说必须懒加载全部模板」。
- **建议改成:** 在 `00` 纪律列表最前面加：

> 冲突时优先级：用户本条消息 = `00` **>** `02-产品规格.md` **>** `03` **>** `01` **>** 仓库根 `AGENTS.md`（其中 BrowserRouter / 35+ 模板 / localStorage 已过时，以 02 为准）。你是执行智能体：读完方案后从阶段 0 开工，**不要**再输出一份新规划，**不要**扩大范围到 macOS/云同步/AI 写简历/第 9 套西方模板。

`开发方案/README.md` 同步加一句：「复制 00 全文作为第一条用户消息；若环境有附件能力，同时附上 `02` `03` `04` `05`。」

---

## B. Major（规格矛盾、阶段依赖不清、路径错/缺）

### B1. 03 对 36 个旧 id 仍说「草稿」，和 02 全表打架

- **Status:** open
- **所在文件:** `03-实现计划.md` Task 2.1、Task 3.3；`02-产品规格.md` §5.1 全表
- **为什么会害:** 见 A7。即使不白屏，`enBw`（英文）被 02 映到 `atsMono`（中文极简）而不是 `enSimple`，老用户英文章会被改成中文栏目标题。
- **建议改成:** Task 2.1 勾选句改为：「把 `02` §5.1 全表抄进 `migrateTemplateId()`，单测 36 个旧 id 每个都有映射。」并补一行产品修正：`enBw → enSimple`（不要 `atsMono`）。

---

### B2. 「删除或停止导出」会留下 36 个西方模板文件

- **Status:** open
- **所在文件:** `03-实现计划.md` Task 3.3、文件地图「只留 6～8 套」；`02-产品规格.md` §5.1「删除或不再注册到选择器」；`00` 纪律 7
- **为什么会害:** 「或」让执行选择成本最低的「不注册但仍 import」。`Record<TemplateId, loader>` 或 barrel export 会把旧模板继续打进包；TemplateModal 若仍遍历 `TemplateId` union 又变 35 张卡。用户要的是少而精，不是「选择器藏起来、代码还在」。
- **建议改成:**

> 阶段 3 结束时 git **删除** `界面/src/app/components/templates/` 下除 8 个新文件、`_primitives/`、`ResumeRenderer.tsx` 以外的全部 `*Template.tsx`。选择器只渲染规格 5.2 的 8 张卡（`compactSplit` 若 R5 否定，进「更多」，仍算 8 套之内）。禁止为了 fallback 保留 `TechTemplate.tsx`。C1 审查子智能体发现超过 8 个 `*Template.tsx` 即打回。

---

### B3. Web / Electron 存储 origin 与 userData 备份未落到任务

- **Status:** open
- **所在文件:** `02-产品规格.md` §7、§9.4；`00` 锁定决策 6；`03` Task 1.1、Task 6.1（`ResumexDesktop` 无备份 API）；`04` R6
- **为什么会害:** 执行可能在 Electron 另写 sqlite/文件 JSON，和 Web 分叉两套逻辑。或以为「做了桌面端就要和浏览器同步」。覆盖安装后数据在 Chromium userData 里，这一点 02 有，03 没验收步骤。`userData/backups/` 完全没任务。
- **建议改成:** 在 03 Task 1.1 + 6.1 写：

> Web 与 Electron **共用** `idb-keyval` 同一套 `ResumeStorage`，不要 sqlite。说明并写进 README：`http://localhost:5173` 与安装包 `file://` 是不同 origin，数据不通，不做同步。Electron 额外 IPC：`saveBackupFile(): Promise<string>` 写到 `app.getPath('userData')/backups/简历备份_YYYY-MM-DD.json`（或 zip，见 A5）。验收：覆盖安装同一 `userData` 后简历还在。`ResumexDesktop` 接口补上 `saveBackupFile`。

---

### B4. 根版本号不 bump，更新器会认为「已是最新」

- **Status:** open
- **所在文件:** `02-产品规格.md` §9.2（`1.1.0` / `v1.1.0`）、§9.5；`03-实现计划.md` Task 6.2（没写改 version）；根 `package.json` 现为 `1.0.0`
- **为什么会害:** 新底包若仍是 `1.0.0`，发 `v1.1.0` 时 `latest.yml` 与包内 version 对不上，或底包就是 1.0.0 则永远检测不到更新。00 锁定决策也没提 version。
- **建议改成:** Task 6.2 增加 checkbox：

> 根 `package.json` 的 `version` 改为 `1.1.0`，tag `v1.1.0`。README 写：「已安装 GitHub 上旧的 v1.0.0 的用户**不能**应用内热更，必须下载新的 `ResumeX-Setup-1.1.0.exe` 覆盖安装；从 1.1.0 起才能点更新升到 1.2.0。」`界面/package.json` 的 version 跟不跟随意，**更新器只认根 package.json**。

---

### B5. `build-setup.js` 与 CI publish 没写清命令

- **Status:** open
- **所在文件:** `02-产品规格.md` §9.2、§9.6；`03-实现计划.md` Task 6.2 / 6.4；对照现有 `build-setup.js` 是 `npx electron-builder --win --x64`（无 `--publish`）
- **为什么会害:** 默认 `--publish never`，tag 工作流跑完 Release 上只有空 tag 或只有 exe 没有 `latest.yml`，应用内「检查更新」永远失败。`GH_TOKEN` vs Actions 的 `GITHUB_TOKEN` 也不写，electron-builder 经常拿不到 token。
- **建议改成:**

> 本地 `node build-setup.js` = 构建 **不** publish。CI `.github/workflows/release.yml`：`env.GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`，`permissions: { contents: write }`，调用 `npx electron-builder --win --x64 --publish always`（或给 `build-setup.js` 加 `--publish` 参数，CI 传 `always`）。验收资产：`ResumeX-Setup-1.1.0.exe` + `latest.yml` + `.blockmap`，文件名无空格。不要用现有脚本的「打包完删除 webapp」在 publish 之前删。

---

### B6. 阶段 4/5 大量任务没有 Files，路径会改错

- **Status:** open
- **所在文件:** `03-实现计划.md` 文件地图 vs Task 4.1–4.3、5.3、6.3；`01` 其它摩擦
- **为什么会害:** 文件地图漏了实际要改的：`Dashboard.tsx`、`LandingPage.tsx`、`QuickStartWizard.tsx`、`quickStartPresets.ts`、`OnboardingOverlay.tsx`、`DiagnosticPanel.tsx`、`StyleSettingsPanel.tsx`、`Sidebar.tsx`、`export.ts`、`exportDocx.ts`、`print.css`、`scripts/generate-icon.js`、`UpdateBar.tsx` 的目录。执行会新建一套平行组件，或改不到诊断「去填写」、落地页「5 款模板」、适应一页 0.80 vs 滑条 0.85。
- **建议改成:** 给每个 Task 补 Files，至少：

> 4.1 `EditorLayout.tsx` `DiagnosticPanel.tsx` `StyleSettingsPanel.tsx` `BasicInfoForm.tsx` `ModuleItem.tsx`  
> 4.2 `Dashboard.tsx` `LandingPage.tsx` `QuickStartWizard.tsx` `quickStartPresets.ts`  
> 4.3 `OnboardingOverlay.tsx`：`querySelector` 失败仍要能关，不能 `if (!rect) return null` 卡死且不写 `hasOnboarded`  
> 5.3 `export.ts` `exportDocx.ts` `EditorLayout.tsx`  
> 6.3 `界面/src/app/components/desktop/UpdateBar.tsx`  
> 6.1 另改 `scripts/generate-icon.js`：ICO **不要**打进 512px 目录项，只用 16/32/48/256。

---

### B7. 空模块过滤、校园/荣誉 type、自定义字段 API 都没落到类型层

- **Status:** open
- **所在文件:** `02-产品规格.md` §4.1–4.3、§4.6；`03` Task 2.1 / 2.2；对照 `resume.ts` 里 `ContentModule.type` 不含 campus/honors，`updateProfile` 只接受 `string`，`ModuleList` 把校园/荣誉当 `custom`
- **为什么会害:** 02 说 campus「可仍用 custom 实现，但类型要有」。执行会只改 union、添加时仍 `type:'custom'`，模板 `m.type==='campus'` 永远空。`customFields` 要 `{id,label,value}[]`，现 store 写不进去。空模块过滤若只写在某一个模板里，8 套会漏。自我评价在 profile 不在 modules，02 4.6 应届顺序含「评价」，QuickStart 可能再插一个 `custom` 自我评价造成双份。
- **建议改成:**

> `ContentModule.type` 含 `education|experience|projects|campus|honors|custom`。添加「校园经历」必须 `type:'campus'`，「荣誉奖项」必须 `type:'honors'`。旧数据标题匹配 `/校园|荣誉|奖/` 的 `custom` **migrate 改 type**（可选，但新添加必须正确）。`updateProfile` 增加 `updateCustomFields`。纸面过滤写在 **原语 / Renderer 一层**：`visible===false` 或 `items.length===0` 不渲染；`profile.summary` 空白不渲染「自我评价」节。QuickStart **不要**再添加「自我评价」模块，评价只走 profile。身份选项必须有「体制内」，模块顺序抄 02 §4.6。

---

### B8. Google Fonts（E-5）和 `fonts.css` 其它 `> div !important` 没有任务

- **Status:** open
- **所在文件:** `01` E-5、T-1；`02` §5.5；`03` 文件地图有 `index.html`，Task 3.1 只拆 padding；对照 `fonts.css` 对 font/line-height/margin 全是 `.resume-page > div { … !important }`
- **为什么会害:** 执行只删 padding，双栏满出血仍被 font/line-height 的 `> div` 打到错误节点；`index.html` 继续请求 `fonts.googleapis.com`，国内预览长时间 fallback 闪烁。E-5 在 03 没有 checkbox，阶段 5 验收也不会想到。
- **建议改成:** Task 3.1 扩成：

> 删除 `index.html` 里全部 Google Fonts `link`。`fonts.css` **禁止** `.resume-page > div` 这种子选择器；改成在 `.resume-page` 自身设 `--rx-page-padding` / `font-family` / `line-height`，由 `ResumeChrome` 读取。3.1 验收：离线打开 `file://` 不发 fonts.googleapis 请求。

---

### B9. 撤销/IME 与「保存状态机」跨文件，阶段 1 验收会假绿

- **Status:** open
- **所在文件:** `03` Task 1.3 / 1.4；`02` §6.1–6.3
- **为什么会害:** Task 1.3 写 DebouncedInput/ValidatedInput，没写 `useDebouncedCallback.ts`、没写「失焦/切模块 flush」。Task 1.4 保存状态机在 EditorLayout，但 persist 成功回调在 store；执行会继续用 300ms 计时器当 `isSaving`。阶段 1 验收「手动输入中文」没有 IME 测试步骤。
- **建议改成:** 1.3 补：失焦、`visibilitychange`、路由离开、切模块都要 flush；测拼音「li」未上屏时 store 不变。1.4：`isSaving` **禁止**再靠 300ms timeout；接 persist `setItem` Promise，分 `dirty|saving|saved|error`。Ctrl+S 在 error 时不得 toast「已保存」。

---

### B10. 快速开始仍指向旧西方 id；落地页/身份预设无任务细节

- **Status:** open
- **所在文件:** `02` §4.6、§6.7；`03` Task 4.2 只有「QuickStart 只指向新 id」；对照 `quickStartPresets.ts`（应届 `freshGrad`/`creative`，社招 `tech`/`vibrant`/`accountant`）
- **为什么会害:** 阶段 3 删旧 id 后，QuickStart 运行时 `templateId: 'creative'` 要么类型报错要么白屏。02 有体制内顺序，代码身份只有应届/在职/自由职业。
- **建议改成:** Task 4.2 写死映射：应届默认 `campusClean`；社招互联网 `jobClean`；金融 `navyBiz`；体制内身份 + `civilFile`；设计也走 `jobClean` 或 `campusClean`，**禁止** `creative`。落地页文案「6–8 套国内模板」，主 CTA 文案分桌面/浏览器；禁止「35+」「5 款」并存。

---

### B11. `printToPDF` / electron-updater 的 API 细节完全押在 R3/R4，03 没有失败时的最小可用配置

- **Status:** open
- **所在文件:** `04` R3/R4；`03` Task 5.2、6.2；`02` §12 调研锁定
- **为什么会害:** 04 要求打开的 electron.build URL 可能 404（`/docs/features/auto-update` 这类路径常变）。子智能体失败后 04 说「采用 02 默认值」，但 02 没有可粘贴的 `package.json build` 片段，也没有 `printToPDF` 的精确 options。执行会背 2023 年 API 把构建打爆。
- **建议改成:** 在 `02` §9.2 直接放一份**最小** `build` JSON（appId、artifactName、publish github、nsis per-user、files: electron+webapp），R3 只允许改与官方文档冲突的字段。Task 5.2 写：`printToPDF({ printBackground: true, pageSize: 'A4', marginsType: 1 })` —— 若官方字段名不同，以 R4 打开的 **Electron 33** 文档为准，并把最终字段贴进 `02` §12。

---

### B12. 05 一票否决会误杀 `enSimple`；编辑器「少紫渐变」和现有 motion 大弹窗冲突未定量

- **Status:** open
- **所在文件:** `05-视觉自审清单.md` A 一票否决「英文全大写栏目」；B「不要大 Framer 入场」；对照 `TemplateModal.tsx` / `QuickStartWizard.tsx` 大量 `motion`
- **为什么会害:** `enSimple` 按规格就是英文栏目标题。执行用 05 A 打回唯一英文套，或反过来给中文套加上 `WORK EXPERIENCE`。B 节没说是否允许保留 motion：执行可能把所有动画删光，或一个不动。
- **建议改成:** 05 A 否决句改为「英文全大写栏目出现在**中文模板**（`enSimple` 除外；`enSimple` 允许 Title Case 英文栏目，仍禁止 infographic / 技能条）」。B 节加：「弹窗允许 150ms 透明度，禁止整页 Framer 弹跳和紫渐变英雄区。」

---

### B13. 恢复 UI「只读恢复屏」vs「恢复条」矛盾；hydrate 空列表会再写李明

- **Status:** open
- **所在文件:** `02` §7；`03` Task 1.1；对照 `useResumeStore.ts` `onRehydrateStorage` 在 `resumeIds.length===0` 时写入 `initialResumeData`
- **为什么会害:** 执行不知道做全屏阻断还是顶栏黄条。空仪表盘（用户删光简历）会被当成损坏并生成李明，P0-2 / P1-12 复现。
- **建议改成:**

> 解析失败 / JSON 损坏 → **全屏只读恢复**（导出原始字节 / 清空），禁止写盘。存储成功但 `resumes` 为空 → 仪表盘空态，**不要**自动创建李明。新用户第一次打开 → 一份**空个人信息**的 `campusClean`，不要演示数据。`initialResumeData` 不得再含「李明 / 高级全栈工程师」。

---

### B14. 00 要求「按仓库规则做浏览器端到端验证」，仓库没有 E2E 规则

- **Status:** open
- **所在文件:** `00` 纪律 4；`AGENTS.md` 只有 Vitest；`03` 阶段 7「浏览器：落地 → 新建…」是手工清单
- **为什么会害:** 执行会去加 Playwright 大框架（范围膨胀），或认为没有规则就跳过点击验证。
- **建议改成:** 00 纪律 4 改为：

> 不要新建 E2E 框架。阶段 7 按 `03` 手工清单在 Vite 和（若能启动的）Electron 窗口点一遍：中文输入、折叠基本信息、撤销按钮、切模板、窄窗导出、导入备份。把结果写入 `执行记录.md`。自动化只要求 Vitest：配额失败、undo 第一次有效、电话去空格、TemplateId 全表、文件名。

---

### B15. 阶段 2 默认模板切到 `campusClean` 与阶段 3 的依赖写成「更好是同一 PR」，commit 切分会打断

- **Status:** open
- **所在文件:** `03` Task 2.1、PR 切分 2/3
- **为什么会害:** 00/03 要求每笔 commit 可运行。commit 2 把默认 id 改成 `campusClean` 而 loaders 还没有 → 新简历白屏。
- **建议改成:** 「默认模板改为 `campusClean` 必须与 `templateLoaders.campusClean` 在**同一个可运行 commit**。若阶段 2 先做表单，默认仍用现有 `recruitBk` 直到阶段 3 切换，并在执行记录写明。」

---

## C. Minor

### C1. 04 产出文件编号和任务号交叉（R5→`06-ATS`，R6→`05-编辑器`）

- **Status:** open
- **所在文件:** `04-子智能体任务卡.md`；`00` 第 3 节表
- **为什么会害:** 执行或审查子智能体会找 `research/05-ATS` 找不到。不至于做错产品。
- **建议改成:** 保持 00 表即可，在 04 开头加一句：「文件名按表，不要自行改成 R5→05。」

---

### C2. `settings.language`、`resetData`、`filename.ts` 死代码 03 没提

- **Status:** open
- **所在文件:** `01` 其它摩擦；`03` 非目标未列清理项
- **为什么会害:** `language:'en'` 从未读取，`enSimple` 可能被做成「切 language 全局英文化」或完全忽略。死代码不挡验收。
- **建议改成:** 「`settings.language` 本轮不做成 i18n；`enSimple` 只改纸面栏目标题。`filename.ts` 若与 `exportFilename.ts` 重复则删除前者。`resetData` 若无入口可删。」

---

### C3. NSIS `allowToChangeInstallationDirectory: true` 可能导致「更新装到默认目录、用户打开旧目录」

- **Status:** open
- **所在文件:** 根 `package.json` nsis；`02` §9；`03` Task 6.2
- **为什么会害:** 覆盖安装路径错，用户以为更新没生效。
- **建议改成:** 「保持 per-user。若保留可改目录，R3/C2 必须验证 electron-updater 仍更新到用户当时的安装路径；验证不了就去掉 `allowToChangeInstallationDirectory`，装死 `%LOCALAPPDATA%\Programs\ResumeX`。」

---

### C4. 技能分组的数据形状有歧义

- **Status:** open
- **所在文件:** `02` §4.3
- **为什么会害:** 执行会做成「一条 skill.name = `前端：React、TypeScript`」或「多条 `group=前端`」。纸面都能看，Word 导出可能乱。
- **建议改成:** 「一条技能 = `{ id, name, group? }`，同 group 的在纸面上渲染为 `group：name、name`。不要把整行塞进 name。」

---

### C5. 02 §3 Electron 打开跳过落地页，03 阶段 6 没接

- **Status:** open
- **所在文件:** `02` §3 末；`03` Task 4.2 / 6.1
- **为什么会害:** 老用户每次开软件先看营销落地页，不像桌面工具。
- **建议改成:** 「packaged 且 `hasOnboarded` 或已有简历 → 默认 `#/dashboard`。落地页仍可从菜单进。」

---

### C6. 便携 zip / `build-release.js` 命运未说明

- **Status:** open
- **所在文件:** `01` 产品形态表；`03` 非目标
- **为什么会害:** 执行可能花时间修 5678 端口 zip，或删掉后有人依赖。
- **建议改成:** 「本轮不维护 `build-release.js` 便携 zip，文件可留着但 README 不提。」

---

### C7. 05 E 节记录格式里 `vis 模型` 前有多余空格，像未写完

- **Status:** open
- **所在文件:** `05-视觉自审清单.md` E
- **为什么会害:** 无功能伤害。
- **建议改成:** 改成「视觉模型看到的问题（引用 `research/visual/...png`）：」

---

### C8. 调研锁定 §12 与「只改数字」在 00 写了，但没禁止执行改 5.2 骨架

- **Status:** open
- **所在文件:** `00` 阶段 0b；`02` §12、§5.2
- **为什么会害:** R2 若建议「再加时间线套」，执行可能改 5.2 加第 9 套。
- **建议改成:** 「0b 只许填 §12 的空和微调 5.2 的中文名/hex；不许增加模板数量、不许把 `compactSplit` 改成满色侧栏、不许把默认改回 `tech`。」

---

## D. 已经够好、不要再加范围

这些不要再扩写、不要再加功能：

1. **产品方向锁死（00 第 4 节 + 02 第 2 节）**  
   国内校招/社招/体制内、A4、禁视口断点、禁技能条/时间线/大渐变、6–8 套、空白新简历、无后端、更新走 latest.yml 不走 git commit、安装包文件名无空格。足够，不要再加「也兼容欧美 CV」。

2. **01 现状审计**  
   P0/P1/E/T 都能指到文件，禁止执行再「探索一遍当完成」。不要再让规划阶段重扫仓库。

3. **02 §5.1 旧 → 新 TemplateId 全表**  
   已覆盖当前 `resume.ts` 全部 36 个 id，缺省 `campusClean` 也写了。不要再加第 37 个映射维度（除非采纳 B1 的 `enBw→enSimple` 这一处修正）。

4. **v1.0.0 不能热更（02 §9.5）**  
   语义已经正确：新底包 1.1.0，之后 1.2.0 才能热更；更新器不认 push。不要做「检测 GitHub commit」假更新。

5. **04 六张调研卡 + 失败默认值**  
   搜什么、打开哪些 URL、写到哪个 `research/*.md`、失败用 02 默认，结构完整。不要规划阶段提前把网上材料搜完填进方案。V1/C1/C2 后置审查卡也够用。

6. **05 纸面一票否决清单**  
   技能条、时间线轨道、30% 色块+CONTACT、渐变波浪、致谢、圆大头、纸中纸、`md:` 藏照片——这些红线直接对应「不要畸形西方风」。不要再加主观美学论文。

7. **非目标（01 末 + 03 末）**  
   不做账号云同步、不做 zip 覆盖安装目录、不像素级拯救 35 套、不签名/不去 SmartScreen、不做 macOS/Linux 安装包。保持。

8. **编辑器流畅度规格（02 §6.1–6.3）**  
   IME composition、echo、flush、undo 不抢输入框、保存失败可见——需求已经写到行为级。缺的是 03 的文件/任务对齐（见 A3/B9），不是再加新 UX 功能。

9. **HashRouter + `base: './'`（00 第 6 节、02 §3）**  
   Electron `file://` 路径是对的。不要改回 BrowserRouter。

10. **执行记录模板**  
    `执行记录.md` 给阶段 0 / 视觉 / 构建 / 未完成项留了空表，够执行填，不要改成另一份规格。

---

## 附录：01 P0/P1/E/T → 03 任务对照

| 01 条目 | 03 落点 | 缺口 |
|---|---|---|
| P0-1 配额 + 假已保存 | 1.1、1.4 | 照片体积在 2.2，阶段 1 不能闭环（A8） |
| P0-2 损坏被李明覆盖 | 1.1 | 空列表 vs 损坏未区分（B13） |
| P0-3 导入 500ms 竞态 | 1.1 | 备份是否含照片未写（A5） |
| P0-4 ValidatedInput 不 flush | 1.3 | 切模块/失焦 flush 未写进步骤（B9） |
| P1-1 第一次 Ctrl+Z 无效 | 1.2 | **未改 EditorLayout 1s debounce（A3）** |
| P1-2 撤销后 2s 吞输入 | 1.2 | 有 |
| P1-3 全局抢走 Ctrl+Z | 1.4 | 有 |
| P1-4 debounce echo | 1.3 | 有 |
| P1-5 DatePicker 至今 | 1.5 | 有 |
| P1-6 电话空格 | 1.5 | 有 |
| P1-7 微信/自定义字段 | 2.2 | store 仍是 string profile（B7） |
| P1-8 切模板不切主题 | 2.3 | 无新 8 套色表（A6） |
| P1-9 仪表盘 hover 删除 | 4.2 | Files 未列 `Dashboard.tsx`（B6） |
| P1-10 `hidden md:block` | 3.3 禁止 sm/md | 若旧模板文件保留则仍在（B2） |
| P1-11 `href="/"` | 1.5 | 有；00 与 02 已禁止 `navigate('#/')` |
| P1-12 新简历克隆李明 | 2.1 | 与 hydrate 空列表冲突（B13） |
| E-1 JPEG PDF | 5.2、5.3 | 打整窗 / print.css 清边距（A4） |
| E-2 PNG | 5.3 | Files 未列 `export.ts`（B6） |
| E-3 Word | 5.3 | 同上 |
| E-4 print class 没用 | 5.1 | 有，但与现 print.css 互斥（A4） |
| E-5 Google Fonts | 仅文件地图 | **无 checkbox（B8）** |
| T-1 全局 padding | 3.1 | 其它 `> div !important` 还在（B8） |
| T-2 国内栏目 | 2.1 | campus/honors 落地含糊（B7） |
| T-3 空模块占标题 | 2.3 验收一句 | 应写进原语层（B7） |
| T-4 假技能条 | 靠重建模板 | 有，前提是真删旧文件（B2） |
| T-5 英文西式 | 靠重建 + 05 | `enSimple` 会被 05 误杀（B12） |
| T-6 行业错映射 | 靠删除 | 有 |
| T-9 35 棵预览树 | 3.4 | 有 |
| Electron 无 updater | 阶段 6 | version/publish/token（B4/B5） |
| ICO 512 | 02 §9.1 一句话 | 03 无 `scripts/generate-icon.js`（B6） |
| 诊断 data-section | 4.1 | Files 未列 DiagnosticPanel（B6） |
| 落地页 5 vs 35 | 4.2 | 有，细节不足（B10） |
| 适应一页 0.80 vs 0.85 | 4.1 | 有 |
| `settings.language` | 无 | C2 |

---

## 建议的最小补丁顺序（仍不改方案正文，只给规划修订用）

1. 先改 `00`：冲突优先级、子智能体工具别名、视觉截图路径、v1.0.0 不能热更、禁止再规划（A1/A2/A9/B4）。
2. 再改 `03`：Task 1.2 加上 `EditorLayout.tsx`；Task 2.1 抄死 02 全表；Task 2.2 照片协议；Task 2.3 主题表；Task 3.3 改为 git 删除旧模板；Task 5.2 禁止打整窗；阶段 4/5 Files 补全。
3. `02` 小补：`enBw→enSimple`、ThemeColor 6 色表、备份含照片、print 模式、persist 单一 version。
4. `05` 小补：`enSimple` 例外、截图路径。

补完 Critical + B1/B2/B3/B4/B5 之后，方案才够另一个智能体独立做完。未补之前不要把本目录当成「已经可以开工的完整任务包」。
