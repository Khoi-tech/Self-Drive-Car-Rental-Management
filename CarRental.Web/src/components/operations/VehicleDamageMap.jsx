import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  Info,
  Car,
  X
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

/**
 * VehicleDamageMap Component
 * @param {Array} points - Array of damage points: [{ id, x, y, view, description, severity, type: 'OLD'|'NEW', fee: number }]
 * @param {Function} onChange - Callback when points change: (newPoints) => void
 * @param {'handover' | 'return' | 'readonly'} mode - Mode of operation
 */
const VehicleDamageMap = ({ 
  points = [], 
  onChange, 
  mode = 'handover', // 'handover' (adds OLD points), 'return' (shows OLD, adds NEW points), 'readonly'
  showList = true,
  className = ''
}) => {
  const [activeView, setActiveView] = useState('ALL'); // 'ALL', 'FRONT', 'REAR', 'LEFT', 'RIGHT', 'TOP'
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [dialogState, setDialogState] = useState(null); // { x, y, view, relX, relY }

  // Quick suggestion tags
  const COMMON_DAMAGES = [
    'Trầy xước nhẹ dưới 5cm',
    'Trầy xước sâu cản xe',
    'Vết móp nhẹ cửa xe',
    'Mâm xe cấn lề xước sơn',
    'Nứt nhẹ ốp đèn',
    'Trầy sườn hông xe'
  ];

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
      fee: mode === 'return' ? 300000 : 0
    });
  };

  const handleSavePoint = () => {
    if (!dialogState) return;

    const newPoint = {
      id: `dp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      view: dialogState.view,
      x: dialogState.relX,
      y: dialogState.relY,
      description: dialogState.description || 'Vết tổn thất ngoại quan',
      severity: dialogState.severity,
      type: mode === 'return' ? 'NEW' : 'OLD',
      fee: mode === 'return' ? Number(dialogState.fee) || 0 : 0
    };

    const updated = [...points, newPoint];
    if (onChange) onChange(updated);
    setDialogState(null);
  };

  const handleDeletePoint = (id) => {
    if (mode === 'readonly') return;
    const updated = points.filter(p => p.id !== id);
    if (onChange) onChange(updated);
    if (selectedPoint?.id === id) setSelectedPoint(null);
  };

  const oldPoints = points.filter(p => p.type === 'OLD');
  const newPoints = points.filter(p => p.type === 'NEW');
  const totalNewDamageFee = newPoints.reduce((sum, p) => sum + (Number(p.fee) || 0), 0);

  // SVG Vehicle Views
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
          {/* Car Body Front Contour */}
          <path d="M 40 85 Q 40 40 70 30 L 130 30 Q 160 40 160 85 L 155 105 Q 100 110 45 105 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          {/* Windshield */}
          <path d="M 68 35 L 132 35 L 125 55 L 75 55 Z" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          {/* Hood Lines */}
          <path d="M 75 55 L 70 85 M 125 55 L 130 85" stroke="#334155" strokeWidth="1.5" strokeDasharray="2 2" />
          {/* Grille */}
          <rect x="75" y="80" width="50" height="15" rx="3" fill="#090d16" stroke="#64748b" strokeWidth="1.5" />
          {/* Headlights */}
          <polygon points="45,68 65,70 60,82 43,78" fill="#38bdf8" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="1.5" />
          <polygon points="155,68 135,70 140,82 157,78" fill="#38bdf8" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="1.5" />
          {/* Bumper Lower Lip */}
          <path d="M 45 100 Q 100 108 155 100" stroke="#64748b" strokeWidth="2" fill="none" />
          {/* Mirrors */}
          <ellipse cx="32" cy="48" rx="6" ry="4" fill="#334155" stroke="#475569" />
          <ellipse cx="168" cy="48" rx="6" ry="4" fill="#334155" stroke="#475569" />
        </svg>

        {/* Damage Pins on Front */}
        {points.filter(p => p.view === 'FRONT').map(p => renderPin(p))}
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
          {/* Car Body Rear Contour */}
          <path d="M 40 85 Q 40 40 70 30 L 130 30 Q 160 40 160 85 L 155 105 Q 100 110 45 105 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          {/* Rear Window */}
          <path d="M 68 35 L 132 35 L 126 58 L 74 58 Z" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          {/* Trunk Line */}
          <path d="M 50 82 Q 100 85 150 82" stroke="#475569" strokeWidth="1.5" fill="none" />
          {/* License Plate Recess */}
          <rect x="80" y="85" width="40" height="12" rx="2" fill="#090d16" stroke="#475569" strokeWidth="1" />
          {/* Taillights */}
          <polygon points="45,65 68,66 65,76 43,73" fill="#ef4444" fillOpacity="0.5" stroke="#ef4444" strokeWidth="1.5" />
          <polygon points="155,65 132,66 135,76 157,73" fill="#ef4444" fillOpacity="0.5" stroke="#ef4444" strokeWidth="1.5" />
          {/* Exhausts */}
          <circle cx="58" cy="104" r="3" fill="#64748b" />
          <circle cx="142" cy="104" r="3" fill="#64748b" />
        </svg>

        {/* Damage Pins on Rear */}
        {points.filter(p => p.view === 'REAR').map(p => renderPin(p))}
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
          {/* Silhouette Profile */}
          <path d="M 20 70 L 35 68 L 65 52 L 110 40 L 175 40 L 220 55 L 245 68 L 245 74 L 20 74 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          {/* Windows */}
          <path d="M 75 52 L 115 44 L 140 44 L 140 54 L 75 54 Z" fill="#0f172a" stroke="#334155" />
          <path d="M 145 44 L 175 44 L 205 52 L 145 54 Z" fill="#0f172a" stroke="#334155" />
          {/* Door Lines */}
          <line x1="142" y1="44" x2="142" y2="72" stroke="#334155" strokeWidth="1.5" />
          <line x1="85" y1="53" x2="85" y2="72" stroke="#334155" strokeWidth="1.5" />
          {/* Door Handles */}
          <rect x="125" y="56" width="8" height="2" rx="1" fill="#94a3b8" />
          <rect x="165" y="56" width="8" height="2" rx="1" fill="#94a3b8" />
          {/* Wheels Arch & Wheels */}
          <path d="M 45 74 A 16 16 0 0 1 77 74" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
          <circle cx="61" cy="74" r="13" fill="#020617" stroke="#475569" strokeWidth="2" />
          <circle cx="61" cy="74" r="6" fill="#475569" />

          <path d="M 185 74 A 16 16 0 0 1 217 74" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
          <circle cx="201" cy="74" r="13" fill="#020617" stroke="#475569" strokeWidth="2" />
          <circle cx="201" cy="74" r="6" fill="#475569" />
        </svg>

        {/* Damage Pins on Side */}
        {points.filter(p => p.view === viewName).map(p => renderPin(p))}
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
          {/* Car Body Top Outline */}
          <path d="M 25 35 Q 20 45 25 55 L 50 68 Q 130 72 210 68 L 240 55 Q 245 45 240 35 L 210 22 Q 130 18 50 22 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          {/* Front Windshield */}
          <path d="M 60 27 L 85 30 L 85 60 L 60 63 Z" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          {/* Sunroof / Roof */}
          <rect x="95" y="30" width="55" height="30" rx="3" fill="#020617" stroke="#334155" strokeWidth="1.5" />
          {/* Rear Windshield */}
          <path d="M 160 30 L 185 27 L 185 63 L 160 60 Z" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
        </svg>

        {/* Damage Pins on Top */}
        {points.filter(p => p.view === 'TOP').map(p => renderPin(p))}
      </div>
    </div>
  );

  const renderPin = (point) => {
    const isOld = point.type === 'OLD';
    const isSelected = selectedPoint?.id === point.id;

    return (
      <div
        key={point.id}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedPoint(point);
        }}
        style={{ left: `${point.x}%`, top: `${point.y}%` }}
        className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group/pin transition-transform hover:scale-125 ${
          isSelected ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900 rounded-full' : ''
        }`}
        title={`${isOld ? '[Vết cũ]' : '[Phát sinh mới]'}: ${point.description}`}
      >
        <div className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] shadow-md border ${
          isOld 
            ? 'bg-amber-500 border-amber-300 text-slate-950 animate-pulse' 
            : 'bg-red-600 border-red-300 text-white animate-bounce'
        }`}>
          {isOld ? 'C' : 'M'}
        </div>

        {/* Hover Tooltip */}
        <div className="absolute left-1/2 bottom-full -translate-x-1/2 mb-1.5 hidden group-hover/pin:flex flex-col bg-slate-950 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap shadow-xl border border-slate-700 pointer-events-none z-30">
          <span className="font-semibold text-slate-200">{point.description}</span>
          <span className={isOld ? 'text-amber-400' : 'text-red-400'}>
            {isOld ? 'Vết xước bàn giao' : `Tổn thất mới: +${formatCurrency(point.fee || 0)}`}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-slate-950/80 rounded-2xl border border-slate-800 p-4 sm:p-5 text-white ${className}`}>
      
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 mb-4">
        <div>
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <Car size={16} className="text-blue-400" />
            Sơ Đồ Chấm Điểm Vết Xước Ngoại Quan 2D
          </h4>
          <p className="text-[11px] text-slate-400">
            {mode === 'handover' 
              ? 'Click trực tiếp lên hình xe để ghi nhận các vết trầy xước/móp có sẵn trước khi giao xe.' 
              : mode === 'return'
                ? 'Vết Vàng (Cũ có từ trước). Click chuột để thêm Vết Đỏ (Hư hỏng mới phát sinh) để tính bồi thường.'
                : 'Sơ đồ đối chiếu tình trạng vết xước bàn giao vs hoàn trả.'}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-300 flex items-center justify-center text-[8px] font-bold text-slate-950">C</span>
            <span className="text-amber-300 text-[11px] font-medium">Vết cũ ({oldPoints.length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600 border border-red-300 flex items-center justify-center text-[8px] font-bold text-white">M</span>
            <span className="text-red-400 text-[11px] font-medium">Vết mới ({newPoints.length})</span>
          </div>
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
                ? 'bg-blue-600 text-white' 
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${mode === 'return' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                Ghi Nhận Điểm Tổn Thất ({dialogState.view})
              </h5>
              <button onClick={() => setDialogState(null)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Mô tả vết xước / tổn thất:</label>
                <input
                  type="text"
                  value={dialogState.description}
                  onChange={(e) => setDialogState({ ...dialogState, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
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
                  <label className="text-slate-400 block mb-1">Mức độ:</label>
                  <select
                    value={dialogState.severity}
                    onChange={(e) => setDialogState({ ...dialogState, severity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs"
                  >
                    <option value="MINOR">Nhẹ (Trầy sơn)</option>
                    <option value="MODERATE">Vừa (Móp / Cấn)</option>
                    <option value="SEVERE">Nặng (Biến dạng)</option>
                  </select>
                </div>

                {mode === 'return' && (
                  <div>
                    <label className="text-red-400 block mb-1">Chi phí phạt (VND):</label>
                    <input
                      type="number"
                      step={50000}
                      value={dialogState.fee}
                      onChange={(e) => setDialogState({ ...dialogState, fee: e.target.value })}
                      className="w-full bg-slate-950 border border-red-500/50 text-red-400 font-bold rounded-lg p-2 text-xs"
                    />
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
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Lưu Điểm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Point List Table */}
      {showList && points.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase text-[11px] text-slate-300">
              Danh Sách Điểm Tổn Thất Đã Chấm ({points.length})
            </span>
            {mode === 'return' && totalNewDamageFee > 0 && (
              <span className="text-red-400 font-bold">
                Tổng phí bồi thường hư hại mới: {formatCurrency(totalNewDamageFee)}
              </span>
            )}
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {points.map((p, idx) => {
              const isOld = p.type === 'OLD';
              return (
                <div 
                  key={p.id}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs border ${
                    isOld 
                      ? 'bg-amber-950/20 border-amber-500/30 text-amber-200' 
                      : 'bg-red-950/20 border-red-500/30 text-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] ${
                      isOld ? 'bg-amber-500 text-slate-950' : 'bg-red-600 text-white'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-semibold">[{p.view}]</span>
                    <span>{p.description}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 uppercase">
                      {p.severity}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {!isOld && p.fee > 0 && (
                      <span className="font-bold text-red-400">+{formatCurrency(p.fee)}</span>
                    )}
                    {isOld && (
                      <span className="text-amber-400/80 italic text-[11px]">Bàn giao cũ</span>
                    )}

                    {mode !== 'readonly' && (
                      <button
                        type="button"
                        onClick={() => handleDeletePoint(p.id)}
                        className="text-slate-500 hover:text-red-400 transition"
                        title="Xóa điểm này"
                      >
                        <Trash2 size={13} />
                      </button>
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
