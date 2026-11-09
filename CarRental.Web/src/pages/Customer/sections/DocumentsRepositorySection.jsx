import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  FileCheck, 
  Receipt, 
  AlertTriangle, 
  Download, 
  Eye, 
  ExternalLink, 
  ShieldCheck, 
  Calendar, 
  Car,
  FileSignature,
  X,
  Filter
} from 'lucide-react';
import { formatDateTime } from '../../../utils/formatters';

const DEFAULT_DOCUMENTS = [
  {
    id: 'DOC-CT-2026-0081',
    type: 'CONTRACT',
    typeName: 'Hợp đồng thuê xe tự lái điện tử',
    title: 'Hợp đồng nguyên tắc & điều khoản giao xe Porsche Taycan 4S',
    vehicleName: 'Porsche Taycan 4S',
    licensePlate: '30H-999.99',
    signedDate: '02/11/2026',
    status: 'SIGNED_VALID',
    statusLabel: 'Ký số hợp lệ',
    fileSize: '1.4 MB',
    isDownloadable: true
  },
  {
    id: 'DOC-HO-2026-0045',
    type: 'HANDOVER_PROTOCOL',
    typeName: 'Biên bản giao xe (Handover Out)',
    title: 'Biên bản bàn giao xe thực tế Mercedes-Benz E300 AMG',
    vehicleName: 'Mercedes-Benz E300 AMG',
    licensePlate: '51K-234.56',
    signedDate: '24/10/2026',
    status: 'VERIFIED',
    statusLabel: 'Giao xe (Handover Out)',
    fileSize: '2.8 MB',
    isDownloadable: true
  },
  {
    id: 'DOC-RT-2026-0039',
    type: 'RETURN_PROTOCOL',
    typeName: 'Biên bản nhận lại xe (Return In)',
    title: 'Biên bản nhận lại xe & kiểm tra tình trạng BMW 530i M Sport',
    vehicleName: 'BMW 530i M Sport',
    licensePlate: '51K-556.78',
    signedDate: '18/10/2026',
    status: 'COMPLETED',
    statusLabel: 'Nhận lại xe (Return In)',
    fileSize: '3.1 MB',
    isDownloadable: true
  },
  {
    id: 'DOC-ST-2026-0022',
    type: 'SETTLEMENT_RECEIPT',
    typeName: 'Phiếu quyết toán & hoàn tiền cọc',
    title: 'Biên bản thanh lý hợp đồng & quyết toán cọc thế chân BMW 530i',
    vehicleName: 'BMW 530i M Sport',
    licensePlate: '51K-556.78',
    signedDate: '18/10/2026',
    status: 'REFUNDED',
    statusLabel: 'Đã hoàn cọc',
    fileSize: '890 KB',
    isDownloadable: true
  }
];

const DocumentsRepositorySection = ({ requests = [], onViewSettlement, onViewHandover }) => {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [vehicleFilter, setVehicleFilter] = useState('ALL');

  // Distinct vehicles
  const vehicleOptions = useMemo(() => {
    const list = [
      { id: 'ALL', label: 'Tất cả chuyến đi & dòng xe' },
      { id: '30H-999.99', label: 'Porsche Taycan 4S (30H-999.99)' },
      { id: '51K-234.56', label: 'Mercedes-Benz E300 AMG (51K-234.56)' },
      { id: '51K-556.78', label: 'BMW 530i M Sport (51K-556.78)' }
    ];
    return list;
  }, []);

  const filteredDocs = useMemo(() => {
    if (vehicleFilter === 'ALL') return DEFAULT_DOCUMENTS;
    return DEFAULT_DOCUMENTS.filter(d => d.licensePlate === vehicleFilter);
  }, [vehicleFilter]);

  const handleDownload = (doc) => {
    alert(`Đang tải xuống tài liệu PDF: ${doc.typeName} - Mã: ${doc.id}...`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Hợp đồng & Chứng từ điện tử
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kho lưu trữ pháp lý: Hợp đồng ký số điện tử, Biên bản bàn giao nhận xe và Phiếu quyết toán có giá trị pháp lý chứng thực.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 flex items-center gap-1.5 border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-blue-900" />
            <span>Ký số SHA-256 Chống sửa đổi</span>
          </span>
        </div>
      </div>

      {/* Filter by Trip / Vehicle Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-blue-900" />
          <span>Lọc theo phương tiện:</span>
        </div>
        <select
          value={vehicleFilter}
          onChange={(e) => setVehicleFilter(e.target.value)}
          className="bg-white border border-slate-200 text-xs font-semibold text-slate-900 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-900 cursor-pointer max-w-xs"
        >
          {vehicleOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map((doc) => {
          let IconComponent = FileText;
          let badgeColor = 'bg-blue-50 text-blue-800 border-blue-200';

          if (doc.type === 'CONTRACT') {
            IconComponent = FileSignature;
            badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
          } else if (doc.type === 'HANDOVER_PROTOCOL') {
            IconComponent = FileCheck;
            badgeColor = 'bg-sky-50 text-sky-800 border-sky-200';
          } else if (doc.type === 'RETURN_PROTOCOL') {
            IconComponent = FileCheck;
            badgeColor = 'bg-indigo-50 text-indigo-800 border-indigo-200';
          } else if (doc.type === 'SETTLEMENT_RECEIPT') {
            IconComponent = Receipt;
            badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
          }

          return (
            <div
              key={doc.id}
              className="p-5 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between gap-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <IconComponent className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                        {doc.typeName}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">
                        {doc.title}
                      </h3>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border shrink-0 ${badgeColor}`}>
                    {doc.statusLabel}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <span className="font-mono text-slate-500 text-[11px]">{doc.id}</span>
                  <span className="font-semibold text-slate-800">{doc.licensePlate}</span>
                  <span className="text-slate-400">•</span>
                  <span className="tabular-nums text-slate-500">Ngày lập: {doc.signedDate}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">{doc.fileSize}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedDoc(doc)}
                  className="px-3 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem trước</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-blue-900 text-white font-semibold text-xs transition flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải bản PDF</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">{selectedDoc.typeName}</span>
                <h3 className="font-bold text-sm text-slate-900">{selectedDoc.title}</h3>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Digital Document Content */}
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-4 max-h-[60vh] overflow-y-auto leading-relaxed">
              <div className="text-center pb-4 border-b border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 uppercase text-sm">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div className="text-xs text-slate-500">Độc lập - Tự do - Hạnh phúc</div>
                <div className="text-sm font-extrabold text-blue-950 mt-2 uppercase">{selectedDoc.title}</div>
                <div className="font-mono text-slate-400 text-[11px]">Mã lưu trữ: {selectedDoc.id} • Ngày ký: {selectedDoc.signedDate}</div>
              </div>

              <div className="space-y-2">
                <p><strong>BÊN CHO THUÊ (BÊN A):</strong> CÔNG TY CỔ PHẦN DỊCH VỤ XE TỰ LÁI CAO CẤP VELORA</p>
                <p><strong>BÊN THUÊ (BÊN B):</strong> ÔNG NGUYỄN HOÀNG MINH - CCCD: 079092004568 - GPLX: 790184920194</p>
                <p><strong>PHƯƠNG TIỆN BÀN GIAO:</strong> {selectedDoc.vehicleName} - Biển số đăng ký: <strong>{selectedDoc.licensePlate}</strong></p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1 text-[11px]">
                <div className="font-bold text-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Chứng thư chữ ký điện tử hợp lệ:
                </div>
                <p className="text-slate-600">
                  Văn bản này được chứng thực bởi hệ thống Ký số SHA-256 của VELORA. Giá trị pháp lý tương đương văn bản giấy có công chứng theo Luật Giao dịch điện tử.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDownload(selectedDoc)}
                className="px-4 py-2 bg-slate-900 hover:bg-blue-900 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Tải về máy (PDF)
              </button>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs cursor-pointer"
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

export default DocumentsRepositorySection;
