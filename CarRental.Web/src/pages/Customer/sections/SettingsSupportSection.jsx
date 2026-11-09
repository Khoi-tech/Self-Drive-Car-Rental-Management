import React, { useState } from 'react';
import { 
  Settings, 
  Lock, 
  Smartphone, 
  ShieldAlert, 
  HelpCircle, 
  PhoneCall, 
  MessageSquare, 
  FileText, 
  LogOut, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  ExternalLink,
  Laptop,
  X,
  KeyRound,
  ShieldCheck
} from 'lucide-react';

const INITIAL_SESSIONS = [
  {
    id: 'ses-1',
    device: 'Windows PC • Chrome Browser',
    ip: '113.161.44.120 (TP. Hồ Chí Minh)',
    isCurrent: true,
    lastActive: 'Đang hoạt động'
  },
  {
    id: 'ses-2',
    device: 'iPhone 15 Pro • Safari Mobile',
    ip: '14.169.89.201 (TP. Hồ Chí Minh)',
    isCurrent: false,
    lastActive: '2 giờ trước'
  }
];

const SettingsSupportSection = ({ 
  user, 
  onLogout, 
  onOpenChangePassword, 
  activeRentalsCount = 0 
}) => {
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [complaintSent, setComplaintSent] = useState(false);

  // Check condition for account deletion
  const canDeleteAccount = activeRentalsCount === 0;

  const handleLogoutSession = (sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleLogoutAllOtherSessions = () => {
    if (window.confirm('Quý khách có chắc chắn muốn đăng xuất khỏi tất cả các thiết bị khác?')) {
      setSessions(prev => prev.filter(s => s.isCurrent));
    }
  };

  const handleSendComplaint = (e) => {
    e.preventDefault();
    if (!complaintText.trim()) return;
    setComplaintSent(true);
    setTimeout(() => {
      setComplaintSent(false);
      setComplaintModalOpen(false);
      setComplaintText('');
      alert('Yêu cầu khiếu nại đã được chuyển đến Ban Giám đốc VELORA. Chúng tôi sẽ phản hồi trong 2 giờ làm việc.');
    }, 1500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Cài đặt & Trung tâm hỗ trợ
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bảo mật phiên làm việc, liên hệ Concierge 24/7, hotline xử lý sự cố khẩn cấp và quản lý tài khoản.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 flex items-center gap-1.5 border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Trung tâm hỗ trợ Concierge 24/7</span>
          </span>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Security & Sessions */}
        <div className="space-y-6">
          
          {/* Card: Đổi mật khẩu */}
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                <Lock className="w-4 h-4 text-blue-900" />
                <span>Mật khẩu & Đăng nhập</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Khuyến nghị đổi mật khẩu định kỳ để bảo vệ tài khoản và lịch sử giao dịch tiền cọc của quý khách.
            </p>
            <button
              type="button"
              onClick={onOpenChangePassword}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-600" />
              <span>Thay đổi mật khẩu ngay</span>
            </button>
          </div>

          {/* Card: Quản lý phiên đăng nhập */}
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                <Laptop className="w-4 h-4 text-blue-900" />
                <span>Thiết bị & Phiên hoạt động</span>
              </div>
              {sessions.filter(s => !s.isCurrent).length > 0 && (
                <button
                  type="button"
                  onClick={handleLogoutAllOtherSessions}
                  className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                >
                  Đăng xuất mọi thiết bị khác
                </button>
              )}
            </div>

            <div className="space-y-2">
              {sessions.map(ses => (
                <div key={ses.id} className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      {ses.device}
                      {ses.isCurrent && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-extrabold">
                          Hiện tại
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono block">{ses.ip}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-500 tabular-nums">{ses.lastActive}</span>
                    {!ses.isCurrent && (
                      <button
                        type="button"
                        onClick={() => handleLogoutSession(ses.id)}
                        className="px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-semibold transition border border-red-200 cursor-pointer"
                      >
                        Đăng xuất thiết bị
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Support & Hotline */}
        <div className="space-y-6">
          
          {/* Card: Hotline 24/7 */}
          <div className="p-5 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 space-y-3">
            <div className="flex items-center gap-2 text-blue-950 font-bold text-xs uppercase tracking-wider">
              <PhoneCall className="w-4 h-4 text-blue-900" />
              <span>Tổng đài Hỗ trợ Concierge & Cứu hộ 24/7</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Trong trường hợp xảy ra sự cố va quẹt, tai nạn hoặc sự cố kỹ thuật trên đường, hãy giữ bình tĩnh và liên hệ đường dây nóng ưu tiên của VELORA.
            </p>
            <div className="flex items-center gap-4 pt-1">
              <a
                href="tel:19008888"
                className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Gọi Hotline: 1900 8888 (Phím 1)</span>
              </a>
              <button
                type="button"
                onClick={() => setComplaintModalOpen(true)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-900" />
                <span>Gửi khiếu nại dịch vụ</span>
              </button>
            </div>
          </div>

          {/* Card: Xóa tài khoản */}
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>Quản lý đóng tài khoản</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Theo Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân, bạn có quyền yêu cầu VELORA hủy tài khoản và ẩn danh dữ liệu khi đã hoàn tất mọi nghĩa vụ tài chính và cọc xe.
            </p>
            <div>
              {canDeleteAccount ? (
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                  className="px-4 py-2 bg-white hover:bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yêu cầu xóa tài khoản VELORA</span>
                </button>
              ) : (
                <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Không thể xóa tài khoản khi đang có chuyến xe chạy hoặc tiền cọc chưa quyết toán.</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Complaint Modal */}
      {complaintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-900" />
                <span>Gửi phản ánh & Khiếu nại dịch vụ</span>
              </h3>
              <button onClick={() => setComplaintModalOpen(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendComplaint} className="space-y-3 text-xs">
              <label className="font-bold text-slate-700 block">Nội dung phản ánh chi tiết:</label>
              <textarea
                required
                rows={4}
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="Vui lòng cung cấp mã đơn hoặc thông tin sự cố để Ban Quản Trị VELORA hỗ trợ xử lý ngay..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-900 focus:outline-none focus:border-blue-900"
              />

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setComplaintModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={complaintSent}
                  className="px-4 py-2 bg-slate-900 hover:bg-blue-900 text-white rounded-lg font-bold cursor-pointer"
                >
                  {complaintSent ? 'Đang gửi...' : 'Gửi khiếu nại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Xác nhận yêu cầu xóa tài khoản</span>
              </h3>
              <button onClick={() => setDeleteModalOpen(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Hành động này sẽ gửi yêu cầu đóng tài khoản vĩnh viễn đến hệ thống. Mọi thông tin định danh sẽ được ẩn danh theo luật định sau khi hoàn tất đối soát nghĩa vụ. Quý khách có chắc chắn muốn tiếp tục?
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Yêu cầu đã được tiếp nhận. Nhân viên CSKH VELORA sẽ liên hệ xác thực trong 24 giờ.');
                  setDeleteModalOpen(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs cursor-pointer"
              >
                Xác nhận gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsSupportSection;
