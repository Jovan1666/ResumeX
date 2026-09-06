import React from 'react';
import { AlertTriangle, Download, Trash2 } from 'lucide-react';
import { clearAllStoredData } from '@/app/store/storage';

interface RecoveryScreenProps {
  /** 错误信息（供展示） */
  error?: string;
  /** 需要恢复的原始状态（可能损坏） */
  rawState?: unknown;
}

/**
 * 全屏只读恢复屏：hydrate 失败时进入，禁止进入 Dashboard/Editor。
 * - 导出损坏数据：下载当前 indexDB 中的 JSON（原始 zip 或 JSON）
 * - 清空并新建：清空存储后 reload（不允许静默用李明覆盖）
 */
export const RecoveryScreen: React.FC<RecoveryScreenProps> = ({ error, rawState }) => {
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState('');

  const handleExportRaw = async () => {
    setBusy(true);
    setMsg('');
    try {
      // 把恢复时的 state（内存里的加载快照）或 idb 内容导出
      const payload = rawState ?? null;
      const blob = new Blob([JSON.stringify(payload ?? {}, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `简历数据_损坏恢复_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMsg('原始数据已导出，请妥善保存');
    } catch (e) {
      console.error('导出恢复数据失败', e);
      setMsg('导出失败，请重试');
    } finally {
      setBusy(false);
    }
  };

  const handleClearAndReset = async () => {
    setBusy(true);
    try {
      await clearAllStoredData();
      window.location.reload();
    } catch (e) {
      console.error('清空数据失败', e);
      setMsg('清空失败，请重试');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">简历数据读取失败</h1>
        <p className="text-gray-600 mb-6 leading-relaxed">
          本地保存的简历数据损坏或无法读取，已进入只读恢复模式。
          请先导出原始数据备份；如需重新开始，可清空数据后新建简历。
          {error && <span className="block mt-2 text-xs text-red-500 break-all">{error}</span>}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
          <button
            onClick={handleExportRaw}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            <Download size={18} />
            导出原始数据
          </button>
          <button
            onClick={handleClearAndReset}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 font-medium rounded-lg transition-colors"
          >
            <Trash2 size={18} />
            清空并重新开始
          </button>
        </div>

        {msg && <p className="text-sm text-gray-500">{msg}</p>}
        <p className="mt-4 text-xs text-gray-400">
          提示：照片另行存储，不会影响 JSON 备份的完整性。
        </p>
      </div>
    </div>
  );
};
