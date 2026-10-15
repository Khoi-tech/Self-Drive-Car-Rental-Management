import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  Search, 
  RefreshCw, 
  Calendar, 
  Car, 
  User, 
  Phone, 
  Gauge, 
  Fuel, 
  Eye, 
  Printer, 
  CheckCircle2, 
  Clock, 
  X,
  FileText
} from 'lucide-react';
import handoverService from '../../services/handoverService';
import { formatDateTime, formatDate } from '../../utils/formatters';

const HandoversPage = () => {
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
      const res = await handoverService.getAll();
      setProtocols(Array.isArray(res) ? res : (res?.data || []));
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách biên bản bàn giao.');
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

  const pendingCount = protocols.filter(p => p.status === 'PENDING_CUSTOMER').length;
  const completedCount = protocols.filter(p => p.status === 'COMPLETED' || p.status === 'CONFIRMED').length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <FileCheck size={20} />
            </div>
            Hồ Sơ Biên Bản Bàn Giao Xe (US-18)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý biên bản giao nhận thực tế, ghi nhận ODO xuất phát, mức xăng, hiện trạng xe và checklist phụ kiện
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
            <span>Tổng số biên bản</span>
            <FileText size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-950 mt-2 tabular-nums">{protocols.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Đã lập trước khi bàn giao xe</div>
        </div>

        <div className="bg-white border border-amber-200 p-4 rounded-lg shadow-sm">
          <div className="text-xs text-amber-700 flex items-center justify-between font-medium">
            <span>Chờ khách nhận xe</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2 tabular-nums">{pendingCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Sẵn sàng để giao xe thực tế</div>
        </div>

        <div className="bg-white border border-emerald-200 p-4 rounded-lg shadow-sm">
          <div className="text-xs text-emerald-700 flex items-center justify-between font-medium">
            <span>Đã giao xe thành công</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2 tabular-nums">{completedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Xe đang vận hành trên đường</div>
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

      {/* Flat SaaS Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Số Biên Bản</th>
                <th className="py-3.5 px-4">Phương Tiện</th>
                <th className="py-3.5 px-4">Khách Hàng</th>
                <th className="py-3.5 px-4">Thông Số Giao Xe</th>
                <th className="py-3.5 px-4">Nhân Viên Kiểm Định</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[#0F172A]" />
                    <span>Đang tải danh sách biên bản bàn giao...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">Chưa có biên bản bàn giao nào phù hợp</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Vào mục Duyệt Đơn Thuê để lập biên bản cho các đơn đã cọc</p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    
                    {/* Số BBBG */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-zinc-950 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                        {item.protocolNumber}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-1 tabular-nums">
                        {formatDateTime(item.handoverDate)}
                      </div>
                    </td>

                    {/* Phương tiện */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-950 text-sm">
                        {item.carMake} {item.carModel}
                      </div>
                      <div className="mt-1">
                        <span className="license-plate text-[10px] px-2 py-0.5">
                          {item.licensePlate}
                        </span>
                      </div>
                    </td>

                    {/* Khách hàng */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-zinc-950">{item.customerName}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5 tabular-nums flex items-center gap-1">
                        <Phone size={10} className="text-slate-400" />
                        {item.customerPhone}
                      </div>
                    </td>

                    {/* Thông số bàn giao */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-zinc-950 font-medium">
                        <Gauge size={13} className="text-slate-400" />
                        <span>ODO: <strong className="font-mono tabular-nums">{item.odoAtHandover?.toLocaleString()} km</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-1">
                        <Fuel size={13} className="text-emerald-600" />
                        <span>Nhiên liệu: <strong className="text-emerald-700">{item.fuelLevel}</strong></span>
                      </div>
                    </td>

                    {/* Nhân viên */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-zinc-950">{item.staffName}</div>
                      <div className="text-[11px] text-slate-400">Đại diện VELORA</div>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3.5 px-4 text-center">
                      {item.status === 'PENDING_CUSTOMER' ? (
                        <span className="badge-maint inline-flex">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Chờ giao xe
                        </span>
                      ) : (
                        <span className="badge-ready inline-flex">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Đã bàn giao
                        </span>
                      )}
                    </td>

                    {/* Hành động */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openPreview(item)}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:border-[#0F172A] hover:bg-slate-50 text-zinc-900 rounded-md text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <Eye size={13} />
                        <span>Xem biên bản</span>
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {isPreviewOpen && selectedProtocol && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-3xl w-full max-h-[92vh] flex flex-col shadow-xl overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
              <div className="font-bold text-zinc-950 text-sm flex items-center gap-2">
                <FileCheck className="text-emerald-600" size={18} />
                <span>Xem Văn Bản: {selectedProtocol.protocolNumber}</span>
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
                
                {/* Header */}
                <div className="text-center space-y-1">
                  <div className="font-bold uppercase tracking-widest text-zinc-950 text-xs">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div className="italic text-slate-600 text-[11px]">Độc lập - Tự do - Hạnh phúc</div>
                  <div className="text-slate-400 tracking-widest mt-1">---o0o---</div>
                </div>

                <div className="text-center pt-2">
                  <h1 className="text-base font-bold uppercase tracking-wider text-zinc-950">
                    BIÊN BẢN BÀN GIAO PHƯƠNG TIỆN TỰ LÁI
                  </h1>
                  <p className="text-slate-500 mt-1">
                    Số: <strong className="font-mono text-zinc-950">{selectedProtocol.protocolNumber}</strong>
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold uppercase text-zinc-950 text-[11px] tracking-wide">I. ĐẠI DIỆN BÊN GIAO XE (VELORA):</h3>
                    <p className="mt-1 text-slate-700">- Nhân viên bàn giao: <strong className="text-zinc-950">{selectedProtocol.staffName}</strong></p>
                    <p className="text-slate-700">- Đơn vị: CÔNG TY TNHH DỊCH VỤ VẬN TẢI VELORA</p>
                  </div>

                  <div>
                    <h3 className="font-bold uppercase text-zinc-950 text-[11px] tracking-wide">II. ĐẠI DIỆN BÊN NHẬN XE (KHÁCH HÀNG):</h3>
                    <p className="mt-1 text-slate-700">- Khách hàng: <strong className="text-zinc-950">{selectedProtocol.customerName}</strong></p>
                    <p className="text-slate-700">- Số điện thoại: <strong className="text-zinc-950 tabular-nums">{selectedProtocol.customerPhone}</strong></p>
                  </div>

                  <div>
                    <h3 className="font-bold uppercase text-zinc-950 text-[11px] tracking-wide">III. THÔNG TIN PHƯƠNG TIỆN & HIỆN TRẠNG BÀN GIAO:</h3>
                    <div className="grid grid-cols-2 gap-2.5 mt-2 bg-slate-50 p-3 rounded-md border border-slate-200">
                      <div>Dòng xe: <strong className="text-zinc-950">{selectedProtocol.carMake} {selectedProtocol.carModel}</strong></div>
                      <div>Biển kiểm soát: <strong className="font-mono text-blue-800">{selectedProtocol.licensePlate}</strong></div>
                      <div>Số ODO xuất phát: <strong className="font-mono tabular-nums text-zinc-950">{selectedProtocol.odoAtHandover?.toLocaleString()} km</strong></div>
                      <div>Mức nhiên liệu: <strong className="text-emerald-700 font-semibold">{selectedProtocol.fuelLevel}</strong></div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold uppercase text-zinc-950 text-[11px] tracking-wide">IV. ĐÁNH GIÁ TÌNH TRẠNG KỸ THUẬT:</h3>
                    <ul className="list-disc pl-5 space-y-1 mt-1 text-slate-700">
                      <li>Ngoại thất: {selectedProtocol.exteriorCondition}</li>
                      <li>Nội thất: {selectedProtocol.interiorCondition}</li>
                      <li>Lốp xe: {selectedProtocol.tireCondition}</li>
                      {selectedProtocol.existingScratchesNotes && (
                        <li className="text-rose-700 font-medium">Vết trầy xước/móp méo ghi nhận trước: {selectedProtocol.existingScratchesNotes}</li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold uppercase text-zinc-950 text-[11px] tracking-wide">V. PHỤ KIỆN BÀN GIAO KÈM THEO:</h3>
                    <div className="grid grid-cols-2 gap-1.5 mt-1.5 pl-2">
                      {selectedProtocol.accessoriesChecklist?.split(';').map((acc, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>{acc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 space-y-8">
                  <p className="italic text-slate-600 text-[11px]">
                    Hai bên đã kiểm tra thực tế, xác nhận toàn bộ nội dung nêu trên là chính xác và đồng ý nhận xe theo đúng hiện trạng.
                  </p>
                  <div className="grid grid-cols-2 text-center pt-2">
                    <div>
                      <div className="font-bold uppercase text-zinc-950 text-[11px]">ĐẠI DIỆN BÊN GIAO XE</div>
                      <div className="text-[10px] italic text-slate-500">(Ký, ghi rõ họ tên)</div>
                      <div className="mt-12 font-bold text-zinc-950">{selectedProtocol.staffName}</div>
                    </div>
                    <div>
                      <div className="font-bold uppercase text-zinc-950 text-[11px]">ĐẠI DIỆN BÊN NHẬN XE</div>
                      <div className="text-[10px] italic text-slate-500">(Ký, ghi rõ họ tên)</div>
                      <div className="mt-12 font-bold text-zinc-950">{selectedProtocol.customerName}</div>
                    </div>
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

export default HandoversPage;
