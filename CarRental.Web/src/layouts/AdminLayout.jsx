import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
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
  ClipboardList
} from 'lucide-react';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const menuItems = [
    { name: 'Tổng quan', path: '/admin', icon: <LayoutDashboard size={20} />, exact: true },
    { name: 'Duyệt đơn thuê', path: '/admin/rental-requests', icon: <ClipboardList size={20} /> },
    { name: 'Quản lý xe', path: '/admin/vehicles', icon: <Car size={20} /> },
    { name: 'Bảng giá', path: '/admin/pricing', icon: <CircleDollarSign size={20} /> },
    { name: 'Chính sách thuê', path: '/admin/policies', icon: <FileText size={20} /> },
    { name: 'Phí và bồi thường', path: '/admin/compensation', icon: <ShieldAlert size={20} /> },
    { name: 'Mẫu hợp đồng', path: '/admin/contracts', icon: <Files size={20} /> },
    { name: 'Cài đặt', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-zinc-50 font-sans text-zinc-900">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} 
        bg-white border-r border-zinc-200 flex flex-col transition-all duration-300 relative`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-200">
          {isSidebarOpen ? (
            <span className="text-xl font-bold tracking-widest uppercase">VELORA</span>
          ) : (
            <span className="text-xl font-bold tracking-widest uppercase mx-auto">V</span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const isActive = item.exact 
                ? location.pathname === item.path 
                : location.pathname.startsWith(item.path);

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={`flex items-center px-3 py-2.5 rounded-md transition-colors group
                      ${isActive 
                        ? 'bg-zinc-900 text-white' 
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}
                    title={!isSidebarOpen ? item.name : ""}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {isSidebarOpen && (
                      <span className="ml-3 text-sm font-medium whitespace-nowrap">{item.name}</span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6">
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar}
              className="text-zinc-500 hover:text-zinc-900 focus:outline-none"
            >
              <Menu size={24} />
            </button>
            
            <div className="ml-6 relative hidden md:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search size={18} className="text-zinc-400" />
              </span>
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                className="pl-10 pr-4 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 w-64"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="text-zinc-500 hover:text-zinc-900 relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">3</span>
            </button>
            <div className="h-8 w-8 rounded-full bg-zinc-200 flex items-center justify-center overflow-hidden">
              <UserCircle size={32} className="text-zinc-600" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-zinc-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
