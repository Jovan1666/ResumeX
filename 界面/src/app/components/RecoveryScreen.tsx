import React from 'react';
import { AlertTriangle, Download, Trash2, RefreshCw } from 'lucide-react';
import { probeRescueData, exportRescueArchive, clearAllData } from '@/app/utils/backup';

interface RecoveryScreenProps {
  /** 原始错误信息（只放在「技术细节」里，不直接甩英文堆栈给用户） */
  error?: string;
}

/** 把常见的英文报错翻译成一句人话 */
function friendlyReason(error?: string): string {
  const text = String(error ?? '').toLowerCase();
  if (/quota|exceed/.test(text)) return '本机存储空间不足，放不下更多简历了。';
  if (/securityerror|denied|private|blocked/.test(text)) return '浏览器拦住了本地存储（无痕模式或隐私设置会导致这种情况）。';
  if (/json|parse|unexpected/.test(text)) return '本机保存的数据文件有内容读不出来，可能在上次写入时被中断。';
  if (!text) return '本机数据这次没能打开。';
  return '本机数据这次没能打开，可能是存储被占用或被清理。';
}

/**
 * 全屏只读恢复屏：hydrate 失败时进入，禁止进入 Dashboard/Editor。
 *
 * 关键约束（P0）：
 * - 「导出原始数据」按钮只有在**真的能从本机读到东西**时才出现；
 *   读不到就不显示，也绝不出现「原始数据已导出」这种骗人的提示。
 * - 「清空并重新开始」必须手打确认词，防止用户在没留档时一键毁掉数据。
 */
export const RecoveryScreen: React.FC<RecoveryScreenProps> = ({ error }) => {
  // null = 还没探测完；false = 本机什么都读不到（隐藏导出按钮）；true = 可以导出
  const [canExport, setCanExport] = React.useState<boolean | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const [confirmingClear, setConfirmingClear] = React.useState(false);
  const [clearWord, setClearWord] = React.useState('');

  React.useEffect(() => {
    let alive = true;
    void probeRescueData().then((ok) => { if (alive) setCanExport(ok); });
    return () => { alive = false; };
  }, []);

  const handleExportRaw = async () => {
    if (busy) return;
    setBusy(true);
    setMsg('');
    const result = await exportRescueArchive();
    setMsg(result.message);
    setBusy(false);
  };

  const handleClearAndReset = async () => {
    if (busy || clearWord.trim() !== '清空') return;
    setBusy(true);
    setMsg('');
    // 走统一的备份模块：连照片一起清掉，不留孤儿数据
    const result = await clearAllData();
    if (result.success) {
      window.location.reload();
      return;
    }
    setMsg(result.message);
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-11 h-11 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">简历数据读取失败</h1>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{friendlyReason(error)}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-5">
          你的简历<strong>仍然在这台电脑上</strong>，只是这次没能打开。建议按下面顺序处理：
          先重新载入试一次；反复失败就把原始数据导出留档，再考虑清空重来。
          <strong>清空后无法恢复。</strong>
        </p>

        <div className="space-y-2 mb-5">
          <button
            onClick={() => window.location.reload()}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            <RefreshCw size={17} /> 重新载入试试
          </button>

          {/* 读不到本机数据时不显示这个按钮：不给用户假的希望 */}
          {canExport && (
            <button
              onClick={handleExportRaw}
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-medium rounded-lg transition-colors"
            >
              <Download size={17} /> 导出本机原始数据（.zip，留档用）
            </button>
          )}

          {canExport === false && (
            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              本机暂时没有可导出的内容 —— 可能是存储被清理了，也可能浏览器把本地存储拦住了。
            </p>
          )}

          {canExport === null && (
            <p className="text-xs text-gray-400">正在检查本机是否有可导出的数据…</p>
          )}

          {!confirmingClear ? (
            canExport !== false && (
              <button
                onClick={() => setConfirmingClear(true)}
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 font-medium rounded-lg transition-colors"
              >
                <Trash2 size={15} /> 清空本机数据，重新开始
              </button>
            )
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700 font-medium mb-2">
                这一步会把本机所有简历和照片永久删除，无法恢复。
              </p>
              <label className="block text-sm text-red-700">
                确认无误后，在下面输入 <code className="px-1 bg-white rounded font-mono">清空</code> 两个字：
                <input
                  value={clearWord}
                  onChange={(e) => setClearWord(e.target.value)}
                  placeholder="输入：清空"
                  className="mt-2 w-full px-3 py-2 border border-red-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-200"
                />
              </label>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { setConfirmingClear(false); setClearWord(''); }}
                  className="flex-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  返回
                </button>
                <button
                  onClick={handleClearAndReset}
                  disabled={busy || clearWord.trim() !== '清空'}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {busy ? '清空中…' : '确认清空'}
                </button>
              </div>
            </div>
          )}
        </div>

        {msg && <p className="text-sm text-gray-600 mb-3">{msg}</p>}

        {error && (
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer select-none">查看技术细节（反馈问题时请附上）</summary>
            <pre className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded overflow-auto max-h-32 whitespace-pre-wrap break-all">
              {String(error)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};
