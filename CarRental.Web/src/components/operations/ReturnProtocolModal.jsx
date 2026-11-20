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
  Info,
  MapPin,
  Lock,
  Upload,
  Zap
} from 'lucide-react';
import returnProtocolService from '../../services/returnProtocolService';
import handoverService from '../../services/handoverService';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import VehicleDamageMap from './VehicleDamageMap';

const DEFAULT_ACCESSORIES = [
  'Giấy đăng ký xe (Cavet công chứng còn hạn)',
  'Giấy chứng nhận kiểm định an toàn kỹ thuật (Đăng kiểm)',
  'Giấy chứng nhận bảo hiểm TNDS bắt buộc',
  '02 Chìa khóa thông minh chính hãng (Smartkey)',
  'Bộ kích lốp & tay mở tắc kê tiêu chuẩn',
  'Lốp dự phòng nguyên bản',
  'Camera hành trình 4K kèm thẻ nhớ',
  'Bộ tam giác cảnh báo nguy hiểm & áo phản quang'
];

const PETROL_BARS = [
  { fraction: '1/8', value: 12.5, label: '1/8 (12.5%)' },
  { fraction: '2/8', value: 25.0, label: '2/8 (25%)' },
  { fraction: '3/8', value: 37.5, label: '3/8 (37.5%)' },
  { fraction: '4/8', value: 50.0, label: '4/8 (50%)' },
  { fraction: '5/8', value: 62.5, label: '5/8 (62.5%)' },
  { fraction: '6/8', value: 75.0, label: '6/8 (75%)' },
  { fraction: '7/8', value: 87.5, label: '7/8 (87.5%)' },
  { fraction: '8/8', value: 100.0, label: '8/8 (100%)' }
];

const ReturnProtocolModal = ({ isOpen, onClose, rentalRequest, onSuccess, onProceedToSettlement }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingHandover, setFetchingHandover] = useState(false);
  const [error, setError] = useState(null);
  const [hardBlockMsg, setHardBlockMsg] = useState(null);

  // Baseline data from handover
  const [handoverData, setHandoverData] = useState(null);
  const [existingProtocol, setExistingProtocol] = useState(null);

  // Fuel type
  const fuelType = (rentalRequest?.vehicle?.fuelType || rentalRequest?.fuelType || 'PETROL').toUpperCase();
  const isElectric = fuelType === 'ELECTRIC';

  // Return flow toggle: 'YARD' (khách trả tại bãi) vs 'TRANSIT_RETURN' (nhận xe tại nhà khách, lái về bãi)
  const [returnType, setReturnType] = useState('YARD');

  // Form State
  const [customerReturnOdo, setCustomerReturnOdo] = useState(0);
  const [yardCheckinOdo, setYardCheckinOdo] = useState(0);
  const [customerReturnFuelLevel, setCustomerReturnFuelLevel] = useState(100);
  const [yardCheckinFuelLevel, setYardCheckinFuelLevel] = useState(100);
  const [returnDashPhotoUrl, setReturnDashPhotoUrl] = useState('');
  const [returnAnomalyNote, setReturnAnomalyNote] = useState('');

  // Conditions & accessories
  const [exteriorCondition, setExteriorCondition] = useState('Ngoại thất sạch sẽ, không phát hiện vết móp méo mới');
  const [interiorCondition, setInteriorCondition] = useState('Nội thất sạch sẽ, ghế da và thảm lót nguyên vẹn');
  const [tireCondition, setTireCondition] = useState('4 lốp áp suất tiêu chuẩn, không cấn lề hay rách hông');
  const [newDamagesNotes, setNewDamagesNotes] = useState('');
  const [damagePoints, setDamagePoints] = useState([]);
  const [accessories, setAccessories] = useState(DEFAULT_ACCESSORIES);
  const [evidencePhotoUrls, setEvidencePhotoUrls] = useState('');
  const [staffNotes, setStaffNotes] = useState('');
  const [nextVehicleStatus, setNextVehicleStatus] = useState('READY'); // READY, CLEANING, MAINTENANCE, REPAIR

  // Check if locked by settlement
  const isSettledLocked = Boolean(
    rentalRequest?.status === 'SETTLED' || 
    rentalRequest?.status === 'PARTIALLY_SETTLED' || 
    rentalRequest?.status === 'CLOSED'
  );

  // Load handover baseline & existing return protocol
  useEffect(() => {
    if (rentalRequest?.id && isOpen) {
      const loadData = async () => {
        try {
          setFetchingHandover(true);
          setError(null);
          setHardBlockMsg(null);

          // 1. Fetch Handover baseline
          let baselineHandover = null;
          try {
            const hRes = await handoverService.getByRequestId(rentalRequest.id);
            baselineHandover = hRes?.data || hRes;
            if (baselineHandover && (baselineHandover.handoverOdo || baselineHandover.odoAtHandover)) {
              setHandoverData(baselineHandover);
            }
          } catch (e) {
            console.warn('Could not load handover protocol:', e);
          }

          const hOdo = baselineHandover?.handoverOdo ?? baselineHandover?.odoAtHandover ?? rentalRequest.currentMileage ?? 10000;
          const hFuel = Number(baselineHandover?.handoverFuelLevel) || Number(baselineHandover?.fuelLevel) || 100;

          // 2. Fetch existing return protocol if any
          try {
            const existingRes = await returnProtocolService.getByRequestId(rentalRequest.id);
            const existing = existingRes?.data || existingRes;
            if (existing && existing.id) {
              setExistingProtocol(existing);
              setCustomerReturnOdo(existing.customerReturnOdo || existing.endOdo || hOdo);
              setYardCheckinOdo(existing.yardCheckinOdo || existing.customerReturnOdo || existing.endOdo || hOdo);
              setCustomerReturnFuelLevel(Number(existing.customerReturnFuelLevel) ?? Number(existing.returnFuelLevel) ?? 100);
              setYardCheckinFuelLevel(Number(existing.yardCheckinFuelLevel) ?? Number(existing.returnFuelLevel) ?? 100);
              setReturnDashPhotoUrl(existing.returnDashPhotoUrl || '');
              setReturnAnomalyNote(existing.returnAnomalyNote || '');
              if (existing.nextVehicleStatus) setNextVehicleStatus(existing.nextVehicleStatus);

              const mapJson = existing.returnDamageMap || existing.damagePointsJson;
              if (mapJson) {
                try {
                  const pts = JSON.parse(mapJson);
                  if (Array.isArray(pts) && pts.length > 0) setDamagePoints(pts);
                } catch {}
              }
              return;
            }
          } catch {
            // Normal flow, not created yet
          }

          // Default initial state
          setCustomerReturnOdo(hOdo + (rentalRequest.totalDays || 1) * 150);
          setYardCheckinOdo(hOdo + (rentalRequest.totalDays || 1) * 150);
          setCustomerReturnFuelLevel(hFuel);
          setYardCheckinFuelLevel(hFuel);

          // Inherit handover damage map with locked stages
          const handoverMapJson = baselineHandover?.handoverDamageMap || baselineHandover?.dispatchDamageMap || baselineHandover?.damagePointsJson;
          if (handoverMapJson) {
            try {
              const hPts = JSON.parse(handoverMapJson).map(p => ({
                ...p,
                stage: p.stage || (p.type === 'NEW' ? 'TRANSIT_DELIVERY' : 'PRE_EXISTING')
              }));
              setDamagePoints(hPts);
            } catch {
              setDamagePoints([]);
            }
          }
        } catch (err) {
          console.error('Error loading baseline:', err);
        } finally {
          setFetchingHandover(false);
        }
      };

      loadData();
    }
  }, [rentalRequest, isOpen]);

  if (!isOpen || !rentalRequest) return null;

  const startOdo = handoverData?.handoverOdo ?? handoverData?.odoAtHandover ?? rentalRequest.currentMileage ?? 10000;
  const initialFuel = Number(handoverData?.handoverFuelLevel) || Number(handoverData?.fuelLevel) || 100;
  const maxKmAllowed = rentalRequest.maxKm || (rentalRequest.totalDays * (rentalRequest.dailyMileageLimit || 300));
  
  // Quãng đường thực tế khách sử dụng (Loại trừ hoàn toàn trung chuyển)
  const customerDistanceTraveled = Math.max(0, Number(customerReturnOdo) - Number(startOdo));
  const excessKm = Math.max(0, customerDistanceTraveled - maxKmAllowed);

  // Return transit audit calculation
  const estDistanceKm = Number(rentalRequest.estimatedDeliveryDistanceKm) || 0;
  const maxAllowedReturnTransitKm = estDistanceKm > 0 ? (estDistanceKm * 1.3 + 5.0) : 50.0;
  const returnTransitKm = Math.max(0, Number(yardCheckinOdo) - Number(customerReturnOdo));
  const isReturnSoftFlag = returnType === 'TRANSIT_RETURN' && returnTransitKm > maxAllowedReturnTransitKm;
  const isReturnHardBlock = returnType === 'TRANSIT_RETURN' && (
    Number(yardCheckinOdo) < Number(customerReturnOdo) || 
    returnTransitKm > (maxAllowedReturnTransitKm * 3) || 
    returnTransitKm > 300
  );

  const toggleAccessory = (item) => {
    if (isSettledLocked) return;
    if (accessories.includes(item)) {
      setAccessories(accessories.filter(a => a !== item));
    } else {
      setAccessories([...accessories, item]);
    }
  };

  const handleDashPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setReturnDashPhotoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (proceedSettlement = false) => {
    setError(null);
    setHardBlockMsg(null);

    if (Number(customerReturnOdo) < Number(startOdo)) {
      setHardBlockMsg(`Chặn lưu (Hard Block): ODO khi khách trả (${Number(customerReturnOdo).toLocaleString()} km) không thể nhỏ hơn ODO lúc bàn giao (${Number(startOdo).toLocaleString()} km). Vui lòng đối chiếu lại ảnh đồng hồ taplo.`);
      return;
    }

    if (returnType === 'TRANSIT_RETURN') {
      if (Number(yardCheckinOdo) < Number(customerReturnOdo)) {
        setHardBlockMsg(`Chặn lưu (Hard Block): ODO khi xe về bãi (${Number(yardCheckinOdo).toLocaleString()} km) không thể nhỏ hơn ODO lúc khách trả (${Number(customerReturnOdo).toLocaleString()} km).`);
        return;
      }
      if (isReturnHardBlock) {
        setHardBlockMsg(`Chặn lưu (Hard Block): Quãng đường xe về bãi (${returnTransitKm} km) vượt quá 3 lần khoảng cách cho phép (${maxAllowedReturnTransitKm * 3} km). Vui lòng kiểm tra lại số ODO.`);
        return;
      }
      if (isReturnSoftFlag && !returnAnomalyNote.trim()) {
        setError('Quãng đường trung chuyển về bãi vượt ngưỡng cho phép. Bắt buộc nhập lý do giải trình để quản lý hậu kiểm.');
        return;
      }
    }

    if (!returnDashPhotoUrl) {
      setError('Bắt buộc phải chụp ảnh đồng hồ taplo lúc nhận lại xe từ khách hàng để đối chứng ODO và mức nhiên liệu.');
      return;
    }

    try {
      setLoading(true);

      const missing = DEFAULT_ACCESSORIES.filter(a => !accessories.includes(a)).join('; ');
      const newCustomerPoints = damagePoints.filter(p => p.stage === 'CUSTOMER_RENTAL' || p.type === 'NEW');
      const hasDamages = newCustomerPoints.length > 0 || (newDamagesNotes && newDamagesNotes.trim().length > 0);

      const combinedDamageNotes = [
        newDamagesNotes?.trim(),
        ...newCustomerPoints.map(p => `[${p.view}] ${p.description} (Phạt: ${formatCurrency(p.fee || 0)})`)
      ].filter(Boolean).join('; ');

      const payload = {
        rentalRequestId: rentalRequest.id,
        contractId: rentalRequest.contractId || null,
        returnDate: new Date().toISOString(),

        // Single Source of Truth
        customerReturnOdo: Number(customerReturnOdo),
        yardCheckinOdo: returnType === 'TRANSIT_RETURN' ? Number(yardCheckinOdo) : Number(customerReturnOdo),
        customerReturnFuelLevel: Number(customerReturnFuelLevel),
        yardCheckinFuelLevel: returnType === 'TRANSIT_RETURN' ? Number(yardCheckinFuelLevel) : Number(customerReturnFuelLevel),
        returnDashPhotoUrl,
        returnAnomalyNote: returnAnomalyNote.trim() || null,
        returnDamageMap: JSON.stringify(damagePoints),

        // Cột cũ để tương thích ngược
        endOdo: Number(customerReturnOdo),
        returnFuelLevel: Math.round(Number(customerReturnFuelLevel)),
        exteriorCondition,
        interiorCondition,
        tireCondition,
        newDamagesNotes: hasDamages ? combinedDamageNotes : '',
        damagePointsJson: JSON.stringify(damagePoints),
        accessoriesChecklist: accessories.join('; '),
        missingAccessories: missing || null,
        evidencePhotoUrls,
        staffNotes,
        staffSignature: 'Đã ký xác nhận bởi nhân viên kiểm định VELORA',
        customerSignature: 'Khách hàng đã ký xác nhận biên bản trả xe',
        nextVehicleStatus: hasDamages ? (nextVehicleStatus === 'READY' ? 'REPAIR' : nextVehicleStatus) : nextVehicleStatus
      };

      let created = existingProtocol;
      if (!existingProtocol) {
        try {
          const res = await returnProtocolService.create(payload);
          created = res?.data || res;
        } catch (createErr) {
          try {
            const fetchRes = await returnProtocolService.getByRequestId(rentalRequest.id);
            const found = fetchRes?.data || fetchRes;
            if (found && (found.id || found.protocolNumber)) {
              created = found;
              setExistingProtocol(found);
            } else {
              throw createErr;
            }
          } catch {
            throw createErr;
          }
        }
      }

      if (onSuccess) onSuccess(created);

      if (proceedSettlement && onProceedToSettlement) {
        onProceedToSettlement(created);
      } else {
        alert('Đã lưu biên bản nghiệm thu hoàn trả xe thành công! Xe đã chuyển sang INSPECTION.');
        onClose();
      }
    } catch (err) {
      console.error('Error submitting return protocol:', err);
      const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi lưu biên bản hoàn trả.';
      if (err.response?.status === 400) {
        setHardBlockMsg(`Chặn lưu (Hard Block từ Máy chủ): ${msg}`);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fuel level selector renderer
  const renderFuelSelector = (level, setLevel, label, disabled = false) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-zinc-800 flex items-center gap-1.5">
          {isElectric ? <Zap size={14} className="text-amber-500" /> : <Fuel size={14} className="text-emerald-600" />}
          <span>{label} *</span>
        </label>
        <span className="font-extrabold text-sm text-blue-900 tabular-nums">
          {isElectric ? `${level}% Pin` : `${level}%`}
        </span>
      </div>

      {isElectric ? (
        <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={level}
            disabled={disabled || isSettledLocked}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="w-full accent-blue-900 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-8 gap-1 p-1.5 rounded-lg bg-slate-100 border border-slate-200">
            {PETROL_BARS.map((bar, idx) => {
              const isFilled = level >= bar.value;
              return (
                <div
                  key={idx}
                  onClick={() => !disabled && !isSettledLocked && setLevel(bar.value)}
                  className={`h-6 rounded flex items-center justify-center text-[9px] font-bold cursor-pointer transition select-none ${
                    isFilled 
                      ? 'bg-blue-900 text-white shadow-xs' 
                      : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-200'
                  }`}
                  title={bar.label}
                >
                  {bar.fraction}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[25, 50, 75, 100].map(val => (
              <button
                key={val}
                type="button"
                disabled={disabled || isSettledLocked}
                onClick={() => setLevel(val)}
                className={`py-1 rounded text-[11px] font-semibold border transition ${
                  level === val
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans">
      <div className="bg-white border border-slate-200 text-zinc-950 rounded-xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden shadow-2xl animate-scaleUp">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center shadow-xs">
              <FileCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
                  Biên Bản Nghiệm Thu & Hoàn Trả Phương Tiện (Check-In)
                </h3>
                {existingProtocol?.protocolNumber && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-100 text-blue-800 border border-blue-200 font-bold">
                    {existingProtocol.protocolNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Đơn #{rentalRequest.id.slice(0, 8).toUpperCase()} • {rentalRequest.carMake} {rentalRequest.carModel} ({rentalRequest.carLicensePlate}) • Nhiên liệu: <strong>{isElectric ? 'Xe Điện (EV)' : `Xăng/Dầu (${fuelType})`}</strong>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-zinc-950 hover:bg-slate-200 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Locked Banner if Settled */}
        {isSettledLocked && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-900 flex items-center gap-2">
            <Lock size={14} className="text-amber-700 shrink-0" />
            <span>
              <strong>Hồ sơ hoàn trả đã khóa:</strong> Đơn thuê này đã được quyết toán cọc. Toàn bộ thông tin biên bản hoàn trả không thể sửa đổi hoặc xóa.
            </span>
          </div>
        )}

        {/* Modal Alerts */}
        {hardBlockMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-xs flex items-center gap-2.5">
            <ShieldAlert size={18} className="shrink-0 text-rose-600" />
            <span className="font-semibold">{hardBlockMsg}</span>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">

          {/* DÒNG TÓM TẮT MINH BẠCH: QUÃNG ĐƯỜNG KHÁCH SỬ DỤNG */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-blue-900 block tracking-wider">
                Quãng Đường Khách Thực Tế Sử Dụng (Loại trừ trung chuyển):
              </span>
              <div className="text-base font-extrabold text-blue-950 flex items-center gap-2">
                <span>Quãng đường = ODO Khách Trả ({customerReturnOdo.toLocaleString()} km) − ODO Lúc Giao ({startOdo.toLocaleString()} km) = </span>
                <span className="text-emerald-700 bg-white px-2 py-0.5 rounded border border-blue-200 font-mono text-lg tabular-nums">
                  {customerDistanceTraveled.toLocaleString()} km
                </span>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-blue-200 sm:pl-4">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Hạn mức hợp đồng:</span>
              <strong className="text-sm font-mono text-zinc-900 tabular-nums">
                {maxKmAllowed.toLocaleString()} km ({rentalRequest.totalDays || 1} ngày)
              </strong>
              {excessKm > 0 ? (
                <span className="text-rose-600 font-bold block text-[11px] mt-0.5">
                  Vượt hạn mức: +{excessKm.toLocaleString()} km
                </span>
              ) : (
                <span className="text-emerald-700 font-medium block text-[11px] mt-0.5">
                  ✓ Trong hạn mức (Dư {(maxKmAllowed - customerDistanceTraveled).toLocaleString()} km)
                </span>
              )}
            </div>
          </div>

          {/* SPLIT-VIEW: 2 CỘT ĐỐI CHIẾU */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CỘT 1: TÌNH TRẠNG LÚC GIAO XE (BASELINE ĐÃ KHÓA) */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                  <CheckCircle2 size={15} className="text-emerald-700" />
                  Cột 1: Tình Trạng Lúc Giao Xe (Baseline)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Đã Ký Xác Nhận
                </span>
              </div>

              {/* ODO & Xăng lúc giao */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Số ODO lúc giao</div>
                  <div className="text-base font-extrabold text-zinc-950 font-mono tabular-nums mt-0.5">
                    {startOdo.toLocaleString()} <span className="text-xs font-normal text-slate-500">km</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Nhiên liệu lúc giao</div>
                  <div className="text-base font-extrabold text-blue-900 tabular-nums mt-0.5">
                    {initialFuel}%
                  </div>
                </div>
              </div>

              {/* Ảnh Taplo lúc giao */}
              {handoverData?.handoverDashPhotoUrl && (
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Ảnh đồng hồ Taplo lúc giao:</span>
                  <img
                    src={handoverData.handoverDashPhotoUrl}
                    alt="Taplo lúc giao"
                    className="w-full h-32 object-cover rounded border border-slate-200"
                  />
                </div>
              )}

              {/* Ghi chú lúc giao */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-700 text-[10px] uppercase">Ghi nhận ngoại thất lúc giao:</div>
                <p>{handoverData?.exteriorCondition || 'Xe sạch sẽ, sơn bóng nguyên bản, không móp méo.'}</p>
                {handoverData?.existingScratchesNotes && (
                  <p className="text-amber-800 font-medium pt-1">
                    • Vết xước có trước: {handoverData.existingScratchesNotes}
                  </p>
                )}
              </div>
            </div>

            {/* CỘT 2: TÌNH TRẠNG LÚC NGHIỆM THU TRẢ XE */}
            <div className="p-5 rounded-xl border-2 border-blue-900/30 bg-white space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                <span className="font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                  <Gauge size={15} className="text-blue-900" />
                  Cột 2: Nghiệm Thu Thực Tế Lúc Trả
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                  Đang Kiểm Định
                </span>
              </div>

              {/* Hình thức trả xe */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-800">Hình thức nhận xe:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReturnType('YARD')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition ${
                      returnType === 'YARD' ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Khách trả tại bãi
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnType('TRANSIT_RETURN')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition ${
                      returnType === 'TRANSIT_RETURN' ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Thu xe tận nơi (Về bãi)
                  </button>
                </div>
              </div>

              {/* ODO Khách Trả */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-zinc-900 text-[11px]">Số ODO khách trả (km) *</label>
                  <span className="text-[10px] text-slate-500 tabular-nums">Khách đi: {customerDistanceTraveled} km</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={startOdo}
                    disabled={isSettledLocked}
                    value={customerReturnOdo}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCustomerReturnOdo(val);
                      if (returnType === 'YARD') setYardCheckinOdo(val);
                    }}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-base font-mono font-extrabold text-zinc-950 tabular-nums focus:bg-white focus:border-blue-900 focus:outline-none"
                  />
                  <span className="font-bold text-xs text-slate-500">KM</span>
                </div>
              </div>

              {/* Mức xăng lúc trả */}
              <div>
                {renderFuelSelector(customerReturnFuelLevel, setCustomerReturnFuelLevel, 'Nhiên liệu lúc khách trả')}
                {customerReturnFuelLevel < initialFuel && (
                  <div className="mt-1 text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                    Nhiên liệu thấp hơn lúc giao ({initialFuel}% → {customerReturnFuelLevel}%). Sẽ tính phụ thu chênh lệch nếu vượt dung sai.
                  </div>
                )}
              </div>

              {/* NẾU THU XE TẬN NƠI: KHU VỰC VỀ BÃI & AUDIT ODO CHIỀU VỀ */}
              {returnType === 'TRANSIT_RETURN' && (
                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-3">
                  <span className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={14} className="text-purple-700" />
                    Kiểm Soát Trung Chuyển Lái Xe Về Bãi (Internal Transit)
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-purple-950 block mb-1">ODO khi xe về tới bãi:</label>
                      <input
                        type="number"
                        min={customerReturnOdo}
                        disabled={isSettledLocked}
                        value={yardCheckinOdo}
                        onChange={(e) => setYardCheckinOdo(Number(e.target.value))}
                        className="w-full bg-white border border-purple-300 rounded-md p-2 font-mono font-bold text-xs tabular-nums focus:outline-none focus:border-purple-600"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-purple-950 block mb-1">Xăng khi xe về tới bãi (%):</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={isSettledLocked}
                        value={yardCheckinFuelLevel}
                        onChange={(e) => setYardCheckinFuelLevel(Number(e.target.value))}
                        className="w-full bg-white border border-purple-300 rounded-md p-2 font-mono font-bold text-xs tabular-nums focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-purple-900 flex justify-between">
                    <span>Quãng đường nhân viên lái về bãi:</span>
                    <strong className="font-mono tabular-nums">{returnTransitKm} km (Ngưỡng: ~{maxAllowedReturnTransitKm.toFixed(1)} km)</strong>
                  </div>

                  {isReturnSoftFlag && !isReturnHardBlock && (
                    <div className="p-2.5 rounded bg-amber-50 border border-amber-300 text-amber-950 space-y-1.5">
                      <div className="font-bold text-[11px] flex items-center gap-1 text-amber-900">
                        <AlertTriangle size={13} className="text-amber-600" />
                        <span>Cảnh báo ODO chiều về vượt ngưỡng</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={returnAnomalyNote}
                        disabled={isSettledLocked}
                        onChange={(e) => setReturnAnomalyNote(e.target.value)}
                        placeholder="Giải trình lý do chênh lệch quãng đường về bãi..."
                        className="w-full bg-white border border-amber-300 rounded p-1.5 text-xs focus:outline-none focus:border-amber-600"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* BẮT BUỘC ẢNH ĐỒNG HỒ TAPLO LÚC TRẢ */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="text-[11px] font-bold text-zinc-900 flex items-center gap-1.5">
                  <Camera size={14} className="text-blue-900" />
                  <span>Ảnh chụp đồng hồ Taplo lúc nhận lại xe (Bắt buộc) *</span>
                </label>

                {returnDashPhotoUrl ? (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={returnDashPhotoUrl} 
                        alt="Taplo lúc trả" 
                        className="w-20 h-14 object-cover rounded-md border border-slate-300"
                      />
                      <span className="font-bold text-xs text-zinc-900">Đã chụp ảnh đồng hồ taplo trả xe</span>
                    </div>

                    {!isSettledLocked && (
                      <button
                        type="button"
                        onClick={() => setReturnDashPhotoUrl('')}
                        className="px-2.5 py-1 text-slate-500 hover:text-rose-600 text-xs font-semibold"
                      >
                        Chụp lại
                      </button>
                    )}
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-50 rounded-lg cursor-pointer text-blue-950 text-xs font-semibold border-2 border-dashed border-blue-900/40 hover:border-blue-900 transition">
                    <Camera size={16} className="text-blue-900" />
                    <span>Bấm để chụp hoặc tải ảnh đồng hồ Taplo lúc khách trả</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      disabled={isSettledLocked}
                      onChange={handleDashPhotoUpload} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>

              {/* Trạng thái tiếp theo của xe */}
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <label className="font-bold text-zinc-900 text-[11px]">Trạng thái phương tiện sau khi thu hồi:</label>
                <select
                  value={nextVehicleStatus}
                  disabled={isSettledLocked}
                  onChange={(e) => setNextVehicleStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-zinc-950 focus:outline-none focus:border-blue-900"
                >
                  <option value="READY">Sẵn sàng khai thác tiếp (READY)</option>
                  <option value="CLEANING">Chuyển đi vệ sinh / rửa xe (CLEANING)</option>
                  <option value="MAINTENANCE">Đến hạn bảo dưỡng kỹ thuật (MAINTENANCE)</option>
                  <option value="REPAIR">Có hư hỏng cần vào gara sửa chữa (REPAIR)</option>
                </select>
              </div>

            </div>

          </div>

          {/* SƠ ĐỒ 2D ĐỐI CHIẾU VẾT XƯỚC (DIFF MARKER) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-950 flex items-center gap-2">
                <Car size={16} className="text-blue-900" />
                <span>Sơ Đồ 2D Đối Chiếu Vết Xước — Khóa Vết Lúc Giao, Chỉ Chấm Vết Mới Do Khách</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                Vết cũ (Xám) & Vết giao xe (Cam) bị khóa. Điểm chấm mới tự động gán nhãn <strong>Khách thuê làm xước (Đỏ)</strong>.
              </span>
            </div>

            <VehicleDamageMap
              points={damagePoints}
              onChange={setDamagePoints}
              mode={isSettledLocked ? 'readonly' : 'return'}
              defaultStage="CUSTOMER_RENTAL"
              lockedStages={['PRE_EXISTING', 'TRANSIT_DELIVERY']}
            />
          </div>

          {/* CHECKLIST PHỤ KIỆN HOÀN TRẢ */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-950 flex items-center gap-2">
              <ClipboardCheck size={16} className="text-blue-900" />
              <span>Kiểm Kê Phụ Kiện & Giấy Tờ Hoàn Trả</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEFAULT_ACCESSORIES.map(acc => {
                const isChecked = accessories.includes(acc);
                return (
                  <div
                    key={acc}
                    onClick={() => toggleAccessory(acc)}
                    className={`p-2.5 rounded-lg border flex items-center gap-2.5 cursor-pointer transition select-none text-xs ${
                      isChecked 
                        ? 'bg-emerald-50/50 border-emerald-300 text-emerald-950 font-medium' 
                        : 'bg-rose-50/60 border-rose-300 text-rose-900 font-bold'
                    }`}
                  >
                    {isChecked ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    ) : (
                      <X size={16} className="text-rose-600 shrink-0" />
                    )}
                    <span>{acc} {!isChecked && '(THIẾU)'}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            Đóng
          </button>

          {!isSettledLocked && (
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={loading || isReturnHardBlock}
                className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition disabled:opacity-50"
              >
                Chỉ lưu biên bản hoàn trả
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={loading || isReturnHardBlock}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-400 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-sm cursor-pointer"
              >
                <span>Lưu & Chuyển Sang Quyết Toán Cọc</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ReturnProtocolModal;
