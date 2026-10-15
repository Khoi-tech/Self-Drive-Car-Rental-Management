import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  CircleDollarSign, 
  FileText, 
  ShieldAlert, 
  Files, 
  Settings,
  Menu,
  X,
  Bell,
  Search,
  UserCircle,
  ClipboardList,
  ShieldCheck,
  FileCheck,
  Clock,
  LifeBuoy,
  Wrench,
  RotateCcw,
  ExternalLink,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navGroups = [
    {
      groupTitle: 'TỔNG QUAN',
      items: [
        { name: 'Dashboard & Hiệu suất', path: '/admin', icon: <LayoutDashboard size={17} />, exact: true },
      ]
    },
    {
      groupTitle: 'VẬN HÀNH ĐƠN THUÊ',
      items: [
        { name: 'Duyệt hồ sơ & Đặt xe', path: '/admin/rental-requests', icon: <ClipboardList size={17} /> },
        { name: 'Biên bản Bàn giao', path: '/admin/handovers', icon: <FileCheck size={17} /> },
        { name: 'Biên bản Hoàn trả', path: '/admin/returns', icon: <RotateCcw size={17} /> },
        { name: 'Gia hạn thuê xe', path: '/admin/extensions', icon: <Clock size={17} /> },
        { name: 'Sự cố & Cứu hộ', path: '/admin/incidents', icon: <LifeBuoy size={17} /> },
      ]
    },
    {
      groupTitle: 'QUẢN LÝ ĐỘI XE',
      items: [
        { name: 'Danh sách xe (27)', path: '/admin/vehicles', icon: <Car size={17} /> },
        { name: 'Bảo dưỡng xe', path: '/admin/maintenance', icon: <Wrench size={17} /> },
        { name: 'Hồ sơ Bảo hiểm', path: '/admin/insurances', icon: <ShieldCheck size={17} /> },
      ]
    },
    {
      groupTitle: 'CẤU HÌNH CHÍNH SÁCH',
      items: [
        { name: 'Bảng giá & Chiết khấu', path: '/admin/pricing', icon: <CircleDollarSign size={17} /> },
        { name: 'Điều kiện thuê xe', path: '/admin/policies', icon: <FileText size={17} /> },
        { name: 'Biểu phí bồi thường', path: '/admin/compensation', icon: <ShieldAlert size={17} /> },
        { name: 'Mẫu hợp đồng', path: '/admin/contracts', icon: <Files size={17} /> },
      ]
    }
  ];

  // Helper to get active title for breadcrumbs
  const getActiveTitle = () => {
    for (const group of navGroups) {
      for (const item of group.items) {
        if (item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)) {
          return item.name;
        }
      }
    }
    return 'Vận hành hệ thống';
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-zinc-950 overflow-hidden">
      
      {/* SIDEBAR: Ultra-Clean Deep Navy Backoffice (240px) */}
      <aside 
        className={`${isSidebarOpen ? 'w-[240px]' : 'w-18'} 
        bg-[#0F172A] text-slate-300 flex flex-col shrink-0 transition-all duration-300 z-30 select-none border-r border-slate-800`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
              V
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="text-sm font-extrabold tracking-[0.15em] text-white leading-none">
                  VELORA
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">
                  Backoffice Portal
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navGroups.map((group) => (
            <div key={group.groupTitle} className="space-y-1">
              {isSidebarOpen && (
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {group.groupTitle}
                </div>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = item.exact 
                    ? location.pathname === item.path 
                    : location.pathname.startsWith(item.path);

                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={`flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium transition-all group ${
                          isActive 
                            ? 'bg-blue-600/20 text-white font-semibold border-l-2 border-blue-500' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                        title={!isSidebarOpen ? item.name : ''}
                      >
                        <span className={`shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                          {item.icon}
                        </span>
                        {isSidebarOpen && (
                          <span className="ml-2.5 whitespace-nowrap truncate">{item.name}</span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer User info */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded bg-slate-800 text-slate-200 flex items-center justify-center text-xs font-bold shrink-0">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              {isSidebarOpen && (
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white truncate leading-tight">
                    {user?.fullName || 'Nhân viên'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {user?.role || 'STAFF'}
                  </div>
                </div>
              )}
            </div>

            {isSidebarOpen && (
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-1 text-slate-400 hover:text-red-400 rounded transition"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>

      </aside>

      {/* MAIN WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        
        {/* Workspace Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-2xs">
          
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleSidebar}
              className="p-1.5 rounded-md text-slate-500 hover:text-zinc-950 hover:bg-slate-100 transition focus:outline-none"
              title="Đóng / mở sidebar"
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Backoffice</span>
              <ChevronRight size={13} className="text-slate-400" />
              <span className="font-bold text-zinc-950">{getActiveTitle()}</span>
            </div>
          </div>

          {/* Quick status & Client Storefront link */}
          <div className="flex items-center gap-3.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Live Database Connected
            </span>

            <Link
              to="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition"
              title="Mở giao diện khách hàng ở tab mới"
            >
              <span>Xem Web Khách</span>
              <ExternalLink size={12} className="text-slate-500" />
            </Link>
          </div>

        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default AdminLayout;
