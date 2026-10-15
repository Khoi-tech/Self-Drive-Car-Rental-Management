import React, { useState, useEffect } from 'react';
import { 
  X, 
  CircleDollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  QrCode, 
  CreditCard, 
  Receipt, 
  Printer, 
  RefreshCw, 
  Car, 
  ShieldAlert,
  Fuel,
  Gauge,
  Clock,
  Sparkles,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import settlementService from '../../services/settlementService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const POPULAR_BANKS = [
  { code: '970436', shortName: 'VCB', name: 'Vietcombank' },
  { code: '970415', shortName: 'CTG', name: 'VietinBank' },
  { code: '970418', shortName: 'BIDV', name: 'BIDV' },
  { code: '970407', shortName: 'TCB', name: 'Techcombank' },
  { code: '970422', shortName: 'MB', name: 'MBBank' },
  { code: '970423', shortName: 'TPB', name: 'TPBank' },
  { code: '970432', shortName: 'VPB', name: 'VPBank' },
  { code: '970448', shortName: 'OCB', name: 'OCB' },
  { code: '970416', shortName: 'ACB', name: 'ACB' }
];

const SettlementModal = ({ isOpen, onClose, rentalRequest, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Preview Data
  const [preview, setPreview] = useState(null);

  // Editable Adjustments
  const [extraKmFee, setExtraKmFee] = useState(0);
  const [lateReturnFee, setLateReturnFee] = useState(0);
  const [fuelFee, setFuelFee] = useState(0);
  const [damageFee, setDamageFee] = useState(0);
  const [cleaningFee, setCleaningFee] = useState(0);
  const [otherFee, setOtherFee] = useState(0);
  const [otherFeeNotes, setOtherFeeNotes] = useState('');

  // Refund Bank Form
  const [selectedBank, setSelectedBank] = useState('VCB');
  const [accountNumber, setAccountNumber] = useState('0123456789');
  const [accountName, setAccountName] = useState('');
  const [transactionCode, setTransactionCode] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [staffNotes, setStaffNotes] = useState('');

  // Step: 1: Calculation & Review, 2: Payment/Refund Execution
  const [step, setStep] = useState(1);
  const [settlementResult, setSettlementResult] = useState(null);

  useEffect(() => {
    if (rentalRequest?.id && isOpen) {
      const loadPreview = async () => {
        try {
          setPreviewLoading(true);
          setError(null);
          const res = await settlementService.preview(rentalRequest.id);
          const data = res?.data || res;
          setPreview(data);

          setExtraKmFee(data.extraKmFee || 0);
          setLateReturnFee(data.lateReturnFee || 0);
          setFuelFee(data.fuelFee || 0);
          setDamageFee(data.damageFee || 0);
          setCleaningFee(data.cleaningFee || 0);
          setOtherFee(data.otherFee || 0);
          setOtherFeeNotes(data.otherFeeNotes || '');

          setAccountName(data.customerName || rentalRequest.customerName || '');
        } catch (err) {
          console.error(err);
          setError(err.response?.data?.message || 'Không thể tính trước bảng quyết toán. Vui lòng đảm bảo đã lập biên bản hoàn trả xe.');
        } finally {
          setPreviewLoading(false);
        }
      };

      loadPreview();
    }
  }, [rentalRequest, isOpen]);

  if (!isOpen || !rentalRequest) return null;

  const deposit = preview?.depositAmount ?? rentalRequest.depositAmount ?? 0;
  const rentalFee = preview?.rentalFee ?? rentalRequest.estimatedTotalFee ?? 0;

  const totalDeductions = Number(extraKmFee) + Number(lateReturnFee) + Number(fuelFee) + Number(damageFee) + Number(cleaningFee) + Number(otherFee);
  const balance = deposit - totalDeductions;
  const isRefund = balance >= 0;
  const refundAmount = isRefund ? balance : 0;
  const additionalDue = !isRefund ? Math.abs(balance) : 0;

  const vietQrRefundUrl = `https://img.vietqr.io/image/${selectedBank}-${accountNumber}-compact2.png?amount=${refundAmount}&addInfo=VELORA%20HOAN%20COC%20${rentalRequest.id.slice(0, 8).toUpperCase()}&accountName=${encodeURIComponent(accountName)}`;
  const vietQrCompanyUrl = `https://img.vietqr.io/image/VCB-1029384756-compact2.png?amount=${additionalDue}&addInfo=VELORA%20PHU%20PHI%20${rentalRequest.id.slice(0, 8).toUpperCase()}&accountName=CONG%20TY%20VELORA`;

  const handleCreateSettlement = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        rentalRequestId: rentalRequest.id,
        contractId: preview?.contractId || rentalRequest.contractId,
        returnProtocolId: preview?.returnProtocolId,
        rentalFee: Number(rentalFee),
        depositAmount: Number(deposit),
        extraKmFee: Number(extraKmFee),
        lateHours: preview?.lateHours || 0,
        lateReturnFee: Number(lateReturnFee),
        fuelFee: Number(fuelFee),
        damageFee: Number(damageFee),
        cleaningFee: Number(cleaningFee),
        otherFee: Number(otherFee),
        otherFeeNotes,
        refundBankName: selectedBank,
        refundAccountNumber: accountNumber,
        refundAccountName: accountName,
        staffNotes
      };

      const res = await settlementService.create(payload);
      const created = res?.data || res;
      setSettlementResult(created);
      setSuccessMsg('Đã thiết lập phiếu quyết toán tài chính thành công!');

      if (balance === 0) {
        if (onSuccess) onSuccess(created);
        setTimeout(() => onClose(), 1500);
      } else {
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo phiếu quyết toán.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRefund = async () => {
    if (!settlementResult?.id) return;
    try {
      setLoading(true);
      setError(null);

      const payload = {
        refundTransactionCode: transactionCode || `TXN-REFUND-${Date.now().toString().slice(-6)}`,
        refundProofUrl: proofUrl,
        refundMethod: 'VIETQR',
        refundBankName: selectedBank,
        refundAccountNumber: accountNumber,
        refundAccountName: accountName,
        staffNotes
      };

      const res = await settlementService.confirmRefund(settlementResult.id, payload);
      const updated = res?.data || res;

      setSuccessMsg('Đã hoàn tất hoàn cọc cho khách hàng! Đơn thuê đã chính thức COMPLETED.');
      if (onSuccess) onSuccess(updated);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi khi xác nhận hoàn cọc.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAdditionalPayment = async () => {
    if (!settlementResult?.id) return;
    try {
      setLoading(true);
      setError(null);

      const payload = {
        transactionCode: transactionCode || `TXN-COLLECT-${Date.now().toString().slice(-6)}`,
        paymentMethod: 'VIETQR',
        proofUrl,
        staffNotes
      };

      const res = await settlementService.confirmAdditionalPayment(settlementResult.id, payload);
      const updated = res?.data || res;

      setSuccessMsg('Đã xác nhận thu phụ phí bổ sung! Đơn thuê đã chính thức COMPLETED.');
      if (onSuccess) onSuccess(updated);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi khi xác nhận thu phụ phí.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans">
      <div className="bg-white border border-slate-200 text-zinc-950 rounded-lg w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-xl animate-scaleUp">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-900 text-white flex items-center justify-center shadow-xs">
              <Receipt size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
                Phiếu Quyết Toán Tài Chính & Hoàn Cọc (US-23)
              </h3>
              <p className="text-xs text-slate-500">
                Đơn #{rentalRequest.id.slice(0, 8).toUpperCase()} • Khách hàng: {rentalRequest.customerName} ({rentalRequest.customerPhone})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-zinc-950 hover:bg-slate-200 transition">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {previewLoading ? (
            <div className="py-12 text-center text-slate-500">
              <RefreshCw size={24} className="animate-spin text-blue-900 mx-auto mb-2" />
              <p className="text-xs font-semibold">Đang tổng hợp dữ liệu nghiệm thu & cọc...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: HÓA ĐƠN KẾ TOÁN (INVOICE LEDGER - 7 Cols) */}
              <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt size={16} className="text-blue-900" />
                    Bảng Kê Đối Trừ Tài Chính Hợp Đồng
                  </span>
                  <span className="text-[11px] text-slate-500 tabular-nums">Ngày lập: {new Date().toLocaleDateString('vi-VN')}</span>
                </div>

                {/* Ledger Table */}
                <div className="space-y-2.5">
                  
                  {/* Khoản cọc */}
                  <div className="flex justify-between items-center p-2.5 rounded bg-slate-50 border border-slate-200">
                    <span className="font-bold text-zinc-900">1. Tiền đặt cọc ban đầu (Đã nhận):</span>
                    <span className="font-extrabold text-blue-900 text-sm tabular-nums">+{formatCurrency(deposit)}</span>
                  </div>

                  {/* Các khoản khấu trừ */}
                  <div className="p-3 rounded border border-slate-200 space-y-2.5 bg-white">
                    <div className="font-bold text-slate-700 uppercase text-[11px]">2. Các khoản khấu trừ chi phí phát sinh:</div>

                    <div className="grid grid-cols-2 gap-2 items-center text-xs">
                      <span className="text-slate-600">Phụ phí vượt hạn mức ODO:</span>
                      <input
                        type="number"
                        value={extraKmFee}
                        onChange={(e) => setExtraKmFee(Number(e.target.value))}
                        disabled={step === 2}
                        className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-right font-bold text-zinc-950 tabular-nums"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 items-center text-xs">
                      <span className="text-slate-600">Phụ phí trễ hạn trả xe:</span>
                      <input
                        type="number"
                        value={lateReturnFee}
                        onChange={(e) => setLateReturnFee(Number(e.target.value))}
                        disabled={step === 2}
                        className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-right font-bold text-zinc-950 tabular-nums"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 items-center text-xs">
                      <span className="text-slate-600">Phụ phí thiếu hụt xăng/nhiên liệu:</span>
                      <input
                        type="number"
                        value={fuelFee}
                        onChange={(e) => setFuelFee(Number(e.target.value))}
                        disabled={step === 2}
                        className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-right font-bold text-zinc-950 tabular-nums"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 items-center text-xs">
                      <span className="text-slate-600">Chi phí bồi thường hư hỏng mới:</span>
                      <input
                        type="number"
                        value={damageFee}
                        onChange={(e) => setDamageFee(Number(e.target.value))}
                        disabled={step === 2}
                        className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-right font-bold text-red-700 tabular-nums"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 items-center text-xs">
                      <span className="text-slate-600">Phí vệ sinh / khử mùi khoang xe:</span>
                      <input
                        type="number"
                        value={cleaningFee}
                        onChange={(e) => setCleaningFee(Number(e.target.value))}
                        disabled={step === 2}
                        className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-right font-bold text-zinc-950 tabular-nums"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 items-center text-xs">
                      <span className="text-slate-600">Phụ phí khác (nếu có):</span>
                      <input
                        type="number"
                        value={otherFee}
                        onChange={(e) => setOtherFee(Number(e.target.value))}
                        disabled={step === 2}
                        className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-right font-bold text-zinc-950 tabular-nums"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-slate-700 font-bold">
                      <span>Tổng các khoản khấu trừ:</span>
                      <span className="text-red-700 tabular-nums">-{formatCurrency(totalDeductions)}</span>
                    </div>
                  </div>

                  {/* KẾT QUẢ QUYẾT TOÁN CUỐI CÙNG */}
                  <div className={`p-4 rounded-md border text-center space-y-1 ${
                    isRefund 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}>
                    <div className="text-[11px] uppercase font-bold tracking-wider">
                      {isRefund ? 'SỐ TIỀN HOÀN TRẢ KHÁCH HÀNG (REFUND):' : 'SỐ TIỀN KHÁCH CẦN ĐÓNG THÊM (ADDITIONAL PAYMENT):'}
                    </div>
                    <div className={`text-2xl font-extrabold tabular-nums ${isRefund ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {formatCurrency(isRefund ? refundAmount : additionalDue)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {isRefund ? 'Chuyển khoản hoàn cọc cho khách qua mã VietQR bên phải' : 'Khách hàng quét mã VietQR bên phải để thanh toán bổ sung'}
                    </div>
                  </div>

                </div>
              </div>

              {/* RIGHT COLUMN: VIETQR CỔNG THANH TOÁN (5 Cols) */}
              <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
                    <QrCode size={16} className="text-blue-900" />
                    Cổng Giao Dịch VietQR
                  </span>
                  <span className="badge-rented text-[10px] py-0.2">NAPAS 24/7</span>
                </div>

                {/* QR Code image */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="p-2 bg-white rounded border border-slate-200 shadow-xs">
                    <img
                      src={isRefund ? vietQrRefundUrl : vietQrCompanyUrl}
                      alt="VietQR Settlement"
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                  <div className="mt-2 text-center text-slate-500 text-[11px]">
                    Quét bằng app ngân hàng để thực hiện chuyển tiền
                  </div>
                </div>

                {/* Bank Account Selection / Form */}
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-900 mb-1">Ngân hàng nhận tiền:</label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      disabled={step === 2}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-semibold text-zinc-950 focus:outline-none focus:border-blue-900"
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b.shortName} value={b.shortName}>
                          {b.shortName} - {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-900 mb-1">Số tài khoản thụ hưởng:</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      disabled={step === 2}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-zinc-950 tabular-nums focus:outline-none focus:border-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-900 mb-1">Tên chủ tài khoản:</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      disabled={step === 2}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-semibold text-zinc-950 uppercase focus:outline-none focus:border-blue-900"
                    />
                  </div>

                  {step === 2 && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                      <label className="block text-[11px] font-bold text-zinc-900">Mã giao dịch ngân hàng xác nhận:</label>
                      <input
                        type="text"
                        value={transactionCode}
                        onChange={(e) => setTransactionCode(e.target.value)}
                        placeholder="VD: FT2610148899"
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-zinc-950 focus:outline-none focus:border-blue-900"
                      />
                    </div>
                  )}
                </div>

                {/* Action Buttons in Right Box */}
                <div className="pt-2">
                  {step === 1 ? (
                    <button
                      type="button"
                      onClick={handleCreateSettlement}
                      disabled={loading}
                      className="w-full bg-slate-900 hover:bg-blue-900 disabled:bg-slate-400 text-white font-bold text-xs py-2.5 px-4 rounded-md shadow-xs transition-colors uppercase tracking-wider cursor-pointer"
                    >
                      {loading ? 'Đang khởi tạo...' : 'Xác lập phiếu quyết toán & Sinh mã QR'}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {isRefund ? (
                        <button
                          type="button"
                          onClick={handleConfirmRefund}
                          disabled={loading}
                          className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white font-bold text-xs py-2.5 px-4 rounded-md shadow-xs transition-colors uppercase tracking-wider cursor-pointer"
                        >
                          {loading ? 'Đang ghi nhận...' : 'Xác nhận đã chuyển hoàn cọc cho khách'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleConfirmAdditionalPayment}
                          disabled={loading}
                          className="w-full bg-blue-900 hover:bg-blue-950 disabled:bg-slate-400 text-white font-bold text-xs py-2.5 px-4 rounded-md shadow-xs transition-colors uppercase tracking-wider cursor-pointer"
                        >
                          {loading ? 'Đang ghi nhận...' : 'Xác nhận đã nhận phụ phí bổ sung'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-semibold transition"
          >
            Đóng
          </button>
          <div className="text-[11px] text-slate-500">
            Hệ thống tự động đồng bộ trạng thái đơn sang <strong className="text-zinc-950 font-bold">COMPLETED</strong> ngay khi xác nhận.
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettlementModal;
