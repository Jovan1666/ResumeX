# 04 PDF / Word 导出调研

> 调研日期：2026-09-06
> 调研范围：Electron `printToPDF` 当前 API、浏览器 `window.print` + `@page` 行为、html-to-image 在 `file://` 下的坑、docx 库中文/图片用法
> 主路径结论：**Electron 优先 Chromium 打印 PDF（文字可选中）**；浏览器次优 print；Word 走 docx 库干净国内结构；PNG 保留投递截图场景

---

## 1. Electron `webContents.printToPDF` 当前 API（权威结论）

### 1.1 margins 字段名结论（必读）

**`printToPDF` 的 margins 是 `{ top, bottom, left, right }`，单位是英寸（inches），不存在 `marginType` 字段。**

`marginType`（`default` / `none` / `printableArea` / `custom`）**属于 `webContents.print()`（系统打印对话框 API），不属于 `webContents.printToPDF()`**。两者是不同 API，切勿混淆。

字段对照表（来源：Electron 官方文档）：

| 字段 | 类型 | 默认值 | 单位/说明 |
|---|---|---|---|
| `margins.top` | number | 1cm (~0.4) | **inches** |
| `margins.bottom` | number | 1cm (~0.4) | **inches** |
| `margins.left` | number | 1cm (~0.4) | **inches** |
| `margins.right` | number | 1cm (~0.4) | **inches** |
| `pageSize` | string \| `{width, height}` | `Letter` | `A0`~`A6`、`Legal`、`Letter`、`Tabloid`、`Ledger`，或对象含 `height`/`width` **inches** |
| `printBackground` | boolean | `false` | 是否打印背景图形 — **简历必须设 `true`** |
| `preferCSSPageSize` | boolean | `false` | 是否优先使用 CSS `@page` 定义的页面尺寸；`false` 时内容缩放适配纸张 |
| `landscape` | boolean | `false` | 与 `@page` CSS at-rule 同时使用时 **landscape 会被忽略** |
| `displayHeaderFooter` | boolean | `false` | 是否显示页眉页脚 |
| `headerTemplate` / `footerTemplate` | string | — | HTML 模板，注入类名：`date`/`title`/`url`/`pageNumber`/`totalPages` |
| `scale` | number | `1` | 页面渲染缩放 |
| `pageRanges` | string | `''` | 如 `'1-5, 8, 11-13'` |
| `generateTaggedPDF` | boolean | `false` | 实验性：生成可访问 PDF |
| `generateDocumentOutline` | boolean | `false` | 实验性：生成文档大纲 |

返回：`Promise<Buffer>`，可写 `fs.writeFile` 或直接发给渲染进程。

### 1.2 官方示例（Electron 文档原文示例）

```js
// main process
const { app, BrowserWindow } = require('electron')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

app.whenReady().then(() => {
  const win = new BrowserWindow()
  win.loadURL('https://github.com')
  win.webContents.on('did-finish-load', () => {
    const pdfPath = path.join(os.homedir(), 'Desktop', 'temp.pdf')
    win.webContents.printToPDF({}).then(data => {
      fs.writeFile(pdfPath, data, (error) => {
        if (error) throw error
        console.log(`Wrote PDF successfully to ${pdfPath}`)
      })
    }).catch(error => {
      console.log(`Failed to write PDF to ${pdfPath}: `, error)
    })
  })
})
```

### 1.3 Chromium CDP 底层一致性

Electron `printToPDF` 底层调用 Chrome DevTools Protocol `Page.printToPDF`，参数直接对应（CDP 中是 `marginTop/marginBottom/marginLeft/marginRight`，单位同为 **inches**，默认 1cm(~0.4in)；`paperWidth/paperHeight` 单位也是 **inches**）。这佐证了 margins 用「英寸」而不是「像素」。

---

## 2. 浏览器 `window.print` + `@page` 行为

### 2.1 `@page` CSS at-rule

- `@page` 是 CSS at-rule，用于修改打印页的尺寸、方向和边距。可以针对所有页或子集（`:left`/`:right` 伪类）。
- **`size` 描述符**：指定页面盒子尺寸/方向。`size: A4;` 有效（210mm × 297mm）。支持 `A4 portrait`、`A4 landscape`、`size: 8.5in 9in`、`size: 4in 6in` 等。
  - `@page { size: A4; margin: 0 }` — **「size: A4 + margin: 0」组合在 Chrome/Edge/Firefox/Safari 均受支持**（MDN 标记 Baseline 2024，即 2024 年 12 月起所有主流浏览器支持）。
- **`margin` 描述符**：可设置 `margin` 或 `margin-top/right/bottom/left`。
- 注意：`@page` 里还有 `page-orientation`、margin at-rules（如 `@top-right { content: "Page " counter(pageNumber) }`）等。

### 2.2 浏览器打印的关键限制（诚实标注点）

| 限制 | 说明 |
|---|---|
| 无法指定文件名 | 浏览器打印对话框的「另存为 PDF」文件名由浏览器决定（通常取 `document.title`），**应用层无法控制导出文件名**，与 `exportFilename.ts` 的统一命名冲突 |
| 无进度回调 | 无法在 UI 显示导出进度（进度条、百分比） |
| 无法预览自身分页 | 分页由浏览器引擎决定，`@page` 控制有限，模板多页时无法保证在哪一处断页 |
| 用户步骤多 | 用户必须手动选择「保存为 PDF」、选位置 — 不如 Electron 一键导出 |
| 打印背景需注意 | 必须给打印样式加 `print-color-adjust: exact` / `-webkit-print-color-adjust: exact`，否则背景色/背景图可能丢失 |

### 2.3 `window.print` 的可见性技巧（项目已用）

项目 `export.ts` 的 `printToPdf()` 已实现：`@media print { body * {visibility:hidden} #print-content, #print-content * {visibility:visible} #print-content{position:absolute;left:0;top:0;width:210mm;min-height:297mm} }`。这是经典的做法，但要注意：

- `visible` 方案会保留布局占位，可能产生空白页；`display:none` 其他元素 + `display:block` 打印元素更干净，但某些浏览器下 `display` 切换会破坏 flex 布局。最稳妥的替代是：**打印时直接重定向到独立的「打印预览页」路由**（只渲染 `ResumeRenderer`，无编辑器 chrome），配合 `@page` 规则。
- `position:absolute` + `width:210mm` 时，若模版内部有固定 `min-width` 或 `rem` 单位，会溢出/缩放错位。

---

## 3. html-to-image 在 `file://` 协议下的坑

html-to-image（v1.11.13，项目当前版本）的导出流程：`toSvg()` → `cloneNode()` → `embedWebFonts()` → `embedImages()` → `applyStyle()` → 序列化为 SVG dataURL → `createImage()` 载入 → `toCanvas()`。**所有外部资源（字体、图片、样式表）都要通过 `fetch()` 转成 dataURL 内嵌**：

- `src/embed-webfonts.ts`：`fetchCSS(url)` 用 `fetch()` 抓 CSS；`embedFonts()` 用 `fetchAsDataURL()` 抓字体文件。
- `src/dataurl.ts`：`fetchAsDataURL()` 全程用 `fetch(url, init)`。
- `src/util.ts` 的 `createImage()` 设置 `img.crossOrigin = 'anonymous'`。

### 3.1 `file://` 协议下的具体坑

| # | 坑 | 原因 | 后果 |
|---|---|---|---|
| 1 | **`fetch(file://...)` 在浏览器抛「bad scheme」错误** | 浏览器 `fetch()` 只接受 HTTP(S) scheme；`file://` 会被拒绝（MDN 明确 fetch 会在 "bad scheme" 时 reject）。HTML-to-image 的 `fetchAsDataURL/resourceToDataURL/fetchCSS` 全部依赖 fetch | `file://` 页面下：外部 CSS、@font-face 里的字体 URL、`<img src="file://...">` 全部嵌入失败 |
| 2 | **外部字体/Google Fonts 嵌入失败 → 回退系统字体** | `embedWebFonts` 抓不到字体文件，`getFontEmbedCSS()` 返回空/失败 | 最终 PNG/PDF 里字体与预览不一致（如中文回退宋体/楷体），**出现字形差异** |
| 3 | **跨源样式表 CSSRule 读取被拒（CORS）** | 浏览器禁止读取非同源样式表的 `cssRules`（html-to-image 需读取以解析 URL 引用）；GitHub issue #362、#523 有报告 | `Failed to read the 'cssRules' property from 'CSSStyleSheet'` |
| 4 | **背景图片/CSS url() 资源嵌入失败** | 同 #1 | 模板的背景图/装饰消失 |
| 5 | **canvas 被 taint** | `crossOrigin='anonymous'` 在 file:// 下无 CORS 标签可回 | `canvas.toDataURL()` 抛出 SecurityError，导出整体失败 |
| 6 | **已知相关 bug** | 项目 issue #467（img onerror）、#301（CSS CORS）、#523（按 origin 过滤样式表）、#479（字体错误 URL）、#362（cssRules 拒绝访问） | 不稳定复现 |

### 3.2 应对策略（按优先级）

1. **本地字体内嵌（推荐）**：项目 `EditorLayout.tsx` 已用 `fontEmbedCSS: LOCAL_FONT_CSS` 传入本地字体 CSS —— 这是正确做法，**避免运行时抓取字体**。继续维护 `LOCAL_FONT_CSS`（基建字体全部 base64 内嵌）。
2. **图片全部转 dataURL 存储**：简历头像、模板素材在写入 store 时就转 `data:image/...;base64,...`，避免 `<img src="file://...">`。项目导出正好也用了 `data:` 头像（`exportDocx.ts` 判断 `profile.avatar.startsWith('data:image')`）。
3. **样式表同源化**：Vite 构建的 CSS 与 JS 同源（`http://localhost` / 生产同域）时正常；`file://` 打开构建产物则挂了 —— **建设 Electron 用 `loadFile()` 时禁止用户直接打开 `dist/index.html`**，或在开发测试时用 `npm run dev` + `http://localhost:5173` 验证。
4. **`fetchRequestInit`**：`html-to-image` 提供 `fetchRequestInit` 选项，可传 `{ cache: 'no-cache' }` 等（issue #399、#503 提到），但不能解决 file:// 的 bad scheme。
5. **兜底**：`imagePlaceholder` + `onError` 回调（options），个别图片失败时输出占位而不是整体抛错。

---

## 4. docx 库（npm `docx`）中文 / 图片用法

依赖版本：项目 `package.json` 为 `"docx": "^9.5.1"`；npm latest 为 **9.7.1**（2026-09-06 查得）。许可证 MIT。

### 4.1 中文字体（关键：`eastAsia`）

docx 的 `IFontAttributesProperties` 接口字段：`ascii`（西文）、`hAnsi`（高 ANSI）、`cs`（复杂脚本）、`eastAsia`（**东亚字体，中文必须设它**）、`hint`。

**`TextRun`/`Paragraph` 的 `font` 属性支持三种形式**：

```ts
// 1) 简单字符串 —— 只设置 ascii/hAnsi，中文无效！(不推荐中文场景)
new TextRun({ text: '姓名', font: 'Microsoft YaHei' })

// 2) 对象 { name, hint? } —— 同样只设置单一字体

// 3) IFontAttributesProperties —— 正确做法：中西文分别指定
new TextRun({
  text: '张三 · 前端工程师',
  bold: true,
  size: 32, // 单位 half-points（32 = 16pt）
  color: '2E68C8',
  font: {
    ascii: 'Microsoft YaHei',       // 西文/数字
    hAnsi: 'Microsoft YaHei',       // 高 ANSI
    eastAsia: 'Microsoft YaHei',    // 中文 → 微软雅黑
    cs: 'Microsoft YaHei',
  },
})
```

> 推荐中文简历统一用 **微软雅黑（Microsoft YaHei）**，Word 在 Windows 下必有；苹果端可回退 `PingFang SC`，但 Word 文档中 `eastAsia` 只认一个值，建议就设雅黑（Word 打开时若无该字体会按替代规则处理，属正常现象）。

若要更强保证，把「字体名」作为文档样式 `styles` 默认值：`new Document({ styles: { default: { document: { run: { font: {...} } } } } })`。

### 4.2 插入图片（证件照等）

`ImageRun` 构造参数：

```ts
new ImageRun({
  type: 'jpg',                 // 'jpg' | 'png' | 'gif' | 'bmp' 必须显式指定（9.x 起需要）
  data: uint8Array,            // Buffer | string | Uint8Array | ArrayBuffer（base64 字符串亦可）
  transformation: { width: 60, height: 60 },  // 单位 = px（EMU 由库换算）
  // 可选：altText: { title, description }, floating: {...}
})
```

> 注意：v9 起 `type` 是必填（`RegularImageOptions` 中 `type` 非可选）。旧 v8 代码只传 `data` + `transformation` 会在 v9 报 TS 错。
> `transformation` 的 `width/height` 文档上下文为**像素**（docx.js.org 文档和 `IMediaTransformation` 定义，单位 px，内部转 EMU）。证件照通常 60×60 px 合适（Word 打印时约 1.58cm）。注意：`transformation` 是**原始尺寸**，视觉上 `width:60,height:60` 大约 0.6 英寸高；若需要更大的证件照（如 2.5cm），用 `width: 95, height: 95`（约 1 英寸）左右。

项目中 `exportDocx.ts` 已有 `base64ToUint8Array()` + `getImageType()` 辅助函数，直接沿用。

### 4.3 标题样式 / 结构

```ts
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';

new Paragraph({
  text: '项目经历',
  heading: HeadingLevel.HEADING_2,   // 使用内置标题样式 → Word 导航窗格可折叠
  spacing: { before: 200, after: 100 },
})
```

- 段落一般传 `children: [new TextRun(...)]` 或 `text`。
- `Packer.toBlob(doc)` 生成 Blob → 浏览器用 `URL.createObjectURL` + `<a download>` 触发下载（项目已用 `file-saver` 或原生方式均可）。
- `document.sections[0].properties.page` 设页面：`{ size: { width: 11906, height: 16838, orientation: Portrait } }`（A4 用 twips；11906×16838 是 A4@1440dpi 的标准值）。

### 4.4 Word 导出定位（按要求）

- **不追求像素级复刻花模板**；输出干净、国内招聘方习惯的纵向结构：姓名/电话/邮箱/求职意向 → 教育经历 → 工作/项目经历（倒序）→ 技能标签 → 自我评价。
- 用 `HeadingLevel` 体现章节结构（Word 目录/导航可用）。
- 证件照：`ImageRun` 放姓名行右侧（tab 分隔或两列段），或者直接放第一行居中（矩形，不裁圆角 —— Word 中圆形头像需要 `floating` 加图片裁剪，复杂度高；普通矩形证件照在国内简历中完全可接受，按任务要求用「矩形证件照」）。
- 正文中文 10.5pt（size: 21）≈ 五号；小节标题加粗 + 主题色 hex（`themeConfig.colors.primary.replace('#','')`）；时间范围用 `spacing` 或右侧 tab stop（项目已有 `TabStopPosition`/`TabStopType` import）。

---

## 5. 主路径方案

### 5.1 ✅ 主路径（推荐）：Electron Chromium 打印 PDF（文字可选中）

优先实现。在 Electron 主进程中用 `webContents.printToPDF()`，渲染进程通过 IPC 传递当前 `ResumeData`（或直接把打印节点对应的 HTML 加载进隐藏 BrowserWindow）。

**关键决策点：**

1. **用隐藏/独立 BrowserWindow 加载打印内容**，而不是打印编辑器 UI —— 编辑器左栏（表单、按钮）不能出现在 PDF 里。
   - 方案 A（推荐）：主进程创建一个子 `BrowserWindow`，`loadURL` 到一个「仅渲染 ResumeRenderer 的打印页」（可用 `?mode=print&resume=...` 查询参数，或 IPC 传入 `resumeData`）。
   - 方案 B：直接在现有窗口打印 `printRef.current` —— 需配合 `@media print` 隐藏编辑器 UI（见 2.3 的注意事项），且不能单独控制尺寸。
2. **`@page { size: A4 }` + `preferCSSPageSize: true`**：让 CSS 决定纸张尺寸，模板像素尺寸用 mm 换算自适应。若模板是固定 px 宽（如 800px），则不设 `preferCSSPageSize`，用 `scale` 适配 + `pageSize: 'A4'` + `marginType` 不存在、只配 margins。

**全部需要 exportToPdf 的调用方**为渲染进程 → IPC → 主进程 → 返回 `Buffer` → 渲染进程（或主进程直接）写文件/弹保存对话框。

### printToPDF options JSON（可直接粘贴）

```jsonc
{
  // Electron 主进程 webContents.printToPDF(options)
  "pageSize": "A4",            // string：A0-A6/Legal/Letter/Tabloid/Ledger；或 { width, height } 单位 inches
  "printBackground": true,     // 关键：打印模板的背景色/背景图（简历模板必填 true）
  "margins": {
    "top": 0.4,                // 单位 inches（1cm ≈ 0.3937 in）
    "bottom": 0.4,
    "left": 0.4,
    "right": 0.4
  },
  "preferCSSPageSize": true,   // 模板用 @page { size: A4; margin: 0 } 时：交给 CSS 完全控制
  "scale": 1,                  // 缩放；模板固定 px 宽时可 <1
  "landscape": false,
  "displayHeaderFooter": false,  // 简历页眉页脚关闭；需要页码再开 + footerTemplate
  "pageRanges": "",            // 空 = 全部
  "generateTaggedPDF": false,  // 实验性，简历不需要
  "generateDocumentOutline": false
}
```

> 注意：`preferCSSPageSize: true` 时若模板 `@page { margin: 0 }`，则上面的 `margins` 会被 CSS margin 覆盖（以 CSS 为准，Chromium 行为）。所以**模板必须自带打印边距**（如 padding / 内边距），否则文字贴边。

### IPC 流程（渲染进程 → 主进程 → Buffer → 另存为）

```ts
// ===== 渲染进程 renderer =====
const resumeData = useResumeStore.getState().resumes[activeResumeId];
const payload: PrintPdfPayload = {
  type: 'resume',
  data: resumeData,
  filename: generateExportFilename(resumeData, 'pdf'),
  options: {  // 与上面 JSON 一致
    pageSize: 'A4', printBackground: true, preferCSSPageSize: true,
    margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 },
    scale: 1, landscape: false, displayHeaderFooter: false,
  },
};
const result = await window.electronAPI.invoke('resume:export-pdf', payload);
if (result.ok) showToast('success', 'PDF 导出成功');
```

```ts
// ===== preload.ts =====
contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
});
```

```js
// ===== 主进程 main.js =====
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('node:fs');

ipcMain.handle('resume:export-pdf', async (event, { data, filename, options }) => {
  // 1. 创建隐藏打印窗口（或复用父窗口 webContents，若打印页已是独立路由）
  const printWin = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false } });
  await printWin.loadURL('app://print-resume');          // 或 loadFile(打印html, { query: {...} })

  // 2. 把 ResumeData 注入打印页（IPC 或 query；模板函数式渲染）
  printWin.webContents.send('print:resume-data', data);
  await new Promise(r => printWin.webContents.once('ipc-message', ...));  // 渲染完成信号
  // 实际用 executeJavaScript 也可，但推荐消息握手，避免竞态

  // 3. 打印 PDF —— 直接返回 Buffer
  const buffer = await printWin.webContents.printToPDF(options);   // Promise<Buffer>
  printWin.destroy();

  // 4. 弹「另存为」对话框（主进程对话框，不是渲染进程 a 标签）
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: filename, filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  if (!canceled) await fs.promises.writeFile(filePath, buffer);
  return { ok: !canceled };
});
```

### 5.2 次优路径（浏览器 / 暂无 Electron）：改良 print + UI 诚实标注

1. **改良 `printToPdf()`**：已有实现保留，但补充：
   - 打印样式增加 `-webkit-print-color-adjust: exact; print-color-adjust: exact;`
   - `@page { size: A4; margin: 12mm }`（模板内边距与浏览器 margin 二选一，防止贴边）
   - 推荐「独立打印页 route」方案：`/print` 只渲染 `ResumeRenderer`，`window.print()` 前无编辑器 DOM。
2. **UI 诚实标注**：在导出菜单 PDF 项旁注
   「浏览器打印为系统对话框，文件名由浏览器决定（建议改 document.title），无进度条」；文案如 `PDF（浏览器打印，可另存）`。
3. **不推荐纯截图转 PDF（现状 jspdf 方案）作为主路径的原因**：
   - 图片型 PDF 文字不可选中/复制（投递 ATS 阻力大）；
   - 多页时中间可能被竖线硬切，模板行高不一致（jspdf 分页无行高感知）；
   - 每页重新编码，大模板内存峰值高。
   - **保留为 fallback**（无 Electron、用户不想用打印时可用）。

### 5.3 PNG：投递截图场景保留

- 保留 `exportToPng()` 现状（html-to-image `toPng`, `pixelRatio: 2`）。
- **候选场景**：微信/小程序投递、招聘软件附件限制为图片、预览分享图。
- 已在 file:// 页面时其坑见 §3 —— 建议 PNG 导出按钮在 `location.protocol === 'file:'` 时提示「建议通过 http(s) 或应用内导出」。

### 5.4 三格式对比表

| 格式 | 主路径 | 主要优点 | 限制 |
|---|---|---|---|
| PDF（Electron） | `webContents.printToPDF` | 文字可选中、可复制、尺寸/边距可控、可指定文件名、可加进度 | 需要 Electron 壳（本次不引入则不可用） |
| PDF（浏览器） | `window.print` + `@page` | 无需额外依赖 | 文件名不受控、无进度、分页不可预测（UI 要标注） |
| Word | docx 库程序化构建 | 招聘方可编辑、国内接受度高、雅黑适配 | 不追求像素级复刻模板样式 |
| PNG | html-to-image `toPng` | 投递截图场景、保真 | 文字不可选、多页不便、file:// 下坑多 |

---

## 6. 事实来源 URL 列表

| 事实 | URL |
|---|---|
| Electron printToPDF 选项（权威：`print-to-pdf-options.md`） | https://www.electronjs.org/docs/latest/api/structures/print-to-pdf-options |
| Electron PrintToPDFMargins（top/bottom/left/right 单位 inches） | https://www.electronjs.org/docs/latest/api/structures/print-to-pdf-margins |
| Electron printToPDF 主文档（含官方示例、preferCSSPageSize、landscape 忽略说明） | https://www.electronjs.org/docs/latest/api/web-contents#contentsprinttopdfoptions-callback |
| Electron print() 的 marginType（对照：marginType 属于 print 不属于 printToPDF） | https://www.electronjs.org/docs/latest/api/web-contents#contentsprintoptions-callback |
| Electron 官方仓库源文件 | https://raw.githubusercontent.com/electron/electron/main/docs/api/structures/print-to-pdf-options.md |
| Chromium CDP Page.printToPDF（marginTop 等 inches 单位） | https://chromedevtools.github.io/devtools-protocol/tot/Page/ |
| MDN `@page`（size/margin 描述符、page-orientation） | https://developer.mozilla.org/en-US/docs/Web/CSS/@page |
| MDN `@page/size`（Baseline 2024，A4=210×297mm，浏览器兼容） | https://developer.mozilla.org/en-US/docs/Web/CSS/@page/size |
| MDN fetch（bad scheme 会 reject，file:// 不被接受） | https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch |
| html-to-image README（fetchRequestInit/fontEmbedCSS/图片占位） | https://github.com/bubkoo/html-to-image |
| html-to-image 源码 embed-webfonts.ts（fetchCSS/fetchAsDataURL 抓字体） | https://github.com/bubkoo/html-to-image/blob/master/src/embed-webfonts.ts |
| html-to-image 源码 dataurl.ts（fetchAsDataURL 用 fetch） | https://github.com/bubkoo/html-to-image/blob/master/src/dataurl.ts |
| html-to-image 源码 util.ts（img.crossOrigin='anonymous'） | https://github.com/bubkoo/html-to-image/blob/master/src/util.ts |
| html-to-image issue #362（cssRules 拒绝访问） | https://github.com/bubkoo/html-to-image/issues/362 |
| html-to-image issue #523（按 origin 过滤样式表防 CORS） | https://github.com/bubkoo/html-to-image/issues/523 |
| html-to-image issue #301（CSS CORS） | https://github.com/bubkoo/html-to-image/issues/301 |
| html-to-image issue #479（字体错误 URL） | https://github.com/bubkoo/html-to-image/issues/479 |
| npm docx 包（latest 9.7.1，MIT，浏览器可用） | https://www.npmjs.com/package/docx |
| docx 类型定义 IFontAttributesProperties（ascii/hAnsi/eastAsia/cs） | https://unpkg.com/docx@9.7.1/dist/index.d.ts |
| docx 官方文档（ImageRun/Paragraph/HeadingLevel 用法） | https://docx.js.org/ |
| docx demo 图片示例 | https://stackblitz.com/edit/react-docx-images |
| Electron npm latest 版本 | https://registry.npmjs.org/electron/latest |

---

## 7. 落地清单（结合本项目现状）

| 项 | 现状 | 建议 |
|---|---|---|
| PDF 主路径 | `EditorLayout.tsx` `handleExportPdf` 用 html-to-image `toCanvas` + jsPDF 分页 → **图片型 PDF** | 有 Electron 时改 `webContents.printToPDF`（§5.1）；无 Electron 时保留 jsPDF fallback 但 UI 标注 |
| 打印辅助 | `export.ts` `printToPdf()` 用了 visibility 技巧 + afterprint 恢复 | 保留；新增 `print-color-adjust: exact`、`@page{size:A4;margin:12mm}`、独立打印页路由 |
| 字体内嵌 | `handleExportPdf` 里 `fontEmbedCSS: LOCAL_FONT_CSS` | 保留并扩大 LOCAL_FONT_CSS 覆盖（含所有模板用到的字体） |
| Word 导出 | `exportDocx.ts` 已实现基础版（姓名+头像右、雅黑、主题色） | 按 §4.1 把 `font` 改成 `{ ascii, hAnsi, eastAsia, cs }` 形式；`ImageRun` 补 `type` 字段（v9 要求）；确认 heading 结构 |
| PNG | `export.ts` `exportToPng()`（pixelRatio 2） | 保留；file:// 下提示 |
| 文件名 | `exportFilename.ts` `姓名_求职意向_简历.格式` | Electron 路径用 `dialog.showSaveDialog({ defaultPath: filename })` 继承 |
