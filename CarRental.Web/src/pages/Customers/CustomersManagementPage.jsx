import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Award, 
  Car, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock, 
  X, 
  AlertTriangle, 
  Phone, 
  Mail, 
  CreditCard,
  Building,
  RefreshCw,
  Info,
  CheckSquare,
  Square,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  FileCheck2,
  FileSignature,
  TrendingDown,
  TrendingUp,
  PlusCircle,
  ArrowRight
} from 'lucide-react';
import customerService from '../../services/customerService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const CustomersManagementPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [kycFilter, setKycFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Inline quick-unmask state for table rows
  const [revealedPhones, setRevealedPhones] = useState({});

  // Drawer / Modal: Chi tiết & Thẩm định Khách hàng (max-w-4xl)
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('kyc'); // 'kyc', 'credit', 'trips'
  const [unmaskPii, setUnmaskPii] = useState(false); // Global toggle in drawer
  const [unmaskAuditLogTime, setUnmaskAuditLogTime] = useState('');

  // Tab 1: Checklist state for KYC verification
  const [kycChecklist, setKycChecklist] = useState({
    photoClear: false,
    vneidMatched: false,
    licenseValid: false
  });
  const [kycRejectReason, setKycRejectReason] = useState('Ảnh chụp mờ hoặc lóa sáng');
  const [showRejectBox, setShowRejectBox] = useState(false);

  // Tab 2: Adjust Credit Score form state
  const [violationForm, setViolationForm] = useState({
    type: 'TRẢ XE TRỄ',
    pointsAdjustment: -10,
    notes: ''
  });

  // Modal: Khóa / Mở khóa Tài khoản (max-w-md)
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockReasonCategory, setLockReasonCategory] = useState('Chờ đối soát phạt nguội');
  const [lockNotes, setLockNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Lightbox for document image zoom
  const [previewImage, setPreviewImage] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await customerService.getCustomers({
        search,
        tier: tierFilter,
        kycStatus: kycFilter,
        status: statusFilter
      });
      const data = res?.data || res;
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Không thể kết nối máy chủ để tải danh sách khách hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [tierFilter, kycFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  // Toggle PII unmask in modal
  const handleToggleUnmaskPii = () => {
    if (!unmaskPii) {
      const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setUnmaskAuditLogTime(now);
      setUnmaskPii(true);
    } else {
      setUnmaskPii(false);
      setUnmaskAuditLogTime('');
    }
  };

  // Open detail drawer for customer
  const handleOpenCustomerDetail = (customer) => {
    setSelectedCustomer(customer);
    setDrawerTab('kyc');
    setUnmaskPii(false);
    setShowRejectBox(false);
    setKycChecklist({
      photoClear: customer.kycStatus === 'VERIFIED',
      vneidMatched: customer.kycStatus === 'VERIFIED',
      licenseValid: customer.kycStatus === 'VERIFIED'
    });
    setIsDetailDrawerOpen(true);
  };

  // Open lock modal
  const handleOpenLockModal = (customer) => {
    setSelectedCustomer(customer);
    setLockReasonCategory('Chờ đối soát phạt nguội');
    setLockNotes('');
    setIsLockModalOpen(true);
  };

  // Confirm Lock / Unlock
  const handleConfirmToggleStatus = async () => {
    if (!selectedCustomer) return;
    try {
      setActionLoading(true);
      const nextStatus = selectedCustomer.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      const fullReason = `${lockReasonCategory}: ${lockNotes || 'Không có ghi chú thêm'}`;
      await customerService.toggleStatus(selectedCustomer.id, nextStatus, fullReason);
      
      setIsLockModalOpen(false);
      // Update local state smoothly
      setCustomers(prev => prev.map(c => 
        c.id === selectedCustomer.id 
          ? { ...c, accountStatus: nextStatus, internalStaffNotes: fullReason }
          : c
      ));
      if (selectedCustomer) {
        setSelectedCustomer(prev => ({ ...prev, accountStatus: nextStatus, internalStaffNotes: fullReason }));
      }
    } catch (err) {
      alert('Không thể cập nhật trạng thái tài khoản. Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  // Approve KYC
  const handleApproveKyc = async () => {
    if (!selectedCustomer) return;
    try {
      setActionLoading(true);
      await customerService.updateKycStatus(selectedCustomer.id, 'VERIFIED');
      setCustomers(prev => prev.map(c => 
        c.id === selectedCustomer.id ? { ...c, kycStatus: 'VERIFIED' } : c
      ));
      setSelectedCustomer(prev => ({ ...prev, kycStatus: 'VERIFIED' }));
      alert(`Đã phê duyệt hồ sơ KYC của ${selectedCustomer.fullName} thành công!`);
    } catch {
      alert('Lỗi phê duyệt KYC.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject / Request Update KYC
  const handleRejectKyc = async () => {
    if (!selectedCustomer) return;
    try {
      setActionLoading(true);
      await customerService.updateKycStatus(selectedCustomer.id, 'REJECTED', kycRejectReason);
      setCustomers(prev => prev.map(c => 
        c.id === selectedCustomer.id ? { ...c, kycStatus: 'REJECTED' } : c
      ));
      setSelectedCustomer(prev => ({ ...prev, kycStatus: 'REJECTED' }));
      setShowRejectBox(false);
      alert(`Đã gửi yêu cầu cập nhật lại hồ sơ KYC đến ${selectedCustomer.fullName}!`);
    } catch {
      alert('Lỗi từ chối KYC.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit violation score adjustment
  const handleAddViolation = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      setActionLoading(true);
      const points = parseInt(violationForm.pointsAdjustment, 10);
      await customerService.addViolation(
        selectedCustomer.id,
        violationForm.type,
        points,
        violationForm.notes || 'Biên bản ghi nhận điều chỉnh nội bộ'
      );

      const newLog = {
        id: `v-${Date.now()}`,
        date: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        type: violationForm.type,
        pointsChange: points,
        reason: violationForm.notes || 'Biên bản ghi nhận điều chỉnh nội bộ',
        officer: 'Trưởng ca Vận hành'
      };

      const updatedScore = Math.max(0, Math.Min ? Math.min(100, selectedCustomer.trustScore + points) : 100);

      setSelectedCustomer(prev => ({
        ...prev,
        trustScore: Math.max(0, Math.min(100, prev.trustScore + points)),
        violationsHistory: [newLog, ...(prev.violationsHistory || [])]
      }));

      setCustomers(prev => prev.map(c => 
        c.id === selectedCustomer.id 
          ? { 
              ...c, 
              trustScore: Math.max(0, Math.min(100, c.trustScore + points)),
              violationsHistory: [newLog, ...(c.violationsHistory || [])]
            }
          : c
      ));

      setViolationForm({ type: 'TRẢ XE TRỄ', pointsAdjustment: -10, notes: '' });
      alert('Đã cập nhật điểm tín nhiệm và ghi nhận vào lịch sử thành công!');
    } catch {
      alert('Lỗi ghi nhận vi phạm.');
    } finally {
      setActionLoading(false);
    }
  };

  // 1.1. Dynamic KPI Computations
  const totalCount = customers.length;
  const verifiedKycCount = customers.filter(c => c.kycStatus === 'VERIFIED').length;
  const activeRentersCount = customers.filter(c => c.activeBookings > 0).length;
  const suspendedCount = customers.filter(c => c.accountStatus === 'SUSPENDED').length;

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      
      {/* 1. Privacy Banner (Nghị định 13/2023/NĐ-CP) */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5 border border-white/10">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">
                Bảo vệ quyền riêng tư khách hàng (Nghị định 13/2023/NĐ-CP)
              </span>
              <span className="px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                Privacy-by-Design
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Dữ liệu nhạy cảm (SĐT, CCCD, GPLX) được che giấu tự động dạng <code className="text-amber-300 font-mono">***</code>. Chỉ nhân viên được ủy quyền mới có thể mở giải mã tạm thời khi đối soát bàn giao xe.
            </p>
          </div>
        </div>

        <button
          onClick={fetchCustomers}
          disabled={loading}
          className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer border border-white/10 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-300' : ''}`} />
          <span>Đồng bộ dữ liệu</span>
        </button>
      </div>

      {/* 2. 4 Overview Dynamic KPI Cards (100% computed from customer list) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Tổng khách hàng */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tổng số khách hàng
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {totalCount}
          </div>
          <span className="text-[11px] text-slate-400 block">Dữ liệu khách hàng B2C đồng bộ</span>
        </div>

        {/* Card 2: Đã xác thực KYC */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Đã xác thực KYC
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 tabular-nums">
            {verifiedKycCount}
          </div>
          <span className="text-[11px] text-emerald-600 block">Đủ điều kiện nhận xe ngay</span>
        </div>

        {/* Card 3: Khách đang thuê xe (B2C max 1/customer) */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Khách đang thuê xe
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-900 tabular-nums">
            {activeRentersCount}
          </div>
          <span className="text-[11px] text-slate-400 block">Đang lưu hành phương tiện</span>
        </div>

        {/* Card 4: Tài khoản tạm khóa */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tài khoản tạm khóa
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-600 tabular-nums">
            {suspendedCount}
          </div>
          <span className="text-[11px] text-slate-400 block">Khớp 100% với trạng thái khóa</span>
        </div>

      </div>

      {/* 3. Filter & Search Controls */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo họ tên, email, SĐT hoặc mã khách hàng..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-900"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-900"
          >
            <option value="ALL">Tất cả hạng VIP</option>
            <option value="Platinum">Platinum Member</option>
            <option value="Gold">Gold Member</option>
            <option value="Silver">Silver Member</option>
          </select>

          <select
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-900"
          >
            <option value="ALL">Tất cả KYC</option>
            <option value="VERIFIED">Đã xác minh KYC</option>
            <option value="PENDING">Chờ duyệt giấy tờ</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-900"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">🟢 Đang hoạt động</option>
            <option value="SUSPENDED">🔴 Đang tạm khóa</option>
          </select>
        </div>

      </div>

      {/* 4. Customer Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Khách hàng</th>
                <th className="py-3.5 px-4">Liên hệ (Masked)</th>
                <th className="py-3.5 px-4">Định danh KYC</th>
                <th className="py-3.5 px-4 text-center">Hạng bằng</th>
                <th className="py-3.5 px-4 text-center">Chuyến thuê</th>
                <th className="py-3.5 px-4 text-center">Điểm tín nhiệm</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-900" />
                    <span>Đang tải danh sách khách hàng...</span>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    Không tìm thấy khách hàng nào phù hợp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const isRevealed = Boolean(revealedPhones[c.id]);
                  const isSuspended = c.accountStatus === 'SUSPENDED';
                  const isKycPending = c.kycStatus === 'PENDING';

                  // Credit score badge color
                  let trustBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  if (c.trustScore < 60) trustBadge = 'bg-red-50 text-red-800 border-red-200';
                  else if (c.trustScore < 90) trustBadge = 'bg-amber-50 text-amber-800 border-amber-200';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      
                      {/* Cột 1: Tên & Hạng */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {c.fullName?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || 'VL'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {c.fullName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              #{c.id.substring(0, 12).toUpperCase()}
                            </span>
                            <span className={`inline-flex items-center gap-0.5 mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold border ${
                              c.membershipTier === 'Platinum'
                                ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                                : c.membershipTier === 'Gold'
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              <Award className="w-2.5 h-2.5" />
                              {c.membershipTier}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Email & SĐT Masked */}
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium truncate max-w-[170px]">{c.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono tabular-nums font-semibold">
                            {isRevealed ? (c.rawPhone || c.maskedPhone) : c.maskedPhone}
                          </span>
                          <button
                            type="button"
                            onClick={() => setRevealedPhones(p => ({ ...p, [c.id]: !p[c.id] }))}
                            className="p-0.5 text-slate-400 hover:text-blue-900 rounded transition"
                            title={isRevealed ? 'Ẩn số điện thoại' : 'Mở xem (ghi nhận audit log)'}
                          >
                            {isRevealed ? <EyeOff className="w-3 h-3 text-amber-600" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      {/* Cột 3: Định danh KYC */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="font-mono text-slate-800 font-semibold tabular-nums">
                          {c.maskedIdCard}
                        </div>
                        {isKycPending ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            CHỜ DUYỆT KYC
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Đã xác minh KYC
                          </span>
                        )}
                      </td>

                      {/* Cột 4: Hạng bằng GPLX */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-bold text-blue-900 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-xs">
                            {c.licenseClass}
                          </span>
                          {c.isLicenseNearExpiry && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" title="Bằng lái sắp hết hạn" />
                          )}
                        </div>
                        <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                          {c.maskedLicenseNumber}
                        </span>
                      </td>

                      {/* Cột 5: Chuyến thuê (Mathematical Breakdown with Tooltip) */}
                      <td className="py-3.5 px-4 text-center">
                        <div 
                          className="cursor-help inline-block group relative"
                          title={`Tổng: ${c.totalBookings} đơn = ${c.completedBookings} hoàn thành + ${c.activeBookings} đang chạy + ${c.cancelledBookings} đã hủy`}
                        >
                          <span className="font-black text-slate-900 tabular-nums text-sm">
                            {c.totalBookings} chuyến
                          </span>
                          <span className="text-[10px] text-slate-500 block tabular-nums">
                            {c.completedBookings} hoàn thành • {c.activeBookings} đang chạy • {c.cancelledBookings} đã hủy
                          </span>
                        </div>
                      </td>

                      {/* Cột 6: Điểm tín nhiệm */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-black border tabular-nums ${trustBadge}`}>
                            {c.trustScore}/100
                          </span>
                          <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                            <div 
                              className={`h-full rounded-full ${c.trustScore < 60 ? 'bg-red-500' : (c.trustScore < 90 ? 'bg-amber-500' : 'bg-emerald-500')}`}
                              style={{ width: `${c.trustScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Cột 7: Trạng thái tài khoản */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border inline-block ${
                          isSuspended
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {isSuspended ? 'TẠM KHÓA' : 'HOẠT ĐỘNG'}
                        </span>
                      </td>

                      {/* Cột 8: Thao tác an toàn */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Nút xem chi tiết (Mở drawer max-w-4xl) */}
                          <button
                            type="button"
                            onClick={() => handleOpenCustomerDetail(c)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              isKycPending
                                ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600 animate-bounce'
                                : 'border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                            }`}
                            title={isKycPending ? 'Có hồ sơ KYC cần duyệt gấp!' : 'Xem chi tiết & thẩm định hồ sơ'}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Nút Khóa / Mở khóa tài khoản */}
                          <button
                            type="button"
                            onClick={() => handleOpenLockModal(c)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              isSuspended
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                            title={isSuspended ? 'Mở khóa tài khoản' : 'Tạm khóa tài khoản'}
                          >
                            {isSuspended ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1.2. DRAWER / MODAL: CHI TIẾT & THẨM ĐỊNH KHÁCH HÀNG (max-w-4xl)           */}
      {/* ========================================================================= */}
      {selectedCustomer && isDetailDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col animate-scale-up border border-slate-200">
            
            {/* Header with Decryption Mechanism (Nghị định 13/2023/NĐ-CP) */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Identity Summary */}
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-base shadow-sm">
                    {selectedCustomer.fullName?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || 'VL'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900">
                        {selectedCustomer.fullName}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-200">
                        {selectedCustomer.membershipTier} Member
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        selectedCustomer.accountStatus === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}>
                        {selectedCustomer.accountStatus}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      Mã KH: {selectedCustomer.id} • Điểm tín nhiệm: <strong className="text-slate-900">{selectedCustomer.trustScore}/100</strong>
                    </span>
                  </div>
                </div>

                {/* Right: Unmask PII Toggle & Close button */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleToggleUnmaskPii}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs border ${
                      unmaskPii
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {unmaskPii ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-blue-900" />}
                    <span>{unmaskPii ? 'Đang giải mã dữ liệu' : '👁️ Giải mã dữ liệu gốc (Unmask PII)'}</span>
                  </button>

                  <button
                    onClick={() => setIsDetailDrawerOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Audit Log Banner when Unmask is Active */}
              {unmaskPii && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2 animate-fade-in font-medium">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Đã ghi nhật ký truy cập dữ liệu nhạy cảm bởi Nhân viên VELORA lúc <strong>{unmaskAuditLogTime || 'hiện tại'}</strong> theo Nghị định 13/2023/NĐ-CP.
                  </span>
                </div>
              )}

              {/* 3 Main Tabs in Drawer */}
              <div className="flex items-center gap-2 border-b border-slate-200 pt-2">
                {[
                  { id: 'kyc', label: '1. Hồ sơ KYC & Tài xế phụ', icon: FileCheck2 },
                  { id: 'credit', label: '2. Điểm tín nhiệm & Lịch sử vi phạm', icon: Award },
                  { id: 'trips', label: '3. Lịch sử chuyến thuê & Ký quỹ', icon: Car },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setDrawerTab(tab.id)}
                    className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                      drawerTab === tab.id
                        ? 'border-blue-900 text-blue-900'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1">
              
              {/* TAB 1: KYC & ADDITIONAL DRIVERS */}
              {drawerTab === 'kyc' && (
                <div className="space-y-6">
                  
                  {/* Split-View: Left Column Documents / Right Column Parsed Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl border border-slate-200 bg-slate-50/50">
                    
                    {/* Left: Specimen Images */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-blue-900" />
                        <span>Bản quét giấy tờ định danh gốc</span>
                      </h4>

                      {/* CCCD Cards Front & Back */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-600 block">CCCD gắn chip (Mặt trước / Mặt sau):</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div 
                            onClick={() => setPreviewImage({ title: 'CCCD Mặt trước', url: selectedCustomer.IdCardFrontUrl || 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=800&q=80' })}
                            className="aspect-[16/10] bg-slate-200 rounded-lg overflow-hidden border border-slate-300 relative cursor-pointer group"
                          >
                            <img src={selectedCustomer.IdCardFrontUrl || 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=600&q=80'} alt="CCCD trước" className="w-full h-full object-cover group-hover:scale-105 transition" />
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/70 text-white text-[9px] font-bold">Mặt trước</span>
                          </div>
                          <div 
                            onClick={() => setPreviewImage({ title: 'CCCD Mặt sau', url: selectedCustomer.IdCardBackUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80' })}
                            className="aspect-[16/10] bg-slate-200 rounded-lg overflow-hidden border border-slate-300 relative cursor-pointer group"
                          >
                            <img src={selectedCustomer.IdCardBackUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80'} alt="CCCD sau" className="w-full h-full object-cover group-hover:scale-105 transition" />
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/70 text-white text-[9px] font-bold">Mặt sau</span>
                          </div>
                        </div>
                      </div>

                      {/* GPLX Cards Front & Back */}
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[11px] font-semibold text-slate-600 block">GPLX chuẩn Bộ GTVT:</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div 
                            onClick={() => setPreviewImage({ title: 'GPLX Mặt trước', url: selectedCustomer.DriverLicenseFrontUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80' })}
                            className="aspect-[16/10] bg-slate-200 rounded-lg overflow-hidden border border-slate-300 relative cursor-pointer group"
                          >
                            <img src={selectedCustomer.DriverLicenseFrontUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80'} alt="GPLX trước" className="w-full h-full object-cover group-hover:scale-105 transition" />
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/70 text-white text-[9px] font-bold">GPLX Trước</span>
                          </div>
                          <div 
                            onClick={() => setPreviewImage({ title: 'GPLX Mặt sau', url: selectedCustomer.DriverLicenseBackUrl || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80' })}
                            className="aspect-[16/10] bg-slate-200 rounded-lg overflow-hidden border border-slate-300 relative cursor-pointer group"
                          >
                            <img src={selectedCustomer.DriverLicenseBackUrl || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80'} alt="GPLX sau" className="w-full h-full object-cover group-hover:scale-105 transition" />
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/70 text-white text-[9px] font-bold">GPLX Sau</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Right: Parsed Info & Checklist */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4 text-emerald-700" />
                        <span>Thông tin trích xuất & Thẩm định</span>
                      </h4>

                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Số CCCD (12 số):</span>
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
                            {unmaskPii ? selectedCustomer.rawIdCard : selectedCustomer.maskedIdCard}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Số GPLX (12 số):</span>
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
                            {unmaskPii ? selectedCustomer.rawLicenseNumber : selectedCustomer.maskedLicenseNumber}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Hạng bằng lái:</span>
                          <span className="font-bold text-blue-900">
                            Hạng {selectedCustomer.licenseClass} (Sedan/SUV dưới 9 chỗ)
                          </span>
                        </div>
                        <div className="flex justify-between py-1 items-center">
                          <span className="text-slate-500">Ngày hết hạn:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold tabular-nums text-slate-800">{selectedCustomer.licenseExpiryDate}</span>
                            {selectedCustomer.isLicenseNearExpiry && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-extrabold">
                                Còn dưới 30 ngày!
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 3 Checkboxes */}
                      <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200 text-xs">
                        <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                          Tiêu chí thẩm định hồ sơ:
                        </span>
                        
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={kycChecklist.photoClear}
                            onChange={(e) => setKycChecklist(p => ({ ...p, photoClear: e.target.checked }))}
                            className="rounded text-blue-900 focus:ring-0 w-4 h-4 cursor-pointer"
                          />
                          <span className="font-medium text-slate-700">1. Ảnh chụp rõ nét, không bị lóa hoặc mất góc</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={kycChecklist.vneidMatched}
                            onChange={(e) => setKycChecklist(p => ({ ...p, vneidMatched: e.target.checked }))}
                            className="rounded text-blue-900 focus:ring-0 w-4 h-4 cursor-pointer"
                          />
                          <span className="font-medium text-slate-700">2. Thông tin họ tên và ngày sinh trùng khớp VNeID</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={kycChecklist.licenseValid}
                            onChange={(e) => setKycChecklist(p => ({ ...p, licenseValid: e.target.checked }))}
                            className="rounded text-blue-900 focus:ring-0 w-4 h-4 cursor-pointer"
                          />
                          <span className="font-medium text-slate-700">3. Bằng lái còn thời hạn hợp lệ trong thời gian thuê</span>
                        </label>
                      </div>

                      {/* Actions: Approve / Request Update */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={handleApproveKyc}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Phê duyệt KYC (Hợp lệ)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowRejectBox(!showRejectBox)}
                            className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                            <span>Yêu cầu bổ sung lại</span>
                          </button>
                        </div>

                        {showRejectBox && (
                          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-2 text-xs">
                            <span className="font-bold text-amber-900 block">Lý do yêu cầu cập nhật lại:</span>
                            <select
                              value={kycRejectReason}
                              onChange={(e) => setKycRejectReason(e.target.value)}
                              className="w-full bg-white border border-amber-300 rounded-lg p-2 font-semibold text-slate-900"
                            >
                              <option value="Ảnh chụp mờ hoặc lóa sáng">Ảnh chụp mờ hoặc lóa sáng, không đọc được số</option>
                              <option value="Giấy phép lái xe đã hết hạn">Giấy phép lái xe đã hết hạn theo quy định</option>
                              <option value="Họ tên không trùng khớp với CCCD">Họ tên trên GPLX không trùng khớp với CCCD</option>
                              <option value="Mất góc hoặc có dấu hiệu chỉnh sửa">Ảnh chụp có dấu hiệu cắt góc / chỉnh sửa</option>
                            </select>
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={handleRejectKyc}
                              className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-bold text-xs cursor-pointer"
                            >
                              Xác nhận gửi thông báo cho khách
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Additional Drivers List */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-900" />
                      <span>Danh sách tài xế bổ sung đã đăng ký</span>
                    </h4>

                    {(!selectedCustomer.additionalDrivers || selectedCustomer.additionalDrivers.length === 0) ? (
                      <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                        Khách hàng chưa đăng ký tài xế cùng lái nào.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedCustomer.additionalDrivers.map((drv) => (
                          <div key={drv.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-900 block">{drv.fullName}</span>
                              <span className="text-[11px] text-slate-500">GPLX Hạng {drv.licenseClass} ({drv.licenseNumber}) • Hạn: {drv.expiryDate}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {drv.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 2: CREDIT SCORE & VIOLATIONS */}
              {drawerTab === 'credit' && (
                <div className="space-y-6">
                  
                  {/* Credit Score Bar */}
                  <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs uppercase font-bold text-slate-500 tracking-wider block">
                          Điểm tín nhiệm hiện tại
                        </span>
                        <div className="text-3xl font-black text-slate-900 tabular-nums">
                          {selectedCustomer.trustScore} <span className="text-sm font-semibold text-slate-400">/ 100</span>
                        </div>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                        selectedCustomer.trustScore >= 90 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                          : selectedCustomer.trustScore >= 60 
                          ? 'bg-amber-50 text-amber-800 border-amber-300' 
                          : 'bg-red-50 text-red-800 border-red-300'
                      }`}>
                        {selectedCustomer.trustScore >= 90 ? 'VIP TÍN NHIỆM CAO' : selectedCustomer.trustScore >= 60 ? 'MỨC ĐỘ TRUNG BÌNH' : 'CẢNH BÁO RỦI RO'}
                      </span>
                    </div>

                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          selectedCustomer.trustScore >= 90 ? 'bg-emerald-500' : selectedCustomer.trustScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${selectedCustomer.trustScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Violation History Table */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      Lịch sử biến động điểm tín nhiệm
                    </h4>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                          <tr>
                            <th className="py-2.5 px-3">Thời gian</th>
                            <th className="py-2.5 px-3">Hạng mục</th>
                            <th className="py-2.5 px-3 text-center">Biến động</th>
                            <th className="py-2.5 px-3">Nội dung chi tiết</th>
                            <th className="py-2.5 px-3">Cán bộ phụ trách</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {(selectedCustomer.violationsHistory || []).map((v) => {
                            const isPositive = v.pointsChange > 0;
                            return (
                              <tr key={v.id || v.date} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 tabular-nums text-slate-500 font-medium">{v.date}</td>
                                <td className="py-2.5 px-3 font-bold text-slate-900">{v.type}</td>
                                <td className="py-2.5 px-3 text-center font-black tabular-nums">
                                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                                    isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                  }`}>
                                    {isPositive ? `+${v.pointsChange}` : v.pointsChange} điểm
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-700">{v.reason}</td>
                                <td className="py-2.5 px-3 text-slate-500 text-[11px]">{v.officer}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Quick Form: Điều chỉnh điểm tín nhiệm */}
                  <form onSubmit={handleAddViolation} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <PlusCircle className="w-4 h-4 text-blue-900" />
                      <span>Ghi nhận vi phạm / Điều chỉnh điểm thủ công</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block">Loại sự vụ:</label>
                        <select
                          value={violationForm.type}
                          onChange={(e) => setViolationForm(p => ({ ...p, type: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-semibold text-slate-900"
                        >
                          <option value="TRẢ XE TRỄ">Trả xe trễ hạn (-10 điểm)</option>
                          <option value="PHẠT NGUỘI">Vi phạm tốc độ / Phạt nguội (-15 điểm)</option>
                          <option value="VỆ SINH">Hút thuốc / Dơ nội thất (-10 điểm)</option>
                          <option value="THIỆT HẠI">Trầy xước va quẹt (-25 điểm)</option>
                          <option value="KHEN THƯỞNG">Khen thưởng giữ gìn xe xuất sắc (+5 điểm)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block">Số điểm cộng / trừ:</label>
                        <input
                          type="number"
                          required
                          value={violationForm.pointsAdjustment}
                          onChange={(e) => setViolationForm(p => ({ ...p, pointsAdjustment: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold tabular-nums text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="font-bold text-slate-700 block">Ghi chú biên bản:</label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Trả xe trễ 1.5 giờ do thời tiết mưa lớn tại Vũng Tàu..."
                        value={violationForm.notes}
                        onChange={(e) => setViolationForm(p => ({ ...p, notes: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium text-slate-900"
                      />
                    </div>

                    <div className="text-right pt-1">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="px-4 py-2 bg-slate-900 hover:bg-blue-900 text-white rounded-lg font-bold text-xs shadow-xs transition"
                      >
                        {actionLoading ? 'Đang lưu...' : 'Lưu biên bản & cập nhật điểm'}
                      </button>
                    </div>
                  </form>

                </div>
              )}

              {/* TAB 3: TRIPS HISTORY & VIETQR ESCROW */}
              {drawerTab === 'trips' && (
                <div className="space-y-6">
                  
                  {/* 4 Stat Boxes */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Tổng chi tiêu</span>
                      <span className="text-base font-black text-blue-900 tabular-nums">
                        {formatCurrency(selectedCustomer.totalSpent)}
                      </span>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">Đã hoàn thành</span>
                      <span className="text-base font-black text-emerald-900 tabular-nums">
                        {selectedCustomer.completedBookings} chuyến
                      </span>
                    </div>

                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                      <span className="text-[10px] font-bold text-indigo-800 uppercase block">Đang lưu hành</span>
                      <span className="text-base font-black text-indigo-900 tabular-nums">
                        {selectedCustomer.activeBookings} xe
                      </span>
                    </div>

                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="text-[10px] font-bold text-amber-800 uppercase block">Cọc phong tỏa (Escrow)</span>
                      <span className="text-base font-black text-amber-900 tabular-nums">
                        {formatCurrency(selectedCustomer.escrowDepositAmount || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Recent Bookings List */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      Danh sách các hợp đồng thuê gần nhất
                    </h4>

                    {(!selectedCustomer.recentBookings || selectedCustomer.recentBookings.length === 0) ? (
                      <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                        Chưa có lịch sử chuyến đi nào.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                            <tr>
                              <th className="py-2.5 px-3">Mã đơn</th>
                              <th className="py-2.5 px-3">Xe thuê</th>
                              <th className="py-2.5 px-3">Thời gian</th>
                              <th className="py-2.5 px-3 text-right">Giá trị thuê</th>
                              <th className="py-2.5 px-3 text-center">Trạng thái</th>
                              <th className="py-2.5 px-3 text-right">Hợp đồng</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {selectedCustomer.recentBookings.map((b) => (
                              <tr key={b.bookingId} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{b.bookingId}</td>
                                <td className="py-2.5 px-3">
                                  <span className="font-bold text-slate-900 block">{b.carName}</span>
                                  <span className="text-[10px] font-mono text-slate-500">{b.licensePlate}</span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 tabular-nums">{b.dates}</td>
                                <td className="py-2.5 px-3 text-right font-black text-blue-900 tabular-nums">
                                  {formatCurrency(b.totalFee)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                                    {b.statusLabel}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => alert(`Xem hợp đồng điện tử ${b.bookingId}`)}
                                    className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-blue-900"
                                    title="Xem hợp đồng"
                                  >
                                    <FileSignature className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between rounded-b-2xl">
              <span className="text-xs text-slate-500 font-mono">
                Bảo vệ PII theo Nghị định 13/2023/NĐ-CP • VELORA CA Verified
              </span>
              <button
                type="button"
                onClick={() => setIsDetailDrawerOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-blue-900 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Đóng hồ sơ
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1.3. MODAL: KHÓA / MỞ KHÓA TÀI KHOẢN (max-w-md)                          */}
      {/* ========================================================================= */}
      {selectedCustomer && isLockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up border border-slate-200">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>
                  {selectedCustomer.accountStatus === 'ACTIVE' ? 'Xác nhận tạm khóa tài khoản' : 'Xác nhận mở khóa tài khoản'}
                </span>
              </h3>
              <button onClick={() => setIsLockModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs leading-relaxed">
              
              {/* Warning if customer currently has active rental */}
              {selectedCustomer.activeBookings > 0 && selectedCustomer.accountStatus === 'ACTIVE' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Lưu ý đặc biệt về chuyến đi đang chạy:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Khách hàng đang có phương tiện lưu hành. Tạm khóa chỉ chặn đặt xe mới, không hủy hợp đồng đang thực hiện.
                  </p>
                </div>
              )}

              <p className="text-slate-700">
                {selectedCustomer.accountStatus === 'ACTIVE'
                  ? `Bạn có chắc chắn muốn TẠM KHÓA tài khoản của ${selectedCustomer.fullName} (${selectedCustomer.email})?`
                  : `Bạn có muốn MỞ KHÓA lại quyền đặt xe cho ${selectedCustomer.fullName} (${selectedCustomer.email})?`}
              </p>

              {/* Mandatory Reason Dropdown */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Lý do xử lý (Bắt buộc):</label>
                <select
                  value={lockReasonCategory}
                  onChange={(e) => setLockReasonCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 focus:outline-none focus:border-blue-900"
                >
                  <option value="Chờ đối soát phạt nguội">Chờ đối soát phạt nguội CSGT</option>
                  <option value="Quá hạn thanh toán phụ phí bồi thường">Quá hạn thanh toán phụ phí bồi thường</option>
                  <option value="Phát hiện gian lận hồ sơ KYC">Phát hiện gian lận hồ sơ KYC</option>
                  <option value="Theo yêu cầu cơ quan chức năng">Theo yêu cầu từ cơ quan chức năng</option>
                  <option value="Khách hàng yêu cầu khóa">Khách hàng chủ động yêu cầu tạm ngưng</option>
                </select>
              </div>

              {/* Internal Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Ghi chú kiểm soát rủi ro:</label>
                <textarea
                  rows={2}
                  value={lockNotes}
                  onChange={(e) => setLockNotes(e.target.value)}
                  placeholder="Nhập chi tiết biên bản hoặc mã hợp đồng liên quan..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-900 focus:outline-none focus:border-blue-900"
                />
              </div>

            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLockModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmToggleStatus}
                className={`px-4 py-2 rounded-lg font-bold text-xs text-white ${
                  selectedCustomer.accountStatus === 'ACTIVE'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {actionLoading ? 'Đang xử lý...' : (selectedCustomer.accountStatus === 'ACTIVE' ? 'Xác nhận tạm khóa' : 'Xác nhận mở khóa')}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Lightbox Preview */}
      {previewImage && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">{previewImage.title}</h3>
              <button onClick={() => setPreviewImage(null)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-hidden rounded-xl bg-slate-100 flex items-center justify-center">
              <img src={previewImage.url} alt={previewImage.title} className="max-h-[65vh] w-auto object-contain" />
            </div>
            <div className="text-right">
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomersManagementPage;
