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

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <FileCheck className="text-emerald-400" size={28} />
            Hồ Sơ Biên Bản Bàn Giao Xe (US-18)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Quản lý biên bản giao nhận thực tế, ghi nhận ODO xuất phát, mức xăng, hiện trạng xe và checklist phụ kiện
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
            <span>Tổng số biên bản</span>
            <FileText size={16} />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{protocols.length}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Đã lập trước khi bàn giao xe</div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
          <div className="text-xs text-amber-400 flex items-center justify-between">
            <span>Chờ khách nhận xe (Sprint 4)</span>
            <Clock size={16} />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            {protocols.filter(p => p.status === 'PENDING_CUSTOMER').length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Sẵn sàng để giao xe thực tế</div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
          <div className="text-xs text-emerald-400 flex items-center justify-between">
            <span>Đã giao xe thành công</span>
            <CheckCircle2 size={16} />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {protocols.filter(p => p.status === 'COMPLETED' || p.status === 'CONFIRMED').length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Xe đang vận hành trên đường</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm theo số biên bản, biển số, tên xe, tên khách hàng, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[11px] border-b border-zinc-800">
              <tr>
                <th className="py-4 px-6">Số Biên Bản</th>
                <th className="py-4 px-6">Phương Tiện</th>
                <th className="py-4 px-6">Khách Hàng</th>
                <th className="py-4 px-6">Thông Số Giao Xe</th>
                <th className="py-4 px-6">Nhân Viên Kiểm Định</th>
                <th className="py-4 px-6">Trạng Thái</th>
                <th className="py-4 px-6 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-zinc-500">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-emerald-500" />
                    Đang tải danh sách biên bản bàn giao...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-zinc-500">
                    Chưa có biên bản bàn giao nào được lập. Hãy vào mục "Duyệt Đơn Thuê" và chọn đơn đã cọc để lập biên bản.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/40 transition">
                    
                    {/* Số BBBG */}
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-xs">
                        {item.protocolNumber}
                      </span>
                      <div className="text-[11px] text-zinc-500 mt-1">
                        {formatDateTime(item.handoverDate)}
                      </div>
                    </td>

                    {/* Phương tiện */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-white text-sm">
                        {item.carMake} {item.carModel}
                      </div>
                      <div className="font-mono text-xs text-amber-400 mt-0.5">
                        {item.licensePlate}
                      </div>
                    </td>

                    {/* Khách hàng */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-zinc-200">{item.customerName}</div>
                      <div className="text-zinc-400 text-[11px] mt-0.5">{item.customerPhone}</div>
                    </td>

                    {/* Thông số bàn giao */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-zinc-200">
                        <Gauge size={13} className="text-amber-400" />
                        <span>ODO: <strong className="font-mono">{item.odoAtHandover} KM</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] mt-1">
                        <Fuel size={13} className="text-emerald-400" />
                        <span>Nhiên liệu: <strong className="text-emerald-300">{item.fuelLevel}</strong></span>
                      </div>
                    </td>

                    {/* Nhân viên */}
                    <td className="py-4 px-6">
                      <div className="font-medium text-zinc-200">{item.staffName}</div>
                      <div className="text-[11px] text-zinc-500">Đại diện VELORA</div>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-4 px-6">
                      {item.status === 'PENDING_CUSTOMER' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          <Clock size={11} />
                          <span>Chờ giao xe</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 size={11} />
                          <span>Đã bàn giao</span>
                        </span>
                      )}
                    </td>

                    {/* Hành động */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => openPreview(item)}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition inline-flex items-center gap-1.5"
                      >
                        <Eye size={13} />
                        <span>Xem văn bản</span>
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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 print:hidden">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <FileCheck className="text-emerald-400" size={18} />
                <span>Xem Văn Bản: {selectedProtocol.protocolNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Printer size={14} />
                  <span>In văn bản</span>
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              <div className="bg-white text-zinc-900 p-8 rounded-2xl shadow-xl space-y-6 font-serif text-xs">
                
                {/* Header */}
                <div className="text-center space-y-1">
                  <div className="font-bold uppercase tracking-widest text-zinc-700">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div className="italic text-zinc-600">Độc lập - Tự do - Hạnh phúc</div>
                  <div className="text-zinc-400 tracking-widest mt-1">---o0o---</div>
                </div>

                <div className="text-center pt-2">
                  <h1 className="text-lg font-bold uppercase tracking-wider text-black">
                    BIÊN BẢN BÀN GIAO PHƯƠNG TIỆN TỰ LÁI
                  </h1>
                  <p className="font-sans text-zinc-500 mt-1">
                    Số: <strong className="font-mono text-zinc-800">{selectedProtocol.protocolNumber}</strong>
                  </p>
                </div>

                <div className="space-y-3 font-sans">
                  <div>
                    <h3 className="font-bold uppercase text-zinc-800">I. ĐẠI DIỆN BÊN GIAO XE (VELORA):</h3>
                    <p className="mt-1">- Nhân viên bàn giao: <strong>{selectedProtocol.staffName}</strong></p>
                    <p>- Đơn vị: CÔNG TY TNHH DỊCH VỤ VẬN TẢI VELORA</p>
                  </div>

                  <div>
                    <h3 className="font-bold uppercase text-zinc-800">II. ĐẠI DIỆN BÊN NHẬN XE (KHÁCH HÀNG):</h3>
                    <p className="mt-1">- Khách hàng: <strong>{selectedProtocol.customerName}</strong></p>
                    <p>- Số điện thoại: <strong>{selectedProtocol.customerPhone}</strong></p>
                  </div>

                  <div>
                    <h3 className="font-bold uppercase text-zinc-800">III. THÔNG TIN PHƯƠNG TIỆN & HIỆN TRẠNG BÀN GIAO:</h3>
                    <div className="grid grid-cols-2 gap-2 mt-2 bg-zinc-50 p-3 rounded-lg border">
                      <div>Dòng xe: <strong>{selectedProtocol.carMake} {selectedProtocol.carModel}</strong></div>
                      <div>Biển kiểm soát: <strong className="font-mono text-blue-700">{selectedProtocol.licensePlate}</strong></div>
                      <div>Số ODO xuất phát: <strong className="font-mono text-amber-700">{selectedProtocol.odoAtHandover} KM</strong></div>
                      <div>Mức nhiên liệu: <strong className="text-emerald-700">{selectedProtocol.fuelLevel}</strong></div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold uppercase text-zinc-800">IV. ĐÁNH GIÁ TÌNH TRẠNG KỸ THUẬT:</h3>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                      <li>Ngoại thất: {selectedProtocol.exteriorCondition}</li>
                      <li>Nội thất: {selectedProtocol.interiorCondition}</li>
                      <li>Lốp xe: {selectedProtocol.tireCondition}</li>
                      {selectedProtocol.existingScratchesNotes && (
                        <li className="text-rose-700 font-medium">Vết trầy xước/móp méo ghi nhận trước: {selectedProtocol.existingScratchesNotes}</li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold uppercase text-zinc-800">V. PHỤ KIỆN BÀN GIAO KÈM THEO:</h3>
                    <div className="grid grid-cols-2 gap-1 mt-1 pl-2">
                      {selectedProtocol.accessoriesChecklist?.split(';').map((acc, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-zinc-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                          <span>{acc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t font-sans space-y-8">
                  <p className="italic text-zinc-600">
                    Hai bên đã kiểm tra thực tế, xác nhận toàn bộ nội dung nêu trên là chính xác và đồng ý nhận xe theo đúng hiện trạng.
                  </p>
                  <div className="grid grid-cols-2 text-center pt-2">
                    <div>
                      <div className="font-bold uppercase text-zinc-800">ĐẠI DIỆN BÊN GIAO XE</div>
                      <div className="text-[10px] italic text-zinc-500">(Ký, ghi rõ họ tên)</div>
                      <div className="mt-12 font-bold text-zinc-800">{selectedProtocol.staffName}</div>
                    </div>
                    <div>
                      <div className="font-bold uppercase text-zinc-800">ĐẠI DIỆN BÊN NHẬN XE</div>
                      <div className="text-[10px] italic text-zinc-500">(Ký, ghi rõ họ tên)</div>
                      <div className="mt-12 font-bold text-zinc-800">{selectedProtocol.customerName}</div>
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
