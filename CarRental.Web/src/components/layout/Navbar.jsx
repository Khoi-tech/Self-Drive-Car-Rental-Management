import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, ShieldCheck, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ isVisible = true }) => {
  const { user, isAuthenticated, isStaff, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Brand Logo */}
          <Link to="/" className="text-white text-2xl font-light tracking-[0.2em] hover:opacity-80 transition-opacity">
            VELORA
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex space-x-8 text-sm font-medium text-gray-300">
            <Link to="/cars" className="hover:text-white transition-colors">Dòng xe</Link>
            <a href="/#experience" className="hover:text-white transition-colors">Trải nghiệm</a>
            <a href="/#services" className="hover:text-white transition-colors">Dịch vụ</a>
            <a href="/#contact" className="hover:text-white transition-colors">Liên hệ</a>
          </div>

          {/* Auth & CTA */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {isStaff && (
                  <Link
                    to="/admin"
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-200 transition-colors flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">Quản trị</span>
                  </Link>
                )}

                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-sm">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-white">
                    {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs text-zinc-300 max-w-[120px] truncate hidden sm:inline">
                    {user?.fullName}
                  </span>
                  <button
                    onClick={handleLogout}
                    title="Đăng xuất"
                    className="text-zinc-400 hover:text-red-400 ml-1 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-zinc-300 hover:text-white px-3 py-1.5 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium text-white border border-white/20 hover:border-white px-3.5 py-1.5 rounded-lg transition-colors hidden sm:inline-block"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            <Link
              to="/cars"
              className="bg-white text-black px-5 py-2 text-sm font-medium hover:bg-gray-200 transition-colors rounded-sm"
            >
              ĐẶT XE
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
