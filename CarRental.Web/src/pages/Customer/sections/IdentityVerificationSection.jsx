import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CreditCard, 
  FileCheck2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Upload, 
  Eye, 
  ChevronRight,
  Info,
  Calendar,
  Award,
  Sparkles,
  ExternalLink,
  X,
  AlertTriangle,
  QrCode,
  Save
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import customerService from '../../../services/customerService';

const IdentityVerificationSection = ({ latestRequest = null }) => {
  const { user, refreshUser } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Real user data from DB (backed by app_users)
  const fullName = user?.fullName || latestRequest?.customerName || 'KHÁCH HÀNG VELORA';
  const idCardNumber = user?.idCardNumber || latestRequest?.customerIdCard || '079092004568';
  const driverLicenseNumber = user?.driverLicenseNumber || latestRequest?.driverLicenseNumber || '790184920194';
  const driverLicenseClass = user?.driverLicenseClass || latestRequest?.driverLicenseClass || 'B2';
  
  const licenseExpiryObj = user?.driverLicenseExpiry ? new Date(user.driverLicenseExpiry) : (latestRequest?.driverLicenseExpiry ? new Date(latestRequest.driverLicenseExpiry) : null);
  const licenseExpiryFormatted = licenseExpiryObj ? licenseExpiryObj.toLocaleDateString('vi-VN') : '18/06/2030';
  const isExpiringSoon = licenseExpiryObj ? licenseExpiryObj <= new Date(Date.now() + 30 * 24 * 3600 * 1000) : false;

  const kycStatus = user?.kycStatus || (user?.idCardNumber ? 'VERIFIED' : 'PENDING');

  const [formData, setFormData] = useState({
    idCardNumber: user?.idCardNumber || '',
    driverLicenseNumber: user?.driverLicenseNumber || '',
    driverLicenseClass: user?.driverLicenseClass || 'B2',
    driverLicenseExpiry: user?.driverLicenseExpiry ? user.driverLicenseExpiry.split('T')[0] : '',
    idCardFrontUrl: user?.idCardFrontUrl || '',
    idCardBackUrl: user?.idCardBackUrl || '',
    driverLicenseFrontUrl: user?.driverLicenseFrontUrl || '',
    driverLicenseBackUrl: user?.driverLicenseBackUrl || ''
  });

  const handleOpenModal = () => {
    setError(null);
    setFormData({
      idCardNumber: user?.idCardNumber || latestRequest?.customerIdCard || '',
      driverLicenseNumber: user?.driverLicenseNumber || latestRequest?.driverLicenseNumber || '',
      driverLicenseClass: user?.driverLicenseClass || latestRequest?.driverLicenseClass || 'B2',
      driverLicenseExpiry: user?.driverLicenseExpiry ? user.driverLicenseExpiry.split('T')[0] : '',
      idCardFrontUrl: user?.idCardFrontUrl || '',
      idCardBackUrl: user?.idCardBackUrl || '',
      driverLicenseFrontUrl: user?.driverLicenseFrontUrl || '',
      driverLicenseBackUrl: user?.driverLicenseBackUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!formData.idCardNumber.trim() || !formData.driverLicenseNumber.trim()) {
      setError('Vui lòng nhập đầy đủ số CCCD và số Giấy phép lái xe.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await customerService.updateMyKyc(formData);
      if (refreshUser) {
        await refreshUser();
      }
      setUploadSuccess(true);
      setIsModalOpen(false);
      setTimeout(() => setUploadSuccess(false), 5000);
    } catch (err) {
      console.error('Update KYC failed:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ KYC.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Xác minh danh tính & Giấy phép lái xe
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hồ sơ pháp lý điện tử phục vụ điều kiện giao nhận xe tự lái cao cấp theo Nghị định 13/2023/NĐ-CP và Luật Giao thông đường bộ.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs border ${
            kycStatus === 'VERIFIED'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : kycStatus === 'REJECTED'
              ? 'bg-red-100 text-red-800 border-red-200'
              : 'bg-amber-100 text-amber-800 border-amber-200'
          }`}>
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>
              {kycStatus === 'VERIFIED' ? 'Đã xác thực VNeID & Cổng GPLX' : (kycStatus === 'REJECTED' ? 'Cần bổ sung hồ sơ KYC' : 'Đang chờ thẩm định')}
            </span>
          </span>
        </div>
      </div>

      {uploadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã gửi hồ sơ cập nhật mới! Ban pháp chế VELORA sẽ thẩm định trong 15 phút.</span>
          </div>
          <button onClick={() => setUploadSuccess(false)}><X className="w-4 h-4 text-emerald-700 cursor-pointer" /></button>
        </div>
      )}

      {/* KYC Grid: 2 Specimen Cards (CCCD & GPLX) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Căn cước công dân gắn chip (Specimen Card) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 sm:p-6 space-y-5 hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-900 text-white flex items-center justify-center shadow-xs">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Căn cước công dân gắn chip</h3>
                <span className="text-[11px] text-slate-500 font-medium">Định danh quốc gia (VNeID Cấp 2)</span>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border flex items-center gap-1 ${
              kycStatus === 'VERIFIED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <CheckCircle2 className="w-3 h-3" />
              {kycStatus === 'VERIFIED' ? 'ĐÃ XÁC MINH' : 'CHỜ DUYỆT'}
            </span>
          </div>

          {/* Luxury Specimen CCCD Visual */}
          <div 
            onClick={() => setSelectedImage({ title: 'Căn cước công dân gắn chip (Mặt trước)', isCCCD: true })}
            className="group relative rounded-xl p-4 bg-gradient-to-tr from-cyan-900 via-sky-800 to-indigo-900 text-white shadow-md border border-cyan-400/30 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg"
          >
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-cyan-400/10 rounded-full blur-xl pointer-events-none"></div>
            
            <div className="flex items-start justify-between mb-3">
              <div className="space-y-0.5">
                <div className="text-[9px] uppercase tracking-widest text-cyan-200 font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div className="text-[8px] text-cyan-100/80">Độc lập - Tự do - Hạnh phúc</div>
                <div className="text-xs font-black tracking-wider text-white mt-1">CĂN CƯỚC CÔNG DÂN / CITIZEN IDENTITY CARD</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-[10px] text-amber-300 font-bold border border-amber-300">★</div>
                <div className="w-8 h-6 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 border border-yellow-200 shadow-inner flex items-center justify-center">
                  <div className="w-4 h-3 border border-amber-800/40 rounded-xs"></div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-center my-2">
              <div className="w-16 h-20 rounded-md bg-slate-800/80 border border-white/30 flex flex-col items-center justify-center text-center p-1 text-[9px] text-slate-300 shrink-0">
                <span className="font-bold text-white text-xs">VELORA</span>
                <span className="text-[8px] text-slate-400">Ảnh CCCD</span>
              </div>

              <div className="space-y-1 text-[11px] leading-tight">
                <div>
                  <span className="text-cyan-200/80 text-[9px] block">Số / No.:</span>
                  <span className="font-mono font-bold tracking-widest text-sm text-amber-300">{idCardNumber}</span>
                </div>
                <div>
                  <span className="text-cyan-200/80 text-[9px] block">Họ và tên / Full name:</span>
                  <span className="font-bold uppercase tracking-wider text-white">{fullName}</span>
                </div>
                <div className="flex gap-3 text-[10px]">
                  <span>Quốc tịch: <strong className="text-cyan-100">Việt Nam</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[9px] text-cyan-200/80">
              <span>Trạng thái: <strong className="text-white">{kycStatus}</strong></span>
              <span className="flex items-center gap-1 group-hover:text-white transition font-medium">
                <Eye className="w-3 h-3" /> Nhấn để phóng to
              </span>
            </div>
          </div>

          {/* Details specs */}
          <div className="grid grid-cols-2 gap-3 py-3 px-4 bg-white rounded-lg border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Số định danh CCCD</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">{idCardNumber}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Cơ quan cấp</span>
              <span className="font-semibold text-slate-800">Cục Cảnh sát QLHC về TTXH</span>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Chủ thẻ</span>
              <span className="font-medium text-slate-800">{fullName}</span>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Tình trạng KYC</span>
              <span className="font-bold text-emerald-700">{kycStatus}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenModal}
            className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Cập nhật thông tin & ảnh CCCD mới</span>
          </button>
        </div>

        {/* Card 2: Giấy phép lái xe (GPLX PET 12 số) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 sm:p-6 space-y-5 hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Giấy phép lái xe (GPLX)</h3>
                <span className="text-[11px] text-slate-500 font-medium">Thẻ nhựa PET chuẩn Bộ GTVT</span>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border flex items-center gap-1 ${
              kycStatus === 'VERIFIED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <CheckCircle2 className="w-3 h-3" />
              {kycStatus === 'VERIFIED' ? 'ĐÃ XÁC MINH' : 'CHỜ DUYỆT'}
            </span>
          </div>

          {/* Luxury Specimen GPLX Visual */}
          <div 
            onClick={() => setSelectedImage({ title: 'Giấy phép lái xe PET (Mặt trước)', isGPLX: true })}
            className="group relative rounded-xl p-4 bg-gradient-to-tr from-amber-950 via-stone-900 to-amber-900 text-white shadow-md border border-amber-500/30 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="space-y-0.5">
                <div className="text-[9px] uppercase tracking-widest text-amber-200 font-bold">GIẤY PHÉP LÁI XE / DRIVING LICENCE</div>
                <div className="text-[8px] text-amber-100/70">VIETNAM MOTOR VEHICLE DRIVER'S LICENCE</div>
                <div className="text-xs font-black tracking-wider text-amber-300 mt-1">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-xs text-amber-300 font-bold border border-amber-300">
                ★
              </div>
            </div>

            <div className="flex gap-4 items-center my-2">
              <div className="w-16 h-20 rounded-md bg-stone-800/90 border border-amber-300/30 flex flex-col items-center justify-center text-center p-1 text-[9px] text-stone-300 shrink-0">
                <span className="font-bold text-amber-300 text-xs">VELORA</span>
                <span className="text-[8px] text-stone-400">GPLX PET</span>
              </div>

              <div className="space-y-1 text-[11px] leading-tight">
                <div>
                  <span className="text-amber-200/80 text-[9px] block">Số / No. (12 Chữ số):</span>
                  <span className="font-mono font-bold tracking-widest text-sm text-yellow-300">{driverLicenseNumber}</span>
                </div>
                <div>
                  <span className="text-amber-200/80 text-[9px] block">Họ tên / Full name:</span>
                  <span className="font-bold uppercase tracking-wider text-white">{fullName}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span>Hạng / Class: <strong className="text-amber-300 font-black text-xs px-1.5 py-0.2 bg-amber-400/20 rounded border border-amber-400/40">{driverLicenseClass}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[9px] text-amber-200/80">
              <span>Có giá trị đến / Expires: <strong className="text-white font-bold">{licenseExpiryFormatted}</strong></span>
              <span className="flex items-center gap-1 group-hover:text-white transition font-medium">
                <Eye className="w-3 h-3" /> Nhấn để phóng to
              </span>
            </div>
          </div>

          {/* Smart Expiry Warning if applicable */}
          {isExpiringSoon && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold block">GPLX sắp hết hạn trong 30 ngày:</span>
                <span className="text-[11px] text-amber-800">Vui lòng cập nhật GPLX mới gia hạn để đảm bảo điều kiện nhận xe.</span>
              </div>
            </div>
          )}

          {/* Details specs */}
          <div className="grid grid-cols-2 gap-3 py-3 px-4 bg-white rounded-lg border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Số GPLX (12 số)</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">{driverLicenseNumber}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Hạng bằng lái</span>
              <span className="font-black text-blue-900 text-sm">{driverLicenseClass} (Ô tô đến 9 chỗ)</span>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Chủ sở hữu</span>
              <span className="font-medium text-slate-800">{fullName}</span>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Ngày hết hạn</span>
              <span className="font-bold text-emerald-700 tabular-nums">{licenseExpiryFormatted}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenModal}
            className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Cập nhật giấy phép lái xe gia hạn</span>
          </button>
        </div>

      </div>

      {/* License Requirement Matrix */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/70 space-y-3">
        <div className="flex items-center gap-2 text-blue-950 font-bold text-xs uppercase tracking-wider">
          <Award className="w-4 h-4 text-blue-900" />
          <span>Ma trận thẩm định điều kiện lái xe VELORA</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Với hạng bằng <strong className="text-blue-950 font-bold">{driverLicenseClass}</strong> và thời hạn đến ngày <strong className="text-blue-950">{licenseExpiryFormatted}</strong>, hồ sơ của bạn đáp ứng tiêu chuẩn điều khiển:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Xe Sedan & Coupe Hạng Sang
            </span>
            <p className="text-[11px] text-slate-500">Porsche Taycan 4S, BMW 320i / 530i, Mercedes C/E-Class</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Xe SUV & Crossover 7 chỗ
            </span>
            <p className="text-[11px] text-slate-500">Ford Explorer, Kia Carnival, VinFast VF8/VF9</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Xe Thể thao Hiệu năng cao
            </span>
            <p className="text-[11px] text-slate-500">Porsche Macan GTS, BMW M4 Competition</p>
          </div>
        </div>
      </div>

      {/* KYC Update Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-900" />
                <span>Cập nhật hồ sơ định danh CCCD & GPLX</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleKycSubmit} className="space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block text-xs">Số Căn cước công dân (12 số) *</label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={formData.idCardNumber}
                    onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                    placeholder="VD: 079092004568"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-semibold text-slate-900 focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block text-xs">Số Giấy phép lái xe *</label>
                    <input
                      type="text"
                      required
                      maxLength={12}
                      value={formData.driverLicenseNumber}
                      onChange={(e) => setFormData({ ...formData, driverLicenseNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                      placeholder="VD: 790184920194"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-semibold text-slate-900 focus:outline-none focus:border-blue-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block text-xs">Hạng GPLX</label>
                    <select
                      value={formData.driverLicenseClass}
                      onChange={(e) => setFormData({ ...formData, driverLicenseClass: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:border-blue-900"
                    >
                      <option value="B1">B1 (Số tự động)</option>
                      <option value="B2">B2 (Số sàn & số tự động)</option>
                      <option value="C">Hạng C</option>
                      <option value="D">Hạng D</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 block text-xs">Ngày hết hạn Giấy phép lái xe</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setFullYear(d.getFullYear() + 5);
                          setFormData({ ...formData, driverLicenseExpiry: d.toISOString().split('T')[0] });
                        }}
                        className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-bold"
                      >
                        +5 năm
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setFullYear(d.getFullYear() + 10);
                          setFormData({ ...formData, driverLicenseExpiry: d.toISOString().split('T')[0] });
                        }}
                        className="px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-900 text-[9px] font-extrabold border border-blue-200"
                      >
                        +10 năm (B2)
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    value={formData.driverLicenseExpiry}
                    onChange={(e) => setFormData({ ...formData, driverLicenseExpiry: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:border-blue-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px] leading-relaxed">
                ℹ️ Sau khi nhấn gửi, hồ sơ sẽ được tự động đồng bộ vào cơ sở dữ liệu VELORA và chuyển trạng thái <strong>CHỜ DUYỆT (PENDING)</strong> để chuyên viên pháp chế kiểm tra tính hợp lệ trước khi ký hợp đồng tiếp theo.
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-blue-900 disabled:bg-slate-400 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{submitting ? 'Đang lưu...' : 'Gửi thẩm định'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Specimen Cards */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">{selectedImage.title}</h3>
              <button onClick={() => setSelectedImage(null)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 bg-slate-900 rounded-xl text-center text-white space-y-2">
              <div className="text-sm font-bold">{selectedImage.isCCCD ? 'CĂN CƯỚC CÔNG DÂN GẮN CHIP' : 'GIẤY PHÉP LÁI XE'}</div>
              <div className="font-mono text-xs text-amber-300">{selectedImage.isCCCD ? idCardNumber : driverLicenseNumber}</div>
              <div className="text-xs uppercase">{fullName}</div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedImage(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
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

export default IdentityVerificationSection;
