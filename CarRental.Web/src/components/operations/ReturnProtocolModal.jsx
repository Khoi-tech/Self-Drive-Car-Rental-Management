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
  ShieldAlert,
  ArrowRight,
  Info
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
            setEndOdo(data.odoAtHandover + (rentalRequest.totalDays || 1) * 150);
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

  const startOdo = handoverData?.odoAtHandover ?? rentalRequest.currentMileage ?? 10000;
  const initialFuel = handoverData?.fuelLevel ?? 100;
  const maxKmAllowed = rentalRequest.maxKm || (rentalRequest.totalDays * (rentalRequest.dailyMileageLimit || 300));
  const distanceTraveled = Math.max(0, endOdo - startOdo);
  const excessKm = Math.max(0, distanceTraveled - maxKmAllowed);

  const toggleAccessory = (item) => {
    if (accessories.includes(item)) {
      setAccessories(accessories.filter(a => a !== item));
    } else {
      setAccessories([...accessories, item]);
    }
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans">
      <div className="bg-white border border-slate-200 text-zinc-950 rounded-lg w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-xl animate-scaleUp">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-900 text-white flex items-center justify-center shadow-xs">
              <FileCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
                Biên Bản Nghiệm Thu & Hoàn Trả Xe (Check-in)
              </h3>
              <p className="text-xs text-slate-500">
                Đơn #{rentalRequest.id.slice(0, 8).toUpperCase()} • {rentalRequest.carMake} {rentalRequest.carModel} ({rentalRequest.carLicensePlate})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-md text-slate-400 hover:text-zinc-950 hover:bg-slate-200 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: SPLIT-VIEW (2 Columns Side-by-Side) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Overview Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-md bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-500 block">Khách hàng hoàn trả:</span>
              <span className="font-bold text-zinc-950 text-xs">{rentalRequest.customerName}</span>
              <span className="text-slate-500 text-[11px] ml-1.5 tabular-nums">{rentalRequest.customerPhone}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Lịch hẹn hoàn trả:</span>
              <span className="font-semibold text-zinc-900 text-xs tabular-nums">{formatDateTime(rentalRequest.endTime)}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Hạn mức hợp đồng:</span>
              <span className="font-bold text-blue-900 text-xs tabular-nums">{maxKmAllowed.toLocaleString()} km ({rentalRequest.totalDays} ngày)</span>
            </div>
          </div>

          {/* SPLIT-VIEW GRID: 2 COLUMNS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CỘT TRÁI: TÌNH TRẠNG LÚC GIAO XE (BASELINE) */}
            <div className="p-5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                  <CheckCircle2 size={15} className="text-emerald-700" />
                  Cột 1: Tình Trạng Lúc Giao Xe (Xuất Phát)
                </span>
                <span className="badge-ready text-[10px] py-0.2">Đã nghiệm thu</span>
              </div>

              {/* ODO & Fuel Lúc Giao */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">ODO xuất phát</div>
                  <div className="text-base font-extrabold text-zinc-950 tabular-nums">
                    {startOdo.toLocaleString()} <span className="text-xs font-normal text-slate-500">km</span>
                  </div>
                </div>
                <div className="p-3 bg-white rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Nhiên liệu lúc giao</div>
                  <div className="text-base font-extrabold text-blue-900 tabular-nums">
                    {initialFuel}%
                  </div>
                </div>
              </div>

              {/* Checklist lúc giao */}
              <div className="space-y-1.5 bg-white p-3 rounded border border-slate-200">
                <div className="font-bold text-slate-700 text-[11px] mb-2 uppercase">Checklist phụ kiện lúc giao (7 món):</div>
                {DEFAULT_ACCESSORIES.map((acc) => (
                  <div key={acc} className="flex items-center gap-2 text-slate-600 text-xs">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>{acc}</span>
                  </div>
                ))}
              </div>

              {/* Ghi chú ngoại thất lúc giao */}
              <div className="p-3 bg-white rounded border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-700 text-[11px] uppercase">Hiện trạng ngoại thất lúc giao:</div>
                <p>{handoverData?.exteriorCondition || 'Xe sạch sẽ, không ghi nhận vết trầy xước sâu.'}</p>
              </div>
            </div>

            {/* CỘT PHẢI: TÌNH TRẠNG LÚC TRẢ XE (HIỆN TẠI) */}
            <div className="p-5 rounded-lg border-2 border-blue-900/30 bg-white space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                <span className="font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                  <Gauge size={15} className="text-blue-900" />
                  Cột 2: Tình Trạng Lúc Nghiệm Thu Trả
                </span>
                <span className="badge-rented text-[10px] py-0.2">Đang kiểm định</span>
              </div>

              {/* Nhập ODO Lúc Trả */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-zinc-900 text-xs">Số ODO hiện tại (km) *</label>
                  <span className="text-[11px] text-slate-500 tabular-nums">Đã đi: {distanceTraveled.toLocaleString()} km</span>
                </div>
                <input
                  type="number"
                  value={endOdo}
                  onChange={(e) => setEndOdo(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs font-bold text-zinc-950 tabular-nums focus:outline-none focus:border-blue-900 focus:bg-white transition-colors"
                />
                
                {/* Excess km warning calculation */}
                {excessKm > 0 ? (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800 text-[11px] font-semibold flex items-center justify-between">
                    <span>Vượt hạn mức: <strong>{excessKm.toLocaleString()} km</strong></span>
                    <span className="tabular-nums">Phụ thu: ~{((excessKm) * (rentalRequest.extraKmPrice || 5000)).toLocaleString()}đ</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>Nằm trong hạn mức kilomet cho phép (còn dư {Math.max(0, maxKmAllowed - distanceTraveled).toLocaleString()} km)</span>
                  </div>
                )}
              </div>

              {/* Mức xăng lúc trả: Nút chọn nhanh */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-zinc-900 text-xs">Nhiên liệu / Pin lúc trả:</label>
                  <span className="font-bold text-blue-900 tabular-nums">{returnFuelLevel}%</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setReturnFuelLevel(level)}
                      className={`py-1.5 rounded border text-xs font-bold tabular-nums transition ${
                        returnFuelLevel === level
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {level}%
                    </button>
                  ))}
                </div>
                {returnFuelLevel < initialFuel && (
                  <div className="text-[11px] text-amber-800 font-medium bg-amber-50 p-2 rounded border border-amber-200">
                    Nhiên liệu thấp hơn lúc giao ({initialFuel}% → {returnFuelLevel}%). Sẽ tính phụ thu chênh lệch xăng khi quyết toán.
                  </div>
                )}
              </div>

              {/* Checklist 7 món phụ kiện hoàn trả */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="font-bold text-zinc-900 text-xs uppercase">Checklist phụ kiện hoàn trả:</div>
                <div className="space-y-1.5">
                  {DEFAULT_ACCESSORIES.map((acc) => {
                    const isChecked = accessories.includes(acc);
                    return (
                      <label 
                        key={acc}
                        className={`flex items-center gap-2 p-1.5 rounded border cursor-pointer transition ${
                          isChecked ? 'bg-slate-50 border-slate-200' : 'bg-red-50/50 border-red-200 text-red-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAccessory(acc)}
                          className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                        />
                        <span className={`text-xs ${isChecked ? 'text-slate-800 font-medium' : 'text-red-700 font-bold'}`}>
                          {acc} {!isChecked && '(THIẾU)'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Hư hỏng / Trầy xước mới */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-zinc-900 text-xs">
                  <input
                    type="checkbox"
                    checked={hasNewDamage}
                    onChange={(e) => setHasNewDamage(e.target.checked)}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-600"
                  />
                  <span>Phát hiện vết trầy xước hoặc hư hỏng mới</span>
                </label>

                {hasNewDamage && (
                  <textarea
                    rows={2}
                    value={newDamagesNotes}
                    onChange={(e) => setNewDamagesNotes(e.target.value)}
                    placeholder="Mô tả cụ thể vị trí trầy xước: cản trước bên phụ trầy 10cm..."
                    className="w-full bg-slate-50 border border-red-300 rounded p-2 text-xs text-zinc-950 focus:outline-none focus:border-red-500"
                  />
                )}
              </div>

              {/* Trạng thái xe tiếp theo */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <label className="font-bold text-zinc-900 text-xs">Chuyển trạng thái xe sau khi nhận:</label>
                <select
                  value={nextVehicleStatus}
                  onChange={(e) => setNextVehicleStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-semibold text-zinc-950 focus:outline-none focus:border-blue-900"
                >
                  <option value="READY">Sẵn sàng cho thuê tiếp (READY)</option>
                  <option value="CLEANING">Đưa đi vệ sinh / rửa xe (CLEANING)</option>
                  <option value="MAINTENANCE">Đến hạn bảo dưỡng định kỳ (MAINTENANCE)</option>
                  <option value="REPAIR">Đưa vào gara sửa chữa (REPAIR)</option>
                </select>
              </div>

            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-semibold transition"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-md text-xs font-semibold transition"
            >
              Chỉ lưu biên bản
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2 bg-slate-900 hover:bg-blue-900 disabled:bg-slate-400 text-white rounded-md text-xs font-bold transition flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-xs cursor-pointer"
            >
              <span>Lưu & Quyết toán cọc</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReturnProtocolModal;
