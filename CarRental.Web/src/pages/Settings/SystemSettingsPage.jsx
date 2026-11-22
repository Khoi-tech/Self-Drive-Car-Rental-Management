import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Percent,
  DollarSign,
  ShieldCheck,
  Info,
  Award,
  Sparkles,
  Gauge
} from 'lucide-react';
import systemSettingsService from '../../services/systemSettingsService';
import { formatCurrencyVND } from '../../utils/formatters';

const DEFAULT_SETTINGS = {
  vietqr_discount_percent: '5',
  fast_hold_deposit_amount: '500000',
  fast_hold_expiry_hours: '4',
  traffic_fine_hold_amount: '2000000',
  traffic_fine_hold_days: '30'
};

const DEFAULT_MEMBERSHIP_TIERS = [
  {
    tier: 'STANDARD',
    label: 'Thành viên Tiêu chuẩn',
    minCompletedTrips: 0,
    minTotalSpend: 0,
    minTrustScore: 0,
    earlyBookingDays: 7,
    earlyBookingDiscountPercent: 0,
    freeCarWash: false,
    bonusKmPerDay: 0,
    perksText: 'Hoàn thành 1 chuyến đầu tiên để lên hạng Silver • Ưu đãi VietQR 5% khi thanh toán trả trước • Hỗ trợ cứu hộ kỹ thuật 24/7'
  },
  {
    tier: 'SILVER',
    label: 'Hội viên Silver',
    minCompletedTrips: 1,
    minTotalSpend: 3000000,
    minTrustScore: 0,
    earlyBookingDays: 7,
    earlyBookingDiscountPercent: 0,
    freeCarWash: false,
    bonusKmPerDay: 10,
    perksText: 'Tặng thêm 10 km/ngày • Ưu đãi VietQR 5% khi thanh toán trả trước • Hỗ trợ cứu hộ kỹ thuật 24/7 toàn quốc'
  },
  {
    tier: 'GOLD',
    label: 'Hội viên Gold',
    minCompletedTrips: 5,
    minTotalSpend: 15000000,
    minTrustScore: 80,
    earlyBookingDays: 7,
    earlyBookingDiscountPercent: 10,
    freeCarWash: true,
    bonusKmPerDay: 20,
    perksText: 'Giảm 10% khi đặt xe trước ≥ 7 ngày • Miễn phí vệ sinh & rửa xe tiêu chuẩn khi trả xe • Tặng thêm 20 km/ngày'
  },
  {
    tier: 'PLATINUM',
    label: 'Hội viên Platinum',
    minCompletedTrips: 10,
    minTotalSpend: 35000000,
    minTrustScore: 90,
    earlyBookingDays: 7,
    earlyBookingDiscountPercent: 10,
    freeCarWash: true,
    bonusKmPerDay: 50,
    perksText: 'Giảm 10% khi đặt xe trước ≥ 7 ngày • Miễn phí vệ sinh & rửa xe tiêu chuẩn • Tặng thêm 50 km/ngày • Hỗ trợ Concierge VIP 24/7'
  }
];

const TIER_CARD_THEME = {
  STANDARD: {
    headerBg: 'bg-slate-50 border-slate-200',
    badge: 'bg-slate-200 text-slate-700',
    accent: 'text-slate-700'
  },
  SILVER: {
    headerBg: 'bg-slate-100/90 border-slate-300',
    badge: 'bg-slate-700 text-white',
    accent: 'text-slate-800'
  },
  GOLD: {
    headerBg: 'bg-amber-50/90 border-amber-200',
    badge: 'bg-amber-500 text-white',
    accent: 'text-amber-900'
  },
  PLATINUM: {
    headerBg: 'bg-indigo-50/90 border-indigo-200',
    badge: 'bg-indigo-700 text-white',
    accent: 'text-indigo-950'
  }
};

const SystemSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'membership'

  // Tab 1: Operational settings
  const [formData, setFormData] = useState(DEFAULT_SETTINGS);
  const [initialData, setInitialData] = useState(DEFAULT_SETTINGS);

  // Tab 2: Membership tiers config
  const [tiers, setTiers] = useState(DEFAULT_MEMBERSHIP_TIERS);
  const [initialTiers, setInitialTiers] = useState(DEFAULT_MEMBERSHIP_TIERS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const [settingsRes, tiersRes] = await Promise.all([
        systemSettingsService.getAllSettings(),
        systemSettingsService.getMembershipTiers()
      ]);

      const list = Array.isArray(settingsRes) ? settingsRes : settingsRes?.data || [];
      const mapped = { ...DEFAULT_SETTINGS };
      list.forEach(item => {
        if (item.key && item.value !== undefined && item.key !== 'membership_tiers_config') {
          mapped[item.key] = String(item.value);
        }
      });
      setFormData(mapped);
      setInitialData(mapped);

      const loadedTiers = tiersRes?.data?.tiers || tiersRes?.tiers || DEFAULT_MEMBERSHIP_TIERS;
      if (Array.isArray(loadedTiers) && loadedTiers.length > 0) {
        setTiers(loadedTiers);
        setInitialTiers(loadedTiers);
      }
    } catch (err) {
      console.error('Lỗi tải cấu hình hệ thống:', err);
      setError('Không thể kết nối máy chủ để nạp cấu hình hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTierChange = (tierCode, field, value) => {
    setTiers(prev =>
      prev.map(t => (t.tier === tierCode ? { ...t, [field]: value } : t))
    );
  };

  const validateGeneral = () => {
    const discount = parseFloat(formData.vietqr_discount_percent);
    if (isNaN(discount) || discount < 0 || discount > 50) {
      return 'Tỷ lệ ưu đãi VietQR phải nằm trong khoảng từ 0% đến 50%.';
    }

    const holdDeposit = parseFloat(formData.fast_hold_deposit_amount);
    if (isNaN(holdDeposit) || holdDeposit < 50000) {
      return 'Tiền cọc Fast Hold tối thiểu là 50.000 VNĐ.';
    }

    const expiryHours = parseInt(formData.fast_hold_expiry_hours, 10);
    if (isNaN(expiryHours) || expiryHours < 1 || expiryHours > 72) {
      return 'Thời hạn giữ chỗ Fast Hold phải từ 1 đến 72 giờ.';
    }

    const fineHold = parseFloat(formData.traffic_fine_hold_amount);
    if (isNaN(fineHold) || fineHold < 0) {
      return 'Số tiền giữ phạt nguội không được âm.';
    }

    const fineDays = parseInt(formData.traffic_fine_hold_days, 10);
    if (isNaN(fineDays) || fineDays < 7 || fineDays > 90) {
      return 'Số ngày giữ phạt nguội phải từ 7 đến 90 ngày (chuẩn quy định 15–30 ngày).';
    }

    return null;
  };

  const validateTiers = () => {
    for (const t of tiers) {
      if (Number(t.minCompletedTrips) < 0 || Number(t.minTotalSpend) < 0) {
        return `Điều kiện chuyến/chi tiêu của hạng ${t.tier} không được âm.`;
      }
      if (Number(t.minTrustScore) < 0 || Number(t.minTrustScore) > 100) {
        return `Điểm tín nhiệm tối thiểu của hạng ${t.tier} phải từ 0 đến 100.`;
      }
      if (Number(t.earlyBookingDays) < 1 || Number(t.earlyBookingDays) > 90) {
        return `Số ngày đặt trước của hạng ${t.tier} phải từ 1 đến 90 ngày.`;
      }
      if (Number(t.earlyBookingDiscountPercent) < 0 || Number(t.earlyBookingDiscountPercent) > 50) {
        return `Phần trăm ưu đãi đặt sớm của hạng ${t.tier} phải từ 0% đến 50%.`;
      }
      if (Number(t.bonusKmPerDay) < 0 || Number(t.bonusKmPerDay) > 500) {
        return `Km tặng thêm/ngày của hạng ${t.tier} phải từ 0 đến 500 km.`;
      }
    }
    return null;
  };

  const handleSubmitGeneral = async (e) => {
    if (e) e.preventDefault();
    const valError = validateGeneral();
    if (valError) {
      setError(valError);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      await systemSettingsService.updateBatch(formData);

      setInitialData(formData);
      setSuccessMsg('Đã cập nhật toàn bộ tham số vận hành thành công (Đã làm mới bộ nhớ đệm cache).');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Lỗi lưu cấu hình:', err);
      setError(err.response?.data?.message || err.message || 'Lỗi khi lưu cấu hình hệ thống.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitTiers = async (e) => {
    if (e) e.preventDefault();
    const valError = validateTiers();
    if (valError) {
      setError(valError);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const normalizedPayload = tiers.map(t => ({
        tier: t.tier,
        label: t.label,
        minCompletedTrips: Number(t.minCompletedTrips) || 0,
        minTotalSpend: Number(t.minTotalSpend) || 0,
        minTrustScore: Number(t.minTrustScore) || 0,
        earlyBookingDays: Number(t.earlyBookingDays) || 7,
        earlyBookingDiscountPercent: Number(t.earlyBookingDiscountPercent) || 0,
        freeCarWash: Boolean(t.freeCarWash),
        bonusKmPerDay: Number(t.bonusKmPerDay) || 0,
        perksText: t.perksText || ''
      }));

      const res = await systemSettingsService.updateMembershipTiers(normalizedPayload);
      const savedTiers = res?.data?.tiers || res?.tiers || normalizedPayload;
      setTiers(savedTiers);
      setInitialTiers(savedTiers);
      setSuccessMsg('Đã lưu cấu hình 4 Hạng thành viên & Ưu đãi thành công! Quyền lợi mới đã đồng bộ tức thì sang Web Khách hàng & Báo giá.');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      console.error('Lỗi lưu cấu hình hạng thành viên:', err);
      setError(err.response?.data?.message || err.message || 'Lỗi khi lưu cấu hình hạng thành viên.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (activeTab === 'general') {
      if (window.confirm('Bạn có chắc chắn muốn đặt lại tất cả tham số vận hành về mặc định đề xuất?')) {
        setFormData(DEFAULT_SETTINGS);
      }
    } else {
      if (window.confirm('Bạn có chắc chắn muốn đặt lại cấu hình 4 hạng thành viên về mặc định đề xuất?')) {
        setTiers(DEFAULT_MEMBERSHIP_TIERS);
      }
    }
  };

  const isGeneralDirty = JSON.stringify(formData) !== JSON.stringify(initialData);
  const isTiersDirty = JSON.stringify(tiers) !== JSON.stringify(initialTiers);
  const isDirty = activeTab === 'general' ? isGeneralDirty : isTiersDirty;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Cài đặt & Tham số Hệ thống</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý hằng số vận hành, ưu đãi VietQR, quỹ phạt nguội và chính sách Hạng thành viên VELORA.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={loading || saving}
            className="px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Tải lại</span>
          </button>
          <button
            type="button"
            onClick={handleResetToDefault}
            disabled={saving}
            className="px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>Mặc định</span>
          </button>
          <button
            type="button"
            onClick={activeTab === 'general' ? handleSubmitGeneral : handleSubmitTiers}
            disabled={saving || !isDirty}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => { setActiveTab('general'); setError(null); }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'general'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Tham số Vận hành</span>
          {isGeneralDirty && <span className="w-2 h-2 rounded-full bg-amber-500" />}
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('membership'); setError(null); }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'membership'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Hạng thành viên & Ưu đãi</span>
          {isTiersDirty && <span className="w-2 h-2 rounded-full bg-amber-500" />}
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Đang nạp cấu hình hệ thống từ máy chủ...</p>
        </div>
      ) : activeTab === 'general' ? (
        <form onSubmit={handleSubmitGeneral} className="space-y-6">
          {/* Card 1: Fast Hold */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-100 text-amber-700 rounded-md">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Cọc Giữ Xe Siêu Tốc (Fast Hold 500k)</h2>
                  <p className="text-[11px] text-slate-500">Quy định mức tiền cọc giữ lịch và thời hạn xác thực hồ sơ giấy tờ.</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[11px] font-semibold rounded-full border border-amber-200">
                Chế độ tức thì
              </span>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Số tiền cọc giữ xe Fast Hold (VNĐ)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="50000"
                    min="50000"
                    value={formData.fast_hold_deposit_amount}
                    onChange={(e) => handleChange('fast_hold_deposit_amount', e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
                  <span>Khách chỉ cần thanh toán mức này để khóa xe tức thì</span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrencyVND(Number(formData.fast_hold_deposit_amount) || 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Thời hạn giữ chỗ Fast Hold (Giờ)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={formData.fast_hold_expiry_hours}
                    onChange={(e) => handleChange('fast_hold_expiry_hours', e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Sau khoảng thời gian này nếu chưa bổ sung đủ cọc/hồ sơ, Background Worker sẽ tự động hủy đơn và giải phóng xe về READY.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: VietQR Online Prepayment Discount */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-100 text-blue-700 rounded-md">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Ưu Đãi Thanh Toán Trực Tuyến VietQR</h2>
                  <p className="text-[11px] text-slate-500">Khuyến khích khách thanh toán tiền thuê xe sớm qua VietQR Napas 247.</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-full border border-blue-200">
                Khuyến mãi
              </span>
            </div>

            <div className="p-5">
              <div className="max-w-md">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tỷ lệ giảm giá khi thanh toán online trước (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={formData.vietqr_discount_percent}
                    onChange={(e) => handleChange('vietqr_discount_percent', e.target.value)}
                    className="w-full pl-9 pr-12 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                  <Percent className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Cộng gộp với chiết khấu dài ngày của bảng giá xe (hiển thị trên trang đặt xe).</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Traffic Fine Holding Fund */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Quỹ Tạm Giữ Đối Soát Phạt Nguội</h2>
                  <p className="text-[11px] text-slate-500">Khoản tiền trích giữ từ tiền cọc khi trả xe để chờ dữ liệu tra cứu Cục CSGT.</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-full border border-emerald-200">
                Hậu kiểm 2 đợt
              </span>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Số tiền tạm giữ đối soát phạt nguội (VNĐ)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="500000"
                    min="0"
                    value={formData.traffic_fine_hold_amount}
                    onChange={(e) => handleChange('traffic_fine_hold_amount', e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
                  <span>Số tiền giữ lại trong phiếu quyết toán</span>
                  <span className="font-semibold text-emerald-700">
                    {formatCurrencyVND(Number(formData.traffic_fine_hold_amount) || 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Thời gian phong tỏa đối soát (Ngày)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="7"
                    max="90"
                    value={formData.traffic_fine_hold_days}
                    onChange={(e) => handleChange('traffic_fine_hold_days', e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Sau khoảng thời gian này (thường từ 15 đến 30 ngày), hệ thống Background Worker tạo cảnh báo nhắc Staff hoàn trả cọc Đợt 2 nếu không phát sinh lỗi phạt nguội.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-200">
            <span className="text-xs text-slate-500 font-medium">
              {isGeneralDirty ? 'Có thay đổi chưa lưu' : 'Dữ liệu đã đồng bộ mới nhất'}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData(initialData)}
                disabled={!isGeneralDirty || saving}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy thay đổi
              </button>
              <button
                type="submit"
                disabled={!isGeneralDirty || saving}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Đang lưu...' : 'Lưu cài đặt'}</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* TAB 2: HẠNG THÀNH VIÊN & ƯU ĐÃI */
        <form onSubmit={handleSubmitTiers} className="space-y-6">
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block mb-0.5">Cấu hình động & Snapshot chống sai lệch đơn cũ</strong>
              <span>
                Thay đổi tại đây áp dụng ngay cho bảng tính hạng, báo giá đặt xe mới, quyết toán trả xe và banner quyền lợi trên trang Khách hàng. Các đơn đã đặt hoặc đã quyết toán trước đó giữ nguyên snapshot mức ưu đãi tại thời điểm giao dịch.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {tiers.map((t) => {
              const theme = TIER_CARD_THEME[t.tier] || TIER_CARD_THEME.STANDARD;
              const isStandard = t.tier === 'STANDARD';

              return (
                <div key={t.tier} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
                  {/* Card Header */}
                  <div className={`px-5 py-3.5 border-b flex items-center justify-between ${theme.headerBg}`}>
                    <div className="flex items-center gap-2.5">
                      <Award className={`w-4 h-4 ${theme.accent}`} />
                      <div>
                        <span className={`text-sm font-extrabold block ${theme.accent}`}>
                          {t.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{t.tier}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${theme.badge}`}>
                      {t.tier}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4 text-xs flex-1">
                    {/* Điều kiện lên hạng */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Chuyến tối thiểu
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          disabled={isStandard}
                          value={t.minCompletedTrips}
                          onChange={(e) => handleTierChange(t.tier, 'minCompletedTrips', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Chi tiêu tối thiểu (đ)
                        </label>
                        <input
                          type="number"
                          step="1000000"
                          min="0"
                          disabled={isStandard}
                          value={t.minTotalSpend}
                          onChange={(e) => handleTierChange(t.tier, 'minTotalSpend', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Tín nhiệm tối thiểu
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={t.minTrustScore}
                          onChange={(e) => handleTierChange(t.tier, 'minTrustScore', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Ưu đãi số */}
                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Đặt trước (ngày)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="90"
                          value={t.earlyBookingDays}
                          onChange={(e) => handleTierChange(t.tier, 'earlyBookingDays', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Giảm đặt sớm (%)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="50"
                          value={t.earlyBookingDiscountPercent}
                          onChange={(e) => handleTierChange(t.tier, 'earlyBookingDiscountPercent', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-slate-400" />
                          <span>Tặng km/ngày</span>
                        </label>
                        <input
                          type="number"
                          step="5"
                          min="0"
                          max="500"
                          value={t.bonusKmPerDay}
                          onChange={(e) => handleTierChange(t.tier, 'bonusKmPerDay', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Toggle Miễn phí rửa xe */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-800 block">Miễn phí rửa xe / vệ sinh tiêu chuẩn</span>
                        <span className="text-[10px] text-slate-500">Tự động miễn 200.000đ phí vệ sinh tại bước Quyết toán trả xe</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTierChange(t.tier, 'freeCarWash', !t.freeCarWash)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          t.freeCarWash ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                            t.freeCarWash ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Mô tả quyền lợi */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Mô tả quyền lợi hiển thị trên Banner Khách hàng (ngăn cách bằng dấu <code className="font-mono">•</code>)
                      </label>
                      <textarea
                        rows={2}
                        value={t.perksText}
                        onChange={(e) => handleTierChange(t.tier, 'perksText', e.target.value)}
                        placeholder="VD: Giảm 10% khi đặt xe trước ≥ 7 ngày • Miễn phí rửa xe tiêu chuẩn"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-200">
            <span className="text-xs text-slate-500 font-medium">
              {isTiersDirty ? 'Có thay đổi cấu hình hạng chưa lưu' : 'Cấu hình hạng thành viên đã đồng bộ'}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTiers(initialTiers)}
                disabled={!isTiersDirty || saving}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy thay đổi
              </button>
              <button
                type="submit"
                disabled={!isTiersDirty || saving}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Đang lưu...' : 'Lưu cấu hình hạng'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default SystemSettingsPage;
