import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * 错误边界组件
 * 用于捕获子组件树中的 JavaScript 错误，防止整个应用崩溃
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // 更新状态，下次渲染时显示降级 UI
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 记录错误信息
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({ errorInfo });
    
    // 调用外部错误处理函数（可用于错误上报）
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认的错误 UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              哎呀，出错了
            </h1>
            
            <p className="text-gray-600 mb-6">
              应用遇到了一个意外错误。请尝试刷新页面或返回首页。
            </p>

            {/* 错误详情（开发环境显示） */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left overflow-auto max-h-40">
                <p className="text-sm font-mono text-red-600 break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <RefreshCw size={18} />
                重试
              </button>
              
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
              >
                <Home size={18} />
                返回首页
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 带有重试功能的错误边界 HOC
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * 模块级别的轻量级错误边界
 */
interface ModuleErrorBoundaryProps {
  children: ReactNode;
  moduleName?: string;
}

interface ModuleErrorState {
  hasError: boolean;
}

export class ModuleErrorBoundary extends Component<ModuleErrorBoundaryProps, ModuleErrorState> {
  constructor(props: ModuleErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ModuleErrorState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error(`Error in module ${this.props.moduleName || 'unknown'}:`, error, errorInfo);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-sm text-red-600">
            {this.props.moduleName ? `${this.props.moduleName}模块` : '此模块'}加载失败
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
          >
            点击重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
