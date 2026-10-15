import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/layout/Navbar';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập Họ và tên.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Vui lòng nhập Email.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim() || null,
        password: formData.password
      });
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      let msg = err.response?.data?.message || err.response?.data?.Message || err.message || 'Đăng ký không thành công.';
      if (typeof msg === 'string' && (msg.includes('timeout') || err.code === 'ECONNABORTED')) {
        msg = 'Kết nối máy chủ bị quá thời gian chờ (Timeout). Vui lòng thử lại sau giây lát!';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-950 flex flex-col font-sans">
      <Navbar isVisible={true} />

      <div className="flex-1 flex items-center justify-center px-4 py-28">
        <div className="max-w-md w-full">
          
          <div className="text-center mb-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-blue-900 block mb-1">
              GIA NHẬP HỆ THỐNG VELORA
            </span>
            <h1 className="text-2xl font-extrabold text-zinc-950 tracking-tight">
              Tạo tài khoản mới
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Trở thành khách hàng để đặt xe nhanh và lưu lịch sử chuyến đi
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm">
            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Họ và tên đầy đủ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="NGUYEN VAN A"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-2 text-xs font-semibold text-zinc-950 uppercase focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Địa chỉ Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-2 text-xs font-semibold text-zinc-950 focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Số điện thoại di động
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="0901234567"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-2 text-xs font-semibold text-zinc-950 tabular-nums focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Tối thiểu 6 ký tự"
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

              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Xác nhận lại mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Nhập lại mật khẩu"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-2 text-xs font-semibold text-zinc-950 focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-blue-900 disabled:bg-slate-400 text-white font-bold text-xs py-2.5 px-4 rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer mt-2"
              >
                {loading ? (
                  <span>Đang đăng ký tài khoản...</span>
                ) : (
                  <>
                    <span>Đăng ký thành viên</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-500">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-bold text-blue-900 hover:underline">
                Đăng nhập tại đây
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
