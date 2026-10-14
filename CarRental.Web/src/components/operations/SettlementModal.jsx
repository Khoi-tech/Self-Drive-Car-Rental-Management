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
  ExternalLink
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
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [transactionCode, setTransactionCode] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [staffNotes, setStaffNotes] = useState('');

  // Step in Modal: 1: Calculation & Review, 2: Payment/Refund Execution
  const [step, setStep] = useState(1);

  // Existing settlement if already created
  const [settlementResult, setSettlementResult] = useState(null);

  // Load preview calculation
  useEffect(() => {
    if (rentalRequest?.id && isOpen) {
      const loadPreview = async () => {
        try {
          setPreviewLoading(true);
          setError(null);
          const res = await settlementService.preview(rentalRequest.id);
          const data = res?.data || res;
          setPreview(data);

          // Populate default calculated fees
          setExtraKmFee(data.extraKmFee || 0);
          setLateReturnFee(data.lateReturnFee || 0);
          setFuelFee(data.fuelFee || 0);
          setDamageFee(data.damageFee || 0);
          setCleaningFee(data.cleaningFee || 0);
          setOtherFee(data.otherFee || 0);
          setOtherFeeNotes(data.otherFeeNotes || '');

          setAccountName(data.customerName || rentalRequest.customerName || '');
          setAccountNumber('0123456789'); // Demo fallback account
        } catch (err) {
          console.error(err);
          setError(err.response?.data?.message || 'Không thể tính trước bảng quyết toán. Vui lòng đảm bảo đã lập biên bản hoàn trả xe (US-22).');
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

  // Real-time calculation based on inputs
  const totalDeductions = Number(extraKmFee) + Number(lateReturnFee) + Number(fuelFee) + Number(damageFee) + Number(cleaningFee) + Number(otherFee);
  const balance = deposit - totalDeductions;
  const isRefund = balance >= 0;
  const refundAmount = isRefund ? balance : 0;
  const additionalDue = !isRefund ? Math.abs(balance) : 0;

  // VietQR generation
  // For Refund (Staff sends money to Customer)
  const vietQrRefundUrl = `https://img.vietqr.io/image/${selectedBank}-${accountNumber}-compact2.png?amount=${refundAmount}&addInfo=VELORA%20HOAN%20COC%20${rentalRequest.id.slice(0, 8).toUpperCase()}&accountName=${encodeURIComponent(accountName)}`;
  
  // For Additional Payment (Customer sends money to VELORA company)
  const vietQrCompanyUrl = `https://img.vietqr.io/image/VCB-1029384756-compact2.png?amount=${additionalDue}&addInfo=VELORA%20PHU%20PHI%20${rentalRequest.id.slice(0, 8).toUpperCase()}&accountName=CONG%20TY%20VELORA`;

  // Handle Create Settlement
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

      // If no money exchange needed (even), finish
      if (balance === 0) {
        if (onSuccess) onSuccess(created);
        setTimeout(() => onClose(), 1500);
      } else {
        setStep(2); // Move to transaction verification
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo phiếu quyết toán.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Confirm Refund
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
      setTimeout(() => onClose(), 1800);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi khi xác nhận hoàn cọc.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Confirm Additional Payment
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
      setTimeout(() => onClose(), 1800);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi khi xác nhận thu phụ phí.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-zinc-950 border border-zinc-800 text-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-scaleUp">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CircleDollarSign size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Quyết Toán Hợp Đồng & Hoàn Tiền Cọc (US-23)
              </h3>
              <p className="text-xs text-zinc-400">
                Đơn #{rentalRequest.id.slice(0, 8).toUpperCase()} • {rentalRequest.carMake} {rentalRequest.carModel} ({rentalRequest.carLicensePlate})
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2">
              <AlertTriangle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {previewLoading ? (
            <div className="py-16 text-center text-zinc-400 space-y-3">
              <RefreshCw size={24} className="animate-spin mx-auto text-amber-400" />
              <p>Đang đối chiếu biên bản kiểm tra trả xe và tự động tính toán phụ phí...</p>
            </div>
          ) : step === 1 ? (
            <>
              {/* Financial Baseline Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div>
                  <span className="text-zinc-500 block">Tiền thuê hợp đồng:</span>
                  <span className="text-lg font-light text-white block">{formatCurrency(rentalFee)}</span>
                  <span className="text-zinc-400">Đã thanh toán lúc nhận xe</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Tiền đặt cọc đang giữ:</span>
                  <span className="text-lg font-semibold text-emerald-400 block">{formatCurrency(deposit)}</span>
                  <span className="text-zinc-400">Căn cứ để khấu trừ phụ phí</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Khách hàng nhận cọc:</span>
                  <span className="text-sm font-medium text-white block">{rentalRequest.customerName}</span>
                  <span className="text-zinc-400">{rentalRequest.customerPhone}</span>
                </div>
              </div>

              {/* Itemized Deductions Calculation Table */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2 text-sm">
                  <Receipt size={16} className="text-amber-400" />
                  Bảng Kê Chi Tiết Các Khoản Khấu Trừ Phụ Phí
                </h4>

                <div className="space-y-3 pt-2">
                  
                  {/* Row 1: Phí vượt KM */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Gauge size={14} className="text-amber-400" />
                        <span className="font-semibold text-zinc-200">1. Phụ phí vượt số kilomet</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        {preview?.excessKm > 0 
                          ? `Vượt ${preview.excessKm.toLocaleString()} km × ${formatCurrency(preview.extraKmRate)}/km` 
                          : 'Không vượt giới hạn kilomet'}
                      </p>
                    </div>
                    <div className="w-48 text-right">
                      <input
                        type="number"
                        value={extraKmFee}
                        onChange={(e) => setExtraKmFee(Number(e.target.value))}
                        className="w-full text-right bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-rose-400 font-semibold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Row 2: Phí trả xe trễ */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-blue-400" />
                        <span className="font-semibold text-zinc-200">2. Phụ phí hoàn trả xe trễ hạn</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        {preview?.lateHours > 1 
                          ? `Trễ ${preview.lateHours} giờ (Đơn giá: 100,000đ/giờ)` 
                          : 'Trả xe đúng giờ quy định'}
                      </p>
                    </div>
                    <div className="w-48 text-right">
                      <input
                        type="number"
                        value={lateReturnFee}
                        onChange={(e) => setLateReturnFee(Number(e.target.value))}
                        className="w-full text-right bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-rose-400 font-semibold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Row 3: Phí chênh lệch nhiên liệu */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Fuel size={14} className="text-amber-400" />
                        <span className="font-semibold text-zinc-200">3. Phí bù hao hụt nhiên liệu</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        {preview?.fuelDifference > 0 
                          ? `Thiếu hụt ${preview.fuelDifference}% so với lúc nhận (6,000đ/%)` 
                          : 'Mức nhiên liệu bằng hoặc nhiều hơn lúc nhận'}
                      </p>
                    </div>
                    <div className="w-48 text-right">
                      <input
                        type="number"
                        value={fuelFee}
                        onChange={(e) => setFuelFee(Number(e.target.value))}
                        className="w-full text-right bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-rose-400 font-semibold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Row 4: Phí bồi thường hư hỏng / sự cố */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <ShieldAlert size={14} className="text-rose-400" />
                        <span className="font-semibold text-zinc-200">4. Bồi thường hư hỏng mới & sự cố</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        {preview?.damageNotes || 'Không có hư hỏng hoặc sự cố phát sinh'}
                      </p>
                    </div>
                    <div className="w-48 text-right">
                      <input
                        type="number"
                        value={damageFee}
                        onChange={(e) => setDamageFee(Number(e.target.value))}
                        className="w-full text-right bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-rose-400 font-semibold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Row 5: Phí vệ sinh xe */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-zinc-200">5. Phí vệ sinh chuyên sâu (nếu xe bẩn / có mùi)</span>
                      <p className="text-[11px] text-zinc-400">Áp dụng nếu khoang lái bám mùi thuốc lá, hải sản hoặc bùn đất nặng</p>
                    </div>
                    <div className="w-48 text-right">
                      <input
                        type="number"
                        value={cleaningFee}
                        onChange={(e) => setCleaningFee(Number(e.target.value))}
                        placeholder="0"
                        className="w-full text-right bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-rose-400 font-semibold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Row 6: Phụ phí khác */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <div className="space-y-1 flex-1">
                      <span className="font-semibold text-zinc-200">6. Khoản phát sinh khác (Phí cầu đường, phạt nguội...)</span>
                      <input
                        type="text"
                        value={otherFeeNotes}
                        onChange={(e) => setOtherFeeNotes(e.target.value)}
                        placeholder="Nhập lý do chi tiết (nếu có)..."
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-white text-xs"
                      />
                    </div>
                    <div className="w-48 text-right">
                      <input
                        type="number"
                        value={otherFee}
                        onChange={(e) => setOtherFee(Number(e.target.value))}
                        placeholder="0"
                        className="w-full text-right bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-rose-400 font-semibold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* Settlement Summary Outcome Card */}
              <div className={`p-5 rounded-2xl border ${
                isRefund 
                  ? 'bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-zinc-950 border-emerald-500/40' 
                  : 'bg-gradient-to-r from-rose-950/40 via-zinc-950 to-zinc-950 border-rose-500/40'
              } space-y-4`}>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-zinc-400 block text-xs">Tổng phụ phí khấu trừ:</span>
                    <span className="text-xl font-light text-rose-400 block mt-0.5">
                      -{formatCurrency(totalDeductions)}
                    </span>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-zinc-400 block text-xs">
                      {isRefund ? 'SỐ TIỀN HOÀN TRẢ CỌC CHO KHÁCH:' : 'SỐ TIỀN KHÁCH HÀNG CẦN ĐÓNG THÊM:'}
                    </span>
                    <span className={`text-2xl font-bold block mt-0.5 ${
                      isRefund ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {formatCurrency(isRefund ? refundAmount : additionalDue)}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {isRefund 
                        ? 'Chuyển khoản VietQR trả lại tài khoản của khách' 
                        : 'Tổng chi phí phát sinh vượt quá hạn mức tiền cọc'}
                    </span>
                  </div>
                </div>

                {isRefund && (
                  <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-zinc-400 block mb-1">Ngân hàng thụ hưởng của khách</label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500"
                      >
                        {POPULAR_BANKS.map(b => (
                          <option key={b.shortName} value={b.shortName}>{b.shortName} - {b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-zinc-400 block mb-1">Số tài khoản nhận tiền cọc *</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-500"
                        placeholder="VD: 1029384756"
                      />
                    </div>

                    <div>
                      <label className="text-zinc-400 block mb-1">Tên chủ tài khoản *</label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-500 uppercase"
                        placeholder="NGUYEN VAN A"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* STEP 2: VIETQR EXECUTION SCREEN */
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                  {isRefund ? 'Xác Nhận Chuyển Khoản Hoàn Cọc' : 'Khách Quét Mã VietQR Đóng Bổ Sung'}
                </span>
                <h4 className="text-lg font-bold text-white mt-2">
                  {isRefund 
                    ? `Hoàn Tiền Cọc: ${formatCurrency(refundAmount)}` 
                    : `Thu Phụ Phí Bổ Sung: ${formatCurrency(additionalDue)}`}
                </h4>
                <p className="text-xs text-zinc-400">
                  Phiếu quyết toán #{settlementResult?.settlementNumber || 'QT-VELORA'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                
                {/* QR Code Canvas */}
                <div className="bg-white p-5 rounded-2xl flex flex-col items-center justify-center shadow-xl border border-zinc-200 text-black">
                  <img
                    src={isRefund ? vietQrRefundUrl : vietQrCompanyUrl}
                    alt="VietQR Settlement"
                    className="w-64 h-64 object-contain rounded-xl"
                  />
                  <div className="mt-3 text-center space-y-0.5">
                    <p className="text-xs font-bold text-zinc-900">
                      {isRefund ? `${selectedBank} • ${accountNumber}` : 'Vietcombank • 1029384756'}
                    </p>
                    <p className="text-[11px] font-semibold text-zinc-600 uppercase">
                      {isRefund ? accountName : 'CONG TY TNHH VELORA VIET NAM'}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-bold">
                      {formatCurrency(isRefund ? refundAmount : additionalDue)}
                    </p>
                  </div>
                </div>

                {/* Confirm Form */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Người thụ hưởng:</span>
                      <span className="text-white font-medium">{isRefund ? accountName : 'Công ty VELORA'}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Nội dung chuyển:</span>
                      <span className="text-amber-400 font-medium">
                        VELORA {isRefund ? 'HOAN COC' : 'PHU PHI'} {rentalRequest.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Trạng thái xe sau trả:</span>
                      <span className="text-emerald-400 font-medium">Sẵn sàng khai thác (READY)</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">Mã tham chiếu / Mã giao dịch ngân hàng *</label>
                    <input
                      type="text"
                      value={transactionCode}
                      onChange={(e) => setTransactionCode(e.target.value)}
                      placeholder="VD: FT26288123982390 hoặc MB88921"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">URL ảnh ủy nhiệm chi / biên lai chuyển khoản (tùy chọn)</label>
                    <input
                      type="text"
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      placeholder="https://imgur.com/receipt-proof.jpg"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">Ghi chú quyết toán</label>
                    <input
                      type="text"
                      value={staffNotes}
                      onChange={(e) => setStaffNotes(e.target.value)}
                      placeholder="Khách hàng hài lòng, đã nhận đủ cọc..."
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition text-xs"
          >
            Đóng
          </button>

          {step === 1 ? (
            <button
              type="button"
              disabled={loading || previewLoading}
              onClick={handleCreateSettlement}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-semibold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Đang tạo phiếu...' : 'Chốt Bảng Tính & Sang Chuyển Khoản'}</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs"
              >
                Quay lại bảng kê
              </button>

              {isRefund ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConfirmRefund}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  <span>{loading ? 'Đang xác nhận...' : 'Xác Nhận Đã Hoàn Cọc & Đóng Đơn'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConfirmAdditionalPayment}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  <span>{loading ? 'Đang xác nhận...' : 'Xác Nhận Đã Thu Phụ Phí & Đóng Đơn'}</span>
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SettlementModal;
