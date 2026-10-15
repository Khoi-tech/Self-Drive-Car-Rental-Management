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
  AlertCircle
} from 'lucide-react';
import handoverService from '../../services/handoverService';
import { formatDateTime } from '../../utils/formatters';

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

const HandoverModal = ({ isOpen, onClose, rentalRequest, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('FORM'); // 'FORM' or 'PREVIEW'
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [existingProtocol, setExistingProtocol] = useState(null);

  // Form State
  const [staffName, setStaffName] = useState('Trần Văn Hưng (Staff VELORA)');
  const [odoAtHandover, setOdoAtHandover] = useState(rentalRequest?.vehicle?.currentMileage || 10000);
  const [fuelLevel, setFuelLevel] = useState('100%');
  const [exteriorCondition, setExteriorCondition] = useState('Ngoại thất bóng sạch, sơn nguyên bản, không biến dạng kết cấu.');
  const [interiorCondition, setInteriorCondition] = useState('Nội thất sạch sẽ, ghế da nguyên vẹn, trần xe sạch, điều hòa lạnh sâu.');
  const [tireCondition, setTireCondition] = useState('4 lốp gai sâu trên 6mm, áp suất 2.3 bar tiêu chuẩn, mâm xe không cấn lề.');
  const [selectedAccessories, setSelectedAccessories] = useState(DEFAULT_ACCESSORIES);
  const [existingScratchesNotes, setExistingScratchesNotes] = useState('');
  const [evidencePhotoUrls, setEvidencePhotoUrls] = useState('');
  const [staffNotes, setStaffNotes] = useState('Đã đối chiếu CCCD và GPLX gốc của khách hàng. Xe trong trạng thái hoàn hảo.');

  // Fetch existing protocol if exists
  useEffect(() => {
    if (isOpen && rentalRequest?.id) {
      const loadExisting = async () => {
        try {
          setFetching(true);
          const res = await handoverService.getByRequestId(rentalRequest.id);
          const data = res?.data || res;
          if (data && data.id) {
            setExistingProtocol(data);
            setStaffName(data.staffName || 'Trần Văn Hưng (Staff VELORA)');
            setOdoAtHandover(data.odoAtHandover || 10000);
            setFuelLevel(data.fuelLevel || '100%');
            setExteriorCondition(data.exteriorCondition || '');
            setInteriorCondition(data.interiorCondition || '');
            setTireCondition(data.tireCondition || '');
            setExistingScratchesNotes(data.existingScratchesNotes || '');
            setEvidencePhotoUrls(data.evidencePhotoUrls || '');
            setStaffNotes(data.staffNotes || '');
            if (data.accessoriesChecklist) {
              setSelectedAccessories(data.accessoriesChecklist.split(';'));
            }
          } else {
            setExistingProtocol(null);
            setOdoAtHandover(rentalRequest.vehicle?.currentMileage || rentalRequest.currentMileage || 0);
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
    if (selectedAccessories.includes(item)) {
      setSelectedAccessories(selectedAccessories.filter(a => a !== item));
    } else {
      setSelectedAccessories([...selectedAccessories, item]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        rentalRequestId: rentalRequest.id,
        staffName,
        odoAtHandover: Number(odoAtHandover),
        fuelLevel,
        exteriorCondition,
        interiorCondition,
        tireCondition,
        accessoriesChecklist: selectedAccessories.join(';'),
        existingScratchesNotes,
        evidencePhotoUrls,
        staffNotes
      };

      const res = await handoverService.create(payload);
      setExistingProtocol(res?.data || res);
      alert('Đã lập và lưu Biên Bản Bàn Giao Xe thành công!');
      if (onSuccess) onSuccess();
      setActiveTab('PREVIEW');
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu biên bản bàn giao.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-lg max-w-4xl w-full max-h-[92vh] flex flex-col shadow-xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <FileCheck size={22} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
                <span>Biên Bản Bàn Giao Xe Ô Tô Tự Lái (US-18)</span>
                {existingProtocol && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold">
                    {existingProtocol.protocolNumber}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Xe: <strong className="text-zinc-950">{rentalRequest.carMake} {rentalRequest.carModel}</strong> ({rentalRequest.carLicensePlate}) • Khách: <strong className="text-zinc-950">{rentalRequest.customerName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex bg-slate-200/60 p-0.5 rounded-md text-xs font-medium border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('FORM')}
                className={`px-3 py-1.5 rounded transition ${activeTab === 'FORM' ? 'bg-white text-zinc-950 font-semibold shadow-sm' : 'text-slate-600 hover:text-zinc-950'}`}
              >
                Nhập kiểm định
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PREVIEW')}
                className={`px-3 py-1.5 rounded transition ${activeTab === 'PREVIEW' ? 'bg-white text-zinc-950 font-semibold shadow-sm' : 'text-slate-600 hover:text-zinc-950'}`}
              >
                Xem trước biên bản
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-zinc-950 rounded-md hover:bg-slate-100 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-700 bg-slate-50/30">
          
          {activeTab === 'FORM' ? (
            /* ================= FORM TAB ================= */
            <form onSubmit={handleSave} className="space-y-5">
              
              {/* Thông tin nhân viên & Thời gian */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-sm">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium text-[11px]">Nhân viên bàn giao xe *</label>
                  <input
                    type="text"
                    required
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-zinc-950 text-xs focus:outline-none focus:border-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium text-[11px]">Khách hàng nhận xe</label>
                  <input
                    type="text"
                    disabled
                    value={`${rentalRequest.customerName} - ${rentalRequest.customerPhone}`}
                    className="w-full bg-slate-100 border border-slate-200 rounded-md px-3 py-2 text-slate-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium text-[11px]">Thời điểm bàn giao</label>
                  <input
                    type="text"
                    disabled
                    value={formatDateTime(new Date().toISOString())}
                    className="w-full bg-slate-100 border border-slate-200 rounded-md px-3 py-2 text-slate-500 text-xs tabular-nums"
                  />
                </div>
              </div>

              {/* ODO và Mức Nhiên Liệu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2 shadow-sm">
                  <div className="flex items-center gap-2 text-zinc-950 font-semibold">
                    <Gauge size={16} className="text-slate-500" />
                    <span>Số Kilomet Xuất Phát (ODO) *</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      required
                      value={odoAtHandover}
                      onChange={(e) => setOdoAtHandover(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-md px-3 py-2 text-base font-mono font-bold text-zinc-950 focus:outline-none focus:border-[#0F172A] tabular-nums"
                    />
                    <span className="text-slate-500 font-semibold text-xs">KM</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Căn cứ tính phí vượt kilomet khi khách hoàn trả xe (giới hạn <strong className="text-zinc-950">{rentalRequest.vehicle?.mileageLimit || rentalRequest.mileageLimit || 300} km/ngày</strong>).
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2 shadow-sm">
                  <div className="flex items-center gap-2 text-zinc-950 font-semibold">
                    <Fuel size={16} className="text-emerald-600" />
                    <span>Mức Nhiên Liệu Lúc Bàn Giao *</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['25%', '50%', '75%', '100%'].map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setFuelLevel(lvl)}
                        className={`py-2 rounded-md font-semibold text-xs transition border ${
                          fuelLevel === lvl 
                            ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Chính sách: Khách hoàn trả xe cùng mức nhiên liệu ban đầu (<strong className="text-zinc-950">{fuelLevel}</strong>).
                  </p>
                </div>
              </div>

              {/* Tình trạng kỹ thuật & Ngoại quan */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 shadow-sm">
                <h3 className="font-bold text-zinc-950 text-xs flex items-center gap-2">
                  <Car size={16} className="text-blue-600" />
                  <span>Kiểm Định Tình Trạng Kỹ Thuật & Thân Vỏ</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium text-[11px]">Ngoại thất (Sơn, kính, đèn)</label>
                    <input
                      type="text"
                      value={exteriorCondition}
                      onChange={(e) => setExteriorCondition(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-zinc-950 text-xs focus:outline-none focus:border-[#0F172A]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-medium text-[11px]">Nội thất & Tiện nghi</label>
                    <input
                      type="text"
                      value={interiorCondition}
                      onChange={(e) => setInteriorCondition(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-zinc-950 text-xs focus:outline-none focus:border-[#0F172A]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-medium text-[11px]">Tình trạng 4 lốp & Mâm xe</label>
                    <input
                      type="text"
                      value={tireCondition}
                      onChange={(e) => setTireCondition(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-zinc-950 text-xs focus:outline-none focus:border-[#0F172A]"
                    />
                  </div>
                </div>

                {/* Vết xước móp cũ */}
                <div>
                  <label className="block text-slate-700 mb-1 font-medium flex items-center gap-1.5 text-[11px]">
                    <ShieldAlert size={14} className="text-amber-600" />
                    <span>Mô tả vết trầy xước, móp méo đã tồn tại trước đó (nếu có)</span>
                  </label>
                  <textarea
                    rows="2"
                    placeholder="VD: Cản trước bên phụ có 1 vết trầy xước nhẹ 3cm, mâm sau bên lái trầy nhẹ mép ngoài. Đã đối chiếu khách hàng đồng ý."
                    value={existingScratchesNotes}
                    onChange={(e) => setExistingScratchesNotes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md p-2.5 text-zinc-950 text-xs focus:outline-none focus:border-[#0F172A]"
                  />
                </div>
              </div>

              {/* Checklist Phụ Kiện Đi Kèm */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 shadow-sm">
                <h3 className="font-bold text-zinc-950 text-xs flex items-center gap-2">
                  <CheckSquare size={16} className="text-emerald-600" />
                  <span>Danh Mục Giấy Tờ & Phụ Kiện Bàn Giao</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEFAULT_ACCESSORIES.map(acc => {
                    const isChecked = selectedAccessories.includes(acc);
                    return (
                      <div
                        key={acc}
                        onClick={() => toggleAccessory(acc)}
                        className={`p-2.5 rounded-md border flex items-center gap-2.5 cursor-pointer transition select-none text-xs ${
                          isChecked 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
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

              {/* Ghi chú chung */}
              <div>
                <label className="block text-slate-600 mb-1 font-medium text-[11px]">Ghi chú bổ sung của nhân viên giao xe</label>
                <textarea
                  rows="2"
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md p-2.5 text-zinc-950 text-xs focus:outline-none focus:border-[#0F172A]"
                  placeholder="Ghi chú thêm về địa điểm giao, dặn dò khách hàng..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <span className="text-slate-500 text-[11px]">
                  Biên bản sau khi lập sẽ được đối chiếu tại thời điểm hoàn trả xe.
                </span>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md font-medium transition text-xs shadow-sm"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-[#0F172A] hover:bg-[#1D4ED8] text-white font-semibold rounded-md transition shadow-sm flex items-center gap-1.5 text-xs disabled:opacity-50"
                  >
                    <Save size={14} />
                    <span>{loading ? 'Đang lưu biên bản...' : (existingProtocol ? 'Cập nhật biên bản' : 'Xác nhận & Lưu biên bản')}</span>
                  </button>
                </div>
              </div>

            </form>
          ) : (
            /* ================= PREVIEW TAB (Văn bản pháp lý) ================= */
            <div className="space-y-4">
              
              <div className="flex justify-end gap-2 print:hidden">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-[#0F172A] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Printer size={14} />
                  <span>In biên bản bàn giao</span>
                </button>
              </div>

              <div className="bg-white text-zinc-950 p-8 sm:p-10 rounded-lg border border-slate-200 shadow-sm space-y-6 text-xs">
                
                {/* Header Tiêu Ngữ */}
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

                {/* Căn cứ */}
                <div className="text-[11px] italic text-slate-600 space-y-0.5 border-b border-slate-200 pb-3">
                  <p>- Căn cứ Hợp đồng thuê xe ô tô tự lái số: <strong>HD-{rentalRequest.carLicensePlate}</strong></p>
                  <p>- Căn cứ nhu cầu và thỏa thuận thực tế giữa Bên Cho Thuê và Bên Thuê.</p>
                </div>

                {/* Các bên */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold uppercase text-zinc-950 text-[11px]">I. ĐẠI DIỆN BÊN GIAO XE (BÊN A - VELORA):</h3>
                    <p className="mt-1 text-slate-700">- Nhân viên bàn giao: <strong className="text-zinc-950">{staffName}</strong></p>
                    <p className="text-slate-700">- Đơn vị: CÔNG TY TNHH DỊCH VỤ VẬN TẢI VELORA</p>
                  </div>

                  <div>
                    <h3 className="font-bold uppercase text-zinc-950 text-[11px]">II. ĐẠI DIỆN BÊN NHẬN XE (BÊN B - KHÁCH HÀNG):</h3>
                    <p className="mt-1 text-slate-700">- Họ và tên: <strong className="text-zinc-950">{rentalRequest.customerName}</strong></p>
                    <p className="text-slate-700">- Số điện thoại: <strong className="text-zinc-950 tabular-nums">{rentalRequest.customerPhone}</strong> • CCCD: <strong className="font-mono text-zinc-950 tabular-nums">{rentalRequest.customerIdCard}</strong></p>
                    <p className="text-slate-700">- Giấy phép lái xe: <strong className="text-zinc-950">{rentalRequest.driverLicenseNumber || 'Đã kiểm tra hợp lệ'}</strong></p>
                  </div>

                  <div>
                    <h3 className="font-bold uppercase text-zinc-950 text-[11px]">III. THÔNG TIN XE VÀ HIỆN TRẠNG TẠI THỜI ĐIỂM GIAO:</h3>
                    <div className="grid grid-cols-2 gap-2 mt-2 bg-slate-50 p-3 rounded-md border border-slate-200 text-xs">
                      <div>Dòng xe: <strong className="text-zinc-950">{rentalRequest.carMake} {rentalRequest.carModel}</strong></div>
                      <div>Biển số kiểm soát: <strong className="font-mono text-blue-800">{rentalRequest.carLicensePlate}</strong></div>
                      <div>Số KM xuất phát (ODO): <strong className="font-mono text-zinc-950 tabular-nums">{odoAtHandover?.toLocaleString()} km</strong></div>
                      <div>Mức nhiên liệu: <strong className="text-emerald-700 font-semibold">{fuelLevel}</strong></div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold uppercase text-zinc-950 text-[11px]">IV. ĐÁNH GIÁ TÌNH TRẠNG KỸ THUẬT:</h3>
                    <ul className="list-disc pl-5 space-y-1 mt-1 text-slate-700">
                      <li>Ngoại thất: {exteriorCondition}</li>
                      <li>Nội thất: {interiorCondition}</li>
                      <li>Lốp & Mâm: {tireCondition}</li>
                      {existingScratchesNotes && (
                        <li className="text-rose-700 font-medium">Vết trầy xước/móp méo đã ghi nhận trước: {existingScratchesNotes}</li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold uppercase text-zinc-950 text-[11px]">V. DANH MỤC GIẤY TỜ & PHỤ KIỆN BÀN GIAO KÈM THEO:</h3>
                    <div className="grid grid-cols-2 gap-1.5 mt-1 pl-2">
                      {selectedAccessories.map((acc, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>{acc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cam kết & Chữ ký */}
                <div className="pt-4 border-t border-slate-200 space-y-8">
                  <p className="italic text-slate-600 text-[11px]">
                    Hai bên đã cùng kiểm tra thực tế, xác nhận toàn bộ nội dung nêu trên là chính xác và đồng ý nhận xe theo đúng hiện trạng. Biên bản được lập thành 02 bản có giá trị pháp lý như nhau.
                  </p>

                  <div className="grid grid-cols-2 text-center pt-2">
                    <div>
                      <div className="font-bold uppercase text-zinc-950 text-[11px]">ĐẠI DIỆN BÊN GIAO XE</div>
                      <div className="text-[10px] italic text-slate-500">(Ký, ghi rõ họ tên)</div>
                      <div className="mt-12 font-bold text-zinc-950">{staffName}</div>
                    </div>

                    <div>
                      <div className="font-bold uppercase text-zinc-950 text-[11px]">ĐẠI DIỆN BÊN NHẬN XE</div>
                      <div className="text-[10px] italic text-slate-500">(Ký, ghi rõ họ tên)</div>
                      <div className="mt-12 font-bold text-zinc-950">{rentalRequest.customerName}</div>
                    </div>
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
