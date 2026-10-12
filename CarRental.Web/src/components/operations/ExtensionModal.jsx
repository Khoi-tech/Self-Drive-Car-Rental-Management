import React, { useState } from 'react';
import { Calendar, Clock, DollarSign, AlertCircle, X, CheckCircle2, ArrowRight } from 'lucide-react';
import extensionService from '../../services/extensionService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const ExtensionModal = ({ isOpen, onClose, rentalRequest, onSuccess }) => {
  const [newEndTime, setNewEndTime] = useState('');
  const [reason, setReason] = useState('Gia đình muốn kéo dài thêm lịch trình tham quan du lịch.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !rentalRequest) return null;

  const currentEnd = new Date(rentalRequest.endTime);

  // Tính toán thời gian gia hạn và phụ phí ước tính
  let extendedDays = 0;
  let estimatedFee = 0;
  let isValidDate = false;

  if (newEndTime) {
    const selectedNewEnd = new Date(newEndTime);
    if (selectedNewEnd > currentEnd) {
      isValidDate = true;
      const diffMs = selectedNewEnd.getTime() - currentEnd.getTime();
      extendedDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      estimatedFee = extendedDays * (rentalRequest.dailyRate || 0);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidDate) {
      setError('Thời gian trả xe mới phải sau thời gian trả xe hiện tại.');
      return;
    }
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do gia hạn.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await extensionService.create({
        rentalRequestId: rentalRequest.id,
        newEndTime: new Date(newEndTime).toISOString(),
        reason: reason.trim()
      });

      alert('Yêu cầu gia hạn thuê xe đã được gửi thành công! Đội ngũ VELORA sẽ kiểm tra lịch xe và phản hồi trong ít phút.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu gia hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Yêu Cầu Gia Hạn Thuê Xe</h3>
              <p className="text-xs text-zinc-400">
                {rentalRequest.carMake} {rentalRequest.carModel} ({rentalRequest.carLicensePlate})
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Lịch trình hiện tại */}
          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Thời điểm trả xe hiện tại:</span>
              <strong className="text-zinc-200 font-mono">{formatDateTime(rentalRequest.endTime)}</strong>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Đơn giá ngày:</span>
              <strong className="text-emerald-400">{formatCurrency(rentalRequest.dailyRate)} / ngày</strong>
            </div>
          </div>

          {/* Chọn ngày & giờ trả mới */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <Clock size={14} className="text-purple-400" />
              <span>Thời gian hoàn trả xe mới mong muốn *</span>
            </label>
            <input
              type="datetime-local"
              required
              min={new Date(currentEnd.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16)}
              value={newEndTime}
              onChange={(e) => setNewEndTime(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          {/* Dự toán phụ phí phát sinh */}
          {isValidDate && (
            <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between text-xs text-purple-300">
                <span>Số ngày gia hạn thêm:</span>
                <strong className="font-bold text-white">{extendedDays} ngày</strong>
              </div>
              <div className="flex justify-between text-sm font-bold text-white border-t border-purple-500/20 pt-2">
                <span>Phụ phí gia hạn dự kiến:</span>
                <span className="text-purple-400 font-mono text-base">{formatCurrency(estimatedFee)}</span>
              </div>
              <p className="text-[11px] text-zinc-400 italic">
                * Phụ phí này sẽ được cập nhật vào tổng tiền đơn thuê và thanh toán khi hoàn tất trả xe.
              </p>
            </div>
          )}

          {/* Lý do gia hạn */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Lý do gia hạn *</label>
            <textarea
              rows="3"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Cần thêm 1 ngày để di chuyển về TP.HCM..."
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          {/* Nút hành động */}
          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading || !isValidDate}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Đang gửi yêu cầu...' : (
                <>
                  <span>Gửi yêu cầu gia hạn</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ExtensionModal;
