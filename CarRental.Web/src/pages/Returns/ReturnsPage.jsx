import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  Search, 
  RefreshCw, 
  Car, 
  Gauge, 
  Fuel, 
  Eye, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  FileText, 
  Calendar, 
  User, 
  Wrench, 
  Clock, 
  Sparkles, 
  Phone,
  Camera,
  MapPin
} from 'lucide-react';
import returnProtocolService from '../../services/returnProtocolService';
import { formatDateTime } from '../../utils/formatters';
import VehicleDamageMap from '../../components/operations/VehicleDamageMap';

const ReturnsPage = () => {
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fetchProtocols = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await returnProtocolService.getAll();
      setProtocols(Array.isArray(res) ? res : (res?.data || []));
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách biên bản hoàn trả xe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProtocols();
  }, []);

  const openPreview = (item) => {
    setSelectedProtocol(item);
    setIsPreviewOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const filtered = protocols.filter(p => {
    const s = searchTerm.toLowerCase();
    return (
      p.protocolNumber?.toLowerCase().includes(s) ||
      p.licensePlate?.toLowerCase().includes(s) ||
      p.carMake?.toLowerCase().includes(s) ||
      p.carModel?.toLowerCase().includes(s) ||
      p.customerName?.toLowerCase().includes(s) ||
      p.customerPhone?.toLowerCase().includes(s) ||
      p.staffName?.toLowerCase().includes(s)
    );
  });

  const excessKmCount = protocols.filter(p => p.excessKm > 0).length;
  const newDamagesCount = protocols.filter(p => p.newDamagesNotes && p.newDamagesNotes.trim().length > 0).length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <FileCheck size={20} />
            </div>
            Hồ Sơ Biên Bản Hoàn Trả Xe
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý biên bản nghiệm thu khi khách trả xe, đối chiếu ODO khách đi vs trung chuyển, mức nhiên liệu và vết xước mới
          </p>
        </div>

        <button
          onClick={fetchProtocols}
          disabled={loading}
          className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition flex items-center gap-2 text-xs font-medium shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center justify-between text-xs font-medium">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">
            <X size={14} />
          </button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
          <div className="text-xs text-slate-500 flex items-center justify-between font-medium">
            <span>Tổng số biên bản hoàn trả</span>
            <FileText size={16} className="text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-950 mt-2 tabular-nums">{protocols.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Nghiệm thu thực tế khi kết thúc chuyến thuê</p>
        </div>

        <div className="bg-white border border-rose-200 p-4 rounded-lg shadow-sm">
          <div className="text-xs text-rose-700 flex items-center justify-between font-medium">
            <span>Trường hợp vượt hạn mức ODO</span>
            <Gauge size={16} className="text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2 tabular-nums">
            {excessKmCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Phát sinh phụ phí vượt km quy định</p>
        </div>

        <div className="bg-white border border-amber-200 p-4 rounded-lg shadow-sm">
          <div className="text-xs text-amber-700 flex items-center justify-between font-medium">
            <span>Phát hiện vết xước / hao hụt mới</span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2 tabular-nums">
            {newDamagesCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Cần khấu trừ cọc bồi thường hư hại</p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo số biên bản, biển số, tên xe, tên khách hàng, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-4 py-2 text-xs text-zinc-950 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0F172A]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Số biên bản</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Phương tiện</th>
                <th className="py-3 px-4">Ngày giờ trả</th>
                <th className="py-3 px-4">ODO & Quãng đường</th>
                <th className="py-3 px-4">Nhiên liệu</th>
                <th className="py-3 px-4 text-center">Tình trạng thân vỏ</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-slate-400" />
                    <span>Đang tải danh sách biên bản hoàn trả...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    Không tìm thấy biên bản hoàn trả xe nào.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const returnOdo = item.customerReturnOdo || item.endOdo || 0;
                  const fuelVal = item.customerReturnFuelLevel ?? item.returnFuelLevel ?? 100;
                  const hasDamage = Boolean(item.newDamagesNotes && item.newDamagesNotes.trim().length > 0);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3.5">
                        <p className="font-mono font-bold text-zinc-950">{item.protocolNumber}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.contractNumber || 'HĐ-VELORA'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-zinc-950">{item.customerName}</p>
                        <p className="text-[11px] text-slate-500 tabular-nums flex items-center gap-1 mt-0.5">
                          <Phone size={10} className="text-slate-400" />
                          {item.customerPhone}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-zinc-950">{item.carMake} {item.carModel}</p>
                        <div className="mt-1">
                          <span className="license-plate text-[10px] px-2 py-0.5">
                            {item.licensePlate}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 tabular-nums">
                        {formatDateTime(item.returnDate)}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-zinc-950 tabular-nums">{returnOdo.toLocaleString()} km</p>
                        <p className={`text-[11px] tabular-nums ${item.excessKm > 0 ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                          Khách đi: {item.totalKmDriven?.toLocaleString()} km {item.excessKm > 0 ? `(Vượt ${item.excessKm} km)` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${
                          item.fuelDifference > 0 ? 'text-rose-600' : 'text-emerald-700'
                        }`}>
                          <Fuel size={12} />
                          {fuelVal}% {item.fuelDifference > 0 ? `(-${item.fuelDifference}%)` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {hasDamage ? (
                          <span className="badge-repair inline-flex text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Vết xước mới
                          </span>
                        ) : (
                          <span className="badge-ready inline-flex text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Đạt chuẩn
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => openPreview(item)}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:border-[#0F172A] hover:bg-slate-50 text-zinc-900 rounded-md text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Eye size={13} />
                          <span>Xem chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {isPreviewOpen && selectedProtocol && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-xl overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
              <div className="font-bold text-zinc-950 text-sm flex items-center gap-2">
                <FileCheck className="text-blue-900" size={18} />
                <span>Xem Biên Bản Hoàn Trả: {selectedProtocol.protocolNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-[#0F172A] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Printer size={14} />
                  <span>In văn bản</span>
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-zinc-950 rounded-md hover:bg-slate-100 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50">
              <div className="bg-white text-zinc-950 p-8 rounded-lg border border-slate-200 shadow-sm space-y-6 text-xs">
                
                <div className="text-center space-y-1">
                  <div className="font-bold text-xs uppercase tracking-widest text-zinc-950">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div className="text-[11px] italic text-slate-600">Độc lập - Tự do - Hạnh phúc</div>
                  <div className="text-slate-400 tracking-widest mt-1">---o0o---</div>
                </div>

                <div className="text-center pt-2">
                  <h1 className="text-base font-bold uppercase tracking-wider text-zinc-950">
                    BIÊN BẢN NGHIỆM THU HOÀN TRẢ XE Ô TÔ TỰ LÁI
                  </h1>
                  <p className="text-slate-500 mt-1">
                    Số: <strong className="font-mono text-zinc-950">{selectedProtocol.protocolNumber}</strong> • Ngày trả: {formatDateTime(selectedProtocol.returnDate)}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-bold uppercase text-zinc-950 text-[11px]">ĐẠI DIỆN BÊN THU HỒI XE:</h3>
                      <p className="mt-1 text-slate-700">- Nhân viên: <strong className="text-zinc-950">{selectedProtocol.staffName}</strong></p>
                    </div>

                    <div>
                      <h3 className="font-bold uppercase text-zinc-950 text-[11px]">ĐẠI DIỆN BÊN HOÀN TRẢ XE:</h3>
                      <p className="mt-1 text-slate-700">- Khách hàng: <strong className="text-zinc-950">{selectedProtocol.customerName}</strong></p>
                      <p className="text-slate-700">- Số điện thoại: <strong className="text-zinc-950 tabular-nums">{selectedProtocol.customerPhone}</strong></p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold uppercase text-zinc-950 text-[11px]">THÔNG SỐ NGHIỆM THU:</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">ODO lúc trả</span>
                        <strong className="text-zinc-950 font-mono text-sm tabular-nums">
                          {(selectedProtocol.customerReturnOdo || selectedProtocol.endOdo || 0).toLocaleString()} km
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Quãng đường đi</span>
                        <strong className="text-blue-900 font-mono text-sm tabular-nums">
                          {selectedProtocol.totalKmDriven?.toLocaleString()} km
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Nhiên liệu lúc trả</span>
                        <strong className="text-emerald-700 text-sm tabular-nums">
                          {selectedProtocol.customerReturnFuelLevel ?? selectedProtocol.returnFuelLevel ?? 100}%
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Trạng thái xe</span>
                        <strong className="text-zinc-900 text-sm">
                          {selectedProtocol.nextVehicleStatus || 'READY'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Ảnh Taplo lúc trả */}
                  {selectedProtocol.returnDashPhotoUrl && (
                    <div>
                      <h3 className="font-bold uppercase text-zinc-950 text-[11px] mb-2 flex items-center gap-1.5">
                        <Camera size={13} className="text-blue-900" />
                        <span>Ảnh Chụp Đồng Hồ Taplo Lúc Nghiệm Thu Trả:</span>
                      </h3>
                      <div className="rounded-lg overflow-hidden border border-slate-200 max-w-sm">
                        <img 
                          src={selectedProtocol.returnDashPhotoUrl} 
                          alt="Taplo lúc trả" 
                          className="w-full max-h-48 object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Sơ đồ 2D vết xước */}
                  {(() => {
                    let pts = [];
                    const mapJson = selectedProtocol.returnDamageMap || selectedProtocol.damagePointsJson;
                    if (mapJson) {
                      try { pts = JSON.parse(mapJson); } catch {}
                    }
                    return pts.length > 0 ? (
                      <div>
                        <h3 className="font-bold uppercase text-zinc-950 text-[11px] mb-2">
                          Sơ Đồ Vết Xước 2D Đối Chiếu Hoàn Trả:
                        </h3>
                        <VehicleDamageMap points={pts} mode="readonly" />
                      </div>
                    ) : null;
                  })()}
                </div>

                <div className="pt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs">
                  <div>
                    <div className="font-bold uppercase text-zinc-950">ĐẠI DIỆN BÊN THU HỒI XE</div>
                    <div className="text-[10px] italic text-slate-500">(Ký, ghi rõ họ tên)</div>
                    <div className="mt-12 font-bold text-zinc-950">{selectedProtocol.staffName}</div>
                  </div>
                  <div>
                    <div className="font-bold uppercase text-zinc-950">ĐẠI DIỆN BÊN HOÀN TRẢ XE</div>
                    <div className="text-[10px] italic text-slate-500">(Ký, ghi rõ họ tên)</div>
                    <div className="mt-12 font-bold text-zinc-950">{selectedProtocol.customerName}</div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ReturnsPage;
