import React, { useState } from 'react';
import { AlertTriangle, MapPin, Camera, PhoneCall, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import incidentService from '../../services/incidentService';

const INCIDENT_TYPES = [
  { value: 'COLLISION', label: 'Va chạm / Tai nạn giao thông', icon: '💥' },
  { value: 'BREAKDOWN', label: 'Chết máy / Hỏng hóc động cơ', icon: '⚙️' },
  { value: 'FLAT_TIRE', label: 'Thủng / Nổ lốp xe', icon: '🛞' },
  { value: 'FLOOD', label: 'Thủy kích / Ngập nước', icon: '🌊' },
  { value: 'OTHER', label: 'Sự cố kỹ thuật khác', icon: '⚠️' }
];

const SEVERITY_LEVELS = [
  { value: 'LOW', label: 'Nhẹ', desc: 'Xe vẫn di chuyển được, trầy xước nhẹ' },
  { value: 'MEDIUM', label: 'Trung bình', desc: 'Cần hướng dẫn kỹ thuật hoặc vá lốp' },
  { value: 'HIGH', label: 'Nghiêm trọng', desc: 'Xe không chạy được, cần điều cứu hộ' }
];

const IncidentModal = ({ isOpen, onClose, rentalRequest, onSuccess }) => {
  const [incidentType, setIncidentType] = useState('COLLISION');
  const [severity, setSeverity] = useState('MEDIUM');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrls, setPhotoUrls] = useState('');
  const [hasInjuries, setHasInjuries] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !rentalRequest) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location.trim()) {
      setError('Vui lòng nhập địa chỉ / vị trí hiện tại xảy ra sự cố.');
      return;
    }
    if (!description.trim()) {
      setError('Vui lòng mô tả chi tiết sự việc.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await incidentService.create({
        rentalRequestId: rentalRequest.id,
        incidentType,
        severity,
        location: location.trim(),
        description: description.trim(),
        photoUrls: photoUrls.trim(),
        hasInjuries
      });

      alert('Đã gửi báo cáo sự cố khẩn cấp thành công! Đội cứu hộ VELORA sẽ gọi ngay cho bạn theo số điện thoại: ' + rentalRequest.customerPhone);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi báo cáo sự cố.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Báo Cáo Sự Cố Khẩn Cấp (US-09)</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Phương tiện: <strong className="text-zinc-200">{rentalRequest.carMake} {rentalRequest.carModel}</strong> ({rentalRequest.carLicensePlate})
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition">
            <X size={20} />
          </button>
        </div>

        {/* Hotline Bar */}
        <div className="p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-2xl flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <PhoneCall size={18} className="text-rose-400 animate-pulse" />
            <span>Hotline Cứu Hộ 24/7 khẩn cấp:</span>
          </div>
          <a href="tel:19006868" className="font-mono font-bold text-white text-sm bg-rose-600 px-3 py-1 rounded-lg shadow-sm">
            1900 6868
          </a>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Loại sự cố */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Loại sự cố gặp phải *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INCIDENT_TYPES.map(type => (
                <button
                  type="button"
                  key={type.value}
                  onClick={() => setIncidentType(type.value)}
                  className={`p-2.5 rounded-xl border text-xs text-left flex items-center gap-2 transition ${
                    incidentType === type.value
                      ? 'bg-rose-500/15 border-rose-500/50 text-white font-semibold'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-base">{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mức độ nghiêm trọng */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Mức độ ảnh hưởng *</label>
            <div className="grid grid-cols-3 gap-2">
              {SEVERITY_LEVELS.map(s => (
                <button
                  type="button"
                  key={s.value}
                  onClick={() => setSeverity(s.value)}
                  className={`p-2.5 rounded-xl border text-center transition text-xs ${
                    severity === s.value
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="font-bold">{s.label}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Vị trí hiện tại */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <MapPin size={14} className="text-rose-400" />
              <span>Vị trí hiện trường xảy ra sự cố *</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="VD: Km 45 Cao tốc Phan Thiết - Dầu Giây (hướng về TP.HCM)"
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          {/* Mô tả chi tiết */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Mô tả hiện trạng sự việc *</label>
            <textarea
              rows="3"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả tiếng động, va quẹt ở vị trí nào trên xe, tình trạng xe còn nổ máy được không..."
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          {/* Đường dẫn ảnh hiện trường */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <Camera size={14} className="text-zinc-400" />
              <span>Link ảnh hiện trường (phân cách bằng dấu chấm phẩy nếu nhiều ảnh)</span>
            </label>
            <input
              type="text"
              value={photoUrls}
              onChange={(e) => setPhotoUrls(e.target.value)}
              placeholder="https://example.com/photo1.jpg;https://example.com/photo2.jpg"
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-rose-500 transition font-mono"
            />
          </div>

          {/* Ràng buộc chấn thương người */}
          <label className="flex items-center gap-2.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasInjuries}
              onChange={(e) => setHasInjuries(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 focus:ring-0 bg-zinc-900 border-zinc-700"
            />
            <span className="text-xs text-zinc-300">
              Có người trên xe cần hỗ trợ y tế / cấp cứu khẩn cấp
            </span>
          </label>

          {/* Nút hành động */}
          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Đang gửi...' : 'Gửi Yêu Cầu Cứu Hộ'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default IncidentModal;
