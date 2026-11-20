import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  X, 
  CheckCircle2, 
  Car, 
  Gauge, 
  Fuel, 
  ShieldAlert, 
  Camera, 
  Printer, 
  Save, 
  CheckSquare, 
  Square,
  AlertCircle,
  AlertTriangle,
  Wallet,
  Zap,
  MapPin,
  ArrowRight,
  Lock,
  Upload,
  Clock,
  Layers
} from 'lucide-react';
import handoverService from '../../services/handoverService';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import VehicleDamageMap from '../operations/VehicleDamageMap';

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

const HandoverModal = ({ isOpen, onClose, rentalRequest, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('FORM'); // 'FORM' or 'PREVIEW'
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [existingProtocol, setExistingProtocol] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [hardBlockMsg, setHardBlockMsg] = useState(null);

  // Delivery mode: 'YARD' (nhận tại bãi) vs 'DOORSTEP' (giao tận nơi 2 bước)
  const [deliveryMode, setDeliveryMode] = useState('YARD');
  // Sub-step for Doorstep flow: 1: 'DISPATCH' (Xuất bãi), 2: 'MEET_CUSTOMER' (Gặp khách)
  const [doorstepStep, setDoorstepStep] = useState(1);

  // Fuel type detection
  const fuelType = (rentalRequest?.vehicle?.fuelType || rentalRequest?.fuelType || 'PETROL').toUpperCase();
  const isElectric = fuelType === 'ELECTRIC';

  // Base ODO from vehicle
  const currentVehicleOdo = rentalRequest?.vehicle?.currentMileage || rentalRequest?.currentMileage || 10000;

  // Form State
  const [staffName, setStaffName] = useState('Trần Văn Hưng (Staff VELORA)');
  const [dispatchOdo, setDispatchOdo] = useState(currentVehicleOdo);
  const [handoverOdo, setHandoverOdo] = useState(currentVehicleOdo);
  const [dispatchFuelLevel, setDispatchFuelLevel] = useState(100);
  const [handoverFuelLevel, setHandoverFuelLevel] = useState(100);
  const [handoverDashPhotoUrl, setHandoverDashPhotoUrl] = useState('');
  const [transitAnomalyNote, setTransitAnomalyNote] = useState('');

  // Technical conditions
  const [exteriorCondition, setExteriorCondition] = useState('Ngoại thất bóng sạch, sơn nguyên bản, không biến dạng kết cấu.');
  const [interiorCondition, setInteriorCondition] = useState('Nội thất sạch sẽ, ghế da nguyên vẹn, trần xe sạch, điều hòa lạnh sâu.');
  const [tireCondition, setTireCondition] = useState('4 lốp gai sâu trên 6mm, áp suất 2.3 bar tiêu chuẩn, mâm xe không cấn lề.');
  const [selectedAccessories, setSelectedAccessories] = useState(DEFAULT_ACCESSORIES);
  const [existingScratchesNotes, setExistingScratchesNotes] = useState('');
  const [damagePoints, setDamagePoints] = useState([]);
  const [staffNotes, setStaffNotes] = useState('Đã đối chiếu CCCD và GPLX gốc của khách hàng. Xe trong trạng thái hoàn hảo.');
  const [customerSignature, setCustomerSignature] = useState('');
  const [staffSignature, setStaffSignature] = useState('Trần Văn Hưng - Ký xác nhận');

  // Check if locked by settlement
  const isSettledLocked = Boolean(
    rentalRequest?.status === 'SETTLED' || 
    rentalRequest?.status === 'PARTIALLY_SETTLED' || 
    rentalRequest?.status === 'CLOSED'
  );

  // Distance calculations for Audit ODO
  const estDistanceKm = Number(rentalRequest?.estimatedDeliveryDistanceKm) || 0;
  const maxAllowedTransitKm = estDistanceKm > 0 ? (estDistanceKm * 1.3 + 5.0) : 50.0;
  const transitKm = Math.max(0, Number(handoverOdo) - Number(dispatchOdo));
  const isSoftFlag = deliveryMode === 'DOORSTEP' && doorstepStep === 2 && transitKm > maxAllowedTransitKm;
  const isLocalHardBlock = deliveryMode === 'DOORSTEP' && doorstepStep === 2 && (
    Number(handoverOdo) < Number(dispatchOdo) || 
    transitKm > (maxAllowedTransitKm * 3) || 
    transitKm > 300
  );

  // Fetch existing protocol if exists
  useEffect(() => {
    if (isOpen && rentalRequest?.id) {
      const loadExisting = async () => {
        try {
          setFetching(true);
          setErrorMsg(null);
          setHardBlockMsg(null);

          // Auto-detect delivery mode from pickup location or request
          const isDoorstep = Boolean(
            rentalRequest.deliveryOption === 'DELIVERY' || 
            (rentalRequest.pickupLocation && !rentalRequest.pickupLocation.toLowerCase().includes('bãi') && !rentalRequest.pickupLocation.toLowerCase().includes('cửa hàng')) ||
            (rentalRequest.estimatedDeliveryDistanceKm && rentalRequest.estimatedDeliveryDistanceKm > 0)
          );
          setDeliveryMode(isDoorstep ? 'DOORSTEP' : 'YARD');

          const res = await handoverService.getByRequestId(rentalRequest.id);
          const data = res?.data || res;

          if (data && data.id) {
            setExistingProtocol(data);
            setStaffName(data.staffName || 'Trần Văn Hưng (Staff VELORA)');
            setDispatchOdo(data.dispatchOdo ?? data.odoAtHandover ?? currentVehicleOdo);
            setHandoverOdo(data.handoverOdo ?? data.odoAtHandover ?? currentVehicleOdo);
            setDispatchFuelLevel(Number(data.dispatchFuelLevel) || 100);
            setHandoverFuelLevel(Number(data.handoverFuelLevel) || 100);
            setHandoverDashPhotoUrl(data.handoverDashPhotoUrl || '');
            setTransitAnomalyNote(data.transitAnomalyNote || '');
            setExteriorCondition(data.exteriorCondition || '');
            setInteriorCondition(data.interiorCondition || '');
            setTireCondition(data.tireCondition || '');
            setExistingScratchesNotes(data.existingScratchesNotes || '');
            setStaffNotes(data.staffNotes || '');
            setCustomerSignature(data.customerSignature || '');

            if (data.status === 'IN_TRANSIT') {
              setDeliveryMode('DOORSTEP');
              setDoorstepStep(2); // In-transit already completed step 1, proceed to meet customer
            }

            // Load damage map
            const mapJson = data.handoverDamageMap || data.dispatchDamageMap || data.damagePointsJson;
            if (mapJson) {
              try { setDamagePoints(JSON.parse(mapJson)); } catch { setDamagePoints([]); }
            }

            if (data.accessoriesChecklist) {
              setSelectedAccessories(data.accessoriesChecklist.split(';'));
            }
          } else {
            setExistingProtocol(null);
            setDispatchOdo(currentVehicleOdo);
            setHandoverOdo(currentVehicleOdo);
            setCustomerSignature(rentalRequest.customerName || '');

            // Inherit damage points from vehicle's previous rentals
            const targetCarId = rentalRequest.carId || rentalRequest.vehicle?.id;
            if (targetCarId) {
              try {
                const dmgRes = await handoverService.getLatestDamagesByCar(targetCarId);
                const jsonStr = dmgRes?.damagePointsJson || dmgRes?.data?.damagePointsJson;
                if (jsonStr) {
                  const pts = JSON.parse(jsonStr).map(p => ({
                    ...p,
                    stage: 'PRE_EXISTING',
                    type: 'OLD'
                  }));
                  setDamagePoints(pts);
                }
              } catch (e) {
                console.warn('Could not inherit damage points:', e);
              }
            }
          }
        } catch (err) {
          setExistingProtocol(null);
        } finally {
          setFetching(false);
        }
      };
      loadExisting();
    }
  }, [isOpen, rentalRequest]);

  if (!isOpen || !rentalRequest) return null;

  const toggleAccessory = (item) => {
    if (isSettledLocked) return;
    if (selectedAccessories.includes(item)) {
      setSelectedAccessories(selectedAccessories.filter(a => a !== item));
    } else {
      setSelectedAccessories([...selectedAccessories, item]);
    }
  };

  const handleDashPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setHandoverDashPhotoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // SUBMIT FLOW 1: YARD PICKUP (Direct COMPLETED)
  const handleYardComplete = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg(null);
    setHardBlockMsg(null);

    if (Number(handoverOdo) < currentVehicleOdo) {
      setErrorMsg(`Chỉ số ODO lúc bàn giao (${Number(handoverOdo).toLocaleString('vi-VN')} km) không thể nhỏ hơn ODO hiện tại của xe (${currentVehicleOdo.toLocaleString('vi-VN')} km).`);
      return;
    }
    if (!handoverDashPhotoUrl) {
      setErrorMsg('Bắt buộc phải chụp ảnh đồng hồ taplo lúc bàn giao xe để làm bằng chứng pháp lý.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        rentalRequestId: rentalRequest.id,
        staffName,
        status: 'COMPLETED',
        dispatchOdo: Number(handoverOdo),
        handoverOdo: Number(handoverOdo),
        dispatchFuelLevel: Number(handoverFuelLevel),
        handoverFuelLevel: Number(handoverFuelLevel),
        handoverDashPhotoUrl,
        exteriorCondition,
        interiorCondition,
        tireCondition,
        accessoriesChecklist: selectedAccessories.join(';'),
        existingScratchesNotes,
        dispatchDamageMap: JSON.stringify(damagePoints),
        handoverDamageMap: JSON.stringify(damagePoints),
        staffNotes,
        staffSignature: staffSignature || 'Trần Văn Hưng (Staff VELORA)',
        customerSignature: customerSignature || rentalRequest.customerName
      };

      const res = await handoverService.create(payload);
      const saved = res?.data || res;
      setExistingProtocol(saved);

      // Confirm to activate contract & active request
      if (saved?.id) {
        await handoverService.confirm(saved.id, {
          handoverOdo: Number(handoverOdo),
          handoverFuelLevel: Number(handoverFuelLevel),
          handoverDashPhotoUrl,
          staffName,
          staffSignature,
          customerSignature,
          notes: staffNotes
        });
      }

      alert('Đã hoàn tất bàn giao xe tại bãi thành công! Đơn thuê đã chính thức được KÍCH HOẠT (ACTIVE).');
      if (onSuccess) onSuccess();
      setActiveTab('PREVIEW');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi hoàn tất bàn giao xe.';
      if (err.response?.status === 400) {
        setHardBlockMsg(`Chặn lưu (Hard Block): ${msg}`);
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // SUBMIT FLOW 2: STEP 1 - DISPATCH DRAFT (IN_TRANSIT)
  const handleDispatchStep1 = async () => {
    setErrorMsg(null);
    setHardBlockMsg(null);

    if (Number(dispatchOdo) < currentVehicleOdo) {
      setErrorMsg(`Chỉ số ODO xuất bãi (${Number(dispatchOdo).toLocaleString('vi-VN')} km) không thể nhỏ hơn ODO hiện tại của xe (${currentVehicleOdo.toLocaleString('vi-VN')} km).`);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        rentalRequestId: rentalRequest.id,
        staffName,
        status: 'IN_TRANSIT',
        dispatchOdo: Number(dispatchOdo),
        handoverOdo: Number(dispatchOdo),
        dispatchFuelLevel: Number(dispatchFuelLevel),
        handoverFuelLevel: Number(dispatchFuelLevel),
        exteriorCondition,
        interiorCondition,
        tireCondition,
        accessoriesChecklist: selectedAccessories.join(';'),
        existingScratchesNotes,
        dispatchDamageMap: JSON.stringify(damagePoints.map(p => ({ ...p, stage: 'PRE_EXISTING', type: 'OLD' }))),
        staffNotes: `${staffNotes} [ĐÃ XUẤT BÃI TRUNG CHUYỂN: ODO ${dispatchOdo} km, Nhiên liệu: ${dispatchFuelLevel}%]`,
        staffSignature
      };

      const res = await handoverService.create(payload);
      const saved = res?.data || res;
      setExistingProtocol(saved);

      alert('Đã tạo bản nháp xuất bãi trung chuyển (IN_TRANSIT) thành công. Khi đến điểm hẹn gặp khách, chuyển sang Bước 2 để hoàn tất giao xe.');
      setDoorstepStep(2);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Có lỗi khi lưu xuất bãi trung chuyển.');
    } finally {
      setLoading(false);
    }
  };

  // SUBMIT FLOW 2: STEP 2 - MEET CUSTOMER & COMPLETE (COMPLETED)
  const handleDoorstepComplete = async () => {
    setErrorMsg(null);
    setHardBlockMsg(null);

    if (Number(handoverOdo) < Number(dispatchOdo)) {
      setHardBlockMsg(`Chặn lưu (Hard Block): ODO giao khách (${Number(handoverOdo).toLocaleString()} km) không thể nhỏ hơn ODO xuất bãi (${Number(dispatchOdo).toLocaleString()} km). Vui lòng kiểm tra lại đồng hồ taplo.`);
      return;
    }
    if (isLocalHardBlock) {
      setHardBlockMsg(`Chặn lưu (Hard Block): Quãng đường trung chuyển (${transitKm} km) vượt quá 3 lần khoảng cách cho phép (${maxAllowedTransitKm * 3} km). Vui lòng kiểm tra lỗi gõ nhầm số ODO.`);
      return;
    }
    if (isSoftFlag && !transitAnomalyNote.trim()) {
      setErrorMsg('Quãng đường trung chuyển vượt ngưỡng cho phép. Bắt buộc nhập lý do giải trình (ví dụ: kẹt xe phải đi đường vòng, tránh ngập...) để quản lý hậu kiểm.');
      return;
    }
    if (!handoverDashPhotoUrl) {
      setErrorMsg('Bắt buộc phải chụp ảnh đồng hồ taplo lúc bàn giao xe cho khách hàng.');
      return;
    }

    try {
      setLoading(true);
      const protocolId = existingProtocol?.id;

      const confirmDto = {
        handoverOdo: Number(handoverOdo),
        handoverFuelLevel: Number(handoverFuelLevel),
        handoverDashPhotoUrl,
        handoverDamageMap: JSON.stringify(damagePoints),
        transitAnomalyNote: transitAnomalyNote.trim(),
        staffName,
        staffSignature: staffSignature || 'Trần Văn Hưng (Staff VELORA)',
        customerSignature: customerSignature || rentalRequest.customerName,
        notes: staffNotes
      };

      if (protocolId) {
        await handoverService.confirm(protocolId, confirmDto);
      } else {
        // Fallback: create then confirm
        const createPayload = {
          rentalRequestId: rentalRequest.id,
          staffName,
          status: 'COMPLETED',
          dispatchOdo: Number(dispatchOdo),
          handoverOdo: Number(handoverOdo),
          dispatchFuelLevel: Number(dispatchFuelLevel),
          handoverFuelLevel: Number(handoverFuelLevel),
          handoverDashPhotoUrl,
          transitAnomalyNote: transitAnomalyNote.trim(),
          exteriorCondition,
          interiorCondition,
          tireCondition,
          accessoriesChecklist: selectedAccessories.join(';'),
          existingScratchesNotes,
          dispatchDamageMap: JSON.stringify(damagePoints),
          handoverDamageMap: JSON.stringify(damagePoints),
          staffNotes,
          staffSignature,
          customerSignature
        };
        const createdRes = await handoverService.create(createPayload);
        const created = createdRes?.data || createdRes;
        if (created?.id) {
          await handoverService.confirm(created.id, confirmDto);
        }
      }

      alert('Đã hoàn tất ký biên bản bàn giao xe tận nơi! Đơn thuê đã được chuyển sang ACTIVE và xe chuyển sang RENTED.');
      if (onSuccess) onSuccess();
      setActiveTab('PREVIEW');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi hoàn tất bàn giao.';
      if (err.response?.status === 400) {
        setHardBlockMsg(`Chặn lưu (Hard Block từ Máy chủ): ${msg}`);
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fuel level renderer
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
        /* ELECTRIC SLIDER */
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
            <span>100% (Đầy Pin)</span>
          </div>
        </div>
      ) : (
        /* PETROL 8-BAR VISUAL SELECTOR */
        <div className="space-y-2">
          {/* Visual 8 segments display */}
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

          {/* Quick buttons */}
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <FileCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
                  Biên Bản Bàn Giao Phương Tiện Tự Lái
                </h2>
                {existingProtocol?.protocolNumber && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                    {existingProtocol.protocolNumber}
                  </span>
                )}
                {existingProtocol?.status === 'IN_TRANSIT' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    ĐANG TRUNG CHUYỂN
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Xe: <strong className="text-zinc-950">{rentalRequest.carMake} {rentalRequest.carModel}</strong> ({rentalRequest.carLicensePlate}) • Nhiên liệu: <strong className="text-blue-900">{isElectric ? 'Xe Điện (EV)' : `Xăng/Dầu (${fuelType})`}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('FORM')}
                className={`px-3 py-1.5 rounded-md transition ${activeTab === 'FORM' ? 'bg-white text-zinc-950 shadow-sm' : 'text-slate-600 hover:text-zinc-950'}`}
              >
                Nhập kiểm định
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PREVIEW')}
                className={`px-3 py-1.5 rounded-md transition ${activeTab === 'PREVIEW' ? 'bg-white text-zinc-950 shadow-sm' : 'text-slate-600 hover:text-zinc-950'}`}
              >
                Văn bản pháp lý
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-zinc-950 rounded-lg hover:bg-slate-100 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Locked Banner if Settled */}
        {isSettledLocked && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-900 flex items-center gap-2">
            <Lock size={14} className="text-amber-700 shrink-0" />
            <span>
              <strong>Hồ sơ bàn giao đã được khóa:</strong> Đơn thuê này đã chuyển sang trạng thái quyết toán ({rentalRequest.status}). Mọi thao tác chỉnh sửa hoặc xóa biên bản đều bị vô hiệu hóa.
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

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-700 bg-slate-50/40">
          
          {activeTab === 'FORM' ? (
            <div className="space-y-6">

              {/* 1. Chọn Luồng Giao Nhận (Không chồng chéo) */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={15} className="text-blue-900" />
                    Hình Thức Bàn Giao Phương Tiện
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Địa điểm: <strong>{rentalRequest.pickupLocation || 'Tại Bãi VELORA'}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition ${
                    deliveryMode === 'YARD' 
                      ? 'border-blue-900 bg-blue-50/50 text-blue-950 font-bold ring-1 ring-blue-900' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="deliveryMode"
                      value="YARD"
                      checked={deliveryMode === 'YARD'}
                      disabled={isSettledLocked || existingProtocol?.status === 'IN_TRANSIT'}
                      onChange={() => setDeliveryMode('YARD')}
                      className="mt-0.5 text-blue-900 focus:ring-blue-900"
                    />
                    <div>
                      <span className="block text-xs font-bold">1. Nhận xe tại bãi / quầy</span>
                      <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                        Đi thẳng một bước hoàn tất kiểm định, chụp taplo và kích hoạt đơn ACTIVE.
                      </span>
                    </div>
                  </label>

                  <label className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition ${
                    deliveryMode === 'DOORSTEP' 
                      ? 'border-blue-900 bg-blue-50/50 text-blue-950 font-bold ring-1 ring-blue-900' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="deliveryMode"
                      value="DOORSTEP"
                      checked={deliveryMode === 'DOORSTEP'}
                      disabled={isSettledLocked}
                      onChange={() => setDeliveryMode('DOORSTEP')}
                      className="mt-0.5 text-blue-900 focus:ring-blue-900"
                    />
                    <div>
                      <span className="block text-xs font-bold">2. Giao xe tận nơi (Quy trình 2 bước)</span>
                      <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                        Bước 1 Xuất bãi (IN_TRANSIT) $\rightarrow$ Bước 2 Gặp khách đối chiếu ODO và ký kép (ACTIVE).
                      </span>
                    </div>
                  </label>
                </div>

                {/* Sub-steps indicator for DOORSTEP */}
                {deliveryMode === 'DOORSTEP' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setDoorstepStep(1)}
                      className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition ${
                        doorstepStep === 1 
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs' 
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
                      <span>Bước 1: Xuất bãi trung chuyển (IN_TRANSIT)</span>
                    </button>

                    <ArrowRight size={14} className="text-slate-400 shrink-0" />

                    <button
                      type="button"
                      onClick={() => setDoorstepStep(2)}
                      className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition ${
                        doorstepStep === 2 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
                      <span>Bước 2: Gặp khách bàn giao & ký kép (ACTIVE)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 2. ODO, NHIÊN LIỆU & AUDIT ODO */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-zinc-950 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Gauge size={16} className="text-blue-900" />
                  <span>
                    {deliveryMode === 'YARD' 
                      ? 'Thông Số Bàn Giao Xe Tại Bãi' 
                      : (doorstepStep === 1 ? 'Thông Số Xuất Bãi Trung Chuyển (Bước 1)' : 'Thông Số Bàn Giao Thực Tế Cho Khách (Bước 2)')}
                  </span>
                </h3>

                {/* IF DOORSTEP STEP 2: Show Step 1 Baseline Reference */}
                {deliveryMode === 'DOORSTEP' && doorstepStep === 2 && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">ODO lúc rời bãi:</span>
                      <strong className="text-zinc-950 font-mono text-sm tabular-nums">{dispatchOdo.toLocaleString()} km</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Nhiên liệu lúc rời bãi:</span>
                      <strong className="text-blue-900 text-sm tabular-nums">{dispatchFuelLevel}%</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Khoảng cách tối đa:</span>
                      <strong className="text-emerald-700 text-sm tabular-nums">~{maxAllowedTransitKm.toFixed(1)} km</strong>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ODO Input */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-800 block">
                      {deliveryMode === 'YARD' ? 'Số Kilomet lúc giao (ODO) *' : (doorstepStep === 1 ? 'Số Kilomet xuất bãi (ODO) *' : 'Số Kilomet lúc gặp khách (ODO) *')}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        disabled={isSettledLocked}
                        value={doorstepStep === 1 && deliveryMode === 'DOORSTEP' ? dispatchOdo : handoverOdo}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (deliveryMode === 'DOORSTEP' && doorstepStep === 1) {
                            setDispatchOdo(val);
                            setHandoverOdo(val);
                          } else {
                            setHandoverOdo(val);
                          }
                        }}
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-base font-mono font-extrabold text-zinc-950 tabular-nums focus:bg-white focus:border-blue-900 focus:outline-none"
                      />
                      <span className="font-bold text-xs text-slate-500">KM</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      ODO hiện tại của xe trong hệ thống: <strong className="text-zinc-700">{currentVehicleOdo.toLocaleString()} km</strong>
                    </span>
                  </div>

                  {/* Smart Fuel Selector */}
                  <div>
                    {deliveryMode === 'DOORSTEP' && doorstepStep === 1 ? (
                      renderFuelSelector(dispatchFuelLevel, setDispatchFuelLevel, 'Mức nhiên liệu lúc rời bãi')
                    ) : (
                      renderFuelSelector(handoverFuelLevel, setHandoverFuelLevel, 'Mức nhiên liệu ký nhận với khách')
                    )}
                  </div>
                </div>

                {/* Audit ODO Handling for Doorstep Step 2 */}
                {deliveryMode === 'DOORSTEP' && doorstepStep === 2 && (
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Quãng đường nhân viên đã lái đến điểm hẹn:</span>
                      <strong className={`font-mono text-sm tabular-nums ${isSoftFlag ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {transitKm} km
                      </strong>
                    </div>

                    {/* SOFT FLAG WARNING */}
                    {isSoftFlag && !isLocalHardBlock && (
                      <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                          <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                          <span>Cảnh Báo Kiểm Soát Nội Bộ (Soft Flag) — Vượt Quãng Đường Dự Kiến</span>
                        </div>
                        <p className="text-[11px] text-amber-900/90 leading-relaxed">
                          Quãng đường di chuyển thực tế (<strong>{transitKm} km</strong>) vượt quá ngưỡng cho phép (<strong>{maxAllowedTransitKm.toFixed(1)} km</strong>). Bạn vẫn được hoàn tất giao xe cho khách bình thường, nhưng bắt buộc giải trình lý do bên dưới để quản lý hậu kiểm.
                        </p>
                        <div>
                          <label className="block text-[11px] font-bold text-amber-950 mb-1">
                            Lý do giải trình chênh lệch quãng đường (Bắt buộc) *
                          </label>
                          <input
                            type="text"
                            required
                            value={transitAnomalyNote}
                            disabled={isSettledLocked}
                            onChange={(e) => setTransitAnomalyNote(e.target.value)}
                            placeholder="Ví dụ: Kẹt xe nghiêm trọng trên đường chính, phải đi vòng qua đường tránh..."
                            className="w-full bg-white border border-amber-300 rounded-md p-2 text-xs text-zinc-950 focus:outline-none focus:border-amber-600"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* BẮT BUỘC ẢNH ĐỒNG HỒ TAPLO (Mọi luồng giao xe) */}
                {(deliveryMode === 'YARD' || (deliveryMode === 'DOORSTEP' && doorstepStep === 2)) && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <label className="text-[11px] font-bold text-zinc-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-blue-950">
                        <Camera size={14} className="text-blue-900" />
                        <span>Ảnh Chụp Đồng Hồ Taplo Lúc Bàn Giao (Bắt buộc đối chứng ODO & Xăng) *</span>
                      </span>
                    </label>

                    {handoverDashPhotoUrl ? (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img 
                            src={handoverDashPhotoUrl} 
                            alt="Ảnh taplo lúc giao" 
                            className="w-20 h-14 object-cover rounded-md border border-slate-300"
                          />
                          <div>
                            <span className="font-bold text-xs text-zinc-900 block">Đã ghi nhận ảnh đồng hồ Taplo</span>
                            <span className="text-[10px] text-slate-500">Chụp rõ ODO và mức xăng/pin để tránh tranh chấp khi trả xe</span>
                          </div>
                        </div>

                        {!isSettledLocked && (
                          <button
                            type="button"
                            onClick={() => setHandoverDashPhotoUrl('')}
                            className="px-2.5 py-1 text-slate-500 hover:text-rose-600 text-xs font-semibold"
                          >
                            Chụp lại
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-50 rounded-lg cursor-pointer text-blue-950 text-xs font-semibold border-2 border-dashed border-blue-900/40 hover:border-blue-900 transition">
                          <Camera size={16} className="text-blue-900" />
                          <span>Bấm để chụp hoặc tải ảnh đồng hồ Taplo xe</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            disabled={isSettledLocked}
                            onChange={handleDashPhotoUpload} 
                            className="hidden" 
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. SƠ ĐỒ 2D VẾT XƯỚC NGOẠI QUAN */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-zinc-950 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Car size={16} className="text-blue-900" />
                    <span>Sơ Đồ Đối Chiếu Vết Xước 2D</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {deliveryMode === 'DOORSTEP' && doorstepStep === 2
                      ? 'Vết mới phát sinh lúc lái đi giao được tự động gắn nhãn Nội bộ (không tính phí khách).'
                      : 'Kế thừa tự động vết cũ từ lần thuê trước.'}
                  </span>
                </div>

                <VehicleDamageMap
                  points={damagePoints}
                  onChange={setDamagePoints}
                  mode={isSettledLocked ? 'readonly' : 'handover'}
                  defaultStage={deliveryMode === 'DOORSTEP' && doorstepStep === 2 ? 'TRANSIT_DELIVERY' : 'PRE_EXISTING'}
                  lockedStages={['PRE_EXISTING']}
                />
              </div>

              {/* 4. CHECKLIST PHỤ KIỆN & GIẤY TỜ */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="font-bold text-zinc-950 text-xs uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare size={16} className="text-emerald-700" />
                  <span>Danh Mục Giấy Tờ & Phụ Kiện Bàn Giao Kèm Theo</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEFAULT_ACCESSORIES.map(acc => {
                    const isChecked = selectedAccessories.includes(acc);
                    return (
                      <div
                        key={acc}
                        onClick={() => toggleAccessory(acc)}
                        className={`p-2.5 rounded-lg border flex items-center gap-2.5 cursor-pointer transition select-none text-xs ${
                          isChecked 
                            ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950 font-medium' 
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {isChecked ? (
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        ) : (
                          <Square size={16} className="text-slate-400 shrink-0" />
                        )}
                        <span>{acc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5. XÁC NHẬN KÝ KÉP (DUAL SIGNATURE) */}
              {(deliveryMode === 'YARD' || (deliveryMode === 'DOORSTEP' && doorstepStep === 2)) && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="font-bold text-zinc-950 text-xs uppercase tracking-wider flex items-center gap-2">
                    <FileCheck size={16} className="text-blue-900" />
                    <span>Ký Xác Nhận Kép Tại Điểm Bàn Giao</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                      <span className="font-bold text-zinc-900 text-xs block">1. Đại diện Bên Giao Xe (Staff VELORA)</span>
                      <input
                        type="text"
                        value={staffName}
                        disabled={isSettledLocked}
                        onChange={(e) => setStaffName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-zinc-950 font-semibold focus:outline-none focus:border-blue-900"
                        placeholder="Họ tên nhân viên giao xe"
                      />
                      <input
                        type="text"
                        value={staffSignature}
                        disabled={isSettledLocked}
                        onChange={(e) => setStaffSignature(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 italic focus:outline-none focus:border-blue-900"
                        placeholder="Chữ ký điện tử / Họ tên"
                      />
                    </div>

                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                      <span className="font-bold text-zinc-900 text-xs block">2. Đại diện Bên Nhận Xe (Khách Hàng)</span>
                      <input
                        type="text"
                        value={`${rentalRequest.customerName} - ${rentalRequest.customerPhone}`}
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600 font-semibold"
                      />
                      <input
                        type="text"
                        value={customerSignature}
                        disabled={isSettledLocked}
                        onChange={(e) => setCustomerSignature(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 italic focus:outline-none focus:border-blue-900"
                        placeholder="Chữ ký khách hàng hoặc xác nhận trực tiếp"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <span className="text-[11px] text-slate-500">
                  {deliveryMode === 'DOORSTEP' && doorstepStep === 1 
                    ? 'Lưu nháp xuất bãi sẽ chuyển trạng thái đơn sang IN_TRANSIT.'
                    : 'Hoàn tất bàn giao sẽ kích hoạt đơn thuê sang ACTIVE và xe sang RENTED.'}
                </span>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition shadow-xs"
                  >
                    Đóng
                  </button>

                  {!isSettledLocked && (
                    <>
                      {deliveryMode === 'DOORSTEP' && doorstepStep === 1 ? (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={handleDispatchStep1}
                          className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer disabled:opacity-50"
                        >
                          <Save size={15} />
                          <span>{loading ? 'Đang lưu xuất bãi...' : 'Xác Nhận Xuất Bãi (IN_TRANSIT)'}</span>
                        </button>
                      ) : deliveryMode === 'DOORSTEP' && doorstepStep === 2 ? (
                        <button
                          type="button"
                          disabled={loading || isLocalHardBlock}
                          onClick={handleDoorstepComplete}
                          className="w-full sm:w-auto px-6 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-400 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
                        >
                          <CheckCircle2 size={15} />
                          <span>{loading ? 'Đang kích hoạt...' : 'Ký Kép & Hoàn Tất Bàn Giao (ACTIVE)'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={handleYardComplete}
                          className="w-full sm:w-auto px-6 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-400 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
                        >
                          <CheckCircle2 size={15} />
                          <span>{loading ? 'Đang hoàn tất...' : 'Hoàn Tất Bàn Giao Tại Bãi (ACTIVE)'}</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* PREVIEW TAB (Legal Document) */
            <div className="space-y-4">
              <div className="flex justify-end gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Printer size={14} />
                  <span>In biên bản bàn giao</span>
                </button>
              </div>

              <div className="bg-white text-zinc-950 p-8 sm:p-10 rounded-xl border border-slate-200 shadow-sm space-y-6 text-xs">
                <div className="text-center space-y-1">
                  <div className="font-bold text-xs uppercase tracking-widest text-zinc-950">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div className="text-[11px] italic text-slate-600">Độc lập - Tự do - Hạnh phúc</div>
                  <div className="text-slate-400 tracking-widest mt-1">---o0o---</div>
                </div>

                <div className="text-center pt-2">
                  <h1 className="text-base font-bold uppercase tracking-wider text-zinc-950">
                    BIÊN BẢN BÀN GIAO PHƯƠNG TIỆN TỰ LÁI
                  </h1>
                  <p className="text-slate-500 mt-1">
                    Số biên bản: <strong className="font-mono text-zinc-950">{existingProtocol?.protocolNumber || 'BBBG-2026-DRAFT'}</strong>
                  </p>
                </div>

                <div className="text-[11px] italic text-slate-600 space-y-0.5 border-b border-slate-200 pb-3">
                  <p>- Căn cứ Hợp đồng thuê xe ô tô tự lái số: <strong>HD-{rentalRequest.carLicensePlate}</strong></p>
                  <p>- Căn cứ nhu cầu và thỏa thuận thực tế giữa Bên Cho Thuê và Bên Thuê.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold uppercase text-zinc-950 text-[11px]">I. ĐẠI DIỆN BÊN GIAO XE (BÊN A - VELORA):</h3>
                    <p className="mt-1 text-slate-700">- Nhân viên bàn giao: <strong className="text-zinc-950">{staffName}</strong></p>
                    <p className="text-slate-700">- Đơn vị: CÔNG TY TNHH DỊCH VỤ VẬN TẢI VELORA</p>
                  </div>

                  <div>
                    <h3 className="font-bold uppercase text-zinc-950 text-[11px]">II. ĐẠI DIỆN BÊN NHẬN XE (BÊN B - KHÁCH HÀNG):</h3>
                    <p className="mt-1 text-slate-700">- Họ và tên: <strong className="text-zinc-950">{rentalRequest.customerName}</strong></p>
                    <p className="text-slate-700">- Số điện thoại: <strong className="text-zinc-950 tabular-nums">{rentalRequest.customerPhone}</strong></p>
                  </div>

                  <div>
                    <h3 className="font-bold uppercase text-zinc-950 text-[11px]">III. THÔNG TIN PHƯƠNG TIỆN VÀ CHỈ SỐ BÀN GIAO:</h3>
                    <div className="grid grid-cols-2 gap-2 mt-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                      <div>Dòng xe: <strong className="text-zinc-950">{rentalRequest.carMake} {rentalRequest.carModel}</strong></div>
                      <div>Biển số: <strong className="font-mono text-blue-900">{rentalRequest.carLicensePlate}</strong></div>
                      <div>Số ODO bàn giao: <strong className="font-mono text-zinc-950 tabular-nums">{handoverOdo.toLocaleString()} km</strong></div>
                      <div>Mức nhiên liệu: <strong className="text-emerald-700 font-bold">{handoverFuelLevel}%</strong></div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold uppercase text-zinc-950 text-[11px]">IV. SƠ ĐỒ VẾT XƯỚC 2D ĐÃ CHỐT:</h3>
                    <div className="mt-2">
                      <VehicleDamageMap points={damagePoints} mode="readonly" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs">
                  <div>
                    <div className="font-bold uppercase text-zinc-950">ĐẠI DIỆN BÊN GIAO XE</div>
                    <div className="text-[10px] italic text-slate-500">(Ký, ghi rõ họ tên)</div>
                    <div className="mt-12 font-bold text-zinc-950">{staffName}</div>
                  </div>
                  <div>
                    <div className="font-bold uppercase text-zinc-950">ĐẠI DIỆN BÊN NHẬN XE</div>
                    <div className="text-[10px] italic text-slate-500">(Ký, ghi rõ họ tên)</div>
                    <div className="mt-12 font-bold text-zinc-950">{customerSignature || rentalRequest.customerName}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default HandoverModal;
