import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  Info,
  Car,
  X,
  Camera,
  Eye,
  Upload,
  Lock,
  Layers
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

/**
 * Stage definitions matching VELORA V2.0 Clean Workflow
 */
export const DAMAGE_STAGES = {
  PRE_EXISTING: {
    key: 'PRE_EXISTING',
    label: 'Vết cũ từ trước',
    sublabel: 'Chỉ đọc, khóa không sửa/xóa',
    color: 'slate',
    badgeBg: 'bg-slate-700/80 text-slate-200 border-slate-600',
    pinBg: 'bg-slate-500 border-slate-300 text-white',
    letter: 'C',
    isChargeable: false,
    isLocked: true
  },
  TRANSIT_DELIVERY: {
    key: 'TRANSIT_DELIVERY',
    label: 'Nội bộ giao xe',
    sublabel: 'Phát sinh lúc giao • Không tính phí khách',
    color: 'amber',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    pinBg: 'bg-amber-500 border-amber-300 text-slate-950',
    letter: 'G',
    isChargeable: false,
    isLocked: false // only locked in return mode
  },
  CUSTOMER_RENTAL: {
    key: 'CUSTOMER_RENTAL',
    label: 'Khách thuê làm xước',
    sublabel: 'Phát sinh lúc trả xe • Tính phí bồi thường',
    color: 'rose',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    pinBg: 'bg-rose-600 border-rose-300 text-white',
    letter: 'M',
    isChargeable: true,
    isLocked: false
  },
  TRANSIT_RETURN: {
    key: 'TRANSIT_RETURN',
    label: 'Nội bộ về bãi',
    sublabel: 'Phát sinh lúc về bãi • Không tính phí khách',
    color: 'purple',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    pinBg: 'bg-purple-600 border-purple-300 text-white',
    letter: 'V',
    isChargeable: false,
    isLocked: false
  }
};

/**
 * Helper to normalize marker stage
 */
export const getMarkerStage = (marker) => {
  if (marker.stage && DAMAGE_STAGES[marker.stage]) return marker.stage;
  if (marker.type === 'NEW') return 'CUSTOMER_RENTAL';
  return 'PRE_EXISTING';
};

const COMMON_DAMAGES = [
  'Trầy xước nhẹ dưới 5cm',
  'Trầy xước sâu cản xe',
  'Vết móp nhẹ cửa xe',
  'Mâm xe cấn lề xước sơn',
  'Nứt nhẹ ốp đèn pha/hậu',
  'Trầy sườn hông xe',
  'Trầy xước ốp gương chiếu hậu',
  'Cấn móp nắp capo'
];

/**
 * VehicleDamageMap Component
 * @param {Array} points - Array of damage markers [{ id, x, y, view, description, severity, stage, fee, photo_url, photoUrl }]
 * @param {Function} onChange - (updatedPoints) => void
 * @param {'handover' | 'return' | 'yard_checkin' | 'readonly'} mode
 * @param {string} defaultStage - Default stage for new markers
 * @param {Array<string>} lockedStages - Array of stages that cannot be deleted
 */
const VehicleDamageMap = ({ 
  points = [], 
  onChange, 
  mode = 'handover', 
  defaultStage = null,
  lockedStages = ['PRE_EXISTING'],
  showList = true,
  className = ''
}) => {
  const [activeView, setActiveView] = useState('ALL'); // 'ALL', 'FRONT', 'REAR', 'LEFT', 'RIGHT', 'TOP'
  const [dialogState, setDialogState] = useState(null); // Adding new point
  const [inspectPoint, setInspectPoint] = useState(null); // Inspecting existing point

  // Determine default stage for new markers based on mode
  const resolvedDefaultStage = defaultStage || (
    mode === 'return' ? 'CUSTOMER_RENTAL' : 
    mode === 'yard_checkin' ? 'TRANSIT_RETURN' : 
    'PRE_EXISTING'
  );

  // Filter & classify points by stage
  const pointsWithStage = points.map(p => ({
    ...p,
    resolvedStage: getMarkerStage(p)
  }));

  const preExistingPoints = pointsWithStage.filter(p => p.resolvedStage === 'PRE_EXISTING');
  const transitDeliveryPoints = pointsWithStage.filter(p => p.resolvedStage === 'TRANSIT_DELIVERY');
  const customerRentalPoints = pointsWithStage.filter(p => p.resolvedStage === 'CUSTOMER_RENTAL');
  const transitReturnPoints = pointsWithStage.filter(p => p.resolvedStage === 'TRANSIT_RETURN');

  const totalChargeableFee = customerRentalPoints.reduce((sum, p) => sum + (Number(p.fee) || 0), 0);

  const handleSvgClick = (e, viewName) => {
    if (mode === 'readonly') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const relX = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const relY = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    setDialogState({
      view: viewName,
      relX,
      relY,
      description: 'Trầy xước nhẹ',
      severity: 'MINOR', // MINOR, MODERATE, SEVERE
      stage: resolvedDefaultStage,
      fee: resolvedDefaultStage === 'CUSTOMER_RENTAL' ? 300000 : 0,
      photoUrl: ''
    });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setDialogState(prev => prev ? ({ ...prev, photoUrl: reader.result }) : null);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePoint = () => {
    if (!dialogState) return;

    const stageKey = dialogState.stage || resolvedDefaultStage;
    const isNew = stageKey === 'CUSTOMER_RENTAL' || stageKey === 'TRANSIT_RETURN';

    const newPoint = {
      id: `dmg-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      view: dialogState.view,
      x: dialogState.relX,
      y: dialogState.relY,
      description: dialogState.description || 'Vết tổn thất ngoại quan',
      severity: dialogState.severity,
      stage: stageKey,
      type: isNew ? 'NEW' : 'OLD',
      fee: stageKey === 'CUSTOMER_RENTAL' ? (Number(dialogState.fee) || 0) : 0,
      photo_url: dialogState.photoUrl || '',
      photoUrl: dialogState.photoUrl || ''
    };

    const updated = [...points, newPoint];
    if (onChange) onChange(updated);
    setDialogState(null);
  };

  const isPointLocked = (point) => {
    if (mode === 'readonly') return true;
    const stage = getMarkerStage(point);
    if (stage === 'PRE_EXISTING') return true;
    if (mode === 'return' && stage === 'TRANSIT_DELIVERY') return true;
    if (lockedStages.includes(stage)) return true;
    return false;
  };

  const handleDeletePoint = (id) => {
    const target = points.find(p => p.id === id);
    if (!target || isPointLocked(target)) return;

    const updated = points.filter(p => p.id !== id);
    if (onChange) onChange(updated);
    if (inspectPoint?.id === id) setInspectPoint(null);
  };

  // Render Pin marker on Canvas
  const renderPin = (point) => {
    const stageKey = getMarkerStage(point);
    const stageConfig = DAMAGE_STAGES[stageKey] || DAMAGE_STAGES.PRE_EXISTING;
    const isSelected = inspectPoint?.id === point.id;

    return (
      <div
        key={point.id}
        onClick={(e) => {
          e.stopPropagation();
          setInspectPoint(point);
        }}
        style={{ left: `${point.x}%`, top: `${point.y}%` }}
        className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group/pin transition-all hover:scale-125 ${
          isSelected ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900 rounded-full' : ''
        }`}
        title={`[${stageConfig.label}]: ${point.description}`}
      >
        <div className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] shadow-md border ${stageConfig.pinBg} ${
          stageKey === 'CUSTOMER_RENTAL' ? 'animate-bounce' : ''
        }`}>
          {stageConfig.letter}
        </div>

        {/* Hover Tooltip */}
        <div className="absolute left-1/2 bottom-full -translate-x-1/2 mb-1.5 hidden group-hover/pin:flex flex-col bg-slate-950 text-white text-[10px] rounded-md px-2 py-1 whitespace-nowrap shadow-xl border border-slate-700 pointer-events-none z-30">
          <div className="flex items-center gap-1 font-semibold text-slate-200">
            <span>{point.description}</span>
            {(point.photo_url || point.photoUrl) && (
              <Camera size={10} className="text-blue-400" />
            )}
          </div>
          <span className={`text-[9px] font-medium ${
            stageKey === 'PRE_EXISTING' ? 'text-slate-400' :
            stageKey === 'TRANSIT_DELIVERY' ? 'text-amber-400' :
            stageKey === 'CUSTOMER_RENTAL' ? 'text-rose-400 font-bold' :
            'text-purple-400'
          }`}>
            {stageConfig.label} {stageKey === 'CUSTOMER_RENTAL' && point.fee > 0 ? `(+${formatCurrency(point.fee)})` : ''}
          </span>
        </div>
      </div>
    );
  };

  // SVGs for Views
  const renderFrontView = () => (
    <div className="relative group cursor-crosshair bg-slate-900/60 rounded-xl p-3 border border-slate-800 flex flex-col items-center">
      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-blue-500"></span> Mặt Trước (Đầu Xe)
      </span>
      <div 
        className="relative w-full aspect-16/10 max-w-[280px]"
        onClick={(e) => handleSvgClick(e, 'FRONT')}
      >
        <svg viewBox="0 0 200 120" className="w-full h-full select-none">
          <path d="M 40 85 Q 40 40 70 30 L 130 30 Q 160 40 160 85 L 155 105 Q 100 110 45 105 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <path d="M 68 35 L 132 35 L 125 55 L 75 55 Z" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          <path d="M 75 55 L 70 85 M 125 55 L 130 85" stroke="#334155" strokeWidth="1.5" strokeDasharray="2 2" />
          <rect x="75" y="80" width="50" height="15" rx="3" fill="#090d16" stroke="#64748b" strokeWidth="1.5" />
          <polygon points="45,68 65,70 60,82 43,78" fill="#38bdf8" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="1.5" />
          <polygon points="155,68 135,70 140,82 157,78" fill="#38bdf8" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="1.5" />
          <path d="M 45 100 Q 100 108 155 100" stroke="#64748b" strokeWidth="2" fill="none" />
          <ellipse cx="32" cy="48" rx="6" ry="4" fill="#334155" stroke="#475569" />
          <ellipse cx="168" cy="48" rx="6" ry="4" fill="#334155" stroke="#475569" />
        </svg>
        {pointsWithStage.filter(p => p.view === 'FRONT').map(p => renderPin(p))}
      </div>
    </div>
  );

  const renderRearView = () => (
    <div className="relative group cursor-crosshair bg-slate-900/60 rounded-xl p-3 border border-slate-800 flex flex-col items-center">
      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Mặt Sau (Đuôi Xe)
      </span>
      <div 
        className="relative w-full aspect-16/10 max-w-[280px]"
        onClick={(e) => handleSvgClick(e, 'REAR')}
      >
        <svg viewBox="0 0 200 120" className="w-full h-full select-none">
          <path d="M 40 85 Q 40 40 70 30 L 130 30 Q 160 40 160 85 L 155 105 Q 100 110 45 105 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <path d="M 68 35 L 132 35 L 126 58 L 74 58 Z" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          <path d="M 50 82 Q 100 85 150 82" stroke="#475569" strokeWidth="1.5" fill="none" />
          <rect x="80" y="85" width="40" height="12" rx="2" fill="#090d16" stroke="#475569" strokeWidth="1" />
          <polygon points="45,65 68,66 65,76 43,73" fill="#ef4444" fillOpacity="0.5" stroke="#ef4444" strokeWidth="1.5" />
          <polygon points="155,65 132,66 135,76 157,73" fill="#ef4444" fillOpacity="0.5" stroke="#ef4444" strokeWidth="1.5" />
          <circle cx="58" cy="104" r="3" fill="#64748b" />
          <circle cx="142" cy="104" r="3" fill="#64748b" />
        </svg>
        {pointsWithStage.filter(p => p.view === 'REAR').map(p => renderPin(p))}
      </div>
    </div>
  );

  const renderSideView = (viewName, label) => (
    <div className="relative group cursor-crosshair bg-slate-900/60 rounded-xl p-3 border border-slate-800 flex flex-col items-center">
      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {label}
      </span>
      <div 
        className="relative w-full aspect-21/9 max-w-[340px]"
        onClick={(e) => handleSvgClick(e, viewName)}
      >
        <svg viewBox="0 0 260 100" className="w-full h-full select-none">
          <path d="M 20 70 L 35 68 L 65 52 L 110 40 L 175 40 L 220 55 L 245 68 L 245 74 L 20 74 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <path d="M 75 52 L 115 44 L 140 44 L 140 54 L 75 54 Z" fill="#0f172a" stroke="#334155" />
          <path d="M 145 44 L 175 44 L 205 52 L 145 54 Z" fill="#0f172a" stroke="#334155" />
          <line x1="142" y1="44" x2="142" y2="72" stroke="#334155" strokeWidth="1.5" />
          <line x1="85" y1="53" x2="85" y2="72" stroke="#334155" strokeWidth="1.5" />
          <rect x="125" y="56" width="8" height="2" rx="1" fill="#94a3b8" />
          <rect x="165" y="56" width="8" height="2" rx="1" fill="#94a3b8" />
          <path d="M 45 74 A 16 16 0 0 1 77 74" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
          <circle cx="61" cy="74" r="13" fill="#020617" stroke="#475569" strokeWidth="2" />
          <circle cx="61" cy="74" r="6" fill="#475569" />
          <path d="M 185 74 A 16 16 0 0 1 217 74" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
          <circle cx="201" cy="74" r="13" fill="#020617" stroke="#475569" strokeWidth="2" />
          <circle cx="201" cy="74" r="6" fill="#475569" />
        </svg>
        {pointsWithStage.filter(p => p.view === viewName).map(p => renderPin(p))}
      </div>
    </div>
  );

  const renderTopView = () => (
    <div className="relative group cursor-crosshair bg-slate-900/60 rounded-xl p-3 border border-slate-800 flex flex-col items-center">
      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-purple-500"></span> Nóc & Trần Xe (Top View)
      </span>
      <div 
        className="relative w-full aspect-21/9 max-w-[340px]"
        onClick={(e) => handleSvgClick(e, 'TOP')}
      >
        <svg viewBox="0 0 260 90" className="w-full h-full select-none">
          <path d="M 25 35 Q 20 45 25 55 L 50 68 Q 130 72 210 68 L 240 55 Q 245 45 240 35 L 210 22 Q 130 18 50 22 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <path d="M 60 27 L 85 30 L 85 60 L 60 63 Z" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          <rect x="95" y="30" width="55" height="30" rx="3" fill="#020617" stroke="#334155" strokeWidth="1.5" />
          <path d="M 160 30 L 185 27 L 185 63 L 160 60 Z" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
        </svg>
        {pointsWithStage.filter(p => p.view === 'TOP').map(p => renderPin(p))}
      </div>
    </div>
  );

  return (
    <div className={`bg-slate-950/90 rounded-2xl border border-slate-800 p-4 sm:p-5 text-white shadow-xl ${className}`}>
      
      {/* Header & Legend */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800 mb-4">
        <div>
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <Car size={16} className="text-blue-400" />
            <span>Sơ Đồ Phân Tầng Vết Xước Ngoại Quan 2D</span>
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {mode === 'handover' 
              ? 'Click lên hình để chấm vết xước. Vết cũ được kế thừa tự động. Vết phát sinh lúc giao xe được gắn cờ nội bộ (không tính phí khách).' 
              : mode === 'return'
                ? 'Vết cũ & vết trung chuyển giao xe bị khóa. Chỉ chấm thêm vết mới do khách gây ra (Màu đỏ) để tính bồi thường.'
                : 'Sơ đồ đối chiếu tình trạng vết xước qua các giai đoạn (Diff Marker).'}
          </p>
        </div>

        {/* 4-Stage Legend Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-500 border border-slate-300 flex items-center justify-center text-[8px] font-bold text-white">C</span>
            <span className="text-slate-300 text-[11px]">Vết cũ ({preExistingPoints.length})</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-amber-500/30">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-amber-300 flex items-center justify-center text-[8px] font-bold text-slate-950">G</span>
            <span className="text-amber-400 text-[11px]">Nội bộ giao xe ({transitDeliveryPoints.length})</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-rose-500/30">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-600 border border-rose-300 flex items-center justify-center text-[8px] font-bold text-white">M</span>
            <span className="text-rose-400 text-[11px] font-bold">Khách thuê mới ({customerRentalPoints.length})</span>
          </div>

          {transitReturnPoints.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-purple-500/30">
              <span className="w-3.5 h-3.5 rounded-full bg-purple-600 border border-purple-300 flex items-center justify-center text-[8px] font-bold text-white">V</span>
              <span className="text-purple-400 text-[11px]">Nội bộ về bãi ({transitReturnPoints.length})</span>
            </div>
          )}
        </div>
      </div>

      {/* View Selectors */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 text-xs">
        {['ALL', 'FRONT', 'REAR', 'LEFT', 'RIGHT', 'TOP'].map(v => (
          <button
            key={v}
            type="button"
            onClick={() => setActiveView(v)}
            className={`px-3 py-1 rounded-md font-semibold transition ${
              activeView === v 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {v === 'ALL' && 'Tất cả các mặt'}
            {v === 'FRONT' && 'Mặt trước'}
            {v === 'REAR' && 'Mặt sau'}
            {v === 'LEFT' && 'Sườn trái'}
            {v === 'RIGHT' && 'Sườn phải'}
            {v === 'TOP' && 'Nóc trần'}
          </button>
        ))}
      </div>

      {/* SVG Canvas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {(activeView === 'ALL' || activeView === 'FRONT') && renderFrontView()}
        {(activeView === 'ALL' || activeView === 'REAR') && renderRearView()}
        {(activeView === 'ALL' || activeView === 'LEFT') && renderSideView('LEFT', 'Sườn Xe Bên Trái (Cánh lái)')}
        {(activeView === 'ALL' || activeView === 'RIGHT') && renderSideView('RIGHT', 'Sườn Xe Bên Phải (Cánh phụ)')}
        {(activeView === 'ALL' || activeView === 'TOP') && renderTopView()}
      </div>

      {/* Add Point Dialog Popup */}
      {dialogState && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${
                  dialogState.stage === 'CUSTOMER_RENTAL' ? 'bg-rose-500' :
                  dialogState.stage === 'TRANSIT_DELIVERY' ? 'bg-amber-500' :
                  dialogState.stage === 'TRANSIT_RETURN' ? 'bg-purple-500' : 'bg-slate-500'
                }`}></span>
                Ghi Nhận Điểm Tổn Thất ({dialogState.view})
              </h5>
              <button onClick={() => setDialogState(null)} className="text-slate-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Stage selector if in flexible mode */}
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Phân loại giai đoạn phát sinh:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.values(DAMAGE_STAGES).map(st => {
                    const isSelected = dialogState.stage === st.key;
                    // If in return mode, can only choose CUSTOMER_RENTAL or PRE_EXISTING (if staff forgot)
                    const disabled = (mode === 'return' && st.key === 'TRANSIT_DELIVERY');
                    if (disabled) return null;

                    return (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() => setDialogState({ ...dialogState, stage: st.key })}
                        className={`p-2 rounded-lg border text-left flex items-start gap-2 transition ${
                          isSelected 
                            ? 'bg-slate-800 border-blue-500 text-white ring-1 ring-blue-500' 
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 ${st.pinBg} flex items-center justify-center text-[8px] font-bold`}>
                          {st.letter}
                        </span>
                        <div>
                          <div className="font-bold text-[11px] leading-tight text-slate-200">{st.label}</div>
                          <div className="text-[9px] text-slate-500 leading-tight mt-0.5">{st.sublabel}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Mô tả vết xước / tổn thất:</label>
                <input
                  type="text"
                  value={dialogState.description}
                  onChange={(e) => setDialogState({ ...dialogState, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
                  placeholder="Nhập mô tả vị trí và mức độ..."
                />
                
                {/* Suggestions */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {COMMON_DAMAGES.map(sug => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setDialogState({ ...dialogState, description: sug })}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Mức độ hư hỏng:</label>
                  <select
                    value={dialogState.severity}
                    onChange={(e) => setDialogState({ ...dialogState, severity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs"
                  >
                    <option value="MINOR">Nhẹ (Trầy sơn dưới 5cm)</option>
                    <option value="MODERATE">Vừa (Móp / Cấn sâu)</option>
                    <option value="SEVERE">Nặng (Biến dạng / Nứt)</option>
                  </select>
                </div>

                {dialogState.stage === 'CUSTOMER_RENTAL' ? (
                  <div>
                    <label className="text-rose-400 block mb-1 font-bold">Chi phí bồi thường (VND):</label>
                    <input
                      type="number"
                      step={50000}
                      value={dialogState.fee}
                      onChange={(e) => setDialogState({ ...dialogState, fee: e.target.value })}
                      className="w-full bg-slate-950 border border-rose-500/50 text-rose-400 font-bold rounded-lg p-2 text-xs"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] text-slate-500">Trách nhiệm:</span>
                    <span className="text-xs font-semibold text-emerald-400">0đ (Không tính phí khách)</span>
                  </div>
                )}
              </div>

              {/* Photo Upload / Attachment */}
              <div>
                <label className="text-slate-400 block mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera size={13} className="text-blue-400" />
                    <span>Ảnh chụp hiện trường vết xước (Đối chứng):</span>
                  </span>
                </label>
                
                {dialogState.photoUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950 p-1 flex items-center justify-between">
                    <img 
                      src={dialogState.photoUrl} 
                      alt="Damage preview" 
                      className="w-16 h-12 object-cover rounded"
                    />
                    <span className="text-[11px] text-emerald-400 font-medium">Đã tải ảnh lên</span>
                    <button
                      type="button"
                      onClick={() => setDialogState({ ...dialogState, photoUrl: '' })}
                      className="p-1 text-slate-400 hover:text-rose-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer text-slate-300 text-xs border border-dashed border-slate-600 transition">
                      <Upload size={13} />
                      <span>Chọn file ảnh từ máy / điện thoại</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDialogState(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSavePoint}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
              >
                Lưu Điểm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Point Dialog Popup (View Photo & Info) */}
      {inspectPoint && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  (DAMAGE_STAGES[getMarkerStage(inspectPoint)] || DAMAGE_STAGES.PRE_EXISTING).pinBg
                }`}>
                  {(DAMAGE_STAGES[getMarkerStage(inspectPoint)] || DAMAGE_STAGES.PRE_EXISTING).letter}
                </span>
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                  Chi Tiết Điểm Tổn Thất ({inspectPoint.view})
                </h5>
              </div>
              <button onClick={() => setInspectPoint(null)} className="text-slate-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Giai đoạn:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${(DAMAGE_STAGES[getMarkerStage(inspectPoint)] || DAMAGE_STAGES.PRE_EXISTING).badgeBg}`}>
                    {(DAMAGE_STAGES[getMarkerStage(inspectPoint)] || DAMAGE_STAGES.PRE_EXISTING).label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Mức độ:</span>
                  <span className="font-semibold text-slate-200">{inspectPoint.severity || 'MINOR'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Mô tả:</span>
                  <span className="font-semibold text-white">{inspectPoint.description}</span>
                </div>
                {inspectPoint.stage === 'CUSTOMER_RENTAL' && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <span className="text-rose-400 font-bold">Phí bồi thường:</span>
                    <span className="text-rose-400 font-extrabold text-sm">{formatCurrency(inspectPoint.fee || 0)}</span>
                  </div>
                )}
                {inspectPoint.stage === 'TRANSIT_DELIVERY' && (
                  <div className="text-[11px] text-amber-300 font-medium italic pt-1 border-t border-slate-800">
                    * Sự cố trung chuyển nội bộ — Nhân viên phụ trách, không tính phí khách hàng.
                  </div>
                )}
              </div>

              {/* Photo Display if available */}
              {(inspectPoint.photo_url || inspectPoint.photoUrl) ? (
                <div>
                  <span className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                    <Camera size={13} className="text-blue-400" />
                    <span>Ảnh chụp đối chứng vết xước:</span>
                  </span>
                  <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
                    <img 
                      src={inspectPoint.photo_url || inspectPoint.photoUrl} 
                      alt="Ảnh vết xước chi tiết" 
                      className="w-full max-h-48 object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-500 italic text-center">
                  Không có ảnh chụp hiện trường đính kèm
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              {!isPointLocked(inspectPoint) ? (
                <button
                  type="button"
                  onClick={() => handleDeletePoint(inspectPoint.id)}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold hover:bg-rose-900 transition flex items-center gap-1"
                >
                  <Trash2 size={13} />
                  <span>Xóa điểm này</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Lock size={12} />
                  <span>Vết đã khóa ({DAMAGE_STAGES[getMarkerStage(inspectPoint)]?.label})</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => setInspectPoint(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Point List Table */}
      {showList && points.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-400">
            <span className="font-semibold uppercase text-[11px] text-slate-300">
              Danh Sách Điểm Tổn Thất Đã Chấm ({points.length} điểm)
            </span>
            {totalChargeableFee > 0 && (
              <span className="text-rose-400 font-bold">
                Tổng phí bồi thường hư hại mới (Khách thuê): {formatCurrency(totalChargeableFee)}
              </span>
            )}
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {pointsWithStage.map((p, idx) => {
              const stageConfig = DAMAGE_STAGES[p.resolvedStage] || DAMAGE_STAGES.PRE_EXISTING;
              const locked = isPointLocked(p);

              return (
                <div 
                  key={p.id}
                  onClick={() => setInspectPoint(p)}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs border cursor-pointer transition hover:border-slate-600 ${
                    p.resolvedStage === 'PRE_EXISTING' 
                      ? 'bg-slate-900/40 border-slate-800 text-slate-300' 
                      : p.resolvedStage === 'TRANSIT_DELIVERY'
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                        : p.resolvedStage === 'CUSTOMER_RENTAL'
                          ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                          : 'bg-purple-950/20 border-purple-500/30 text-purple-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] ${stageConfig.pinBg}`}>
                      {stageConfig.letter}
                    </span>
                    <span className="font-semibold text-slate-400">[{p.view}]</span>
                    <span className="font-medium text-slate-100">{p.description}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${stageConfig.badgeBg}`}>
                      {stageConfig.label}
                    </span>
                    {(p.photo_url || p.photoUrl) && (
                      <span className="p-0.5 rounded bg-blue-900/60 text-blue-300" title="Có ảnh chụp đối chứng">
                        <Camera size={11} />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {p.resolvedStage === 'CUSTOMER_RENTAL' && p.fee > 0 && (
                      <span className="font-bold text-rose-400">+{formatCurrency(p.fee)}</span>
                    )}
                    {p.resolvedStage === 'TRANSIT_DELIVERY' && (
                      <span className="text-amber-400/80 italic text-[11px]">Nội bộ / 0đ</span>
                    )}
                    {p.resolvedStage === 'PRE_EXISTING' && (
                      <span className="text-slate-500 italic text-[11px]">Vết cũ</span>
                    )}

                    {!locked ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePoint(p.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 transition p-1"
                        title="Xóa điểm này"
                      >
                        <Trash2 size={13} />
                      </button>
                    ) : (
                      <span className="text-slate-600 p-1" title="Điểm đã khóa, không thể xóa">
                        <Lock size={12} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleDamageMap;
