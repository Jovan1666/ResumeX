import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '@/app/components/ui/toast';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';

// 懒加载路由组件，提升首屏加载速度
const LandingPage = lazy(() => import('@/app/components/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const Dashboard = lazy(() => import('@/app/components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const EditorLayout = lazy(() => import('@/app/components/editor/EditorLayout').then(m => ({ default: m.EditorLayout })));

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
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/editor" element={<EditorLayout />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
