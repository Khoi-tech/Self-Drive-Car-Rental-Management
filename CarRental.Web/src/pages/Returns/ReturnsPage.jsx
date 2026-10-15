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
  Phone
} from 'lucide-react';
import returnProtocolService from '../../services/returnProtocolService';
import { formatDateTime } from '../../utils/formatters';

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
            Hồ Sơ Biên Bản Hoàn Trả Xe (US-22)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý biên bản nghiệm thu khi khách trả xe, đối chiếu ODO, mức nhiên liệu, kiểm tra trầy xước và phụ kiện
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
          <p className="text-[11px] text-slate-400 mt-1">Nghiệm thu thực tế khi kết thúc hợp đồng</p>
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
          <p className="text-[11px] text-slate-400 mt-1">Cần đối chiếu với biên bản giao xe (Baseline)</p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo số biên bản, biển số xe, tên xe, khách hàng..."
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-4 py-2 text-xs text-zinc-950 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0F172A]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Số biên bản</th>
                <th className="px-4 py-3.5">Khách hàng</th>
                <th className="px-4 py-3.5">Phương tiện</th>
                <th className="px-4 py-3.5">Thời gian trả</th>
                <th className="px-4 py-3.5">ODO Trả / Km chạy</th>
                <th className="px-4 py-3.5">Nhiên liệu</th>
                <th className="px-4 py-3.5 text-center">Hiện trạng</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[#0F172A]" />
                    <span>Đang tải danh sách biên bản hoàn trả...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">Chưa có biên bản hoàn trả xe nào</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Vào mục Duyệt Đơn Thuê để nghiệm thu các đơn đang thuê (ACTIVE)</p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5 font-mono font-semibold text-zinc-950">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                        {item.protocolNumber || 'BBHT-VELORA'}
                      </span>
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
                      <p className="font-medium text-zinc-950 tabular-nums">{item.endOdo?.toLocaleString()} km</p>
                      <p className={`text-[11px] tabular-nums ${item.excessKm > 0 ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                        +{item.totalKmDriven?.toLocaleString()} km {item.excessKm > 0 ? `(Vượt ${item.excessKm} km)` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${
                        item.fuelDifference > 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}>
                        <Fuel size={12} />
                        {item.returnFuelLevel}% {item.fuelDifference > 0 ? `(-${item.fuelDifference}%)` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {item.newDamagesNotes ? (
                        <span className="badge-repair inline-flex text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Vết xước mới
                        </span>
                      ) : (
                        <span className="badge-ready inline-flex text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Đạt tiêu chuẩn
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && selectedProtocol && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-3xl w-full max-h-[92vh] flex flex-col shadow-xl overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
              <div className="flex items-center gap-2">
                <FileCheck size={18} className="text-emerald-600" />
                <h3 className="font-bold text-zinc-950 text-sm">Biên Bản Nghiệm Thu & Hoàn Trả Xe</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-[#0F172A] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Printer size={14} />
                  <span>In Biên Bản</span>
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
                <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                  <div>
                    <h2 className="text-lg font-bold tracking-widest uppercase text-zinc-950">VELORA MOTORS</h2>
                    <p className="text-[11px] text-slate-500">Biên bản nghiệm thu kỹ thuật khi hoàn trả xe tự lái</p>
                  </div>
                  <div className="text-right font-mono">
                    <p className="text-sm font-bold text-zinc-950">{selectedProtocol.protocolNumber}</p>
                    <p className="text-[10px] text-slate-400 tabular-nums">{formatDateTime(selectedProtocol.returnDate)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1">
                    <span className="text-slate-500 text-[11px] block">Khách hàng:</span>
                    <p className="font-semibold text-zinc-950">{selectedProtocol.customerName}</p>
                    <p className="text-slate-500 tabular-nums">{selectedProtocol.customerPhone}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1">
                    <span className="text-slate-500 text-[11px] block">Phương tiện:</span>
                    <p className="font-semibold text-zinc-950">{selectedProtocol.carMake} {selectedProtocol.carModel}</p>
                    <div className="mt-1">
                      <span className="license-plate text-[10px] px-2 py-0.5">{selectedProtocol.licensePlate}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-center p-3.5 bg-slate-50 rounded-md border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[10px]">ODO ban đầu</span>
                    <span className="font-bold text-zinc-950 block mt-0.5 tabular-nums">{selectedProtocol.startOdo?.toLocaleString()} km</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">ODO khi trả</span>
                    <span className="font-bold text-zinc-950 block mt-0.5 tabular-nums">{selectedProtocol.endOdo?.toLocaleString()} km</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Quãng đường</span>
                    <span className="font-bold text-emerald-700 block mt-0.5 tabular-nums">{selectedProtocol.totalKmDriven?.toLocaleString()} km</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Nhiên liệu khi trả</span>
                    <span className="font-bold text-amber-700 block mt-0.5 tabular-nums">{selectedProtocol.returnFuelLevel}%</span>
                  </div>
                </div>

                <div className="space-y-2.5 p-3.5 bg-slate-50 rounded-md border border-slate-200">
                  <h4 className="font-bold text-zinc-950 text-xs">Tình trạng kiểm tra thực tế:</h4>
                  <p><span className="text-slate-500">Ngoại thất:</span> <span className="text-slate-800">{selectedProtocol.exteriorCondition}</span></p>
                  <p><span className="text-slate-500">Nội thất:</span> <span className="text-slate-800">{selectedProtocol.interiorCondition}</span></p>
                  <p><span className="text-slate-500">Lốp xe:</span> <span className="text-slate-800">{selectedProtocol.tireCondition}</span></p>
                  {selectedProtocol.newDamagesNotes && (
                    <p className="text-rose-700 font-medium">
                      <span className="font-bold">Hư hỏng mới:</span> {selectedProtocol.newDamagesNotes}
                    </p>
                  )}
                  <p><span className="text-slate-500">Phụ kiện kiểm tra:</span> <span className="text-slate-800">{selectedProtocol.accessoriesChecklist}</span></p>
                  {selectedProtocol.missingAccessories && (
                    <p className="text-rose-700 font-medium">
                      <span className="font-bold">Phụ kiện thiếu:</span> {selectedProtocol.missingAccessories}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-center">
                  <div className="space-y-12">
                    <p className="font-bold text-zinc-950 text-[11px]">ĐẠI DIỆN KHÁCH HÀNG</p>
                    <p className="text-slate-400 italic text-[10px]">(Đã ký xác nhận)</p>
                    <p className="font-semibold text-zinc-950">{selectedProtocol.customerName}</p>
                  </div>
                  <div className="space-y-12">
                    <p className="font-bold text-zinc-950 text-[11px]">ĐẠI DIỆN VELORA</p>
                    <p className="text-slate-400 italic text-[10px]">(Đã ký xác nhận)</p>
                    <p className="font-semibold text-zinc-950">{selectedProtocol.staffName}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 flex justify-end bg-slate-50 print:hidden">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium shadow-sm transition"
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

export default ReturnsPage;
