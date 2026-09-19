import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Download, Rocket, AlertCircle, ExternalLink } from 'lucide-react';
import type { UpdateEventData } from '@/app/types/electron';
import { useResumeStore } from '@/app/store/useResumeStore';
import { useToast } from '@/app/components/ui/toast';
import { flushAllInputs } from './DebouncedInput';

/**
 * 更新条：桌面端显示「检查更新 / 发现新版本 / 下载进度 / 立即更新」。
 * 浏览器（无 window.resumex）不渲染。
 * 状态机：idle / checking / available / downloading / ready / error / none。
 *
 * 「稍后」= 收起这条横幅（snoozed），不再常驻顶栏占位；下次检查更新会重新出现。
 * 「重启并安装」= 二次确认 + 先 flush 输入与落盘，避免重启把正在写的简历吞掉。
 */
export const UpdateBar: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [version, setVersion] = useState('');
  const [percent, setPercent] = useState(0);
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error' | 'none'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [desktop, setDesktop] = useState<boolean>(false);
  const [snoozed, setSnoozed] = useState(false);
  const [confirmInstall, setConfirmInstall] = useState(false);
  const [installing, setInstalling] = useState(false);

  const flushSave = useResumeStore(state => state.flushSave);
  const { showToast } = useToast();
  const desktopApi = window.resumex;

  useEffect(() => {
    setDesktop(!!desktopApi);
    if (!desktopApi) return;
    // 订阅更新事件
    const off = desktopApi.onUpdate((e: UpdateEventData) => {
      setSnoozed(false);
      if (e.type === 'available') {
        const d = e.data as { version?: string } | undefined;
        setVersion(d?.version || '');
        setStatus('available');
      } else if (e.type === 'none') {
        setStatus('none');
      } else if (e.type === 'progress') {
        const d = e.data as { percent?: number } | undefined;
        setStatus('downloading');
        setPercent(Math.round(d?.percent || 0));
      } else if (e.type === 'ready') {
        const d = e.data as { version?: string } | undefined;
        setStatus('ready');
        setVersion(d?.version || '');
      } else if (e.type === 'error') {
        const d = e.data as { message?: string } | undefined;
        setStatus('error');
        setErrorMsg(d?.message || '更新检查失败');
      }
    });
    return () => off();
  }, [desktopApi]);

  const handleCheck = useCallback(async () => {
    if (!desktopApi) return;
    setSnoozed(false);
    setStatus('checking');
    const r = await desktopApi.checkForUpdates();
    if (!r.ok && r.message) {
      setStatus('error');
      setErrorMsg(r.message);
    }
  }, [desktopApi]);

  const handleDownload = useCallback(async () => {
    if (!desktopApi) return;
    await desktopApi.downloadUpdate();
  }, [desktopApi]);

  const snooze = useCallback(() => {
    setSnoozed(true);
    setConfirmInstall(false);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!desktopApi || installing) return;
    setInstalling(true);
    try {
      // 重启前：把防抖中的输入写回 store，再真正落盘，失败就不要冒丢失风险
      flushAllInputs();
      const saved = await flushSave();
      if (!saved) {
        showToast('error', '简历未能保存成功，已取消重启。请先手动导出备份');
        return;
      }
      setConfirmInstall(false);
      const r = await desktopApi.quitAndInstall();
      if (!r.ok && r.message) showToast('error', r.message);
    } finally {
      setInstalling(false);
    }
  }, [desktopApi, flushSave, installing, showToast]);

  const handleOpenRelease = useCallback(() => {
    void desktopApi?.openExternal('https://github.com/Jovan1666/ResumeX/releases/latest');
  }, [desktopApi]);

  // 浏览器不显示
  if (!desktop) return null;

  // 没有更新信息 / 用户选了「稍后」→ 只留一个极小的检查更新入口，不常驻占位
  if (snoozed || status === 'idle' || status === 'none' || status === 'checking') {
    return (
      <div className={`flex items-center gap-2 text-xs ${className}`}>
        <button
          onClick={handleCheck}
          disabled={status === 'checking'}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          title={snoozed ? '更新已稍后，点这里重新查看' : '检查更新'}
        >
          <RefreshCw size={12} className={status === 'checking' ? 'animate-spin' : ''} />
          {status === 'checking' ? '检查更新...' : '检查更新'}
        </button>
      </div>
    );
  }

  // 有更新信息
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${className}`}>
      {status === 'available' && (
        <>
          <span className="text-xs font-medium text-blue-600">发现新版本 v{version || ''}</span>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
          >
            <Download size={12} /> 立即下载
          </button>
          <button
            onClick={handleOpenRelease}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-blue-600 hover:text-blue-700 text-xs"
            title="GitHub 下载页面"
          >
            <ExternalLink size={12} /> 打开下载页
          </button>
          <button onClick={snooze} className="px-2 py-1 rounded text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100">
            稍后
          </button>
        </>
      )}
      {status === 'downloading' && (
        <>
          <span className="text-xs text-gray-600">下载中 {percent}%</span>
          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${percent}%` }} />
          </div>
        </>
      )}
      {status === 'ready' && !confirmInstall && (
        <>
          <span className="text-xs font-medium text-green-600">更新已就绪（v{version}）</span>
          <button
            onClick={() => setConfirmInstall(true)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-600 hover:bg-green-500 text-white text-xs font-medium"
          >
            <Rocket size={12} /> 重启并安装
          </button>
          <button onClick={snooze} className="px-2 py-1 rounded text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100">
            稍后
          </button>
        </>
      )}
      {status === 'ready' && confirmInstall && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5">
          <AlertCircle size={14} className="text-amber-600 shrink-0" />
          <span className="text-xs text-amber-800 leading-tight">
            重启会关闭软件并开始安装（约 10 秒），正在输入的内容会先自动保存
          </span>
          <button
            onClick={handleInstall}
            disabled={installing}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white text-xs font-medium whitespace-nowrap"
          >
            <Rocket size={12} /> {installing ? '正在重启...' : '确认重启'}
          </button>
          <button onClick={() => setConfirmInstall(false)} className="px-2 py-1 rounded text-xs text-gray-600 hover:bg-amber-100 whitespace-nowrap">
            取消
          </button>
          <button onClick={snooze} className="px-2 py-1 rounded text-xs text-gray-600 hover:bg-amber-100 whitespace-nowrap">
            稍后
          </button>
        </div>
      )}
      {status === 'error' && (
        <>
          <AlertCircle size={12} className="text-red-500" />
          <span className="text-xs text-red-600">{errorMsg}</span>
          <button
            onClick={handleOpenRelease}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-blue-600 hover:text-blue-700 text-xs"
          >
            <ExternalLink size={12} /> 打开下载页
          </button>
          <button onClick={snooze} className="px-2 py-1 rounded text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100">
            稍后
          </button>
        </>
      )}
    </div>
  );
};
