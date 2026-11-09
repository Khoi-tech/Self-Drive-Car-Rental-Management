import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  UploadCloud, 
  CreditCard, 
  FileCheck2, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  X, 
  AlertCircle,
  Sparkles,
  Camera,
  RotateCcw
} from 'lucide-react';
import rentalRequestService from '../../../services/rentalRequestService';

// Compress image via HTML5 Canvas to keep Base64 payloads crisp and lightweight (~150KB)
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const FastHoldDocumentModal = ({ isOpen, onClose, rentalRequest, onSuccess }) => {
  if (!isOpen || !rentalRequest) return null;

  const getInitialValue = (val) => (!val || val === 'CHƯA_CẬP_NHẬT' ? '' : val);

  const [idCardNumber, setIdCardNumber] = useState(getInitialValue(rentalRequest.customerIdCard));
  const [driverLicenseNumber, setDriverLicenseNumber] = useState(getInitialValue(rentalRequest.driverLicenseNumber));
  const [driverLicenseClass, setDriverLicenseClass] = useState(rentalRequest.driverLicenseClass || 'B2');
  const [driverLicenseExpiry, setDriverLicenseExpiry] = useState(
    rentalRequest.driverLicenseExpiry ? new Date(rentalRequest.driverLicenseExpiry).toISOString().split('T')[0] : '2028-12-31'
  );

  // 4 Document Photo Slots with real files & previews
  const [idFrontPreview, setIdFrontPreview] = useState(rentalRequest.idCardFrontUrl || '');
  const [idBackPreview, setIdBackPreview] = useState(rentalRequest.idCardBackUrl || '');
  const [licenseFrontPreview, setLicenseFrontPreview] = useState(rentalRequest.driverLicenseFrontUrl || '');
  const [licenseBackPreview, setLicenseBackPreview] = useState(rentalRequest.driverLicenseBackUrl || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Sync state whenever rentalRequest prop changes
  useEffect(() => {
    if (rentalRequest) {
      setIdCardNumber(getInitialValue(rentalRequest.customerIdCard));
      setDriverLicenseNumber(getInitialValue(rentalRequest.driverLicenseNumber));
      setDriverLicenseClass(rentalRequest.driverLicenseClass || 'B2');
      if (rentalRequest.driverLicenseExpiry) {
        setDriverLicenseExpiry(new Date(rentalRequest.driverLicenseExpiry).toISOString().split('T')[0]);
      }
      setIdFrontPreview(rentalRequest.idCardFrontUrl || '');
      setIdBackPreview(rentalRequest.idCardBackUrl || '');
      setLicenseFrontPreview(rentalRequest.driverLicenseFrontUrl || '');
      setLicenseBackPreview(rentalRequest.driverLicenseBackUrl || '');
    }
  }, [rentalRequest]);

  // File selection handler
  const handleFileChange = async (e, setPreview) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setPreview(compressed);
        if (error) setError(null);
      } catch (err) {
        console.error('File load error:', err);
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result);
        reader.readAsDataURL(file);
      }
    }
  };

  // Quick Demo: load verified specimen ID & license data instantly
  const handleLoadDemoSpecimen = () => {
    setIdCardNumber('079092004568');
    setDriverLicenseNumber('790184920194');
    setDriverLicenseClass('B2');
    setDriverLicenseExpiry('2032-08-15');
    setIdFrontPreview('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80');
    setIdBackPreview('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80');
    setLicenseFrontPreview('https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80');
    setLicenseBackPreview('https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80');
    setError(null);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);

    const cccd = idCardNumber?.trim();
    const gplx = driverLicenseNumber?.trim();

    if (!cccd) {
      setError('Vui lòng nhập số CCCD (Căn cước công dân).');
      return;
    }
    if (!gplx) {
      setError('Vui lòng nhập số Giấy phép lái xe.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        customerIdCard: cccd,
        driverLicenseNumber: gplx,
        driverLicenseClass: driverLicenseClass || 'B2',
        driverLicenseExpiry: driverLicenseExpiry ? new Date(driverLicenseExpiry).toISOString() : null,
        idCardFrontUrl: idFrontPreview || '',
        idCardBackUrl: idBackPreview || '',
        driverLicenseFrontUrl: licenseFrontPreview || '',
        driverLicenseBackUrl: licenseBackPreview || ''
      };

      await rentalRequestService.updateDocuments(rentalRequest.id, payload);

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Update documents error:', err);
      setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>Bổ Sung Hồ Sơ Giấy Tờ (Fast Hold 500K)</span>
              </h3>
              <span className="text-[11px] text-slate-300 font-mono">
                Mã đơn: #{rentalRequest.id.substring(0, 8).toUpperCase()} • {rentalRequest.carMake} {rentalRequest.carModel}
              </span>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Info Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Đơn thuê đã <strong>giữ chỗ thành công</strong> với khoản cọc 500.000đ. Vui lòng cung cấp <strong>CCCD & GPLX</strong> để VELORA lập hợp đồng giao nhận xe.
              </p>
            </div>

            {/* Quick Demo Button */}
            <button
              type="button"
              onClick={handleLoadDemoSpecimen}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[11px] transition shrink-0 shadow-2xs cursor-pointer"
              title="Điền sẵn số và nạp 4 ảnh giấy tờ mẫu đạt chuẩn để kiểm thử nhanh"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nạp ảnh mẫu nhanh</span>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2 font-bold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Đã lưu và mã hóa hồ sơ định danh thành công! Đang chuyển hướng...</span>
            </div>
          )}

          {/* Form with NO native HTML5 validation to prevent intrusive browser popups */}
          <form id="fast-hold-doc-form" noValidate onSubmit={handleSubmit} className="space-y-4">
            
            {/* Row 1: Số CCCD & Số GPLX */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  Số CCCD gắn chip (12 chữ số) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customerIdCard"
                  value={idCardNumber}
                  onChange={(e) => {
                    setIdCardNumber(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="VD: 079092004568"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 font-semibold text-slate-900 focus:outline-none focus:border-blue-900 focus:bg-white tabular-nums transition"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  Số Giấy phép lái xe <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="driverLicenseNumber"
                  value={driverLicenseNumber}
                  onChange={(e) => {
                    setDriverLicenseNumber(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="VD: 790184920194"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 font-semibold text-slate-900 focus:outline-none focus:border-blue-900 focus:bg-white tabular-nums transition"
                />
              </div>
            </div>

            {/* Row 2: Hạng bằng & Ngày hết hạn */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Hạng Giấy phép lái xe</label>
                <select
                  name="driverLicenseClass"
                  value={driverLicenseClass}
                  onChange={(e) => setDriverLicenseClass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 font-semibold text-slate-900 focus:outline-none focus:border-blue-900 focus:bg-white transition"
                >
                  <option value="B1_AUTO">Hạng B1 — Số tự động (Không được lái số sàn)</option>
                  <option value="B1">Hạng B1 — Cơ học (Số sàn & tự động)</option>
                  <option value="B2">Hạng B2 — Xe đến 9 chỗ (Số sàn & tự động)</option>
                  <option value="C">Hạng C — Xe tải & du lịch</option>
                  <option value="D">Hạng D — Xe chở người đến 30 chỗ</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Ngày hết hạn GPLX</label>
                <input
                  type="date"
                  name="driverLicenseExpiry"
                  value={driverLicenseExpiry}
                  onChange={(e) => setDriverLicenseExpiry(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 font-semibold text-slate-900 focus:outline-none focus:border-blue-900 focus:bg-white transition"
                />
              </div>
            </div>

            {/* 4 UPLOAD SLOTS VISIBLE ALL AT ONCE (4 Columns on Desktop, 2 on Mobile) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 block text-xs">
                  Tải 4 ảnh giấy tờ định danh (CCCD & GPLX):
                </label>
                <span className="text-[11px] text-slate-500">Bấm vào từng ô để tải ảnh từ máy</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                
                {/* Slot 1: CCCD Mặt trước */}
                <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50 hover:bg-white transition space-y-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                    <span className="truncate">1. CCCD Trước</span>
                    {idFrontPreview && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </div>

                  {idFrontPreview ? (
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 group">
                      <img src={idFrontPreview} alt="CCCD Trước" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setIdFrontPreview('')}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-black/90 text-white rounded transition cursor-pointer"
                        title="Xóa để chọn lại"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 hover:border-blue-900 hover:bg-blue-50/20 rounded-lg aspect-[4/3] flex flex-col items-center justify-center p-2 text-center cursor-pointer transition">
                      <Camera className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="font-bold text-slate-700 text-[10px]">Tải ảnh lên</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleFileChange(e, setIdFrontPreview)} 
                      />
                    </label>
                  )}
                </div>

                {/* Slot 2: CCCD Mặt sau */}
                <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50 hover:bg-white transition space-y-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                    <span className="truncate">2. CCCD Sau</span>
                    {idBackPreview && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </div>

                  {idBackPreview ? (
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 group">
                      <img src={idBackPreview} alt="CCCD Sau" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setIdBackPreview('')}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-black/90 text-white rounded transition cursor-pointer"
                        title="Xóa để chọn lại"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 hover:border-blue-900 hover:bg-blue-50/20 rounded-lg aspect-[4/3] flex flex-col items-center justify-center p-2 text-center cursor-pointer transition">
                      <Camera className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="font-bold text-slate-700 text-[10px]">Tải ảnh lên</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleFileChange(e, setIdBackPreview)} 
                      />
                    </label>
                  )}
                </div>

                {/* Slot 3: GPLX Mặt trước */}
                <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50 hover:bg-white transition space-y-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                    <span className="truncate">3. GPLX Trước</span>
                    {licenseFrontPreview && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </div>

                  {licenseFrontPreview ? (
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 group">
                      <img src={licenseFrontPreview} alt="GPLX Trước" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setLicenseFrontPreview('')}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-black/90 text-white rounded transition cursor-pointer"
                        title="Xóa để chọn lại"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 hover:border-blue-900 hover:bg-blue-50/20 rounded-lg aspect-[4/3] flex flex-col items-center justify-center p-2 text-center cursor-pointer transition">
                      <Camera className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="font-bold text-slate-700 text-[10px]">Tải ảnh lên</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleFileChange(e, setLicenseFrontPreview)} 
                      />
                    </label>
                  )}
                </div>

                {/* Slot 4: GPLX Mặt sau */}
                <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50 hover:bg-white transition space-y-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                    <span className="truncate">4. GPLX Sau</span>
                    {licenseBackPreview && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </div>

                  {licenseBackPreview ? (
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 group">
                      <img src={licenseBackPreview} alt="GPLX Sau" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setLicenseBackPreview('')}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-black/90 text-white rounded transition cursor-pointer"
                        title="Xóa để chọn lại"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 hover:border-blue-900 hover:bg-blue-50/20 rounded-lg aspect-[4/3] flex flex-col items-center justify-center p-2 text-center cursor-pointer transition">
                      <Camera className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="font-bold text-slate-700 text-[10px]">Tải ảnh lên</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleFileChange(e, setLicenseBackPreview)} 
                      />
                    </label>
                  )}
                </div>

              </div>
            </div>

          </form>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            {loading ? (
              <span>Đang lưu và mã hóa hồ sơ...</span>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Gửi hồ sơ thẩm định ngay</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default FastHoldDocumentModal;
