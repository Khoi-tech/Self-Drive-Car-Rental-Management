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
  Sparkles
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

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <FileCheck className="text-emerald-400" size={28} />
            Hồ Sơ Biên Bản Hoàn Trả Xe (US-22)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Quản lý biên bản nghiệm thu khi khách trả xe, đối chiếu ODO, mức nhiên liệu, kiểm tra trầy xước và phụ kiện
          </p>
        </div>

        <button
          onClick={fetchProtocols}
          className="p-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl transition flex items-center gap-2 text-xs"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
          <div className="text-xs text-zinc-400 flex items-center justify-between">
            <span>Tổng số biên bản hoàn trả</span>
            <FileText size={16} />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{protocols.length}</p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
          <div className="text-xs text-zinc-400 flex items-center justify-between">
            <span>Trường hợp vượt hạn mức km</span>
            <Gauge size={16} className="text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-2">
            {protocols.filter(p => p.excessKm > 0).length}
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
          <div className="text-xs text-zinc-400 flex items-center justify-between">
            <span>Phát hiện vết trầy xước / hư hỏng mới</span>
            <AlertTriangle size={16} className="text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">
            {protocols.filter(p => p.newDamagesNotes && p.newDamagesNotes.trim().length > 0).length}
          </p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex items-center gap-3">
        <Search size={18} className="text-zinc-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo số biên bản, biển số xe, tên xe, khách hàng..."
          className="bg-transparent border-none text-white text-xs w-full focus:outline-none placeholder-zinc-500"
        />
      </div>

      {/* Table */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Số biên bản</th>
                <th className="px-5 py-3.5 font-semibold">Khách hàng</th>
                <th className="px-5 py-3.5 font-semibold">Phương tiện</th>
                <th className="px-5 py-3.5 font-semibold">Thời gian trả</th>
                <th className="px-5 py-3.5 font-semibold">ODO Trả / Km chạy</th>
                <th className="px-5 py-3.5 font-semibold">Nhiên liệu</th>
                <th className="px-5 py-3.5 font-semibold">Hiện trạng</th>
                <th className="px-5 py-3.5 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-amber-400" />
                    Đang tải danh sách biên bản hoàn trả...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    Chưa có biên bản hoàn trả xe nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-900/60 transition">
                    <td className="px-5 py-4 font-mono font-semibold text-white">
                      {item.protocolNumber || 'BBHT-VELORA'}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{item.customerName}</p>
                      <p className="text-[11px] text-zinc-400">{item.customerPhone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-zinc-200">{item.carMake} {item.carModel}</p>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 font-mono border border-amber-500/20">
                        {item.licensePlate}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-zinc-400">
                      {formatDateTime(item.returnDate)}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{item.endOdo.toLocaleString()} km</p>
                      <p className={`text-[11px] ${item.excessKm > 0 ? 'text-rose-400 font-medium' : 'text-zinc-400'}`}>
                        +{item.totalKmDriven.toLocaleString()} km {item.excessKm > 0 ? `(Vượt ${item.excessKm} km)` : ''}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 font-semibold ${
                        item.fuelDifference > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        <Fuel size={12} />
                        {item.returnFuelLevel}% {item.fuelDifference > 0 ? `(-${item.fuelDifference}%)` : ''}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {item.newDamagesNotes ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-max">
                          <AlertTriangle size={11} /> Có vết xước mới
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-max">
                          <CheckCircle2 size={11} /> Đạt tiêu chuẩn
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openPreview(item)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold inline-flex items-center gap-1.5 transition"
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-zinc-950 border border-zinc-800 text-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-scaleUp">
            
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
              <div className="flex items-center gap-2">
                <FileCheck size={18} className="text-emerald-400" />
                <h3 className="font-semibold text-white">Biên Bản Nghiệm Thu & Hoàn Trả Xe</h3>
              </div>
              <button onClick={() => setIsPreviewOpen(false)} className="text-zinc-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs print:p-0">
              <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                <div>
                  <h2 className="text-xl font-bold tracking-widest uppercase">VELORA</h2>
                  <p className="text-[11px] text-zinc-400">Biên bản nghiệm thu kỹ thuật khi hoàn trả xe tự lái</p>
                </div>
                <div className="text-right font-mono">
                  <p className="text-sm font-bold text-white">{selectedProtocol.protocolNumber}</p>
                  <p className="text-[10px] text-zinc-400">{formatDateTime(selectedProtocol.returnDate)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-zinc-900 rounded-xl space-y-1">
                  <span className="text-zinc-500">Khách hàng:</span>
                  <p className="font-semibold text-white">{selectedProtocol.customerName}</p>
                  <p className="text-zinc-400">{selectedProtocol.customerPhone}</p>
                </div>
                <div className="p-3 bg-zinc-900 rounded-xl space-y-1">
                  <span className="text-zinc-500">Phương tiện:</span>
                  <p className="font-semibold text-white">{selectedProtocol.carMake} {selectedProtocol.carModel}</p>
                  <p className="text-amber-400 font-mono">Biển số: {selectedProtocol.licensePlate}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center p-3.5 bg-zinc-900 rounded-xl">
                <div>
                  <span className="text-zinc-500 block text-[10px]">ODO ban đầu</span>
                  <span className="font-bold text-white block mt-0.5">{selectedProtocol.startOdo.toLocaleString()} km</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">ODO khi trả</span>
                  <span className="font-bold text-white block mt-0.5">{selectedProtocol.endOdo.toLocaleString()} km</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Quãng đường</span>
                  <span className="font-bold text-emerald-400 block mt-0.5">{selectedProtocol.totalKmDriven.toLocaleString()} km</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Nhiên liệu khi trả</span>
                  <span className="font-bold text-amber-400 block mt-0.5">{selectedProtocol.returnFuelLevel}%</span>
                </div>
              </div>

              <div className="space-y-2 p-3.5 bg-zinc-900/60 rounded-xl">
                <h4 className="font-semibold text-zinc-300">Tình trạng kiểm tra thực tế:</h4>
                <p><span className="text-zinc-500">Ngoại thất:</span> {selectedProtocol.exteriorCondition}</p>
                <p><span className="text-zinc-500">Nội thất:</span> {selectedProtocol.interiorCondition}</p>
                <p><span className="text-zinc-500">Lốp xe:</span> {selectedProtocol.tireCondition}</p>
                {selectedProtocol.newDamagesNotes && (
                  <p className="text-rose-400 font-medium">
                    <span className="text-rose-300">Hư hỏng mới:</span> {selectedProtocol.newDamagesNotes}
                  </p>
                )}
                <p><span className="text-zinc-500">Phụ kiện kiểm tra:</span> {selectedProtocol.accessoriesChecklist}</p>
                {selectedProtocol.missingAccessories && (
                  <p className="text-rose-400 font-medium">
                    <span>Phụ kiện thiếu:</span> {selectedProtocol.missingAccessories}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-zinc-800 text-center">
                <div className="space-y-12">
                  <p className="font-semibold text-zinc-300">ĐẠI DIỆN KHÁCH HÀNG</p>
                  <p className="text-zinc-400 italic">(Đã ký xác nhận)</p>
                  <p className="font-medium text-white">{selectedProtocol.customerName}</p>
                </div>
                <div className="space-y-12">
                  <p className="font-semibold text-zinc-300">ĐẠI DIỆN VELORA</p>
                  <p className="text-zinc-400 italic">(Đã ký xác nhận)</p>
                  <p className="font-medium text-white">{selectedProtocol.staffName}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-zinc-800 flex justify-between bg-zinc-900/90 print:hidden">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white"
              >
                Đóng
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2 rounded-xl bg-emerald-500 text-black font-semibold flex items-center gap-2"
              >
                <Printer size={15} />
                <span>In Biên Bản Hoàn Trả</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ReturnsPage;
