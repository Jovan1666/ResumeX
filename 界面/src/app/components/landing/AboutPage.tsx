import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, FileText, Download, RefreshCw, KeyRound, FolderSync,
  HelpCircle, Github, Check,
} from 'lucide-react';
import { useToast } from '@/app/components/ui/toast';
import { useResumeStore } from '@/app/store/useResumeStore';

// 项目主页（GitHub 链接在浏览器与 Electron 里都能打开：Electron 主进程会转交系统浏览器）
const GITHUB_REPO = 'https://github.com/Jovan1666/ResumeX';
const GITHUB_RELEASES = `${GITHUB_REPO}/releases/latest`;

/** 键盘修饰键提示（Mac 上显示 ⌘） */
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const MOD = isMac ? '⌘' : 'Ctrl';

/** 怎么用：三步 */
const STEPS: { title: string; body: string }[] = [
  {
    title: '新建一份简历',
    body: `在「我的简历」页点右上角「新建简历」，立刻进入编辑器，没有引导弹窗、也不会塞示例内容。`,
  },
  {
    title: '左边填，右边看',
    body: '左侧填写个人信息和各段经历，右侧就是最终打印出来的 A4 纸。换模板、换主题色、调字号和页边距都会实时反映。',
  },
  {
    title: '导出投递',
    body: '写完点右上角「导出」，选 PDF（推荐，文字可被招聘系统读取）、Word（可继续编辑）或 PNG 图片。文件名自动用「姓名_求职意向」。',
  },
];

/** 快捷键（与编辑器实际实现一致） */
const SHORTCUTS: { keys: string; desc: string }[] = [
  { keys: `${MOD} + S`, desc: '保存到本机' },
  { keys: `${MOD} + P`, desc: '导出 PDF' },
  { keys: `${MOD} + Alt + Z`, desc: '撤销上一步（焦点不在输入框里时）' },
  { keys: `${MOD} + Shift + Z`, desc: '重做' },
  { keys: `${MOD} + Z`, desc: '焦点在输入框里时是「撤销文字」，撤销整份简历请用顶栏的撤销按钮' },
  { keys: 'Esc', desc: '关闭当前弹窗' },
];

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: '我的简历会上传到服务器吗？',
    a: (
      <>
        不会。ResumeX 不联网传任何数据，简历和照片都写在你这台电脑的本机存储里。
        反过来说这也是风险：<strong>清理浏览器数据、用隐私模式、卸载重装系统都可能把它清掉</strong>，
        请养成改完重要版本就「导出备份」的习惯。
      </>
    ),
  },
  {
    q: '怎么备份 / 换到另一台电脑？',
    a: (
      <>
        在「我的简历」页右上角点<strong>下载图标（导出备份）</strong>，会生成一个 <code className="px-1 bg-gray-100 rounded">.zip</code> 备份文件，
        里面包含全部简历文字和照片。到新电脑上打开 ResumeX，点<strong>上传图标（导入备份）</strong>选这个文件即可；
        导入前会先告诉你「会覆盖现有几份简历」，确认后才执行。
      </>
    ),
  },
  {
    q: '为什么我装的桌面版里看不到网页版做的简历？',
    a: (
      <>
        这是正常的。浏览器里打开的 ResumeX 和安装到电脑上的桌面版是两个独立环境，
        数据各存各的、互不同步（即使你在同一个电脑上也一样）。想搬过去就用上面的「导出备份 → 导入备份」。
      </>
    ),
  },
  {
    q: '导出的 PDF 招聘网站能识别吗？',
    a: (
      <>
        桌面版的「导出 PDF」生成的是文字版 PDF，可以用鼠标选中、招聘系统也能解析。
        浏览器里用「打印 → 另存为 PDF」同样是文字版；而「导出 PNG 图片」得到的是一张图，
        任何系统都读不出里面的字，只适合发给人力看或做海报。
      </>
    ),
  },
  {
    q: '简历名字怎么改？',
    a: <>在「我的简历」页，双击卡片上的名字（或点名字旁的小铅笔）就能改名，回车保存。这个名字只用于列表里区分，不会出现在打印出来的简历上。</>,
  },
  {
    q: '删掉的简历还能找回来吗？',
    a: <>不能。列表里的删除、以及「删除全部简历」都是不可撤销的操作，所以删除前会明确告诉你要删的是哪一份、共几份。真想留后路只能靠之前导出的备份文件。</>,
  },
];

/** 关于与帮助页（原落地页降级而来：不再营销，只解决真实问题） */
export const AboutPage: React.FC = () => {
  const { showToast } = useToast();
  const resumeCount = useResumeStore((s) => Object.keys(s.resumes).length);
  const [version, setVersion] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const isDesktop = typeof window !== 'undefined' && !!window.resumex;

  useEffect(() => {
    if (!isDesktop) return;
    let alive = true;
    void window.resumex?.getVersion().then((v) => { if (alive) setVersion(String(v)); });
    // 更新事件的反馈直接给到用户，避免出现「点了检查更新但什么都没发生」
    const off = window.resumex?.onUpdate((e) => {
      if (e.type === 'checking') { setChecking(true); return; }
      if (e.type === 'none') { setChecking(false); showToast('info', '已经是最新版本'); return; }
      if (e.type === 'available') { setChecking(false); showToast('info', '发现新版本，正在后台准备'); return; }
      if (e.type === 'ready') { setChecking(false); showToast('success', '新版本已就绪，重启后完成更新'); return; }
      if (e.type === 'error') { setChecking(false); showToast('error', '检查更新失败，可去官网下载最新版'); }
    });
    return () => {
      alive = false;
      off?.();
    };
  }, [isDesktop, showToast]);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-base">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center text-white">
              <FileText size={15} />
            </div>
            ResumeX
          </Link>
          <Link
            to="/"
            className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={15} /> 返回我的简历
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-14">
        {/* 怎么用 */}
        <section>
          <h2 className="text-2xl font-bold mb-1">怎么用</h2>
          <p className="text-gray-500 text-sm mb-6">
            {resumeCount > 0 ? `本机已有 ${resumeCount} 份简历。` : '本机还没有简历。'}
            整个过程就三步：
          </p>
          <ol className="space-y-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="w-7 h-7 shrink-0 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 数据存在哪 */}
        <section>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <FolderSync size={19} className="text-blue-600" /> 你的简历存在哪里
          </h2>
          <ul className="text-sm text-gray-700 space-y-2 leading-relaxed list-disc pl-5">
            <li>全部存在<strong>这台电脑本机</strong>，不注册、不登录、不上传。</li>
            <li>
              <strong>浏览器里打开的网页版</strong>和<strong>安装到电脑上的桌面版</strong>是两个独立环境，数据互不相通：在网页版做的简历，桌面版里看不到（反之亦然）。
            </li>
            <li>清理浏览器记录、切换到隐私/无痕模式、卸载重装，都可能让本机数据消失。</li>
            <li>所以：改到满意就「导出备份」（一个含照片的 .zip 文件），换电脑时「导入备份」。</li>
          </ul>
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-900 flex items-start gap-2">
            <Download size={16} className="mt-0.5 shrink-0" />
            <span>
              备份入口在「我的简历」页右上角：下载图标 = 导出备份，上传图标 = 导入备份。
            </span>
          </div>
        </section>

        {/* 快捷键 */}
        <section>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <KeyRound size={19} className="text-blue-600" /> 快捷键
          </h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {SHORTCUTS.map((s, i) => (
              <div
                key={s.keys}
                className={`flex items-center justify-between gap-4 px-4 py-2.5 text-sm ${
                  i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <kbd className="font-mono text-xs bg-gray-100 border border-gray-200 rounded px-2 py-1 shrink-0 whitespace-nowrap">
                  {s.keys}
                </kbd>
                <span className="text-gray-600 text-right">{s.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Mac 上 {MOD} 即 ⌘ 键。</p>
        </section>

        {/* 常见问题 */}
        <section>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <HelpCircle size={19} className="text-blue-600" /> 常见问题
          </h2>
          <div className="space-y-2">
            {FAQS.map((f) => (
              <details key={f.q} className="border border-gray-200 rounded-lg px-4 py-3 group">
                <summary className="font-medium text-sm cursor-pointer list-none flex items-center justify-between gap-3">
                  {f.q}
                  <span className="text-gray-300 group-open:rotate-45 transition-transform text-lg leading-none shrink-0">+</span>
                </summary>
                <div className="text-sm text-gray-600 mt-2.5 leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* 版本与许可 */}
        <section>
          <h2 className="text-xl font-bold mb-3">版本与许可</h2>
          <div className="border border-gray-200 rounded-lg p-4 text-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500">当前版本</span>
              <span className="font-medium">
                {isDesktop ? (version ? `桌面版 ${version}` : '读取中…') : '浏览器版（本机网页运行，数据留在本浏览器）'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500">开源许可</span>
              <span className="font-medium">MIT License · 免费、无水印、无次数限制</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {isDesktop && (
                <button
                  onClick={() => { setChecking(true); void window.resumex?.checkForUpdates().then((r) => {
                    if (!r?.ok) { setChecking(false); showToast('error', r?.message || '检查更新失败'); }
                  }); }}
                  disabled={checking}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
                  {checking ? '检查中…' : '检查更新'}
                </button>
              )}
              <a
                href={GITHUB_RELEASES}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
              >
                <Download size={14} /> 下载最新版本
              </a>
              <a
                href={GITHUB_REPO}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
              >
                <Github size={14} /> 项目主页 / 提问题
              </a>
            </div>
          </div>
        </section>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            <Check size={18} /> 回到我的简历
          </Link>
        </div>
      </main>
    </div>
  );
};
