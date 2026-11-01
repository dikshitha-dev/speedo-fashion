import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
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
        <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center p-4 font-sans select-none">
          <div className="max-w-md w-full bg-[#141414] border border-red-500/40 rounded-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600"></div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-950/60 border border-red-500/50 flex items-center justify-center text-red-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-white">Something Went Wrong</h2>
                <p className="text-xs text-gray-400 font-mono">Speedo Control Console</p>
              </div>
            </div>

            <div className="p-3.5 bg-black/60 border border-white/10 rounded-lg text-xs font-mono text-red-300 mb-6 overflow-x-auto leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-[#E53935] hover:bg-[#D32F2F] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-950/50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Dashboard</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/10"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Store</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

