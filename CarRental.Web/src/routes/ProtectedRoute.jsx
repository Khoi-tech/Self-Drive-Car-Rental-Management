import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ requireAdmin = false, allowedRoles = null, children }) => {
  const { isAuthenticated, isBackoffice, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requireAdmin && !isBackoffice) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">403 - Quyền truy cập bị từ chối</h1>
        <p className="text-zinc-400 mb-8 max-w-md">
          Tài khoản của bạn không có quyền truy cập vào trang Quản trị. Vui lòng đăng nhập với tài khoản Nhân viên (Staff) hoặc Quản lý (Manager).
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors"
        >
          Trở về Trang chủ
        </button>
      </div>
    );
  }

  // Chặn truy cập theo ma trận phân quyền 3 role
  if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-base font-extrabold text-slate-900 mb-1">403 - Giới hạn quyền truy cập</h2>
        <p className="text-xs text-slate-500 max-w-md mb-4 leading-relaxed">
          Chức năng này yêu cầu vai trò <strong>{allowedRoles.join(' hoặc ')}</strong>. Tài khoản hiện tại của bạn có quyền <strong>{role || 'STAFF'}</strong>.
        </p>
        <button
          onClick={() => window.location.href = '/admin'}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 transition"
        >
          Quay lại Bảng điều khiển
        </button>
      </div>
    );
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
