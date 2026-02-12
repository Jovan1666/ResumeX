import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '@/app/components/ui/toast';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';

// 带重试的懒加载（网络故障时自动重试最多 3 次，避免白屏）
function lazyWithRetry<T extends React.ComponentType>(
  factory: () => Promise<{ default: T }>,
  retries = 3
): React.LazyExoticComponent<T> {
  return lazy(() => {
    const attempt = (remaining: number): Promise<{ default: T }> =>
      factory().catch((err) => {
        if (remaining <= 0) throw err;
        // 等待 1 秒后重试
        return new Promise<{ default: T }>((resolve) =>
          setTimeout(() => resolve(attempt(remaining - 1)), 1000)
        );
      });
    return attempt(retries);
  });
}

// 懒加载路由组件，提升首屏加载速度（含网络故障重试）
const LandingPage = lazyWithRetry(() => import('@/app/components/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const Dashboard = lazyWithRetry(() => import('@/app/components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const EditorLayout = lazyWithRetry(() => import('@/app/components/editor/EditorLayout').then(m => ({ default: m.EditorLayout })));

// 加载中组件
const LoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-500 text-sm">加载中...</p>
    </div>
  </div>
);

// 404 页面
const NotFoundPage: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <p className="text-gray-500 mb-6">页面不存在</p>
      <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
        返回首页
      </a>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <HashRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/editor" element={<EditorLayout />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </HashRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
