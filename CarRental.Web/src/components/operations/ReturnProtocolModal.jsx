import React, { useState, useEffect } from 'react';
import { 
  X, 
  Car, 
  Gauge, 
  Fuel, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  Calendar, 
  Camera, 
  Wrench,
  Sparkles,
  ClipboardCheck,
  ShieldAlert
} from 'lucide-react';
import returnProtocolService from '../../services/returnProtocolService';
import handoverService from '../../services/handoverService';
import { formatDateTime } from '../../utils/formatters';

const DEFAULT_ACCESSORIES = [
  'Giấy đăng ký xe (Cavet)',
  'Giấy chứng nhận kiểm định',
  'Bảo hiểm TNDS bắt buộc',
  'Chìa khóa thông minh (Smartkey)',
  'Bộ kích lốp & tay quay',
  'Lốp xe dự phòng',
  'Camera hành trình'
];

const ReturnProtocolModal = ({ isOpen, onClose, rentalRequest, onSuccess, onProceedToSettlement }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingHandover, setFetchingHandover] = useState(false);
  const [error, setError] = useState(null);

  // Initial Handover baseline
  const [handoverData, setHandoverData] = useState(null);

  // Form State
  const [endOdo, setEndOdo] = useState(0);
  const [returnFuelLevel, setReturnFuelLevel] = useState(100);
  const [exteriorCondition, setExteriorCondition] = useState('Ngoại thất sạch sẽ, không phát hiện vết móp méo mới');
  const [interiorCondition, setInteriorCondition] = useState('Nội thất sạch sẽ, ghế da và thảm lót nguyên vẹn');
  const [tireCondition, setTireCondition] = useState('4 lốp áp suất tiêu chuẩn, không cấn lề hay rách hông');
  const [newDamagesNotes, setNewDamagesNotes] = useState('');
  const [hasNewDamage, setHasNewDamage] = useState(false);
  const [accessories, setAccessories] = useState(DEFAULT_ACCESSORIES);
  const [evidencePhotoUrls, setEvidencePhotoUrls] = useState('');
  const [staffNotes, setStaffNotes] = useState('');
  const [nextVehicleStatus, setNextVehicleStatus] = useState('READY'); // READY, CLEANING, MAINTENANCE, REPAIR

  // Load handover baseline
  useEffect(() => {
    if (rentalRequest?.id && isOpen) {
      const loadHandover = async () => {
        try {
          setFetchingHandover(true);
          setError(null);
          const res = await handoverService.getByRequestId(rentalRequest.id);
          const data = res?.data || res;
          if (data && data.odoAtHandover !== undefined) {
            setHandoverData(data);
            setEndOdo(data.odoAtHandover + (rentalRequest.totalDays || 1) * 150); // Estimated initial guess
            setReturnFuelLevel(data.fuelLevel || 100);
          } else {
            const fallbackOdo = rentalRequest.currentMileage || 10000;
            setEndOdo(fallbackOdo + 200);
          }
        } catch (err) {
          console.warn('Could not fetch handover baseline:', err);
          const fallbackOdo = rentalRequest.currentMileage || 10000;
          setEndOdo(fallbackOdo + 200);
        } finally {
          setFetchingHandover(false);
        }
      };

      loadHandover();
    }
  }, [rentalRequest, isOpen]);

  if (!isOpen || !rentalRequest) return null;

  const startOdo = handoverData?.odoAtHandover ?? rentalRequest.currentMileage ?? 0;
  const initialFuel = handoverData?.fuelLevel ?? 100;
  const maxKmAllowed = rentalRequest.mileageLimit 
    ? rentalRequest.mileageLimit * Math.max(1, rentalRequest.totalDays) 
    : 300 * Math.max(1, rentalRequest.totalDays);

  const totalKmDriven = Math.max(0, endOdo - startOdo);
  const excessKm = Math.max(0, totalKmDriven - maxKmAllowed);
  const fuelDiff = Math.max(0, initialFuel - returnFuelLevel);

  const handleToggleAccessory = (item) => {
    setAccessories(prev => 
      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (proceedSettlement = false) => {
    if (endOdo < startOdo) {
      setError(`Số ODO khi trả (${endOdo.toLocaleString()} km) không thể nhỏ hơn ODO xuất phát (${startOdo.toLocaleString()} km).`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const missing = DEFAULT_ACCESSORIES.filter(a => !accessories.includes(a)).join('; ');

      const payload = {
        rentalRequestId: rentalRequest.id,
        contractId: rentalRequest.contractId,
        returnDate: new Date().toISOString(),
        endOdo: Number(endOdo),
        returnFuelLevel: Number(returnFuelLevel),
        exteriorCondition,
        interiorCondition,
        tireCondition,
        newDamagesNotes: hasNewDamage ? newDamagesNotes : '',
        accessoriesChecklist: accessories.join('; '),
        missingAccessories: missing || null,
        evidencePhotoUrls,
        staffNotes,
        staffSignature: 'Đã ký xác nhận bởi nhân viên kiểm định',
        customerSignature: 'Khách hàng đã ký xác nhận trực tiếp tại quầy',
        nextVehicleStatus: hasNewDamage ? (nextVehicleStatus === 'READY' ? 'REPAIR' : nextVehicleStatus) : nextVehicleStatus
      };

      const res = await returnProtocolService.create(payload);
      const created = res?.data || res;

      if (onSuccess) onSuccess(created);

      if (proceedSettlement && onProceedToSettlement) {
        onProceedToSettlement(created);
      } else {
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lập biên bản hoàn trả xe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-zinc-950 border border-zinc-800 text-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-scaleUp">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Biên Bản Nghiệm Thu & Hoàn Trả Xe (US-22)
              </h3>
              <p className="text-xs text-zinc-400">
                Đơn #{rentalRequest.id.slice(0, 8).toUpperCase()} • {rentalRequest.carMake} {rentalRequest.carModel} ({rentalRequest.carLicensePlate})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2">
              <AlertTriangle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Baseline Info Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div>
              <span className="text-zinc-500 block">Khách hàng bàn giao:</span>
              <span className="font-semibold text-white block text-sm">{rentalRequest.customerName}</span>
              <span className="text-zinc-400">{rentalRequest.customerPhone}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Hạn trả theo hợp đồng:</span>
              <span className="font-medium text-amber-400 block">{formatDateTime(rentalRequest.endTime)}</span>
              <span className="text-zinc-400">Hạn mức di chuyển: {maxKmAllowed.toLocaleString()} km</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Số ODO xuất phát:</span>
              <span className="font-semibold text-emerald-400 block text-sm">{startOdo.toLocaleString()} km</span>
              <span className="text-zinc-400">Nhiên liệu lúc giao: {initialFuel}%</span>
            </div>
          </div>

          {/* Section 1: ODO & Fuel Check */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* ODO Check */}
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5 text-sm">
                  <Gauge size={16} className="text-amber-400" />
                  Đồng Hồ ODO Thực Tế Lúc Trả
                </span>
                <span className="text-[11px] text-zinc-400">Giao: {startOdo.toLocaleString()} km</span>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Nhập số kilomet hiện tại (km) *</label>
                <div className="relative">
                  <input
                    type="number"
                    value={endOdo}
                    onChange={(e) => setEndOdo(Number(e.target.value))}
                    min={startOdo}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-amber-500"
                    placeholder="VD: 15420"
                  />
                  <span className="absolute right-3.5 top-3 text-zinc-500 text-xs">KM</span>
                </div>
              </div>

              {/* ODO Analysis result */}
              <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Tổng quãng đường di chuyển:</span>
                  <span className="text-white font-medium">{totalKmDriven.toLocaleString()} km</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Giới hạn cho phép:</span>
                  <span>{maxKmAllowed.toLocaleString()} km</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-zinc-800 font-semibold">
                  <span>Km vượt định mức:</span>
                  <span className={excessKm > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    {excessKm > 0 ? `+${excessKm.toLocaleString()} km (Phát sinh phụ phí)` : '0 km (Đạt tiêu chuẩn)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Fuel Check */}
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5 text-sm">
                  <Fuel size={16} className="text-amber-400" />
                  Mức Nhiên Liệu Khi Trả Xe
                </span>
                <span className="text-[11px] text-zinc-400">Lúc giao: {initialFuel}%</span>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1.5">Mức xăng / pin còn lại trong bình *</label>
                <div className="grid grid-cols-4 gap-2">
                  {[100, 75, 50, 25].map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setReturnFuelLevel(lvl)}
                      className={`py-2 rounded-xl font-semibold border transition ${
                        returnFuelLevel === lvl
                          ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {lvl}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Fuel Analysis result */}
              <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Mức lúc nhận:</span>
                  <span className="text-white">{initialFuel}%</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Mức lúc trả:</span>
                  <span className="text-white">{returnFuelLevel}%</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-zinc-800 font-semibold">
                  <span>Chênh lệch thiếu:</span>
                  <span className={fuelDiff > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    {fuelDiff > 0 ? `Thiếu ${fuelDiff}% (Tính phí bù nhiên liệu)` : 'Đầy đủ (Không bù phí)'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Section 2: Accessories Checklist */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 space-y-3">
            <h4 className="font-semibold text-white flex items-center gap-2 text-sm">
              <ClipboardCheck size={16} className="text-emerald-400" />
              Kiểm Tra Phụ Kiện & Giấy Tờ Đi Kèm (Checklist)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {DEFAULT_ACCESSORIES.map(acc => {
                const checked = accessories.includes(acc);
                return (
                  <label 
                    key={acc}
                    onClick={() => handleToggleAccessory(acc)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition select-none ${
                      checked 
                        ? 'bg-zinc-900/80 border-emerald-500/40 text-zinc-200' 
                        : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    <input 
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="rounded border-zinc-700 text-emerald-500 focus:ring-0 bg-zinc-800"
                    />
                    <span className="text-xs">{acc}</span>
                  </label>
                );
              })}
            </div>
            {DEFAULT_ACCESSORIES.length !== accessories.length && (
              <p className="text-rose-400 text-[11px] font-medium flex items-center gap-1.5 pt-1">
                <AlertTriangle size={14} />
                Cảnh báo: Có {DEFAULT_ACCESSORIES.length - accessories.length} phụ kiện/giấy tờ chưa được bàn giao lại!
              </p>
            )}
          </div>

          {/* Section 3: Physical Condition & Damages */}
          <div className="space-y-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white flex items-center gap-2 text-sm">
                <Car size={16} className="text-blue-400" />
                Nghiệm Thu Hiện Trạng Xe & Hư Hỏng Mới
              </h4>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasNewDamage}
                  onChange={(e) => setHasNewDamage(e.target.checked)}
                  className="rounded border-zinc-700 text-rose-500 focus:ring-0 bg-zinc-800"
                />
                <span className="text-rose-400 font-medium">Phát hiện vết xước / Hư hỏng mới</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-zinc-400 block mb-1">Hiện trạng ngoại thất</label>
                <input
                  type="text"
                  value={exteriorCondition}
                  onChange={(e) => setExteriorCondition(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Hiện trạng nội thất</label>
                <input
                  type="text"
                  value={interiorCondition}
                  onChange={(e) => setInteriorCondition(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Hiện trạng lốp & mâm</label>
                <input
                  type="text"
                  value={tireCondition}
                  onChange={(e) => setTireCondition(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {hasNewDamage && (
              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2 animate-fadeIn">
                <label className="text-rose-400 font-semibold block text-xs flex items-center gap-1.5">
                  <ShieldAlert size={15} />
                  Mô tả chi tiết vết xước, móp méo, vỡ nứt mới phát hiện:
                </label>
                <textarea
                  rows={2}
                  value={newDamagesNotes}
                  onChange={(e) => setNewDamagesNotes(e.target.value)}
                  placeholder="VD: Cản trước trầy xước sâu 15cm bên phụ; gương chiếu hậu phải nứt ốp ngoài..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            )}

            <div>
              <label className="text-zinc-400 block mb-1 flex items-center gap-1.5">
                <Camera size={14} className="text-zinc-500" />
                URL ảnh chụp minh chứng hiện trạng khi nhận xe (phân cách dấu phẩy nếu nhiều ảnh)
              </label>
              <input
                type="text"
                value={evidencePhotoUrls}
                onChange={(e) => setEvidencePhotoUrls(e.target.value)}
                placeholder="https://images.unsplash.com/photo-car-return-1.jpg, https://..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Section 4: Next Vehicle Lifecycle Status */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 space-y-3">
            <h4 className="font-semibold text-white flex items-center gap-2 text-sm">
              <Wrench size={16} className="text-purple-400" />
              Đề Xuất Trạng Thái Khai Thác Kế Tiếp Của Xe
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'READY', label: 'Sẵn Sàng Cho Thuê', desc: 'Xe sạch sẽ, đạt chuẩn lưu hành ngay', color: 'border-emerald-500/40 text-emerald-400' },
                { key: 'CLEANING', label: 'Cần Vệ Sinh / Rửa', desc: 'Đưa đi rửa nội ngoại thất trước khi giao', color: 'border-blue-500/40 text-blue-400' },
                { key: 'MAINTENANCE', label: 'Bảo Dưỡng Định Kỳ', desc: 'Cần thay nhớt / kiểm định kỹ thuật', color: 'border-amber-500/40 text-amber-400' },
                { key: 'REPAIR', label: 'Sửa Chữa Khắc Phục', desc: 'Có sự cố / hư hỏng cần đưa vào gara', color: 'border-rose-500/40 text-rose-400' }
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setNextVehicleStatus(opt.key)}
                  className={`p-3 rounded-xl border text-left transition ${
                    nextVehicleStatus === opt.key 
                      ? 'bg-zinc-800 border-amber-400 shadow-md ring-1 ring-amber-400/50' 
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <p className={`font-semibold text-xs ${opt.color}`}>{opt.label}</p>
                  <p className="text-[10px] text-zinc-400 mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition text-xs"
          >
            Hủy Bỏ
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(false)}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-semibold transition text-xs disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : 'Chỉ Lưu Biên Bản'}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(true)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles size={15} />
              <span>{loading ? 'Đang xử lý...' : 'Lưu & Sang Quyết Toán Cọc (US-23)'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReturnProtocolModal;
