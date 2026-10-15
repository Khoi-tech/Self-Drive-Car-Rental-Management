import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, ShieldCheck, Car, Calendar, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ isVisible = true }) => {
  const { user, isAuthenticated, isStaff, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { label: 'BỘ SƯU TẬP XE', path: '/cars' },
    { label: 'BẢNG GIÁ & QUY ĐỊNH', path: '/cars#pricing' },
    { label: 'QUY TRÌNH THUÊ XE', path: '/#experience' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex justify-between items-center">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link 
              to="/" 
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center text-white font-bold text-base tracking-tighter group-hover:bg-blue-900 transition-colors shadow-xs">
                V
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-[0.18em] text-zinc-950 group-hover:text-blue-950 transition-colors leading-none">
                  VELORA
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-semibold mt-0.5">
                  Luxury Self-Drive
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-7 text-xs font-semibold tracking-wider text-slate-600">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`transition-colors py-1 relative ${
                      isActive 
                        ? 'text-blue-900 font-bold' 
                        : 'hover:text-zinc-950'
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900 rounded-full"></span>
                    )}
                  </Link>
                );
              })}
              
              {isAuthenticated && (
                <Link 
                  to="/profile" 
                  className={`flex items-center gap-1.5 transition-colors ${
                    location.pathname === '/profile'
                      ? 'text-blue-900 font-bold'
                      : 'text-slate-700 hover:text-blue-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-700" />
                  <span>ĐƠN THUÊ CỦA TÔI</span>
                </Link>
              )}
            </nav>
          </div>

          {/* Right Area: Auth & CTA */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                {isStaff && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-md text-xs font-semibold transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                    <span>Portal Quản trị</span>
                  </Link>
                )}

                <div className="flex items-center border border-slate-200 rounded-md bg-slate-50 p-0.5">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-2.5 py-1 text-xs font-medium text-slate-800 hover:text-blue-900 transition-colors"
                    title="Trang cá nhân & Lịch sử đơn thuê"
                  >
                    <div className="w-6 h-6 rounded-md bg-blue-900 text-white flex items-center justify-center text-xs font-bold">
                      {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="max-w-[110px] truncate hidden sm:inline font-semibold">
                      {user?.fullName || 'Khách hàng'}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="Đăng xuất"
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-white transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Link
                  to="/login"
                  className="px-3 py-2 text-slate-700 hover:text-zinc-950 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 border border-slate-300 hover:border-slate-400 text-slate-800 rounded-md transition-colors hidden sm:inline-block"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Direct Booking CTA */}
            <Link
              to="/cars"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-blue-900 text-white text-xs font-bold tracking-wider uppercase rounded-md shadow-xs transition-colors"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Tìm xe ngay</span>
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
