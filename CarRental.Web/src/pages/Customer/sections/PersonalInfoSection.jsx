import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Lock, 
  Edit3, 
  Check, 
  Camera, 
  AlertCircle,
  KeyRound,
  Save,
  X,
  Building,
  CreditCard,
  QrCode
} from 'lucide-react';

const PersonalInfoSection = ({ user, onOpenChangePassword }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form state initialized with user info or defaults (B2C Persona: Nguyễn Hoàng Minh)
  const [formData, setFormData] = useState({
    fullName: user?.fullName || 'Nguyễn Hoàng Minh',
    email: user?.email || 'hoangminh.nguyen@gmail.com',
    phoneNumber: user?.phoneNumber || '0908 123 456',
    dateOfBirth: '15/08/1992',
    gender: 'Nam',
    city: 'Hồ Chí Minh',
    district: 'Quận 1',
    addressDetail: '15 Đường Lê Lợi, Phường Bến Nghé',
    bankName: 'Techcombank (Ngân hàng Kỹ Thương)',
    bankAccount: '1903 8920 4910',
    bankHolder: 'NGUYEN HOANG MINH'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    try {
      const savedUser = JSON.parse(localStorage.getItem('velora_user') || '{}');
      const updatedUser = {
        ...savedUser,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        address: `${formData.addressDetail}, ${formData.district}, ${formData.city}`
      };
      localStorage.setItem('velora_user', JSON.stringify(updatedUser));
    } catch { /* ignore */ }

    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Thông tin cá nhân & Tài khoản
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý hồ sơ định danh cá nhân, thông tin liên lạc và tài khoản ngân hàng nhận tiền cọc hoàn trả.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-fade-in">
              <Check className="w-4 h-4" /> Đã lưu thông tin!
            </span>
          )}

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-blue-900 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Chỉnh sửa hồ sơ</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Hủy</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu thay đổi</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Avatar & Verification Status Card */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-xl bg-slate-50/80 border border-slate-200/70">
        <div className="relative group">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-slate-900 via-blue-950 to-blue-900 text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-white">
            {formData.fullName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()}
          </div>
          <button
            type="button"
            className="absolute -bottom-2 -right-2 p-1.5 bg-white text-slate-700 rounded-full border border-slate-300 shadow hover:bg-slate-100 transition cursor-pointer"
            title="Thay đổi ảnh đại diện"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-bold text-slate-900 text-base">{formData.fullName}</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Định danh cấp 2 (VNeID & GPLX Hợp lệ)
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Hồ sơ khách hàng chuẩn hóa B2C của VELORA. Ảnh chân dung được sử dụng đối soát sinh trắc học khi giao nhận phương tiện.
          </p>
        </div>
      </div>

      {/* Profile Form Details */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Họ và tên */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Họ và tên (Theo CCCD) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="fullName"
                disabled={!isEditing}
                value={formData.fullName}
                onChange={handleChange}
                className="w-full bg-white disabled:bg-slate-50 disabled:text-slate-700 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-900 transition"
              />
            </div>
          </div>

          {/* Ngày sinh */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Ngày sinh
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="dateOfBirth"
                disabled={!isEditing}
                value={formData.dateOfBirth}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
                className="w-full bg-white disabled:bg-slate-50 disabled:text-slate-700 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-900 transition tabular-nums"
              />
            </div>
          </div>

          {/* Giới tính */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Giới tính
            </label>
            <select
              name="gender"
              disabled={!isEditing}
              value={formData.gender}
              onChange={handleChange}
              className="w-full bg-white disabled:bg-slate-50 disabled:text-slate-700 border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-900 transition"
            >
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          {/* Email với xác thực */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Email đăng ký
              </label>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                <Check className="w-3 h-3" /> Đã xác thực
              </span>
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                name="email"
                disabled={true}
                value={formData.email}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-700 cursor-not-allowed"
                title="Email đăng ký được dùng để nhận hợp đồng điện tử và biên lai hoàn cọc"
              />
            </div>
          </div>

          {/* Số điện thoại liên hệ */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Số điện thoại liên hệ
              </label>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                <Check className="w-3 h-3" /> Đã nhận SMS OTP
              </span>
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="phoneNumber"
                disabled={!isEditing}
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full bg-white disabled:bg-slate-50 disabled:text-slate-700 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-900 transition tabular-nums"
              />
            </div>
          </div>

          {/* Thành phố / Tỉnh */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Tỉnh / Thành phố
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="city"
                disabled={!isEditing}
                value={formData.city}
                onChange={handleChange}
                className="w-full bg-white disabled:bg-slate-50 disabled:text-slate-700 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-900 transition"
              />
            </div>
          </div>

        </div>

        {/* Địa chỉ chi tiết */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Địa chỉ cụ thể (Nơi giao xe / Thường trú)
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <textarea
              name="addressDetail"
              disabled={!isEditing}
              rows={2}
              value={formData.addressDetail}
              onChange={handleChange}
              className="w-full bg-white disabled:bg-slate-50 disabled:text-slate-700 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-900 transition"
            />
          </div>
        </div>

        {/* Khối: Tài khoản ngân hàng nhận hoàn cọc (VietQR Refund) */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Tài khoản ngân hàng nhận hoàn cọc (VietQR Refund)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Hệ thống tự động chuyển khoản hoàn trả tiền cọc thế chân xe sau khi đối soát vi phạm giao thông / phạt nguội.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" /> Đã liên kết VietQR
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Ngân hàng thụ hưởng</span>
              <input
                type="text"
                name="bankName"
                disabled={!isEditing}
                value={formData.bankName}
                onChange={handleChange}
                className="w-full bg-white disabled:bg-transparent disabled:border-none border border-slate-200 rounded-md px-2.5 py-1.5 font-bold text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Số tài khoản</span>
              <input
                type="text"
                name="bankAccount"
                disabled={!isEditing}
                value={formData.bankAccount}
                onChange={handleChange}
                className="w-full bg-white disabled:bg-transparent disabled:border-none border border-slate-200 rounded-md px-2.5 py-1.5 font-mono font-bold text-blue-900 tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Chủ tài khoản (Viết hoa)</span>
              <input
                type="text"
                name="bankHolder"
                disabled={!isEditing}
                value={formData.bankHolder}
                onChange={handleChange}
                className="w-full bg-white disabled:bg-transparent disabled:border-none border border-slate-200 rounded-md px-2.5 py-1.5 font-bold text-slate-900 uppercase"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons when Editing */}
        {isEditing && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Hủy thay đổi
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu thông tin hồ sơ</span>
            </button>
          </div>
        )}

      </form>

      {/* Security & Password Quick Card */}
      <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5 text-blue-900" />
            Bảo mật & Mật khẩu đăng nhập
          </h3>
          <p className="text-xs text-slate-500">
            Đổi mật khẩu định kỳ để bảo vệ tài khoản và lịch sử giao dịch cọc xe của bạn.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenChangePassword}
          className="px-4 py-2 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <KeyRound className="w-3.5 h-3.5 text-slate-600" />
          <span>Đổi mật khẩu</span>
        </button>
      </div>
    </div>
  );
};

export default PersonalInfoSection;
