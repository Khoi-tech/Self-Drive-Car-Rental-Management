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
      if (res?.user?.role === 'STAFF' || res?.user?.role === 'ADMIN' || res?.user?.role === 'MANAGER') {
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
    <div className="min-h-screen bg-slate-50 text-zinc-950 flex flex-col font-sans">
      <Navbar isVisible={true} />

      <div className="flex-1 flex items-center justify-center px-4 py-28">
        <div className="max-w-md w-full">
          
          {/* Header */}
          <div className="text-center mb-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-blue-900 block mb-1">
              HỆ THỐNG QUẢN LÝ VELORA
            </span>
            <h1 className="text-2xl font-extrabold text-zinc-950 tracking-tight">
              Đăng nhập tài khoản
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Quản trị vận hành đội xe và tra cứu đơn thuê tự lái
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm">
            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@velora.vn"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-2 text-xs font-semibold text-zinc-950 focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-zinc-900">
                    Mật khẩu
                  </label>
                  <a href="#" className="text-[11px] text-slate-500 hover:text-blue-900 transition-colors">
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-10 py-2 text-xs font-semibold text-zinc-950 focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-blue-900 disabled:bg-slate-400 text-white font-bold text-xs py-2.5 px-4 rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
              >
                {loading ? (
                  <span>Đang xác thực...</span>
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access Buttons */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block text-center mb-3">
                Tài khoản kiểm thử nhanh (Demo)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('staff@velora.vn', 'Velora@2026')}
                  className="p-2 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors flex items-center gap-2"
                >
                  <ShieldCheck size={16} className="text-blue-900 shrink-0" />
                  <div className="truncate">
                    <div className="text-[11px] font-bold text-zinc-900 leading-tight">Nhân viên / Admin</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">staff@velora.vn</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('customer@velora.vn', 'Velora@2026')}
                  className="p-2 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors flex items-center gap-2"
                >
                  <User size={16} className="text-emerald-700 shrink-0" />
                  <div className="truncate">
                    <div className="text-[11px] font-bold text-zinc-900 leading-tight">Khách hàng</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">customer@velora.vn</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="mt-5 text-center text-xs text-slate-500">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-bold text-blue-900 hover:underline">
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
