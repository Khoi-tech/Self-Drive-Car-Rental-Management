import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Zap, 
  CreditCard, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Percent, 
  DollarSign, 
  ShieldCheck,
  Info
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

const SystemSettingsPage = () => {
  const [formData, setFormData] = useState(DEFAULT_SETTINGS);
  const [initialData, setInitialData] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await systemSettingsService.getAllSettings();
      const list = Array.isArray(res) ? res : res?.data || [];

      const mapped = { ...DEFAULT_SETTINGS };
      list.forEach(item => {
        if (item.key && item.value !== undefined) {
          mapped[item.key] = String(item.value);
        }
      });

      setFormData(mapped);
      setInitialData(mapped);
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

  const validate = () => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valError = validate();
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
      setSuccessMsg('Đã cập nhật toàn bộ tham số cấu hình hệ thống thành công (Đã làm mới bộ nhớ đệm cache).');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Lỗi lưu cấu hình:', err);
      setError(err.response?.data?.message || err.message || 'Lỗi khi lưu cấu hình hệ thống.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại tất cả tham số về mặc định đề xuất?')) {
      setFormData(DEFAULT_SETTINGS);
    }
  };

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
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
                Quản lý các hằng số nghiệp vụ, tỷ lệ ưu đãi trực tuyến, tiền cọc Fast Hold và quỹ giữ phạt nguội.
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
            onClick={handleSubmit}
            disabled={saving || !isDirty}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
          </button>
        </div>
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
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
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
              {isDirty ? 'Có thay đổi chưa lưu' : 'Dữ liệu đã đồng bộ mới nhất'}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData(initialData)}
                disabled={!isDirty || saving}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy thay đổi
              </button>
              <button
                type="submit"
                disabled={!isDirty || saving}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Đang lưu...' : 'Lưu cài đặt'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default SystemSettingsPage;
