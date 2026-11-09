import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Plus, 
  X, 
  Save, 
  Phone, 
  CreditCard, 
  FileCheck2,
  Eye,
  Upload
} from 'lucide-react';

const INITIAL_DRIVERS = [
  {
    id: 'drv-01',
    fullName: 'Trần Thị Bích Ngọc',
    relationship: 'Vợ / Bạn đồng hành',
    dateOfBirth: '20/11/1994',
    phoneNumber: '0908 112 334',
    idCardNumber: '079194008892',
    licenseNumber: '790184492019',
    licenseClass: 'B1',
    licenseExpiry: '15/10/2029',
    status: 'VERIFIED'
  }
];

const AdditionalDriversSection = () => {
  const [drivers, setDrivers] = useState(INITIAL_DRIVERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [viewingLicense, setViewingLicense] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    relationship: 'Bạn đồng hành',
    dateOfBirth: '',
    phoneNumber: '',
    idCardNumber: '',
    licenseNumber: '',
    licenseClass: 'B2',
    licenseExpiry: '',
    frontLicenseUploaded: false,
    backLicenseUploaded: false
  });

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setFormData({
      fullName: '',
      relationship: 'Bạn đồng hành',
      dateOfBirth: '',
      phoneNumber: '',
      idCardNumber: '',
      licenseNumber: '',
      licenseClass: 'B2',
      licenseExpiry: '',
      frontLicenseUploaded: false,
      backLicenseUploaded: false
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({ ...driver, frontLicenseUploaded: true, backLicenseUploaded: true });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài xế bổ sung này khỏi danh sách?')) {
      setDrivers(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phoneNumber || !formData.idCardNumber || !formData.licenseNumber) {
      alert('Vui lòng điền đầy đủ các trường thông tin bắt buộc.');
      return;
    }

    if (editingDriver) {
      setDrivers(prev => prev.map(d => d.id === editingDriver.id ? { ...formData, id: d.id, status: d.status } : d));
    } else {
      const newDriver = {
        ...formData,
        id: `drv-${Date.now()}`,
        status: 'PENDING' // Chờ thẩm định
      };
      setDrivers(prev => [...prev, newDriver]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Quản lý tài xế bổ sung
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Khai báo và thẩm định giấy tờ người cùng cầm lái để đảm bảo quyền lợi bảo hiểm vật chất và dân sự trọn vẹn trong suốt chuyến đi.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-slate-900 hover:bg-blue-900 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Thêm tài xế cùng lái</span>
        </button>
      </div>

      {/* Notice Banner */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <p className="font-bold">Quy định thẩm định bảo hiểm tài xế đồng hành:</p>
          <p className="text-amber-800 text-[11px]">
            Tài xế cùng lái bắt buộc phải có Giấy phép lái xe hợp lệ (từ hạng B1/B2 trở lên) và được VELORA xác thực trước thời điểm nhận bàn giao xe. Nếu xảy ra va chạm do tài xế chưa đăng ký điều khiển, công ty bảo hiểm sẽ từ chối bồi thường.
          </p>
        </div>
      </div>

      {/* Drivers List */}
      {drivers.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Chưa có tài xế bổ sung</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Bạn có thể đăng ký người thân hoặc bạn đồng hành cùng cầm lái trong các chuyến đi đường dài.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-slate-900 hover:bg-blue-900 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {drivers.map((drv) => {
            const isVerified = drv.status === 'VERIFIED';
            return (
              <div
                key={drv.id}
                className="rounded-xl border border-slate-200 bg-slate-50/40 p-5 space-y-4 hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {drv.fullName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{drv.fullName}</h4>
                      <span className="text-[11px] text-slate-500 font-medium">{drv.relationship}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                    isVerified 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {isVerified ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                    {isVerified ? 'Đã duyệt' : 'Chờ thẩm định'}
                  </span>
                </div>

                {/* Driver Info Specs */}
                <div className="grid grid-cols-2 gap-2.5 p-3 rounded-lg bg-white border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Số điện thoại</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{drv.phoneNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Số CCCD</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{drv.idCardNumber}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">GPLX</span>
                    <span className="font-bold text-blue-900">Hạng {drv.licenseClass}</span>
                    <span className="text-[11px] text-slate-500 ml-1">({drv.licenseNumber})</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Hạn GPLX</span>
                    <span className="font-medium text-slate-700 tabular-nums">{drv.licenseExpiry}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setViewingLicense(drv)}
                    className="text-xs font-semibold text-blue-900 hover:text-blue-950 flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem ảnh GPLX</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(drv)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition cursor-pointer"
                      title="Chỉnh sửa thông tin"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(drv.id)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md border border-transparent hover:border-red-100 transition cursor-pointer"
                      title="Xóa tài xế"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Driver Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-900" />
                <span>{editingDriver ? 'Chỉnh sửa thông tin tài xế' : 'Thêm tài xế cùng lái'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Họ và tên <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Trần Văn B"
                    value={formData.fullName}
                    onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Mối quan hệ</label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData(p => ({ ...p, relationship: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:border-blue-900"
                  >
                    <option value="Vợ / Bạn đồng hành">Vợ / Chồng / Gia đình</option>
                    <option value="Bạn bè / Đồng nghiệp">Bạn bè / Đồng nghiệp</option>
                    <option value="Tài xế riêng">Tài xế riêng</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Số điện thoại <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 0908 123 456"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(p => ({ ...p, phoneNumber: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-900 tabular-nums focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Số CCCD (12 số) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    placeholder="12 chữ số CCCD"
                    value={formData.idCardNumber}
                    onChange={(e) => setFormData(p => ({ ...p, idCardNumber: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-900 tabular-nums focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Số GPLX (12 số) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    placeholder="12 chữ số GPLX"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData(p => ({ ...p, licenseNumber: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-900 tabular-nums focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Hạng bằng</label>
                  <select
                    value={formData.licenseClass}
                    onChange={(e) => setFormData(p => ({ ...p, licenseClass: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:border-blue-900"
                  >
                    <option value="B1">Hạng B1 (Số tự động)</option>
                    <option value="B2">Hạng B2 (Số sàn & tự động)</option>
                    <option value="C">Hạng C</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Ngày hết hạn GPLX</label>
                <input
                  type="text"
                  placeholder="DD/MM/YYYY (VD: 20/12/2030)"
                  value={formData.licenseExpiry}
                  onChange={(e) => setFormData(p => ({ ...p, licenseExpiry: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-900 tabular-nums focus:outline-none focus:border-blue-900"
                />
              </div>

              {/* Photo Upload Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="font-bold text-slate-700 block">Tải ảnh chụp GPLX (Mặt trước & Mặt sau)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setFormData(p => ({ ...p, frontLicenseUploaded: !p.frontLicenseUploaded }))}
                    className={`p-3 rounded-lg border-2 border-dashed text-center cursor-pointer transition ${
                      formData.frontLicenseUploaded ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-300 hover:border-slate-400 text-slate-500'
                    }`}
                  >
                    <Upload className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                    <span className="text-[11px] font-bold block">{formData.frontLicenseUploaded ? '✓ Đã chọn mặt trước' : 'Mặt trước GPLX'}</span>
                  </div>
                  <div 
                    onClick={() => setFormData(p => ({ ...p, backLicenseUploaded: !p.backLicenseUploaded }))}
                    className={`p-3 rounded-lg border-2 border-dashed text-center cursor-pointer transition ${
                      formData.backLicenseUploaded ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-300 hover:border-slate-400 text-slate-500'
                    }`}
                  >
                    <Upload className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                    <span className="text-[11px] font-bold block">{formData.backLicenseUploaded ? '✓ Đã chọn mặt sau' : 'Mặt sau GPLX'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-blue-900 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {editingDriver ? 'Cập nhật tài xế' : 'Gửi thẩm định'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Driver License Modal Viewer */}
      {viewingLicense && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">GPLX Tài xế: {viewingLicense.fullName}</h3>
              <button onClick={() => setViewingLicense(null)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Specimen GPLX Preview */}
            <div className="p-4 bg-gradient-to-tr from-amber-950 via-stone-900 to-amber-900 text-white rounded-xl shadow-md space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[9px] uppercase font-bold text-amber-200">GIẤY PHÉP LÁI XE / DRIVING LICENCE</div>
                  <div className="text-xs font-black text-amber-300 mt-1">HẠNG {viewingLicense.licenseClass}</div>
                </div>
                <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-xs text-amber-300 font-bold">★</div>
              </div>

              <div className="py-1 font-mono text-xs space-y-1">
                <div>Số GPLX: <strong className="text-yellow-300 text-sm tracking-wider">{viewingLicense.licenseNumber}</strong></div>
                <div>Họ tên: <strong className="text-white">{viewingLicense.fullName}</strong></div>
                <div>Hạn sử dụng: <span className="text-emerald-400 font-bold">{viewingLicense.licenseExpiry}</span></div>
                <div>Số CCCD: <span className="text-amber-100">{viewingLicense.idCardNumber}</span></div>
              </div>
            </div>

            <div className="text-right">
              <button
                onClick={() => setViewingLicense(null)}
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

export default AdditionalDriversSection;
