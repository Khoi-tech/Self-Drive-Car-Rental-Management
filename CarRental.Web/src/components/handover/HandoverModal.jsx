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
            setOdoAtHandover(rentalRequest.dailyRate ? 10000 : 0);
          }
        } catch (err) {
          // If 404, not created yet - totally normal
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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileCheck size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Biên Bản Bàn Giao Xe Ô Tô Tự Lái (US-18)</span>
                {existingProtocol && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {existingProtocol.protocolNumber}
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400">
                Xe: <strong className="text-zinc-200">{rentalRequest.carMake} {rentalRequest.carModel}</strong> ({rentalRequest.carLicensePlate}) • Khách: <strong className="text-zinc-200">{rentalRequest.customerName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('FORM')}
                className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'FORM' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'}`}
              >
                Nhập kiểm định
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PREVIEW')}
                className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'PREVIEW' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'}`}
              >
                Xem trước biên bản
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs text-zinc-300">
          
          {activeTab === 'FORM' ? (
            /* ================= FORM TAB ================= */
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Thông tin nhân viên & Thời gian */}
              <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Nhân viên bàn giao xe *</label>
                  <input
                    type="text"
                    required
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700/60 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Khách hàng nhận xe</label>
                  <input
                    type="text"
                    disabled
                    value={`${rentalRequest.customerName} - ${rentalRequest.customerPhone}`}
                    className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Thời điểm bàn giao</label>
                  <input
                    type="text"
                    disabled
                    value={formatDateTime(new Date().toISOString())}
                    className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-400"
                  />
                </div>
              </div>

              {/* ODO và Mức Nhiên Liệu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Gauge size={16} />
                    <span>Số Kilomet Xuất Phát (ODO) *</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      required
                      value={odoAtHandover}
                      onChange={(e) => setOdoAtHandover(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-700/60 rounded-xl px-3 py-2 text-lg font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-zinc-400 font-bold">KM</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Căn cứ tính phí vượt kilomet khi khách hoàn trả xe (giới hạn {rentalRequest.dailyRate ? '100' : '150'} km/ngày).
                  </p>
                </div>

                <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Fuel size={16} />
                    <span>Mức Nhiên Liệu Lúc Bàn Giao *</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['25%', '50%', '75%', '100%'].map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setFuelLevel(lvl)}
                        className={`py-2 rounded-xl font-bold transition border ${
                          fuelLevel === lvl 
                            ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20' 
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Chính sách: Khách hoàn trả xe cùng mức nhiên liệu ban đầu ({fuelLevel}).
                  </p>
                </div>
              </div>

              {/* Tình trạng kỹ thuật & Ngoại quan */}
              <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Car size={16} className="text-blue-400" />
                  <span>Kiểm Định Tình Trạng Kỹ Thuật & Thân Vỏ</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Ngoại thất (Sơn, kính, đèn)</label>
                    <input
                      type="text"
                      value={exteriorCondition}
                      onChange={(e) => setExteriorCondition(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700/60 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Nội thất & Tiện nghi</label>
                    <input
                      type="text"
                      value={interiorCondition}
                      onChange={(e) => setInteriorCondition(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700/60 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Tình trạng 4 lốp & Mâm xe</label>
                    <input
                      type="text"
                      value={tireCondition}
                      onChange={(e) => setTireCondition(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700/60 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Vết xước móp cũ */}
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-amber-400" />
                    <span>Mô tả vết trầy xước, móp méo đã tồn tại trước đó (nếu có)</span>
                  </label>
                  <textarea
                    rows="2"
                    placeholder="VD: Cản trước bên phụ có 1 vết trầy xước nhẹ 3cm, mâm sau bên lái trầy nhẹ mép ngoài. Đã đối chiếu khách hàng đồng ý."
                    value={existingScratchesNotes}
                    onChange={(e) => setExistingScratchesNotes(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700/60 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Checklist Phụ Kiện Đi Kèm */}
              <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <CheckSquare size={16} className="text-emerald-400" />
                  <span>Danh Mục Giấy Tờ & Phụ Kiện Bàn Giao</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DEFAULT_ACCESSORIES.map(acc => {
                    const isChecked = selectedAccessories.includes(acc);
                    return (
                      <div
                        key={acc}
                        onClick={() => toggleAccessory(acc)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition select-none ${
                          isChecked 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {isChecked ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> : <Square size={16} className="text-zinc-600 shrink-0" />}
                        <span className="text-xs font-medium">{acc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ghi chú chung */}
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Ghi chú bổ sung của nhân viên giao xe</label>
                <textarea
                  rows="2"
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  placeholder="Ghi chú thêm về địa điểm giao, dặn dò khách hàng..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <span className="text-zinc-500 text-[11px]">
                  Biên bản sau khi lập sẽ được gửi cho khách hàng và dùng làm đối chiếu tại thời điểm trả xe.
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium transition"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save size={16} />
                    <span>{loading ? 'Đang lưu biên bản...' : (existingProtocol ? 'Cập nhật biên bản' : 'Xác nhận & Lưu biên bản')}</span>
                  </button>
                </div>
              </div>

            </form>
          ) : (
            /* ================= PREVIEW TAB (Văn bản pháp lý) ================= */
            <div className="space-y-6">
              
              <div className="flex justify-end gap-2 print:hidden">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                >
                  <Printer size={15} />
                  <span>In biên bản bàn giao</span>
                </button>
              </div>

              <div className="bg-white text-zinc-900 p-8 sm:p-12 rounded-2xl shadow-xl space-y-6 font-serif">
                
                {/* Header Tiêu Ngữ */}
                <div className="text-center space-y-1">
                  <div className="font-bold text-xs uppercase tracking-widest text-zinc-700">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div className="text-xs italic text-zinc-600">Độc lập - Tự do - Hạnh phúc</div>
                  <div className="text-xs text-zinc-400 tracking-widest mt-1">---o0o---</div>
                </div>

                <div className="text-center pt-2">
                  <h1 className="text-xl font-bold uppercase tracking-wider text-black">
                    BIÊN BẢN BÀN GIAO PHƯƠNG TIỆN TỰ LÁI
                  </h1>
                  <p className="text-xs font-sans text-zinc-500 mt-1">
                    Số biên bản: <strong className="font-mono text-zinc-800">{existingProtocol?.protocolNumber || 'BBBG-2026-DRAFT'}</strong>
                  </p>
                </div>

                {/* Căn cứ */}
                <div className="text-xs italic text-zinc-600 space-y-0.5 border-b pb-3">
                  <p>- Căn cứ Hợp đồng thuê xe ô tô tự lái số: <strong>HD-{rentalRequest.carLicensePlate}</strong></p>
                  <p>- Căn cứ nhu cầu và thỏa thuận thực tế giữa Bên Cho Thuê và Bên Thuê.</p>
                </div>

                {/* Các bên */}
                <div className="space-y-3 text-xs font-sans">
                  <div>
                    <h3 className="font-bold uppercase text-zinc-800">I. ĐẠI DIỆN BÊN GIAO XE (BÊN A - VELORA):</h3>
                    <p className="mt-1">- Nhân viên bàn giao: <strong>{staffName}</strong></p>
                    <p>- Đơn vị: CÔNG TY TNHH DỊCH VỤ VẬN TẢI VELORA</p>
                  </div>

                  <div>
                    <h3 className="font-bold uppercase text-zinc-800">II. ĐẠI DIỆN BÊN NHẬN XE (BÊN B - KHÁCH HÀNG):</h3>
                    <p className="mt-1">- Họ và tên: <strong>{rentalRequest.customerName}</strong></p>
                    <p>- Số điện thoại: <strong>{rentalRequest.customerPhone}</strong> • CCCD: <strong>{rentalRequest.customerIdCard}</strong></p>
                    <p>- Giấy phép lái xe: <strong>{rentalRequest.driverLicenseNumber || 'Đã kiểm tra hợp lệ'}</strong></p>
                  </div>

                  <div>
                    <h3 className="font-bold uppercase text-zinc-800">III. THÔNG TIN XE VÀ HIỆN TRẠNG TẠI THỜI ĐIỂM GIAO:</h3>
                    <div className="grid grid-cols-2 gap-2 mt-2 bg-zinc-50 p-3 rounded-lg border text-xs">
                      <div>Dòng xe: <strong>{rentalRequest.carMake} {rentalRequest.carModel}</strong></div>
                      <div>Biển số kiểm soát: <strong className="font-mono text-blue-700">{rentalRequest.carLicensePlate}</strong></div>
                      <div>Số KM xuất phát (ODO): <strong className="font-mono text-amber-700">{odoAtHandover} KM</strong></div>
                      <div>Mức nhiên liệu: <strong className="text-emerald-700">{fuelLevel}</strong></div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold uppercase text-zinc-800">IV. ĐÁNH GIÁ TÌNH TRẠNG KỸ THUẬT:</h3>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                      <li>Ngoại thất: {exteriorCondition}</li>
                      <li>Nội thất: {interiorCondition}</li>
                      <li>Lốp & Mâm: {tireCondition}</li>
                      {existingScratchesNotes && (
                        <li className="text-rose-700 font-medium">Vết trầy xước/móp méo đã ghi nhận trước: {existingScratchesNotes}</li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold uppercase text-zinc-800">V. DANH MỤC GIẤY TỜ & PHỤ KIỆN BÀN GIAO KÈM THEO:</h3>
                    <div className="grid grid-cols-2 gap-1.5 mt-1 pl-2">
                      {selectedAccessories.map((acc, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-zinc-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                          <span>{acc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cam kết & Chữ ký */}
                <div className="pt-4 border-t text-xs font-sans space-y-8">
                  <p className="italic text-zinc-600">
                    Hai bên đã cùng kiểm tra thực tế, xác nhận toàn bộ nội dung nêu trên là chính xác và đồng ý nhận xe theo đúng hiện trạng. Biên bản được lập thành 02 bản có giá trị pháp lý như nhau.
                  </p>

                  <div className="grid grid-cols-2 text-center pt-2">
                    <div>
                      <div className="font-bold uppercase text-zinc-800">ĐẠI DIỆN BÊN GIAO XE</div>
                      <div className="text-[11px] italic text-zinc-500">(Ký, ghi rõ họ tên)</div>
                      <div className="mt-12 font-bold text-zinc-800">{staffName}</div>
                    </div>

                    <div>
                      <div className="font-bold uppercase text-zinc-800">ĐẠI DIỆN BÊN NHẬN XE</div>
                      <div className="text-[11px] italic text-zinc-500">(Ký, ghi rõ họ tên)</div>
                      <div className="mt-12 font-bold text-zinc-800">{rentalRequest.customerName}</div>
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
