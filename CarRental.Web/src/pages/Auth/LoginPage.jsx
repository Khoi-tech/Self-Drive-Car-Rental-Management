import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/layout/Navbar';

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Vui lòng điền đầy đủ email và mật khẩu.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await login(email.trim(), password);
      if (res?.user?.role === 'STAFF' || res?.user?.role === 'MANAGER') {
        navigate(redirectUrl !== '/' ? redirectUrl : '/admin');
      } else {
        navigate(redirectUrl);
      }
    } catch (err) {
      console.error('Login error:', err);
      let msg = err.response?.data?.message || err.response?.data?.Message || err.message || 'Đăng nhập không thành công.';
      if (typeof msg === 'string' && (msg.includes('timeout') || err.code === 'ECONNABORTED')) {
        msg = 'Kết nối máy chủ bị quá thời gian chờ (Timeout). Vui lòng thử lại sau giây lát!';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col justify-between selection:bg-white/20">
      <Navbar isVisible={true} />

      <div className="flex-1 flex items-center justify-center px-4 py-32">
        <div className="max-w-md w-full">
          {/* Brand header */}
          <div className="text-center mb-8">
            <h2 className="text-xs uppercase tracking-widest text-zinc-400 font-semibold mb-2">HỆ THỐNG VELORA</h2>
            <h1 className="text-3xl font-light tracking-tight text-white">Đăng nhập tài khoản</h1>
            <p className="text-zinc-400 text-sm mt-2">Quản lý chuyến đi và trải nghiệm thuê xe tự lái cao cấp</p>
          </div>

          {/* Form Card */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl">
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/40 text-red-400 p-4 rounded-xl text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Email</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-black/50 border border-zinc-800 text-white rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Mật khẩu</label>
                  <a href="#" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Quên mật khẩu?</a>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/50 border border-zinc-800 text-white rounded-xl pl-12 pr-12 py-3.5 focus:outline-none focus:border-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all shadow-lg shadow-white/5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access Bar */}
            <div className="mt-8 pt-6 border-t border-zinc-800/80">
              <p className="text-xs text-zinc-500 mb-3 text-center uppercase tracking-wider font-medium">Tài khoản thử nghiệm nhanh (Demo)</p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('staff@velora.vn', 'Velora@2026')}
                  className="px-3 py-2 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 rounded-xl text-xs font-medium text-zinc-300 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Nhân viên (Staff)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('customer@velora.vn', 'Velora@2026')}
                  className="px-3 py-2 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 rounded-xl text-xs font-medium text-zinc-300 transition-colors flex items-center justify-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  Khách hàng (User)
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-zinc-400">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-white hover:underline font-medium">
                Đăng ký ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
