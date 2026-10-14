import React, { useState, useEffect } from 'react';
import { 
  X, 
  Receipt, 
  Printer, 
  CheckCircle2, 
  Car, 
  Calendar, 
  CreditCard, 
  RefreshCw, 
  AlertCircle,
  FileCheck,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import settlementService from '../../services/settlementService';
import returnProtocolService from '../../services/returnProtocolService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const CustomerSettlementReceiptModal = ({ isOpen, onClose, rentalRequest }) => {
  const [settlement, setSettlement] = useState(null);
  const [returnProtocol, setReturnProtocol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (rentalRequest?.id && isOpen) {
      const loadData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const [settleRes, returnRes] = await Promise.allSettled([
            settlementService.getByRequestId(rentalRequest.id),
            returnProtocolService.getByRequestId(rentalRequest.id)
          ]);

          if (settleRes.status === 'fulfilled') {
            const data = settleRes.value?.data || settleRes.value;
            setSettlement(data);
          }
          if (returnRes.status === 'fulfilled') {
            const data = returnRes.value?.data || returnRes.value;
            setReturnProtocol(data);
          }
        } catch (err) {
          console.error(err);
          setError('Không thể tải thông tin quyết toán.');
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
  }, [rentalRequest, isOpen]);

  if (!isOpen || !rentalRequest) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-zinc-950 border border-zinc-800 text-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-scaleUp">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Receipt size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Phiếu Quyết Toán & Hoàn Cọc (US-10)
              </h3>
              <p className="text-xs text-zinc-400">
                Mã đơn: #{rentalRequest.id.slice(0, 8).toUpperCase()} • Hợp đồng hoàn tất
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs print:p-0">

          {loading ? (
            <div className="py-16 text-center text-zinc-400 space-y-3">
              <RefreshCw size={24} className="animate-spin mx-auto text-amber-400" />
              <p>Đang tải chi tiết quyết toán...</p>
            </div>
          ) : !settlement ? (
            <div className="p-6 text-center text-zinc-400 space-y-2">
              <AlertCircle size={32} className="mx-auto text-zinc-500" />
              <p>Đơn thuê này đang trong quá trình nghiệm thu trả xe và quyết toán tại quầy.</p>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Receipt Visual Card */}
              <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/10 via-transparent to-transparent pointer-events-none rounded-full blur-2xl"></div>

                {/* Company & Receipt Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-800">
                  <div>
                    <h2 className="text-xl font-bold tracking-widest uppercase text-white">VELORA</h2>
                    <p className="text-[11px] text-zinc-400">Hệ Thống Thuê Xe Tự Lái Sang Trọng & Tiện Lợi</p>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {settlement.refundStatus === 'REFUNDED' ? 'ĐÃ HOÀN CỌC THÀNH CÔNG' : 'QUYẾT TOÁN HOÀN TẤT'}
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-1">Số: {settlement.settlementNumber || 'QT-VELORA'}</p>
                    <p className="text-[10px] text-zinc-500">{formatDateTime(settlement.settledAt || settlement.createdAt)}</p>
                  </div>
                </div>

                {/* Customer & Vehicle Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
                    <span className="text-zinc-500 block">Khách hàng thuê xe:</span>
                    <span className="text-white font-semibold text-sm block">{rentalRequest.customerName}</span>
                    <span className="text-zinc-400 block">{rentalRequest.customerPhone} • {rentalRequest.customerEmail}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
                    <span className="text-zinc-500 block">Phương tiện thuê:</span>
                    <span className="text-white font-semibold text-sm block">{rentalRequest.carMake} {rentalRequest.carModel}</span>
                    <span className="text-amber-400 font-medium block">Biển số: {rentalRequest.carLicensePlate}</span>
                  </div>
                </div>

                {/* Return Mileage & Fuel Verification */}
                {returnProtocol && (
                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">ODO bắt đầu</span>
                      <span className="font-semibold text-white block mt-0.5">{returnProtocol.startOdo.toLocaleString()} km</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">ODO khi trả</span>
                      <span className="font-semibold text-white block mt-0.5">{returnProtocol.endOdo.toLocaleString()} km</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Km di chuyển</span>
                      <span className="font-semibold text-white block mt-0.5">{returnProtocol.totalKmDriven.toLocaleString()} km</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Nhiên liệu khi trả</span>
                      <span className="font-semibold text-emerald-400 block mt-0.5">{returnProtocol.returnFuelLevel}%</span>
                    </div>
                  </div>
                )}

                {/* Itemized Table */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-zinc-300 text-xs">Chi Tiết Quyết Toán Tài Chính:</h4>
                  
                  <div className="divide-y divide-zinc-800 text-xs">
                    <div className="py-2 flex justify-between">
                      <span className="text-zinc-400">Tiền thuê xe hợp đồng:</span>
                      <span className="text-white font-medium">{formatCurrency(settlement.rentalFee)}</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-zinc-400">Tiền đặt cọc đã nộp ban đầu:</span>
                      <span className="text-emerald-400 font-medium">{formatCurrency(settlement.depositAmount)}</span>
                    </div>

                    {settlement.extraKmFee > 0 && (
                      <div className="py-2 flex justify-between text-rose-400">
                        <span>Phụ phí vượt số kilomet cho phép:</span>
                        <span>-{formatCurrency(settlement.extraKmFee)}</span>
                      </div>
                    )}

                    {settlement.lateReturnFee > 0 && (
                      <div className="py-2 flex justify-between text-rose-400">
                        <span>Phụ phí trả xe trễ hạn ({settlement.lateHours} giờ):</span>
                        <span>-{formatCurrency(settlement.lateReturnFee)}</span>
                      </div>
                    )}

                    {settlement.fuelFee > 0 && (
                      <div className="py-2 flex justify-between text-rose-400">
                        <span>Phí bù hao hụt nhiên liệu:</span>
                        <span>-{formatCurrency(settlement.fuelFee)}</span>
                      </div>
                    )}

                    {settlement.damageFee > 0 && (
                      <div className="py-2 flex justify-between text-rose-400">
                        <span>Phí bồi thường hư hỏng / sự cố:</span>
                        <span>-{formatCurrency(settlement.damageFee)}</span>
                      </div>
                    )}

                    {settlement.cleaningFee > 0 && (
                      <div className="py-2 flex justify-between text-rose-400">
                        <span>Phí vệ sinh chuyên sâu khoang xe:</span>
                        <span>-{formatCurrency(settlement.cleaningFee)}</span>
                      </div>
                    )}

                    {settlement.otherFee > 0 && (
                      <div className="py-2 flex justify-between text-rose-400">
                        <span>Khoản phát sinh khác {settlement.otherFeeNotes ? `(${settlement.otherFeeNotes})` : ''}:</span>
                        <span>-{formatCurrency(settlement.otherFee)}</span>
                      </div>
                    )}

                    <div className="py-2.5 flex justify-between font-semibold border-t border-zinc-700 text-zinc-300">
                      <span>Tổng các khoản phụ phí khấu trừ:</span>
                      <span className="text-rose-400">-{formatCurrency(settlement.totalDeduction)}</span>
                    </div>
                  </div>
                </div>

                {/* Final Refund Receipt Box */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 via-zinc-950 to-zinc-950 border border-emerald-500/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="text-zinc-400 block text-xs">
                      {settlement.settlementType === 'REFUND_TO_CUSTOMER' 
                        ? 'SỐ TIỀN CỌC THỰC TẾ HOÀN LẠI CHO BẠN:' 
                        : 'SỐ TIỀN PHỤ PHÍ BỔ SUNG ĐÃ NỘP:'}
                    </span>
                    <span className="text-2xl font-bold text-emerald-400 block mt-0.5">
                      {formatCurrency(settlement.refundAmount > 0 ? settlement.refundAmount : settlement.additionalAmountDue)}
                    </span>
                  </div>

                  {settlement.refundStatus === 'REFUNDED' && (
                    <div className="text-right text-[11px] text-zinc-400 space-y-0.5">
                      <p className="text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                        <CheckCircle2 size={13} />
                        Đã chuyển khoản VietQR thành công
                      </p>
                      <p>TK nhận: {settlement.refundAccountNumber} ({settlement.refundBankName})</p>
                      <p>Mã GD: <span className="text-white font-mono">{settlement.refundTransactionCode || 'N/A'}</span></p>
                    </div>
                  )}
                </div>

                {settlement.staffNotes && (
                  <div className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/60 text-zinc-400 text-[11px]">
                    <span className="text-zinc-300 font-medium">Ghi chú từ nhân viên: </span>
                    <span className="italic">{settlement.staffNotes}</span>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/90 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-xs font-semibold flex items-center gap-2 transition"
          >
            <Printer size={15} />
            <span>In Phiếu Quyết Toán</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default CustomerSettlementReceiptModal;
