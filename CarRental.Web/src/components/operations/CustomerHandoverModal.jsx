import React, { useState, useEffect } from 'react';
import { FileCheck, CheckCircle2, Car, Gauge, Fuel, ShieldAlert, X, AlertCircle } from 'lucide-react';
import handoverService from '../../services/handoverService';
import { formatDateTime } from '../../utils/formatters';

const CustomerHandoverModal = ({ isOpen, onClose, rentalRequest, onSuccess }) => {
  const [protocol, setProtocol] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [signature, setSignature] = useState('');
  const [notes, setNotes] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && rentalRequest?.id) {
      const fetchProtocol = async () => {
        try {
          setFetching(true);
          setError(null);
          const res = await handoverService.getByRequestId(rentalRequest.id);
          const data = res?.data || res;
          setProtocol(data && data.id ? data : null);
          if (data && data.customerName) {
            setSignature(data.customerName);
          }
        } catch (err) {
          setProtocol(null);
        } finally {
          setFetching(false);
        }
      };
      fetchProtocol();
    }
  }, [isOpen, rentalRequest]);

  if (!isOpen || !rentalRequest) return null;

  const handleConfirm = async () => {
    if (!agreed) {
      setError('Vui lòng đánh dấu xác nhận đã kiểm tra thực tế phương tiện.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await handoverService.confirm(protocol.id, {
        customerSignature: signature || rentalRequest.customerName,
        notes: notes.trim()
      });

      alert('Chúc mừng! Bạn đã xác nhận nhận xe thành công. Đơn thuê đã được kích hoạt (ACTIVE). Chúc bạn có chuyến hành trình an toàn!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi xác nhận nhận xe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <FileCheck size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Xác Nhận Bàn Giao & Nhận Xe (US-19)</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Xe: <strong className="text-zinc-200">{rentalRequest.carMake} {rentalRequest.carModel}</strong> ({rentalRequest.carLicensePlate})
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition">
            <X size={20} />
          </button>
        </div>

        {fetching ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            Đang tải thông tin biên bản kiểm tra xe...
          </div>
        ) : !protocol ? (
          <div className="py-8 text-center space-y-3">
            <AlertCircle size={36} className="mx-auto text-amber-400 opacity-60" />
            <h4 className="text-sm font-bold text-white">Chưa có biên bản bàn giao</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Nhân viên kiểm định VELORA hiện chưa lập biên bản kiểm tra tình trạng xe tại điểm giao. Vui lòng liên hệ nhân viên giao xe để lập biên bản trước.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Thông số kỹ thuật lúc bàn giao */}
            <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="text-[10px] text-zinc-400">Số ODO xuất phát</div>
                <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">{protocol.odoAtHandover} KM</div>
              </div>

              <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="text-[10px] text-zinc-400">Mức nhiên liệu</div>
                <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">{protocol.fuelLevel}</div>
              </div>

              <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="text-[10px] text-zinc-400">Nhân viên giao</div>
                <div className="text-xs font-semibold text-zinc-200 mt-0.5 truncate">{protocol.staffName}</div>
              </div>

              <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="text-[10px] text-zinc-400">Mã biên bản</div>
                <div className="text-xs font-mono text-blue-400 mt-0.5">{protocol.protocolNumber}</div>
              </div>
            </div>

            {/* Chi tiết hiện trạng xe */}
            <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800 space-y-2 text-xs">
              <h5 className="font-bold text-zinc-300">Hiện trạng ngoại thất & nội thất:</h5>
              <p className="text-zinc-400">• Ngoại quan: {protocol.exteriorCondition}</p>
              <p className="text-zinc-400">• Nội thất: {protocol.interiorCondition}</p>
              <p className="text-zinc-400">• Lốp & Mâm: {protocol.tireCondition}</p>
              {protocol.existingScratchesNotes && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl">
                  <strong>Vết trầy xước/móp méo đã có trước:</strong> {protocol.existingScratchesNotes}
                </div>
              )}
            </div>

            {/* Checklist phụ kiện */}
            {protocol.accessoriesChecklist && (
              <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800 space-y-2 text-xs">
                <h5 className="font-bold text-zinc-300">Phụ kiện & Giấy tờ bàn giao kèm theo xe:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-zinc-400">
                  {protocol.accessoriesChecklist.split(';').map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs">
                {error}
              </div>
            )}

            {/* Cam kết & Ký nhận */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-2.5 bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-0 bg-zinc-900 border-zinc-700"
                />
                <span className="text-xs text-zinc-300">
                  Tôi đã kiểm tra thực tế phương tiện cùng nhân viên VELORA, xác nhận các thông số ODO, mức xăng và tình trạng thân vỏ nêu trên là chính xác và đồng ý nhận xe.
                </span>
              </label>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading || !agreed}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? 'Đang xác nhận...' : 'Đồng Ý & Xác Nhận Nhận Xe'}
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default CustomerHandoverModal;
