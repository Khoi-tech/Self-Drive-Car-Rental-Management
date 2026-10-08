import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-2">Đã xảy ra sự cố hiển thị</h2>
              <p className="text-sm text-zinc-400">
                Hệ thống gặp lỗi không mong muốn khi tải giao diện. Vui lòng thử tải lại trang hoặc quay về trang chủ.
              </p>
              {this.state.error?.message && (
                <div className="mt-4 p-3 bg-black/60 rounded-xl border border-zinc-800 text-left font-mono text-xs text-rose-300 break-all max-h-32 overflow-y-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw size={16} />
                <span>Tải lại trang</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-5 py-2.5 bg-zinc-800 text-zinc-200 font-medium rounded-xl hover:bg-zinc-700 transition flex items-center justify-center gap-2 text-sm border border-zinc-700"
              >
                <Home size={16} />
                <span>Về trang chủ</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
