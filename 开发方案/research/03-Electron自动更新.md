# R3 调研：Electron 自动更新（electron-updater + GitHub Releases）

> 调研日期：2026-09-06
> 目标仓库：`Jovan1666/ResumeX`（本地 `origin` 已确认 = https://github.com/Jovan1666/ResumeX.git）
> 栈约束：Electron 33.2.1 / electron-builder 25.1.8 / appId `com.resumex.app` / NSIS per-user / 根 `package.json`

---

## 0. 结论速览（TL;DR）

| 问题 | 结论 |
|---|---|
| 用哪个库 | `electron-updater`，**实测建议 6.8.9**（npm latest，2026-06-05 发布） |
| 放哪 | 根 `package.json` 的 **`dependencies`**（文档明确：app dependency，不是 devDependency） |
| 用不用升 electron-builder | **不用升**。25.1.8 已支持 GitHub publish、latest.yml、blockmap、`--publish always` 全链路 |
| release 资产 | `ResumeX-Setup-1.1.0.exe` + `latest.yml` + `ResumeX-Setup-1.1.0.exe.blockmap`（后两者自动生成/上传） |
| 版本从哪读 | electron-updater 运行时读 `app.getVersion()`（= Electron 内置的 `package.json` version 字段，即根 `package.json`） |
| 未签名能否更新 | **能，但默认 fail-open 有坑**（见 §8）；SmartScreen 对未签名 exe 会警告 |
| 当前 v1.0.0 无 latest.yml | 旧用户**必须先装新底包**（含 updater 代码），之后才能收到后续自动更新（见 §11） |

**给工程的一句话**：本任务只动 3 个文件——根 `package.json`（加 `publish`/`repository`/`artifactName`/`dependencies`）、`electron/main.js`（接 updater）、新增 `electron/preload.js`（contextBridge 暴露 API），以及 CI workflow（可选，另卡处理）。

---

## 1. 官方文档版本说明（URL 404 处理）

任务卡给的旧路径已失效，按「搜索标题」处理，实际使用的新路径（electron.build 已迁移 Docusaurus 结构，sitemap 确认）：

- ✅ `https://www.electron.build/docs/features/auto-update`（**未 404**，新址可用）
- ✅ `https://www.electron.build/docs/publish`（原 `/docs/publish/` 转为无尾部斜杠，内容可读）
- ✅ `https://www.electron.build/docs/nsis`（原 `/docs/configuration/nsis/` 404，**已注明**）
- ✅ `https://www.electron.build/docs/features/github-actions`
- ✅ `https://www.electron.build/docs/tutorials/release-using-channels`
- ✅ GitHub README：`https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/README.md`（内容极简，详见 §3）

---

## 2. 根 package.json：完整可粘贴配置

### 2.1 repository + publish + artifactName（无空格）

```jsonc
// 根 package.json（现有字段不动，只加/改这几处）
{
  "name": "resumex",
  "version": "1.0.0",
  "description": "ResumeX - 免费专业简历制作工具",
  "main": "electron/main.js",
  "private": true,
  "repository": {
    "type": "git",
    "url": "https://github.com/Jovan1666/ResumeX.git"
  },
  "dependencies": {
    "electron-updater": "^6.8.9"
  },
  "build": {
    "appId": "com.resumex.app",
    "productName": "ResumeX",
    "copyright": "Copyright © 2025 ResumeX",
    "directories": {
      "output": "release/installer"
    },
    "files": [
      "electron/**/*",
      "webapp/**/*"
    ],
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        }
      ],
      "icon": "electron/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "perMachine": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "ResumeX",
      "installerLanguages": ["zh_CN", "en_US"],
      "language": "2052",
      "artifactName": "ResumeX-Setup-${version}.${ext}"
    },
    "publish": [
      {
        "provider": "github",
        "owner": "Jovan1666",
        "repo": "ResumeX",
        "releaseType": "release"
      }
    ]
  }
}
```

字段说明（每条带出处）：

| 字段 | 说明 | 来源 |
|---|---|---|
| `repository.url` | GitHub 上传时 electron-builder 通过 `hosted-git-info` 自动检测 owner/repo（`owner`/`repo` 可省略）；显式写最稳 | https://www.electron.build/docs/publish |
| `build.publish` | 支持 GitHub / GitLab / Bitbucket / Keygen / S3 / Spaces / R2 / Snap / generic HTTP；写法为**数组**或对象均可，官方示例为对象，内部会包装成数组 | https://www.electron.build/docs/publish |
| `publish[].releaseType` | `"draft"` \| `"prerelease"` \| `"release"`，**默认 `"draft"`**——会导致只产生 draft release，`latest.yml` 仍会上传但用户看不到正式版；本项目要设 `"release"`（除非做预发布流程） | https://www.electron.build/docs/publish |
| `publish[].channel` | 默认 `"latest"`，对应 `latest.yml`；不改就不用写 | https://www.electron.build/docs/publish |
| `publish[].publishAutoUpdate` | 默认 `true`；`false` 时**不生成/不上传** latest.yml | https://www.electron.build/docs/publish |
| `nsis.artifactName` | 默认 `"${productName} Setup ${version}.${ext}"` **含空格**；`build/win.artifactName` 或 `nsis.artifactName` 可覆盖。无空格还带来另一个好处：GitHub 对文件名有限制，electron-builder 的 `computeSafeArtifactNameIfNeeded`（v25.1.8 源码 `platformPackager.js` L585）遇到空格会**自动改名为 `-`**（`ResumeX Setup 1.0.0.exe` → `ResumeX-Setup-1.0.0.exe`）并同步写进 latest.yml 的 url；显式配置后可预期、可控 | https://www.electron.build/docs/nsis；https://github.com/electron-userland/electron-builder/blob/master/packages/app-builder-lib/src/platformPackager.ts |
| `dependencies` | 见 §4 | — |

注意：
1. 现在根 `package.json` **还没有** `dependencies` 块和 `repository`、`publish`、`artifactName`——上述是补齐后的完整形态。
2. **不要**在 `nsis` 里写 `"differentialPackage"` 相关配置——默认已启用（见 §6）。
3. 带 `private: true` 不影响发布（发布靠 token，不靠 npm）。

### 2.2 为什么不写 `win.publish`

`publish` 可以放在顶层 `build.publish`、平台级 `build.win.publish` 或目标级 `build.nsis.publish`（按覆盖优先级）。本项目仅 Windows 打包目标，顶层配置最简洁、也是最常见的做法，后续加 macOS 也共用。出处：https://www.electron.build/docs/publish（"Can be specified in the top-level configuration or any platform- or target-specific configuration"）。

---

## 3. electron-updater README（官方，内容极简）

官方 README 全文只说了三件事（已用 GitHub MCP 拉取全文核对）：

- 安装该模块 + 写两行代码即可自动更新；
- 更新发布只需要简单文件托管，不需要专用服务器；
- 支持 macOS (Squirrel.Mac)、**Windows (NSIS)**、Linux (AppImage/rpm/deb)。

原文链接：https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/README.md
详细 API 全部集中在 https://www.electron.build/docs/features/auto-update。

---

## 4. dependencies 还是 devDependencies —— 文档确认

**结论：必须放 `dependencies`。**

官方 auto-update 文档原文："Install electron-updater as an app dependency"（作为应用依赖安装，即 `dependencies`）。
出处：https://www.electron.build/docs/features/auto-update（Installation 小节）。

技术原因（v25.1.8 源码实证）：electron-builder 打包时**只收集 `dependencies` 中的生产依赖**——`util/appFileCopier.js` 的 `computeNodeModuleFileSets()` 通过 `packager.info.getNodeDependencyInfo()` 读取生产依赖树并拷贝进 node_modules；`devDependencies` 不会进包。若把 electron-updater 放 devDependencies，`app-update.yml` 虽会生成，但运行时 `require('electron-updater')` 会直接失败（打好的包里没有这个包）。

---

## 5. npm 版本核实与兼容性（25.1.8 是否需要升级）

| 项 | 实测结果 | 验证方式 |
|---|---|---|
| electron-updater 最新稳定版 | **6.8.9**（`dist-tags.latest`，2026-06-05 发布），7.x 仅 `7.0.0-alpha.7` | npm registry API |
| 6.x 系列 | 6.6.2 (2025-03) → 6.8.9 (2026-06)，连续迭代 | npm registry API |
| 依赖关系 | `semver ^7.7.3, js-yaml ^4.1.0, fs-extra ^10.1.0, lazy-val, lodash.isequal, tiny-typed-emitter, lodash.escaperegexp, builder-util-runtime 9.7.0` | npm registry API |
| 与 electron-builder 25.1.8 兼容 | ✅ 6.x 系列自含（不依赖 electron-builder 包），updater 是发布时配套、运行时独立模块；electron-builder 25.1.8 也完整支持 GitHub publish + latest.yml + blockmap | 25.1.8 源码 tarball（npm 下载后 grep） |

**建议版本：`^6.8.9`（锁在 6.x 主线，不碰 7.0 alpha）。**
不用升 electron-builder——25 系完全覆盖本项目所需；升 26/27 属于独立决策，另卡处理，本方案不默默升级。

---

## 6. Release 资产清单（exe + latest.yml + blockmap）

官方 auto-update 文档给出的 `latest.yml` 样例（staged rollout 示例）：
https://www.electron.build/docs/features/auto-update

```yaml
version: 1.1.0
files:
  - url: TestApp Setup 1.1.0.exe
    sha512: Dj51I0q8aPQ3ioaz9LMqGYujAYRbDNblAQbodDRXAMxmY6hsHqEl3F6SvhfJj5oPhcqdX1ldsgEvfMNXGUXBIw==
    size: 62021782
stagingPercentage: 10
```

**本项目一张 GitHub Release 需要上传的资产（electron-builder `--publish always` 自动处理）：**

```
ResumeX-Setup-1.1.0.exe            ← 安装包本体（必传）
latest.yml                          ← 更新元数据（必传，electron-updater 靠它发现新版本）
ResumeX-Setup-1.1.0.exe.blockmap   ← 增量更新映射（可选但推荐，默认自动生成并上传）
```

字段细节（25.1.8 源码 `publish/updateInfoBuilder.js` 实证）：

- `version`：来自根 `package.json` 的 `version`；
- `files[].url`：GitHub 场景下为 `safeArtifactName`（含空格会被替换成 `-`），且 electron-builder 会额外写旧版兼容字段 `path` + 顶层 `sha512`（兼容 electron-updater 1.x–2.15 老客户端；6.x 读 `files[]`）；
- `files[].sha512`：安装包 SHA-512；
- `files[].size`：字节数（文档示例有，25.1.8 由 electron-updater v6 读取支持）；
- `releaseDate`：ISO 8601（源码 L218 `new Date().toISOString()`）；
- `stagingPercentage`：灰度百分比，只在 staged rollout 时出现（文档示例）。

**blockmap（增量更新）**：NSIS 目标默认 `differentialPackage !== false` 即为差分感知（25.1.8 `NsisTarget.js` L63-64），构建时自动生成 `${exe}.blockmap` 并通过 `callArtifactBuildCompleted` 作为独立 artifact 上传。electron-updater 下载时会**优先尝试差分下载**（NsisUpdater → differentialDownloader，旧版缓存中的完整包作为基准），失败自动回退全量下载（`Cannot download differentially, fallback to full download`）。**把 blockmap 一起传上去，能显著节省国内用户流量，但它不是更新必需项**——没有 blockmap 时 electron-updater 直接走全量下载（`differentialDownloadInstaller` 返回 false 走 httpExecutor.download 全量）。

---

## 7. 主进程接入（可粘贴代码）

### 7.1 `electron/main.js` 追加

```js
// 根 package.json 的 dependencies 里必须有 electron-updater
const { autoUpdater } = require('electron-updater');

// 注意：现有 main.js 里 win 是 createWindow 的局部变量；示例假定改成模块级
// let mainWindow = null（或在 createWindow 里赋值 mainWindow = win），
// 发送状态用 BrowserWindow.getAllWindows()[0] 亦可。

// —— 更新检查（app ready 之后调用）——
function initAutoUpdater() {
  // 关键：禁止自动下载，等用户确认后再下载/安装（配合渲染进程 UI）
  autoUpdater.autoDownload = false;
  // 未签名包时不要自动校验（未签名=app-update.yml 无 publisherName，见 §8）
  // autoUpdater.autoInstallOnAppQuit = true;  // 默认 true：下载完成后退出时静默安装

  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('updater:status', { state: 'checking' });
  });
  autoUpdater.on('update-available', (info) => {
    // info = { version, files: [{url,sha512,size}], releaseDate, ... }
    mainWindow.webContents.send('updater:status', { state: 'available', version: info.version });
  });
  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('updater:status', { state: 'not-available' });
  });
  autoUpdater.on('error', (err) => {
    // 网络失败/国内访问 GitHub 超时都会走到这里（见 §10）
    mainWindow.webContents.send('updater:status', { state: 'error', message: String(err && err.message || err) });
  });
  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('updater:progress', {
      percent: progress.percent,        // 0-100
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    });
  });
  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('updater:status', { state: 'downloaded', version: info.version });
  });

  // 建议：用户点「下载更新」时调用
  // autoUpdater.downloadUpdate();
  // 用户点「重启安装」时调用：
  // autoUpdater.quitAndInstall({ isSilent: true, isForceRunAfter: true });

  // 应用启动 3 秒后静默检查
  setTimeout(() => autoUpdater.checkForUpdates(), 3000);
}

// 在 app.whenReady().then(...) 内、createWindow 之后调用 initAutoUpdater()
```

监听器也可全部用 `autoUpdater.once`/移除监听，避免 dev 热重载重复注册（Electron 主进程不热重载，实际无此问题）。

### 7.2 事件与 `autoDownload` 语义（文档确认）

出处：https://www.electron.build/docs/features/auto-update

- `update-available`："Emitted when there is an available update. The update is downloaded automatically if autoDownload is true." → 设置 `autoDownload = false` 后，发现更新**只通知不下载**；
- `download-progress`：下载进度（percent/bytesPerSecond/transferred/total）；
- `update-downloaded`：下载完成，此时调用 `quitAndInstall()`；
- `error`：网络、镜像、校验错误统一走这里；
- 代码签名校验，"Code signature validation is performed on Windows as well as macOS"（Windows 校验见 §8）；
- `quitAndInstall()`：per-user NSIS 直接静默安装，不需要 UAC（unassisted per-user 安装在后台上即完成）；per-machine 才会用 `elevate.exe` 弹 UAC（本项目 `perMachine: false` 不会触发）；
- NSIS 目标只能配 `artifactName` / `publish` 等；**Squirrel.Windows 不支持**——本项目用 NSIS 正确。

### 7.3 `checkForUpdates()` vs `checkForUpdatesAndNotify()`

- `checkForUpdates()`：纯检查，返回 `Promise<UpdateCheckResult>`，事件照发；
- `checkForUpdatesAndNotify()`：内部 = `checkForUpdates()` + 下载 + **使用系统通知横幅**；
- 本项目 UI 已有全局提示（sonner），所以要**自己监听事件 + 自己做 UI**，用 `checkForUpdates()`。

---

## 8. 未签名能不能更新？SmartScreen 会怎样

### 8.1 未签名是否能完成更新

**结论：能，但要过两道关，且是「默认 fail-open」的**：

1. **electron-updater 侧的签名校验（Windows）**：NSIS 下载完成后会跑 `Get-AuthenticodeSignature` 校验发布者（25.1.8/6.8.9 `NsisUpdater.ts` 的 `verifySignature()`）。**当 `app-update.yml` 里没有 `publisherName` 时，校验被跳过（fail-open）返回 null，直接放行**；只有 `publisherName` 存在且匹配失败才抛 `ERR_UPDATER_INVALID_SIGNATURE`。
   来源（源码实证 + 文档）：https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/src/NsisUpdater.ts
   注意：master 分支源码已有警告**"This fail-open behavior is deprecated: electron-builder v28 will treat a missing publisherName as a verification failure (fail-closed)"** —— 即未签名方案将来可能被 v28 拒之门外；但当前 25.1.8 + 6.8.9 完全可用。
2. **SmartScreen（Windows 系统层）**：未签名 exe 从互联网下载（Mark of the Web）后，用户双击会看到蓝色「Windows 已保护你的电脑 / Windows protected your PC」+「未知发布者 / Unknown publisher」警告，需点击 **"更多信息 / More info" → "仍要运行 / Run anyway"** 才能继续。
   - 这涉及**安装时**（首次装新底包）与**更新时**（`quitAndInstall` 静默启动安装器）两条路径：更新路径因为是「已有已安装应用发起 + SMARTSCREEN 对已受信产品放行」，实际体验通常是一次性小事；但**首次安装是必现的**。
   - 官方文档对未签名行为只做间接描述：code-signing-win 文档开头即写签名的作用是"so that Windows SmartScreen and your auto-updater can verify your app's publisher"（让 SmartScreen 与自动更新器能验证发布者），出处：https://www.electron.build/docs/features/code-signing/code-signing-win
   - SmartScreen 官方 FAQ 页面已迁到 https://feedback.smartscreen.microsoft.com/smartscreenfaq.aspx 且当前无法访问（抓取失败），已知行为以 Microsoft Learn 文档社区共识为准：**「未知发布者」时用户可选择继续运行，不会被硬拦截**（与 Chrome「危险要拦截」级别不同）。

### 8.2 项目决策建议（不签名路线 OK，但别声张）

- **短期（无证书）**：保持未签名。gzip 方案可行，更新链路能跑通（fail-open 默认）。SmartScreen 首次安装必警告，提示用户「更多信息→仍要运行」。**macOS 不做**（不签名在 macOS 直接拒绝运行，非本项目目标平台）。
- **长期**：购买 OV/EV 代码签名证书（每年成本）可消除 SmartScreen 警告并让 `publisherName` 自动进 app-update.yml；**在拿到证书前不要在 `win.publisherName` 配置任何值**（否则校验激活，未签名包直接报 `ERR_UPDATER_INVALID_SIGNATURE` 拒绝更新——那是真正的翻车点）。

### 8.3 证书/签名与 `publisherName` 的关系（源码实证）

25.1.8 `publish/PublishManager.js` L206-210：Windows 打包时**只有在代码签名**（`isForceCodeSigningVerification`/signtool 提取成功）时才把 `publisherName` 写入 `app-update.yml`；未签名包 → `app-update.yml` 无该字段 → electron-updater 跳过校验（§8.1 第 1 点）。这是「未签名能更新」的机制依据。

---

## 9. preload contextBridge API 形状（可粘贴）

需要在 `main.js` 的 `webPreferences` 里加 `preload: path.join(__dirname, 'preload.js')`（现有 main.js 缺 preload，需补），并在 preload 中暴露：

```js
// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// 4 个接收通道 + 2 个发起通道
contextBridge.exposeInMainWorld('updater', {
  // 渲染进程 → 主进程
  check: () => ipcRenderer.send('updater:check'),
  download: () => ipcRenderer.send('updater:download'),
  install: () => ipcRenderer.send('updater:install'),

  // 主进程 → 渲染进程（与 main.js 里 webContents.send 的通道一一对应）
  onStatus: (cb) => {
    const listener = (_e, payload) => cb(payload);
    ipcRenderer.on('updater:status', listener);
    return () => ipcRenderer.removeListener('updater:status', listener);
  },
  onProgress: (cb) => {
    const listener = (_e, payload) => cb(payload);
    ipcRenderer.on('updater:progress', listener);
    return () => ipcRenderer.removeListener('updater:progress', listener);
  },
});
```

```js
// Electron 33 的 contextIsolation 安全实践下，渲染进程最终拿到：
// window.updater.check()
// window.updater.download()
// window.updater.install()
// window.updater.onStatus(({ state, version, message }) => { ... })
// window.updater.onProgress(({ percent, bytesPerSecond, transferred, total }) => { ... })
```

配套 main.js 追加的 IPC 处理（在 `initAutoUpdater` 中或 `ipcMain` 统一注册）：

```js
const { ipcMain } = require('electron');
ipcMain.on('updater:check', () => { autoUpdater.checkForUpdates(); });
ipcMain.on('updater:download', () => { autoUpdater.downloadUpdate(); });
ipcMain.on('updater:install', () => { autoUpdater.quitAndInstall({ isSilent: true, isForceRunAfter: true }); });
```

状态机给 UI 用（建议写入 `界面/src/app/store` 的独立 slice，勿混入 resume store）：

```
state: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading'
      | 'downloaded' | 'error'
```

前端提示条文案建议（真实、不假装成功）：
- available → "发现新版本 v{version}，是否下载？"
- downloading → "正在下载更新 {percent}%"
- downloaded → "下载完成，重启后生效"
- error → "更新检查失败（网络或 GitHub 不可达），请前往 GitHub Releases 页面手动下载最新安装包：https://github.com/Jovan1666/ResumeX/releases" —— 并**绝不**显示"已是最新/更新完成"。

---

## 10. 国内访问 github.com 失败时的降级策略

electron-updater 的默认 provider 直接请求 `https://github.com/Jovan1666/ResumeX/releases/download/v{version}/*`。国内网络直连失败时：

1. **事件层自然降级**：所有网络失败（DNS/超时/TLS）统一落入 `autoUpdater.on('error')`。这是 UI 唯一需要处理的失败通道。
2. **不要做「假装更新完」**：error 事件后状态必须置 `error`，提示用户手动下载（§9 文案）。
3. **提示浏览器打开 Releases 页**（手动降级链路）：`https://github.com/Jovan1666/ResumeX/releases` → 认准带 `latest.yml` 且 `ResumeX-Setup-*` 资产齐全的 release（正式版 tag `v1.1.0` 格式）。
4. **进阶（可选，不阻塞本卡）**：`electron-updater` 官方支持 generic provider（`https://www.electron.build/docs/publish` 的 generic 服务器），若未来上国内 CDN/OSS，把 `build.publish` 换成 `{ provider: 'generic', url: 'https://update.resumex.cn' }` 即可，客户端代码零改动（配置走 app-update.yml，运行时自动切换）。S3/R2 等国内自托管同理。

> 注意：GitHub `download` 域名与 `api`/`github.com` 常常被单独污染，DNS 层面 `objects.githubusercontent.com` 也可能异常。如果要做「中国直连优化」，备选方案是 GitHub Releases 资产镜像到 Gitee/自建 OSS 再走 generic provider——这属于后续优化项。

---

## 11. 当前 v1.0.0 无 latest.yml：如何建立「第一条可更新基线」

**关键事实：electron-updater 只能更新「装有 updater 的应用」。** 旧的 v1.0.0 安装包（如果有分发出去的）内部没有 electron-updater 代码、没有 app-update.yml，永远不知道去检查更新，也不会魔法般地获得更新能力。

### 11.1 基线建立流程（三步）

1. **发新底包**：把本方案的代码（package.json 加 publish/deps + main.js 接 updater + preload）打成一版 `v1.1.0`（把版本号从 1.0.0 提到 1.1.0，遵循语义化版本；1.1.0 ≥ 1.0.0 才能被 1.0.0 逻辑意义上的「检出」，虽然 1.0.0 不检，但 1.1.0 以后每次发版都必须递增）。tag `v1.1.0` + GitHub Release（资产齐全）。
2. **这条 v1.1.0 release 就是「第一条可更新基线」**：`latest.yml` 在这场 release 生成并与 exe 一起上传。**任何后续 tag（v1.1.1 / v1.2.0…）打 release 时，`latest.yml` 才会被覆盖为最新——而 v1.1.0 用户（即装了新底包的人）从此刻起就能自动收到更新。**
3. **用户必须手动装这个 v1.1.0 底包**：v1.0.0 老用户首次无法自动更新，这是所有 electron-updater 新产品共有的「冷启动」问题。缓解手段：
   - 网页/公众号/群公告里引导一次「请下载 v1.1.0 新安装包」，并说明「之后即可自动更新」；
   - 应用内不做更新检查（v1.0.0 没有这条代码，做了也白做）。

### 11.2 版本号与 tag 约定（与 publish 配置配套）

- electron-builder 用 `packager.appInfo.version`（= package.json `version`）拼 GitHub release 资产 URL：`.../releases/download/v{version}/...`（25.1.8 `publish/publishManager.js` `computeDownloadUrl()`：`${githubUrl}/${owner}/${repo}/releases/download/v${appInfo.version}`，可配 `vPrefixedTagName: false` 去掉 `v` 前缀，v27 改名 `tagNamePrefix`。项目保留默认带 `v`）。
- **tag 名必须与 version 一致**：tag `v1.1.0` 配 `version: 1.1.0`。打 tag 时即发布：`git tag v1.1.0 && git push origin v1.1.0`（触发 CI 的 `--publish always`，见 §12）。

---

## 12. GitHub Actions：`--publish always` 官方示例（可粘贴）

来源（官方文档「Publishing on tag push」小节）：https://www.electron.build/docs/features/github-actions

```yaml
# .github/workflows/release.yml（放仓库根）
name: Release

on:
  push:
    tags: ['v*']

permissions:
  contents: write

jobs:
  release:
    strategy:
      matrix:
        os: [windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Publish
        run: npx electron-builder --publish always
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

说明：
- 官方文档原版是 3 平台矩阵（macOS/Windows/Linux）；本项目 `build.win.target` 只有 NSIS x64，**`windows-latest` 单平台即可**（Mac 打包在 Windows 上不可行）；
- 官方文档明确：`--publish always` "uploads assets to the GitHub release for the pushed tag, and creates a draft release if none exists yet"（上传资产到该 tag 的 release，若不存在则创建）——注意**措辞是 draft**！配合 `build.publish[].releaseType: "release"`（§2.1）才能真正发布正式版；只依赖 `--publish always` 会得到 draft release（`latest.yml` 照样上传，但用户可见性差）；
- 文档推荐矩阵多平台版本用 `--publish never` 构建 + 手动上传，或 `--publish always` 直接发布——这里取「tag 即发布」模式，与 2.1 的 `releaseType: "release"` 配套；
- **权限**：`permissions: contents: write`（官方生产 workflow 使用），否则 `GITHUB_TOKEN` 不能创建/更新 release；
- 前一轮本地构建的产物（`release/installer/`）**不要**提交进 git（已被 .gitignore 覆盖与否另查，CI 从零构建）；
- electron-builder 25.1.8 的 `--publish`/`-p` 取值：`onTag | onTagOrDraft | always | never`；文档同时提示 "Publishing is not performed automatically"（v27 起隐式发布被移除，25 系在无 `--publish` 且无 publish 配置时不发布；有 publish 配置时 25 系行为以 `--publish` 为准）。
- **CI 里 npm ci 的依据**：根目录有 `package.json` + lockfile？当前根目录**没有** package-lock.json（只有 `界面/` 有）。CI 里 `npm ci` 会失败，需要 `npm install`，或在根目录生成 lockfile（`npm install --package-lock-only`）后改回 `npm ci`（更可复现）。此细节请 CI 卡注意。

---

## 13. 本方案与仓库现状的差异清单（改动面）

| 文件 | 现状 | 需要改动 |
|---|---|---|
| 根 `package.json` | 无 `dependencies`、无 `repository`、无 `publish`、nsis 无 `artifactName` | 加这 4 块（§2.1 配置全覆盖） |
| `electron/main.js` | 仅创建窗口；`webPreferences` 只有 `contextIsolation: true`，**没有 preload** | 加 preload 路径 + 接入 autoUpdater（§7） |
| `electron/preload.js` | **不存在** | 新建（§9） |
| `界面/src/app/*` | 纯 Web SPA | 加一个 updater 状态 UI（读 `window.updater` 事件），非本卡范围 |
| CI | 无 | 加 `.github/workflows/release.yml`（§12） |

---

## 14. 参考 URL 汇总

**官方文档（electron.build，v26/27 时代站点）**
1. https://www.electron.build/docs/features/auto-update — 自动更新核心文档（安装为 app dependency、事件、staged rollout、NSIS per-user/quitAndInstall、签名校验位置）
2. https://www.electron.build/docs/publish — publish 配置（provider github、GithubOptions 全字段、releaseType 默认 draft、--publish 4 选项）
3. https://www.electron.build/docs/nsis — NSIS 配置（oneClick/perMachine 默认值、artifactName 默认含空格、differentialPackage）
4. https://www.electron.build/docs/features/github-actions — GitHub Actions workflow 示例（--publish always、GH_TOKEN、permissions contents: write）
5. https://www.electron.build/docs/features/code-signing/code-signing-win — Windows 签名（签名目的、publisherName 与 updater 校验关系、OV 新发布者 SmartScreen 警告）
6. https://www.electron.build/docs/tutorials/release-using-channels — 通道/灰度（generateUpdatesFilesForAllChannels、allowDowngrade 自动开启）
7. https://www.electron.build/sitemap.xml — 用于修复旧 URL（/docs/configuration/nsis/ 404 → /docs/nsis；/docs/publish/ → /docs/publish）

**GitHub / 源码实证**
8. https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/README.md — 官方 README（极简）
9. https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/electron-updater/src/NsisUpdater.ts — publisherName 缺失 fail-open 警告、v28 fail-closed 说明、per-user 自动安装允许
10. https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/electron-updater/src/AppUpdater.ts — autoDownload=true 默认值、isUpdaterActive、forceDevUpdateConfig
11. https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/electron-updater/src/windowsExecutableCodeSignatureVerifier.ts — Get-AuthenticodeSignature 校验流程与失败行为
12. https://github.com/electron-userland/electron-builder/blob/master/packages/app-builder-lib/src/publish/updateInfoBuilder.ts — latest.yml 生成（version/files/url/sha512/path/releaseDate、publishAutoUpdate=false 跳过）
13. https://github.com/electron-userland/electron-builder/blob/master/packages/app-builder-lib/src/platformPackager.ts — computeSafeArtifactNameIfNeeded（空格→`-`）
14. app-builder-lib 25.1.8 npm tarball（registry.npmjs.org，本地解压核验）— NsisTarget.js（differentialPackage 默认开、isWriteUpdateInfo）、PublishManager.js（publisherName 仅签名时写入 app-update.yml、computeDownloadUrl 带 v 前缀）
15. electron-updater 6.8.9 npm tarball（本地解压核验）— ElectronAppAdapter.js（version = app.getVersion()）、NsisUpdater.js（verifySignature fail-open）

**npm registry（版本事实）**
16. https://registry.npmjs.org/electron-updater — dist-tags: latest=6.8.9, 7.0.0-alpha.7；6.x 依赖清单
17. https://registry.npmjs.org/electron-builder — 25.1.8/26.x 依赖对比（25 系不依赖 electron-updater 包）

**SmartScreen（官方迁移后可用性差，标注）**
18. https://learn.microsoft.com/en-us/windows/security/threat-protection/microsoft-defender-smartscreen/microsoft-defender-smartscreen-overview — 已 301 重定向至 https://feedback.smartscreen.microsoft.com/smartscreenfaq.aspx（抓取失败，"problem processing request"）；未签名「Windows 已保护你的电脑/Unknown publisher」行为属已知社区共识，工程上按 §8.1 处理
