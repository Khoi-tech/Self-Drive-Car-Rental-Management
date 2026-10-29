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
  DollarSign,
  AlertCircle,
  Calendar,
  FileCheck,
  ChevronDown,
  ChevronUp
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

  // Existing Settlement if already settled
  const [existingSettlement, setExistingSettlement] = useState(null);
  const [showItemizedDetails, setShowItemizedDetails] = useState(false);
  const [forceRecreate, setForceRecreate] = useState(false);

  // Preview Data
  const [preview, setPreview] = useState(null);

  // Editable Adjustments for Creation Mode
  const [extraKmFee, setExtraKmFee] = useState(0);
  const [lateReturnFee, setLateReturnFee] = useState(0);
  const [fuelFee, setFuelFee] = useState(0);
  const [damageFee, setDamageFee] = useState(0);
  const [cleaningFee, setCleaningFee] = useState(0);
  const [otherFee, setOtherFee] = useState(0);
  const [otherFeeNotes, setOtherFeeNotes] = useState('');

  // Traffic Fine Hold Deposit State
  const [holdTrafficFine, setHoldTrafficFine] = useState(true);
  const [trafficFineHoldAmount, setTrafficFineHoldAmount] = useState(2000000);
  const [trafficFineRefundDays, setTrafficFineRefundDays] = useState(20);

  // Refund Bank Form (Round 1)
  const [selectedBank, setSelectedBank] = useState('VCB');
  const [accountNumber, setAccountNumber] = useState('0123456789');
  const [accountName, setAccountName] = useState('');
  const [transactionCode, setTransactionCode] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [staffNotes, setStaffNotes] = useState('');

  // Step for Creation: 1: Calculation & Review, 2: Payment/Refund Execution
  const [step, setStep] = useState(1);
  const [settlementResult, setSettlementResult] = useState(null);

  // Round 2 Traffic Fine Settlement Form State
  const [round2HasViolation, setRound2HasViolation] = useState(false);
  const [round2Deduction, setRound2Deduction] = useState(0);
  const [round2ViolationNotes, setRound2ViolationNotes] = useState('');
  const [round2ProofUrl, setRound2ProofUrl] = useState('');
  const [round2TransactionCode, setRound2TransactionCode] = useState('');
  const [round2StaffNotes, setRound2StaffNotes] = useState('');
  const [round2Loading, setRound2Loading] = useState(false);

  // Dispute Resolution Form State
  const [disputeAction, setDisputeAction] = useState('ACCEPT_REFUND');
  const [disputeAdjustedAmount, setDisputeAdjustedAmount] = useState(300000);
  const [disputeNotes, setDisputeNotes] = useState('');
  const [disputeTxnCode, setDisputeTxnCode] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);

  useEffect(() => {
    if (rentalRequest?.id && isOpen) {
      const loadData = async () => {
        try {
          setPreviewLoading(true);
          setError(null);
          setSuccessMsg(null);
          setForceRecreate(false);

          // 1. Try to load existing settlement
          let existing = null;
          try {
            const settleRes = await settlementService.getByRequestId(rentalRequest.id);
            existing = settleRes?.data || settleRes;
            if (existing && existing.id) {
              setExistingSettlement(existing);
              setSettlementResult(existing);
              if (existing.refundBankName) setSelectedBank(existing.refundBankName);
              if (existing.refundAccountNumber) setAccountNumber(existing.refundAccountNumber);
              if (existing.refundAccountName) setAccountName(existing.refundAccountName);
            } else {
              setExistingSettlement(null);
            }
          } catch {
            setExistingSettlement(null);
          }

          // 2. Load preview calculation
          try {
            const previewRes = await settlementService.preview(rentalRequest.id);
            const data = previewRes?.data || previewRes;
            setPreview(data);

            setExtraKmFee(data.extraKmFee || 0);
            setLateReturnFee(data.lateReturnFee || 0);
            setFuelFee(data.fuelFee || 0);
            setDamageFee(data.damageFee || 0);
            setCleaningFee(data.cleaningFee || 0);
            setOtherFee(data.otherFee || 0);
            setOtherFeeNotes(data.otherFeeNotes || '');

            if (!existing?.refundAccountName) {
              setAccountName(data.customerName || rentalRequest.customerName || '');
            }
          } catch (err) {
            console.error('Preview error:', err);
          }
        } catch (err) {
          console.error(err);
          setError('Không thể tải thông tin quyết toán.');
        } finally {
          setPreviewLoading(false);
        }
      };

      loadData();
    }
  }, [rentalRequest, isOpen]);

  if (!isOpen || !rentalRequest) return null;

  // Active settlement object if already completed
  const activeSettlement = existingSettlement || settlementResult;
  const isAlreadySettled = Boolean(activeSettlement?.id && (activeSettlement?.refundStatus === 'REFUNDED' || activeSettlement?.status === 'DISPUTED' || rentalRequest?.status === 'DISPUTED') && !forceRecreate);

  // Calculations for Creation / Preview
  const deposit = preview?.depositAmount ?? rentalRequest.depositAmount ?? 0;
  const rentalFee = preview?.rentalFee ?? rentalRequest.estimatedTotalFee ?? 0;

  const totalDeductions = Number(extraKmFee) + Number(lateReturnFee) + Number(fuelFee) + Number(damageFee) + Number(cleaningFee) + Number(otherFee);
  const balance = deposit - totalDeductions;
  const isRefund = balance >= 0;
  const refundAmount = isRefund ? balance : 0;
  const additionalDue = !isRefund ? Math.abs(balance) : 0;

  // Split refund into Immediate (Round 1) and Traffic Fine Hold (Round 2)
  const finalHoldAmount = (isRefund && holdTrafficFine) ? Math.min(refundAmount, Number(trafficFineHoldAmount) || 0) : 0;
  const immediateRefundAmount = Math.max(0, refundAmount - finalHoldAmount);

  // VietQR URLs
  const vietQrRefundUrl = `https://img.vietqr.io/image/${selectedBank}-${accountNumber}-compact2.png?amount=${immediateRefundAmount}&addInfo=VELORA%20HOAN%20COC%20${rentalRequest.id.slice(0, 8).toUpperCase()}&accountName=${encodeURIComponent(accountName)}`;
  const vietQrCompanyUrl = `https://img.vietqr.io/image/VCB-1029384756-compact2.png?amount=${additionalDue}&addInfo=VELORA%20PHU%20PHI%20${rentalRequest.id.slice(0, 8).toUpperCase()}&accountName=CONG%20TY%20VELORA`;

  // Round 2 VietQR Calculation
  const round2HoldAmount = activeSettlement?.trafficFineHoldAmount || 0;
  const round2ActualRefund = Math.max(0, round2HoldAmount - (round2HasViolation ? Number(round2Deduction) : 0));
  const round2Bank = activeSettlement?.refundBankName || selectedBank;
  const round2Account = activeSettlement?.refundAccountNumber || accountNumber;
  const round2Name = activeSettlement?.refundAccountName || accountName;
  const vietQrRound2Url = `https://img.vietqr.io/image/${round2Bank}-${round2Account}-compact2.png?amount=${round2ActualRefund}&addInfo=VELORA%20HOAN%20COC%20DOT2%20${rentalRequest.id.slice(0, 8).toUpperCase()}&accountName=${encodeURIComponent(round2Name)}`;

  const licensePlate = activeSettlement?.licensePlate || preview?.licensePlate || rentalRequest?.carLicensePlate || '';

  const extractErrorMessage = (err, defaultMsg) => {
    let msg = err.response?.data?.message || err.response?.data?.Message;
    if (!msg && err.response?.data?.errors) {
      msg = Object.entries(err.response.data.errors)
        .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`)
        .join('; ');
    }
    if (!msg && err.response?.data?.title) {
      msg = err.response.data.title;
    }
    return msg || err.message || defaultMsg;
  };

  // 1. Handle Create Settlement (Step 1 -> Step 2)
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
        trafficFineHoldAmount: finalHoldAmount,
        trafficFineRefundDate: finalHoldAmount > 0 ? new Date(Date.now() + Number(trafficFineRefundDays) * 86400000).toISOString() : null,
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
      setError(extractErrorMessage(err, 'Có lỗi xảy ra khi tạo phiếu quyết toán.'));
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Confirm Refund Round 1
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
      setExistingSettlement(updated);
      setSettlementResult(updated);

      setSuccessMsg('Đã hoàn tất hoàn cọc Đợt 1 thành công! Đơn thuê đã được cập nhật.');
      if (onSuccess) onSuccess(updated);
    } catch (err) {
      console.error(err);
      setError(extractErrorMessage(err, 'Có lỗi khi xác nhận hoàn cọc.'));
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Confirm Additional Payment
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
      setExistingSettlement(updated);
      setSettlementResult(updated);

      setSuccessMsg('Đã xác nhận thu phụ phí bổ sung thành công!');
      if (onSuccess) onSuccess(updated);
    } catch (err) {
      console.error(err);
      setError(extractErrorMessage(err, 'Có lỗi khi xác nhận thu phụ phí.'));
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Confirm Round 2 Traffic Fine Refund
  const handleConfirmRound2Refund = async () => {
    if (!activeSettlement?.id) return;
    try {
      setRound2Loading(true);
      setError(null);

      const deduction = round2HasViolation ? Number(round2Deduction) : 0;
      if (deduction > round2HoldAmount) {
        alert('Số tiền khấu trừ vi phạm không thể lớn hơn số tiền quỹ giữ cọc phạt nguội.');
        return;
      }

      const payload = {
        actualDeduction: deduction,
        violationNotes: round2HasViolation 
          ? (round2ViolationNotes || 'Vi phạm luật giao thông đường bộ ghi nhận từ Cổng CSGT') 
          : 'Đã đối soát cổng CSGT: Xe không có vi phạm phạt nguội trong thời gian thuê',
        violationProofUrl: round2ProofUrl,
        transactionCode: round2TransactionCode || `TXN-TRAFFIC-${Date.now().toString().slice(-6)}`,
        refundBankName: round2Bank,
        refundAccountNumber: round2Account,
        refundAccountName: round2Name,
        staffNotes: round2StaffNotes
      };

      const res = await settlementService.confirmTrafficFineRefund(activeSettlement.id, payload);
      const updated = res?.data || res;
      setExistingSettlement(updated);
      setSettlementResult(updated);
      setSuccessMsg('Đã quyết toán hoàn tất Quỹ cọc phạt nguội Đợt 2 thành công!');
      if (onSuccess) onSuccess(updated);
    } catch (err) {
      console.error(err);
      setError(extractErrorMessage(err, 'Có lỗi khi quyết toán cọc phạt nguội Đợt 2.'));
    } finally {
      setRound2Loading(false);
    }
  };

  // 5. Handle Resolve Customer Dispute (Admin / Staff)
  const handleResolveDispute = async () => {
    if (!activeSettlement?.id) return;
    if (!disputeNotes.trim()) {
      alert('Vui lòng nhập lý do / kết luận phân xử của quản trị viên.');
      return;
    }
    try {
      setDisputeLoading(true);
      setError(null);
      const payload = {
        resolutionAction: disputeAction,
        adjustedRefundAmount: (disputeAction === 'REJECT') ? 0 : Number(disputeAdjustedAmount),
        resolutionNotes: disputeNotes.trim(),
        transactionCode: disputeTxnCode || `TXN-DISPUTE-${Date.now().toString().slice(-6)}`
      };
      const res = await settlementService.resolveDispute(activeSettlement.id, payload);
      const updated = res?.data || res;
      setExistingSettlement(updated);
      setSettlementResult(updated);
      setSuccessMsg('Đã hoàn tất phân xử khiếu nại thành công! Đơn thuê đã được cập nhật.');
      if (onSuccess) onSuccess(updated);
    } catch (err) {
      console.error(err);
      setError(extractErrorMessage(err, 'Có lỗi khi phân xử khiếu nại.'));
    } finally {
      setDisputeLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans">
      <div className="bg-white border border-slate-200 text-zinc-950 rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-scaleUp">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center shadow-xs">
              <Receipt size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
                  {isAlreadySettled 
                    ? 'Hồ Sơ Quyết Toán & Đối Soát Hoàn Cọc 2 Đợt' 
                    : 'Phiếu Quyết Toán Tài Chính & Hoàn Cọc'}
                </h3>
                {activeSettlement?.settlementNumber && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    {activeSettlement.settlementNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Đơn #{rentalRequest.id.slice(0, 8).toUpperCase()} • Khách hàng: <strong className="text-zinc-800">{rentalRequest.customerName}</strong> ({rentalRequest.customerPhone}) • Xe: <strong className="text-zinc-800">{licensePlate}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.print()} 
              className="p-2 rounded-md text-slate-500 hover:text-zinc-950 hover:bg-slate-200 transition"
              title="In phiếu quyết toán"
            >
              <Printer size={16} />
            </button>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-md text-slate-400 hover:text-zinc-950 hover:bg-slate-200 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">

          {previewLoading ? (
            <div className="py-20 text-center text-slate-400 space-y-3">
              <RefreshCw size={24} className="animate-spin mx-auto text-blue-900" />
              <p>Đang đối soát và tính toán số liệu quyết toán...</p>
            </div>
          ) : isAlreadySettled ? (

            /* ======================================================== */
            /* MODE 2: QUẢN LÝ PHIẾU ĐÃ QUYẾT TOÁN & ĐỐI SOÁT 2 ĐỢT CỌC */
            /* ======================================================== */
            <div className="space-y-6">

              {/* Overview Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Tiền thuê hợp đồng</span>
                  <span className="text-base font-extrabold text-zinc-900 tabular-nums block mt-0.5">
                    {formatCurrency(activeSettlement.rentalFee)}
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Tiền cọc ban đầu</span>
                  <span className="text-base font-extrabold text-emerald-700 tabular-nums block mt-0.5">
                    {formatCurrency(activeSettlement.depositAmount)}
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Khấu trừ phụ phí</span>
                  <span className="text-base font-extrabold text-rose-600 tabular-nums block mt-0.5">
                    -{formatCurrency(activeSettlement.totalDeduction)}
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Tổng tiền hoàn trả</span>
                  <span className="text-base font-extrabold text-emerald-700 tabular-nums block mt-0.5">
                    {formatCurrency(activeSettlement.refundAmount)}
                  </span>
                </div>
              </div>

              {/* DISPUTE RESOLUTION PANEL (IF DISPUTED) */}
              {(activeSettlement?.status === 'DISPUTED' || rentalRequest?.status === 'DISPUTED') && (
                <div className="p-4 rounded-xl border border-rose-300 bg-rose-50/60 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-rose-200">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-rose-600 text-white">
                        <AlertTriangle size={16} />
                      </div>
                      <div>
                        <span className="font-bold text-rose-950 text-xs uppercase tracking-wider block">
                          Đơn Thuê Đang Có Khiếu Nại Quyết Toán Từ Khách Hàng
                        </span>
                        <p className="text-[11px] text-rose-800">
                          Khách hàng không đồng ý với một số khoản phí khấu trừ trong phiếu quyết toán ban đầu
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900 border border-rose-300">
                      CHỜ PHÂN XỬ
                    </span>
                  </div>

                  {/* Customer Dispute Reason Extracted */}
                  <div className="p-3 bg-white rounded-lg border border-rose-200 text-xs space-y-1">
                    <span className="font-bold text-slate-500 text-[10px] uppercase">Ý kiến khiếu nại của khách hàng:</span>
                    <p className="text-zinc-900 font-medium italic">
                      "{activeSettlement.staffNotes?.split('[KHIẾU NẠI KHÁCH HÀNG').pop()?.replace(/^[^\]]*\]:\s*/, '') || 'Khách hàng khiếu nại khoản phí khấu trừ không hợp lý.'}"
                    </p>
                  </div>

                  {/* Admin Resolution Form */}
                  <div className="space-y-3 bg-white p-4 rounded-lg border border-rose-200">
                    <label className="block font-bold text-zinc-900 text-xs">
                      Quyết định phân xử của Ban Quản Trị / Quản Lý:
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 text-xs transition ${
                        disputeAction === 'ACCEPT_REFUND' ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-bold ring-1 ring-emerald-500' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="disputeOpt"
                          checked={disputeAction === 'ACCEPT_REFUND'}
                          onChange={() => setDisputeAction('ACCEPT_REFUND')}
                          className="text-emerald-600 focus:ring-emerald-600"
                        />
                        <span>1. Chấp thuận khiếu nại (Hoàn lại tiền)</span>
                      </label>

                      <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 text-xs transition ${
                        disputeAction === 'COMPROMISE' ? 'border-amber-500 bg-amber-50/60 text-amber-950 font-bold ring-1 ring-amber-500' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="disputeOpt"
                          checked={disputeAction === 'COMPROMISE'}
                          onChange={() => setDisputeAction('COMPROMISE')}
                          className="text-amber-600 focus:ring-amber-600"
                        />
                        <span>2. Hòa giải thương lượng (Hoàn một phần)</span>
                      </label>

                      <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 text-xs transition ${
                        disputeAction === 'REJECT' ? 'border-rose-500 bg-rose-50/60 text-rose-950 font-bold ring-1 ring-rose-500' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="disputeOpt"
                          checked={disputeAction === 'REJECT'}
                          onChange={() => setDisputeAction('REJECT')}
                          className="text-rose-600 focus:ring-rose-600"
                        />
                        <span>3. Bác bỏ khiếu nại (Giữ nguyên)</span>
                      </label>
                    </div>

                    {/* Adjusted Amount & VietQR if 1 or 2 */}
                    {disputeAction !== 'REJECT' && (
                      <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-zinc-900 mb-1">
                              Số tiền hoàn bổ sung cho khách hàng:
                            </label>
                            <input
                              type="number"
                              step={50000}
                              value={disputeAdjustedAmount}
                              onChange={(e) => setDisputeAdjustedAmount(Math.max(0, Number(e.target.value)))}
                              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-right font-bold text-emerald-700 tabular-nums focus:outline-none focus:border-emerald-600"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-zinc-900 mb-1">
                              Mã GD chuyển tiền bổ sung (nếu đã chuyển):
                            </label>
                            <input
                              type="text"
                              value={disputeTxnCode}
                              onChange={(e) => setDisputeTxnCode(e.target.value)}
                              placeholder="VD: TXN-ADJ-998811"
                              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-zinc-950 focus:outline-none focus:border-emerald-600"
                            />
                          </div>
                        </div>

                        {disputeAdjustedAmount > 0 && (
                          <div className="p-2.5 rounded bg-white border border-slate-200 flex items-center gap-3">
                            <img
                              src={`https://img.vietqr.io/image/${round2Bank}-${round2Account}-compact2.png?amount=${disputeAdjustedAmount}&addInfo=VELORA%20HOAN%20KHIEU%20NAI%20${rentalRequest.id.slice(0, 8).toUpperCase()}&accountName=${encodeURIComponent(round2Name)}`}
                              alt="VietQR Dispute Refund"
                              className="w-20 h-20 object-contain shrink-0 border border-slate-200 rounded"
                            />
                            <div className="text-[11px] space-y-0.5">
                              <span className="font-bold text-emerald-700 block">Quét VietQR chuyển tiền hoàn thêm:</span>
                              <p>Chuyển khoản đến: <strong>{round2Bank}</strong> - STK: <strong className="font-mono">{round2Account}</strong> ({round2Name})</p>
                              <p className="text-slate-400 text-[10px]">Tiền hoàn thêm sẽ tự động cộng vào tổng số tiền hoàn cọc của đơn.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Resolution Notes */}
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-900 mb-1">
                        Kết luận phân xử & lý do gửi khách hàng:
                      </label>
                      <textarea
                        value={disputeNotes}
                        onChange={(e) => setDisputeNotes(e.target.value)}
                        placeholder="Nhập chi tiết căn cứ giải quyết (VD: Ban quản lý đã kiểm tra lại camera nghiệm thu và đồng ý miễn giảm phí vệ sinh...)"
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs text-zinc-900 focus:outline-none focus:border-blue-900 resize-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleResolveDispute}
                      disabled={disputeLoading}
                      className="w-full bg-rose-700 hover:bg-rose-800 disabled:bg-slate-400 text-white font-bold text-xs py-2.5 px-4 rounded-lg shadow-sm transition-colors uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {disputeLoading ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Đang cập nhật phân xử...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={15} />
                          <span>Xác Nhận Kết Luận Phân Xử & Đóng Khiếu Nại</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* 2-STAGE ESCROW ROADMAP */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-900" />
                  Tiến Trình Hoàn Trả Tiền Cọc 2 Đợt
                </h4>

                {/* STAGE 1: IMMEDIATE REFUND */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-emerald-200">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                        1
                      </span>
                      <div>
                        <span className="font-bold text-zinc-900 text-xs">
                          ĐỢT 1: Hoàn cọc tức thì ngay khi bàn giao xe
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Thực hiện qua chuyển khoản VietQR tự động
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 size={13} className="text-emerald-700" />
                        ĐÃ HOÀN TẤT QUA VIETQR
                      </span>
                      <span className="text-sm font-extrabold text-emerald-700 tabular-nums">
                        {formatCurrency(Math.max(0, activeSettlement.refundAmount - (activeSettlement.trafficFineHoldAmount || 0)))}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 bg-white/70 p-3 rounded-lg border border-emerald-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Tài khoản thụ hưởng:</span>
                      <strong className="text-zinc-800">{activeSettlement.refundAccountNumber}</strong> ({activeSettlement.refundBankName})
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Chủ tài khoản:</span>
                      <strong className="text-zinc-800 uppercase">{activeSettlement.refundAccountName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Mã GD & Thời gian:</span>
                      <span className="font-mono text-zinc-800 font-semibold">{activeSettlement.refundTransactionCode || 'N/A'}</span>
                      <span className="text-slate-400 block text-[10px]">{formatDateTime(activeSettlement.refundedAt || activeSettlement.settledAt)}</span>
                    </div>
                  </div>
                </div>

                {/* STAGE 2: TRAFFIC FINE ESCROW */}
                {activeSettlement.trafficFineHoldAmount > 0 && (
                  <div className={`p-4 rounded-xl border space-y-4 ${
                    activeSettlement.trafficFineRefundStatus === 'HOLDING'
                      ? 'border-indigo-200 bg-indigo-50/40'
                      : activeSettlement.trafficFineRefundStatus === 'REFUNDED'
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'border-amber-200 bg-amber-50/40'
                  }`}>
                    
                    {/* Stage 2 Header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-indigo-200">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full text-white flex items-center justify-center font-bold text-xs ${
                          activeSettlement.trafficFineRefundStatus === 'HOLDING' ? 'bg-indigo-600' : 'bg-emerald-600'
                        }`}>
                          2
                        </span>
                        <div>
                          <span className="font-bold text-zinc-900 text-xs">
                            ĐỢT 2: Quỹ giữ cọc Phạt nguội (15 - 30 ngày)
                          </span>
                          <p className="text-[11px] text-slate-500">
                            Thời hạn đối soát cổng CSGT đến ngày: <strong className="text-zinc-800">{formatDateTime(activeSettlement.trafficFineRefundDate)}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {activeSettlement.trafficFineRefundStatus === 'HOLDING' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300 flex items-center gap-1">
                            <Clock size={13} className="text-indigo-600" />
                            ĐANG GIỮ ĐỐI SOÁT CSGT
                          </span>
                        )}
                        {activeSettlement.trafficFineRefundStatus === 'REFUNDED' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 size={13} className="text-emerald-700" />
                            ĐÃ HOÀN CỌC 100% CHO KHÁCH
                          </span>
                        )}
                        {(activeSettlement.trafficFineRefundStatus === 'DEDUCTED' || activeSettlement.trafficFineRefundStatus === 'PARTIAL_REFUNDED') && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                            <AlertCircle size={13} className="text-amber-700" />
                            ĐÃ KHẤU TRỪ TIỀN PHẠT & HOÀN DƯ
                          </span>
                        )}
                        <span className="text-sm font-extrabold text-indigo-700 tabular-nums">
                          {formatCurrency(activeSettlement.trafficFineHoldAmount)}
                        </span>
                      </div>
                    </div>

                    {/* IF ALREADY COMPLETED (REFUNDED OR DEDUCTED) */}
                    {activeSettlement.trafficFineRefundStatus !== 'HOLDING' ? (
                      <div className="bg-white/90 p-4 rounded-lg border border-slate-200 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Quỹ cọc giữ ban đầu</span>
                            <span className="font-extrabold text-zinc-900 tabular-nums">
                              {formatCurrency(activeSettlement.trafficFineHoldAmount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Khấu trừ nộp phạt CSGT</span>
                            <span className="font-extrabold text-rose-600 tabular-nums">
                              -{formatCurrency(activeSettlement.trafficFineActualDeduction || 0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Tiền thực tế đã hoàn khách</span>
                            <span className="font-extrabold text-emerald-700 tabular-nums">
                              {formatCurrency(activeSettlement.trafficFineActualRefund || 0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Mã GD & Ngày chuyển</span>
                            <span className="font-mono text-zinc-900 font-bold block">
                              {activeSettlement.trafficFineTransactionCode || 'N/A'}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {formatDateTime(activeSettlement.trafficFineRefundedAt)}
                            </span>
                          </div>
                        </div>

                        {activeSettlement.trafficFineNotes && (
                          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
                            <strong>Ghi chú đối soát CSGT:</strong> {activeSettlement.trafficFineNotes}
                          </div>
                        )}
                      </div>
                    ) : (

                      /* IF STILL HOLDING: ACTION DASHBOARD FOR STAFF TO REFUND ROUND 2 */
                      <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xs space-y-4">
                        
                        {/* 1-Click CSGT Lookup Button */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                          <div>
                            <p className="font-bold text-indigo-950 text-xs">
                              Cổng Tra Cứu Phạt Nguội Quốc Gia (Cục CSGT)
                            </p>
                            <p className="text-[11px] text-indigo-900/80">
                              Kiểm tra lỗi vi phạm giao thông của xe <strong>{licensePlate}</strong> trong thời gian khách thuê xe
                            </p>
                          </div>
                          <a
                            href={`https://phatnguoi.vn/?bienso=${encodeURIComponent(licensePlate)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                          >
                            <ExternalLink size={13} />
                            <span>Tra Cứu Ngay ({licensePlate})</span>
                          </a>
                        </div>

                        {/* Round 2 Options */}
                        <div className="space-y-3">
                          <label className="block font-bold text-zinc-900 text-xs">
                            Kết quả đối soát trên hệ thống phạt nguội:
                          </label>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition ${
                              !round2HasViolation 
                                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-500' 
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}>
                              <input
                                type="radio"
                                name="violationCheck"
                                checked={!round2HasViolation}
                                onChange={() => {
                                  setRound2HasViolation(false);
                                  setRound2Deduction(0);
                                }}
                                className="mt-0.5 text-emerald-600 focus:ring-emerald-600"
                              />
                              <div>
                                <span className="font-bold text-xs block">Xe KHÔNG có phạt nguội</span>
                                <span className="text-[11px] text-slate-500 block mt-0.5">
                                  Hoàn lại 100% quỹ cọc giữ (<strong className="text-emerald-700">{formatCurrency(round2HoldAmount)}</strong>)
                                </span>
                              </div>
                            </label>

                            <label className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition ${
                              round2HasViolation 
                                ? 'border-amber-500 bg-amber-50/50 text-amber-950 ring-1 ring-amber-500' 
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}>
                              <input
                                type="radio"
                                name="violationCheck"
                                checked={round2HasViolation}
                                onChange={() => {
                                  setRound2HasViolation(true);
                                  setRound2Deduction(Math.min(round2HoldAmount, 1000000));
                                }}
                                className="mt-0.5 text-amber-600 focus:ring-amber-600"
                              />
                              <div>
                                <span className="font-bold text-xs block">Xe CÓ phát sinh phạt nguội</span>
                                <span className="text-[11px] text-slate-500 block mt-0.5">
                                  Khấu trừ tiền phạt nộp CSGT và hoàn lại phần dư
                                </span>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* If Violation: Enter Deduction & Reason */}
                        {round2HasViolation && (
                          <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-amber-950 mb-1">
                                  Số tiền phạt bị khấu trừ:
                                </label>
                                <input
                                  type="number"
                                  step={100000}
                                  value={round2Deduction}
                                  onChange={(e) => setRound2Deduction(Math.max(0, Number(e.target.value)))}
                                  className="w-full bg-white border border-amber-300 rounded px-2.5 py-1.5 text-right font-bold text-red-600 tabular-nums focus:outline-none focus:border-amber-600"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-amber-950 mb-1">
                                  Số tiền thực hoàn lại cho khách:
                                </label>
                                <div className="px-2.5 py-1.5 bg-white border border-amber-300 rounded font-bold text-emerald-700 text-sm text-right tabular-nums">
                                  {formatCurrency(round2ActualRefund)}
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-amber-950 mb-1">
                                Chi tiết lỗi vi phạm & ngày ghi nhận trên CSGT:
                              </label>
                              <input
                                type="text"
                                value={round2ViolationNotes}
                                onChange={(e) => setRound2ViolationNotes(e.target.value)}
                                placeholder="VD: Lỗi quá tốc độ 10-20km/h tại QL1A Đồng Nai, phạt 1.500.000đ"
                                className="w-full bg-white border border-amber-300 rounded px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-amber-600"
                              />
                            </div>
                          </div>
                        )}

                        {/* VietQR for Round 2 Execution */}
                        {round2ActualRefund > 0 ? (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                            <div className="p-2 bg-white rounded border border-slate-200 shadow-2xs shrink-0">
                              <img
                                src={vietQrRound2Url}
                                alt="VietQR Round 2"
                                className="w-36 h-36 object-contain"
                              />
                            </div>
                            <div className="flex-1 space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-zinc-900 text-xs">
                                  Mã VietQR Hoàn Cọc Đợt 2:
                                </span>
                                <span className="text-base font-extrabold text-emerald-700 tabular-nums">
                                  {formatCurrency(round2ActualRefund)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                Quét mã chuyển khoản trực tiếp vào tài khoản ngân hàng của khách hàng:
                              </p>
                              <div className="p-2 rounded bg-white border border-slate-200 text-[11px] space-y-0.5">
                                <p><strong>Ngân hàng:</strong> {round2Bank}</p>
                                <p><strong>Số tài khoản:</strong> <span className="font-mono font-bold text-zinc-900">{round2Account}</span></p>
                                <p><strong>Chủ tài khoản:</strong> <span className="uppercase font-semibold text-zinc-900">{round2Name}</span></p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                            Toàn bộ số tiền cọc phạt nguội (2.000.000đ) đã được khấu trừ để nộp phạt cho cơ quan CSGT. Khách hàng không nhận lại tiền hoàn đợt này.
                          </div>
                        )}

                        {/* Confirmation Input & Action Button */}
                        <div className="space-y-3 pt-2">
                          <div>
                            <label className="block text-[11px] font-bold text-zinc-900 mb-1">
                              Mã giao dịch ngân hàng chuyển tiền Đợt 2:
                            </label>
                            <input
                              type="text"
                              value={round2TransactionCode}
                              onChange={(e) => setRound2TransactionCode(e.target.value)}
                              placeholder="VD: FT2610237788 hoặc TXN-TRAFFIC-001"
                              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-zinc-950 focus:outline-none focus:border-indigo-600"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleConfirmRound2Refund}
                            disabled={round2Loading}
                            className="w-full bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-400 text-white font-bold text-xs py-3 px-4 rounded-lg shadow-sm transition-colors uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {round2Loading ? (
                              <>
                                <RefreshCw size={14} className="animate-spin" />
                                <span>Đang chốt quyết toán Đợt 2...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={16} />
                                <span>Xác Nhận Đã Chuyển Hoàn Cọc Đợt 2 & Kết Thúc</span>
                              </>
                            )}
                          </button>
                        </div>

                      </div>
                    )}

                  </div>
                )}
              </div>

              {/* Collapsible Itemized Inspection Data */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowItemizedDetails(!showItemizedDetails)}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-zinc-800 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <FileCheck size={14} className="text-slate-600" />
                    Xem Chi Tiết Biên Bản Nghiệm Thu & Các Khoản Khấu Trừ Phụ Phí
                  </span>
                  {showItemizedDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showItemizedDetails && (
                  <div className="p-4 space-y-3 bg-white border-t border-slate-200 divide-y divide-slate-100 text-xs">
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Phụ phí vượt số kilomet cho phép:</span>
                      <span className="font-bold text-zinc-900 tabular-nums">-{formatCurrency(activeSettlement.extraKmFee)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Phụ phí trả xe trễ hạn ({activeSettlement.lateHours} giờ):</span>
                      <span className="font-bold text-zinc-900 tabular-nums">-{formatCurrency(activeSettlement.lateReturnFee)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Phí bù hao hụt nhiên liệu:</span>
                      <span className="font-bold text-zinc-900 tabular-nums">-{formatCurrency(activeSettlement.fuelFee)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Phí bồi thường hư hỏng / sự cố:</span>
                      <span className="font-bold text-zinc-900 tabular-nums">-{formatCurrency(activeSettlement.damageFee)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Phí vệ sinh chuyên sâu khoang xe:</span>
                      <span className="font-bold text-zinc-900 tabular-nums">-{formatCurrency(activeSettlement.cleaningFee)}</span>
                    </div>
                    {activeSettlement.otherFee > 0 && (
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Phụ phí khác ({activeSettlement.otherFeeNotes || 'N/A'}):</span>
                        <span className="font-bold text-zinc-900 tabular-nums">-{formatCurrency(activeSettlement.otherFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-t border-slate-200 font-bold text-zinc-950">
                      <span>Tổng các khoản phụ phí đã khấu trừ:</span>
                      <span className="text-rose-600 tabular-nums">-{formatCurrency(activeSettlement.totalDeduction)}</span>
                    </div>
                  </div>
                )}
              </div>

            </div>

          ) : (

            /* ======================================================== */
            /* MODE 1: LẬP MỚI PHIẾU QUYẾT TOÁN & HOÀN CỌC ĐỢT 1        */
            /* ======================================================== */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* LEFT COLUMN: BẢNG TÍNH TOÁN & KHẤU TRỪ PHỤ PHÍ (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Contract & Deposit Info Bar */}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Tiền thuê xe hợp đồng:</span>
                    <span className="text-sm font-extrabold text-zinc-950 tabular-nums">
                      {formatCurrency(rentalFee)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Tiền đặt cọc ban đầu:</span>
                    <span className="text-sm font-extrabold text-emerald-700 tabular-nums">
                      {formatCurrency(deposit)}
                    </span>
                  </div>
                </div>

                {/* Sub-charges adjustment list */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <span className="font-bold text-zinc-950 uppercase tracking-wider text-xs">
                      Chi Tiết Khấu Trừ Theo Biên Bản Trả Xe
                    </span>
                    <span className="text-[11px] text-slate-500 italic">Có thể điều chỉnh thực tế</span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Extra Km */}
                    <div className="grid grid-cols-2 gap-2 items-center text-xs">
                      <div>
                        <span className="font-semibold text-zinc-900 block">Vượt km cho phép:</span>
                        <span className="text-[11px] text-slate-500">{preview?.excessKm || 0} km × 5.000 đ</span>
                      </div>
                      <input
                        type="number"
                        value={extraKmFee}
                        onChange={(e) => setExtraKmFee(Number(e.target.value))}
                        disabled={step === 2}
                        className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-right font-bold text-zinc-950 tabular-nums"
                      />
                    </div>

                    {/* Late return */}
                    <div className="grid grid-cols-2 gap-2 items-center text-xs">
                      <div>
                        <span className="font-semibold text-zinc-900 block">Trả xe trễ hạn:</span>
                        <span className="text-[11px] text-slate-500">{preview?.lateHours || 0} giờ trễ</span>
                      </div>
                      <input
                        type="number"
                        value={lateReturnFee}
                        onChange={(e) => setLateReturnFee(Number(e.target.value))}
                        disabled={step === 2}
                        className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-right font-bold text-zinc-950 tabular-nums"
                      />
                    </div>

                    {/* Fuel difference */}
                    <div className="grid grid-cols-2 gap-2 items-center text-xs">
                      <div>
                        <span className="font-semibold text-zinc-900 block">Bù hao hụt nhiên liệu:</span>
                        <span className="text-[11px] text-slate-500">Chênh lệch: {preview?.fuelDifference || 0}%</span>
                      </div>
                      <input
                        type="number"
                        value={fuelFee}
                        onChange={(e) => setFuelFee(Number(e.target.value))}
                        disabled={step === 2}
                        className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-right font-bold text-zinc-950 tabular-nums"
                      />
                    </div>

                    {/* Damage fee */}
                    <div className="grid grid-cols-2 gap-2 items-center text-xs">
                      <div>
                        <span className="font-semibold text-zinc-900 block">Sự cố & Hỏng hóc:</span>
                        <span className="text-[11px] text-slate-500 truncate block max-w-[200px]" title={preview?.damageNotes}>
                          {preview?.damageNotes || 'Không có hư hỏng ghi nhận'}
                        </span>
                      </div>
                      <input
                        type="number"
                        value={damageFee}
                        onChange={(e) => setDamageFee(Number(e.target.value))}
                        disabled={step === 2}
                        className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-right font-bold text-zinc-950 tabular-nums"
                      />
                    </div>

                    {/* Cleaning fee */}
                    <div className="grid grid-cols-2 gap-2 items-center text-xs">
                      <span className="text-slate-600">Vệ sinh khoang xe chuyên sâu:</span>
                      <input
                        type="number"
                        value={cleaningFee}
                        onChange={(e) => setCleaningFee(Number(e.target.value))}
                        disabled={step === 2}
                        className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-right font-bold text-zinc-950 tabular-nums"
                      />
                    </div>

                    {/* Other fee */}
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

                  {/* QUỸ GIỮ CỌC PHẠT NGUỘI & TRA CỨU CSGT */}
                  {isRefund && refundAmount > 0 && (
                    <div className="p-3.5 rounded-lg border border-indigo-200 bg-indigo-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-indigo-950 text-xs">
                          <input
                            type="checkbox"
                            checked={holdTrafficFine}
                            onChange={(e) => setHoldTrafficFine(e.target.checked)}
                            disabled={step === 2}
                            className="rounded border-indigo-300 text-indigo-900 focus:ring-indigo-900"
                          />
                          <span>Áp dụng Quỹ giữ cọc Phạt nguội (15 - 30 ngày)</span>
                        </label>

                        {/* Link tra cứu CSGT */}
                        <a
                          href={`https://phatnguoi.vn/?bienso=${encodeURIComponent(licensePlate)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded bg-white border border-indigo-200 text-indigo-700 hover:text-indigo-900 font-semibold text-[11px] flex items-center gap-1 shadow-2xs hover:bg-indigo-50 transition"
                          title="Mở cổng tra cứu phạt nguội phương tiện"
                        >
                          <ExternalLink size={12} />
                          <span>Tra cứu phạt nguội ({licensePlate})</span>
                        </a>
                      </div>

                      {holdTrafficFine && (
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-indigo-100 text-xs">
                          <div>
                            <span className="text-indigo-900/80 block text-[11px] font-medium mb-1">Số tiền giữ cọc phạt nguội:</span>
                            <input
                              type="number"
                              step={500000}
                              value={trafficFineHoldAmount}
                              onChange={(e) => setTrafficFineHoldAmount(Math.max(0, Number(e.target.value)))}
                              disabled={step === 2}
                              className="w-full bg-white border border-indigo-300 rounded px-2.5 py-1 text-right font-bold text-indigo-950 tabular-nums"
                            />
                          </div>

                          <div>
                            <span className="text-indigo-900/80 block text-[11px] font-medium mb-1">Thời hạn đối soát phạt nguội:</span>
                            <select
                              value={trafficFineRefundDays}
                              onChange={(e) => setTrafficFineRefundDays(Number(e.target.value))}
                              disabled={step === 2}
                              className="w-full bg-white border border-indigo-300 rounded px-2 py-1 text-xs font-semibold text-indigo-950"
                            >
                              <option value={15}>15 ngày sau (Hoàn trả {new Date(Date.now() + 15 * 86400000).toLocaleDateString('vi-VN')})</option>
                              <option value={20}>20 ngày sau (Hoàn trả {new Date(Date.now() + 20 * 86400000).toLocaleDateString('vi-VN')})</option>
                              <option value={30}>30 ngày sau (Hoàn trả {new Date(Date.now() + 30 * 86400000).toLocaleDateString('vi-VN')})</option>
                            </select>
                          </div>

                          <div className="col-span-2 p-2 rounded bg-white/80 border border-indigo-200 text-[11px] text-indigo-900 flex justify-between items-center">
                            <span>Hoàn ngay Đợt 1 (VietQR): <strong className="text-emerald-700">{formatCurrency(immediateRefundAmount)}</strong></span>
                            <span>Giữ Đợt 2 (Phạt nguội): <strong className="text-indigo-700">{formatCurrency(finalHoldAmount)}</strong></span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* KẾT QUẢ QUYẾT TOÁN CUỐI CÙNG */}
                  <div className={`p-4 rounded-md border text-center space-y-1 ${
                    isRefund 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}>
                    <div className="text-[11px] uppercase font-bold tracking-wider">
                      {isRefund 
                        ? (holdTrafficFine && finalHoldAmount > 0 
                            ? 'SỐ TIỀN HOÀN CỌC ĐỢT 1 NGAY HÔM NAY (VIETQR):' 
                            : 'SỐ TIỀN HOÀN TRẢ KHÁCH HÀNG (REFUND):')
                        : 'SỐ TIỀN KHÁCH CẦN ĐÓNG THÊM (ADDITIONAL PAYMENT):'}
                    </div>
                    <div className={`text-2xl font-extrabold tabular-nums ${isRefund ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {formatCurrency(isRefund ? immediateRefundAmount : additionalDue)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {isRefund 
                        ? (holdTrafficFine && finalHoldAmount > 0
                            ? `Đã giữ lại ${formatCurrency(finalHoldAmount)} quỹ cọc phạt nguội (sẽ hoàn ngày ${new Date(Date.now() + Number(trafficFineRefundDays) * 86400000).toLocaleDateString('vi-VN')})`
                            : 'Chuyển khoản hoàn cọc cho khách qua mã VietQR bên phải')
                        : 'Khách hàng quét mã VietQR bên phải để thanh toán bổ sung'}
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-semibold transition"
            >
              Đóng
            </button>
            {isAlreadySettled && (
              <button
                type="button"
                onClick={() => setForceRecreate(true)}
                className="px-3 py-2 text-slate-500 hover:text-rose-600 text-xs font-medium transition"
              >
                Lập lại phiếu quyết toán mới
              </button>
            )}
          </div>
          <div className="text-[11px] text-slate-500">
            Hệ thống hỗ trợ quản lý trọn vẹn <strong className="text-zinc-950 font-bold">2 Đợt Hoàn Cọc</strong> theo quy chuẩn đối soát CSGT.
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettlementModal;
