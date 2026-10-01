import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ requireAdmin = false, children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
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

  if (requireAdmin && !isAdmin) {
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

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
