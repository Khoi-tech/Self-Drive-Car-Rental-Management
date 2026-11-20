import React, { useState } from 'react';
import { KeyRound, CheckCircle2, X, AlertCircle } from 'lucide-react';
import authService from '../../../services/authService';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    try {
      setLoading(true);
      await authService.changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Change password failed:', err);
      const msg = err.response?.data?.message || err.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-blue-900" />
            <h3 className="font-bold text-sm text-slate-900">Thay đổi mật khẩu đăng nhập</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-sm text-slate-900">Đổi mật khẩu thành công!</h4>
            <p className="text-xs text-slate-500">Mật khẩu mới của bạn đã có hiệu lực trên toàn bộ hệ thống VELORA.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Mật khẩu hiện tại</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:border-blue-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Mật khẩu mới</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:border-blue-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:border-blue-900"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-slate-900 hover:bg-blue-900 text-white rounded-lg font-bold"
              >
                {loading ? 'Đang cập nhật...' : 'Lưu mật khẩu'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default ChangePasswordModal;
