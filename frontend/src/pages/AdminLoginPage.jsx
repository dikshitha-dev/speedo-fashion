import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function AdminLoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.adminLogin(username.trim(), password);

      if (res && res.success) {
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      } else {
        setErrorMessage(res.message || 'Invalid username or password.');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setErrorMessage('Authentication service unavailable. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col justify-between relative overflow-hidden font-sans select-none">
      
      {/* Background Subtle Geometric Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(#E53935_1px,transparent_1px)] [background-size:28px_28px]"></div>
      </div>

      {/* Top Header */}
      <header className="relative z-10 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black border border-white/20 shadow-sm overflow-hidden flex items-center justify-center p-1">
            <img 
              src="/logo.jpg" 
              alt="Speedo Fashions Logo" 
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-display font-black text-xl tracking-tighter text-white">SPEEDO</span>
              <span className="text-[#E53935] font-black text-xl tracking-tighter">FASHIONS</span>
            </div>
            <p className="text-[9px] uppercase tracking-widest text-gray-400 font-mono mt-0.5">
              Secure Administration Gateway
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
          <ShieldCheck className="w-4 h-4 text-[#E53935]" />
          <span>RESTRICTED ACCESS</span>
        </div>
      </header>

      {/* Center Login Card */}
      <main className="relative z-10 max-w-md w-full mx-auto px-4 py-8">
        <div className="bg-[#141414] border-2 border-white/10 shadow-2xl p-8 sm:p-10 relative rounded-sm">
          
          {/* Top Red Accent Stripe */}
          <div className="absolute -top-[2px] left-0 right-0 h-[3px] bg-gradient-to-r from-[#E53935] via-[#FF6B6B] to-[#E53935]"></div>

          {/* Heading */}
          <div className="mb-8 pt-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E53935] block mb-1">
              AUTHORIZED PERSONNEL ONLY
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white uppercase">
              SPEEDO FASHIONS – ADMIN PORTAL
            </h1>
            <p className="text-xs text-gray-400 font-sans mt-1.5 leading-relaxed">
              Enter your administrator credentials to access the store management console.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-3.5 bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-mono flex items-center gap-2.5 rounded">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            
            {/* Username Field */}
            <div>
              <label 
                htmlFor="adminUsername"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-300 mb-1.5"
              >
                Username *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="adminUsername"
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-10 pr-4 py-3 text-sm bg-[#1E1E1E] text-white border border-white/10 focus:outline-none focus:border-[#E53935] font-sans rounded transition-colors"
                />
              </div>
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div>
              <label 
                htmlFor="adminPassword"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-300 mb-1.5"
              >
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="adminPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 text-sm bg-[#1E1E1E] text-white border border-white/10 focus:outline-none focus:border-[#E53935] font-mono tracking-wider rounded transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !username.trim() || !password}
                className="w-full py-4 bg-[#E53935] hover:bg-[#D32F2F] text-white font-bold text-xs uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-950/60"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 px-6 py-4 text-center text-xs font-mono text-gray-500">
        SPEEDO FASHIONS • SECURE SERVER-AUTHENTICATED ADMIN CONSOLE
      </footer>

    </div>
  );
}

