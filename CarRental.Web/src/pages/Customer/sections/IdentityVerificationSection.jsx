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
  QrCode
} from 'lucide-react';

const IdentityVerificationSection = ({ latestRequest = null }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Persona B2C: Nguyễn Hoàng Minh
  const idCardData = {
    number: latestRequest?.customerIdCard || '079092004568',
    fullName: 'NGUYỄN HOÀNG MINH',
    dob: '15/08/1992',
    gender: 'Nam',
    nationality: 'Việt Nam',
    issueDate: '10/05/2021',
    expiryDate: '15/08/2032',
    issuePlace: 'Cục Cảnh sát QLHC về TTXH',
    status: 'VERIFIED'
  };

  // GPLX 12 chữ số hợp lệ
  const licenseData = {
    number: latestRequest?.driverLicenseNumber || '790184920194',
    fullName: 'NGUYỄN HOÀNG MINH',
    licenseClass: latestRequest?.driverLicenseClass || 'B2',
    issueDate: '18/06/2020',
    expiryDate: latestRequest?.driverLicenseExpiry ? new Date(latestRequest.driverLicenseExpiry).toLocaleDateString('vi-VN') : '18/06/2030',
    status: 'VERIFIED',
    issueAuthority: 'Sở Giao thông Vận tải TP. Hồ Chí Minh'
  };

  // Tính số ngày còn lại đến hạn GPLX
  const isExpiringSoon = false; // Có thể bật test nếu < 30 ngày

  const handleSimulateUpload = () => {
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 4000);
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
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1.5 shadow-2xs border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Đã xác thực VNeID & Cổng GPLX</span>
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

            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              ĐÃ XÁC MINH
            </span>
          </div>

          {/* Luxury Specimen CCCD Visual */}
          <div 
            onClick={() => setSelectedImage({ title: 'Căn cước công dân gắn chip (Mặt trước)', isCCCD: true })}
            className="group relative rounded-xl p-4 bg-gradient-to-tr from-cyan-900 via-sky-800 to-indigo-900 text-white shadow-md border border-cyan-400/30 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg"
          >
            {/* Hologram & Microchip decoration */}
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-cyan-400/10 rounded-full blur-xl pointer-events-none"></div>
            
            <div className="flex items-start justify-between mb-3">
              <div className="space-y-0.5">
                <div className="text-[9px] uppercase tracking-widest text-cyan-200 font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div className="text-[8px] text-cyan-100/80">Độc lập - Tự do - Hạnh phúc</div>
                <div className="text-xs font-black tracking-wider text-white mt-1">CĂN CƯỚC CÔNG DÂN / CITIZEN IDENTITY CARD</div>
              </div>
              {/* National Emblem & Gold Chip */}
              <div className="flex flex-col items-end gap-1">
                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-[10px] text-amber-300 font-bold border border-amber-300">★</div>
                <div className="w-8 h-6 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 border border-yellow-200 shadow-inner flex items-center justify-center">
                  <div className="w-4 h-3 border border-amber-800/40 rounded-xs"></div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-center my-2">
              {/* Photo */}
              <div className="w-16 h-20 rounded-md bg-slate-800/80 border border-white/30 flex flex-col items-center justify-center text-center p-1 text-[9px] text-slate-300 shrink-0">
                <span className="font-bold text-white text-xs">HM</span>
                <span className="text-[8px] text-slate-400">Ảnh chân dung</span>
              </div>

              {/* Data fields */}
              <div className="space-y-1 text-[11px] leading-tight">
                <div>
                  <span className="text-cyan-200/80 text-[9px] block">Số / No.:</span>
                  <span className="font-mono font-bold tracking-widest text-sm text-amber-300">{idCardData.number}</span>
                </div>
                <div>
                  <span className="text-cyan-200/80 text-[9px] block">Họ và tên / Full name:</span>
                  <span className="font-bold uppercase tracking-wider text-white">{idCardData.fullName}</span>
                </div>
                <div className="flex gap-3 text-[10px]">
                  <span>Ngày sinh: <strong className="text-cyan-100">{idCardData.dob}</strong></span>
                  <span>Giới tính: <strong className="text-cyan-100">{idCardData.gender}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[9px] text-cyan-200/80">
              <span>Có giá trị đến / Date of exp: <strong className="text-white">{idCardData.expiryDate}</strong></span>
              <span className="flex items-center gap-1 group-hover:text-white transition font-medium">
                <Eye className="w-3 h-3" /> Nhấn để phóng to
              </span>
            </div>
          </div>

          {/* Details specs */}
          <div className="grid grid-cols-2 gap-3 py-3 px-4 bg-white rounded-lg border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Số định danh CCCD</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">{idCardData.number}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Cơ quan cấp</span>
              <span className="font-semibold text-slate-800">{idCardData.issuePlace}</span>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Ngày cấp</span>
              <span className="font-medium text-slate-800 tabular-nums">{idCardData.issueDate}</span>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Hạn sử dụng</span>
              <span className="font-medium text-slate-800 tabular-nums">{idCardData.expiryDate}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSimulateUpload}
            className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Cập nhật ảnh CCCD mới (khi đổi thẻ)</span>
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

            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              ĐÃ XÁC MINH
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
                <span className="font-bold text-amber-300 text-xs">HM</span>
                <span className="text-[8px] text-stone-400">GPLX PET</span>
              </div>

              <div className="space-y-1 text-[11px] leading-tight">
                <div>
                  <span className="text-amber-200/80 text-[9px] block">Số / No. (12 Chữ số):</span>
                  <span className="font-mono font-bold tracking-widest text-sm text-yellow-300">{licenseData.number}</span>
                </div>
                <div>
                  <span className="text-amber-200/80 text-[9px] block">Họ tên / Full name:</span>
                  <span className="font-bold uppercase tracking-wider text-white">{licenseData.fullName}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span>Hạng / Class: <strong className="text-amber-300 font-black text-xs px-1.5 py-0.2 bg-amber-400/20 rounded border border-amber-400/40">{licenseData.licenseClass}</strong></span>
                  <span>Ngày cấp: <strong className="text-white">{licenseData.issueDate}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[9px] text-amber-200/80">
              <span>Có giá trị đến / Expires: <strong className="text-white font-bold">{licenseData.expiryDate}</strong></span>
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
              <span className="font-mono font-bold text-slate-900 tabular-nums">{licenseData.number}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Hạng bằng lái</span>
              <span className="font-black text-blue-900 text-sm">{licenseData.licenseClass} (Ô tô đến 9 chỗ)</span>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Ngày cấp</span>
              <span className="font-medium text-slate-800 tabular-nums">{licenseData.issueDate}</span>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Ngày hết hạn</span>
              <span className="font-bold text-emerald-700 tabular-nums">{licenseData.expiryDate}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSimulateUpload}
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
          Với hạng bằng <strong className="text-blue-950 font-bold">{licenseData.licenseClass}</strong> và thời hạn đến năm <strong className="text-blue-950">{licenseData.expiryDate}</strong>, hồ sơ của bạn đáp ứng tiêu chuẩn điều khiển:
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
            
            <div className="p-4 bg-slate-900 rounded-xl flex items-center justify-center">
              {selectedImage.isCCCD ? (
                <div className="w-full rounded-xl p-5 bg-gradient-to-tr from-cyan-950 via-sky-900 to-indigo-950 text-white shadow-xl border border-cyan-400/40 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-cyan-200">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                      <div className="text-[9px] text-cyan-100/70">Độc lập - Tự do - Hạnh phúc</div>
                      <div className="text-xs font-extrabold text-white mt-1">CĂN CƯỚC CÔNG DÂN</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-xs text-amber-300 font-bold">★</div>
                  </div>
                  <div className="space-y-1.5 py-2 font-mono text-xs">
                    <div>Số: <strong className="text-amber-300 text-sm tracking-widest">{idCardData.number}</strong></div>
                    <div>Họ và tên: <strong className="text-white text-sm">{idCardData.fullName}</strong></div>
                    <div>Ngày sinh: <span className="text-cyan-100">{idCardData.dob}</span></div>
                    <div>Nơi cấp: <span className="text-cyan-100">{idCardData.issuePlace}</span></div>
                    <div>Hạn sử dụng: <span className="text-emerald-400 font-bold">{idCardData.expiryDate}</span></div>
                  </div>
                </div>
              ) : (
                <div className="w-full rounded-xl p-5 bg-gradient-to-tr from-amber-950 via-stone-900 to-amber-900 text-white shadow-xl border border-amber-500/40 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-amber-200">GIẤY PHÉP LÁI XE / DRIVING LICENCE</div>
                      <div className="text-xs font-extrabold text-amber-300 mt-1">BỘ GIAO THÔNG VẬN TẢI VIỆT NAM</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-xs text-amber-300 font-bold">★</div>
                  </div>
                  <div className="space-y-1.5 py-2 font-mono text-xs">
                    <div>Số GPLX (12 số): <strong className="text-yellow-300 text-sm tracking-widest">{licenseData.number}</strong></div>
                    <div>Họ tên: <strong className="text-white text-sm">{licenseData.fullName}</strong></div>
                    <div>Hạng: <strong className="text-amber-300 text-base">{licenseData.licenseClass}</strong></div>
                    <div>Ngày cấp: <span className="text-amber-100">{licenseData.issueDate}</span></div>
                    <div>Giá trị đến: <span className="text-emerald-400 font-bold">{licenseData.expiryDate}</span></div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-right">
              <button
                onClick={() => setSelectedImage(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
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
