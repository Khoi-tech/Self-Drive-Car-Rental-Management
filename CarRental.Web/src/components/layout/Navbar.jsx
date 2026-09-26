import React from 'react';

const Navbar = ({ isVisible }) => {
  return (
    <nav 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-1000 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-white text-2xl font-light tracking-[0.2em]">
            VELORA
          </div>
          <div className="hidden md:flex space-x-8 text-sm font-medium text-gray-300">
            <a href="#" className="hover:text-white transition-colors">Dòng xe</a>
            <a href="#" className="hover:text-white transition-colors">Dịch vụ</a>
            <a href="#" className="hover:text-white transition-colors">Trải nghiệm</a>
            <a href="#" className="hover:text-white transition-colors">Liên hệ</a>
          </div>
          <div>
            <button className="bg-white text-black px-6 py-2 text-sm font-medium hover:bg-gray-200 transition-colors">
              ĐẶT XE
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
