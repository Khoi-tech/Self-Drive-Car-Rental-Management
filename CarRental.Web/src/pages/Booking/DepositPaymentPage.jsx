import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  Copy, 
  QrCode, 
  ShieldCheck, 
  Car, 
  Calendar, 
  MapPin, 
  FileText, 
  AlertCircle, 
  ArrowRight,
  ExternalLink,
  Sparkles,
  Zap
} from 'lucide-react';
import paymentService from '../../services/paymentService';
import rentalRequestService from '../../services/rentalRequestService';
import Navbar from '../../components/layout/Navbar';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const DepositPaymentPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [paymentData, setPaymentData] = useState(null);
  const [requestDetails, setRequestDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Copy notification
  const [copiedField, setCopiedField] = useState(null);

  // Confirmation state
  const [confirming, setConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const initPayment = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch request details
        const reqRes = await rentalRequestService.getRequestById(requestId);
        const reqObj = reqRes?.data || reqRes;
        setRequestDetails(reqObj);

        // 2. Initialize or get deposit payment
        const payRes = await paymentService.createDepositPayment({
          rentalRequestId: requestId,
          paymentMethod: 'VIETQR'
        });
        const payObj = payRes?.data || payRes;
        setPaymentData(payObj);

        if (payObj?.status === 'SUCCESS' || reqObj?.status === 'CONFIRMED') {
          setIsSuccess(true);
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Không thể tạo phiên giao dịch thanh toán.');
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      initPayment();
    }
  }, [requestId]);

  // Copy to clipboard helper
  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Instant sandbox confirmation
  const handleConfirmSandbox = async () => {
    if (!paymentData?.transactionCode) return;

    try {
      setConfirming(true);
      const res = await paymentService.confirmPayment(paymentData.transactionCode);
      setPaymentData(res?.data || res);
      setIsSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xác nhận thanh toán.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-zinc-400">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span>Đang tạo cổng thanh toán VietQR...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-950/60 border border-rose-800 text-rose-400 mx-auto flex items-center justify-center mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">Không Thể Thanh Toán</h2>
          <p className="text-zinc-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/cars')}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition"
          >
            Quay lại danh mục xe
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        
        {/* Stepper Header */}
        <div className="mb-8 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 size={16} />
              <span>1. Gửi yêu cầu</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 size={16} />
              <span>2. Duyệt hồ sơ</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 size={16} />
              <span>3. Ký hợp đồng</span>
            </div>
            <div className={`flex items-center gap-2 font-semibold ${isSuccess ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isSuccess ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] border border-amber-500/40">4</div>}
              <span>4. Đặt cọc VietQR</span>
            </div>
          </div>
        </div>

        {/* ================= SUCCESS STATE ================= */}
        {isSuccess ? (
          <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-emerald-500/40 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-2xl space-y-6 animate-scaleUp">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={44} />
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                GIAO DỊCH THÀNH CÔNG
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
                Xác Nhận Đặt Cọc Thành Công!
              </h2>
              <p className="text-zinc-400 text-sm mt-2 max-w-lg mx-auto">
                Chúc mừng bạn! Khoản tiền cọc đã được ghi nhận. Xe <strong className="text-white">{requestDetails?.carMake} {requestDetails?.carModel} ({requestDetails?.carLicensePlate})</strong> đã được giữ chỗ an toàn trên hệ thống VELORA.
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 text-left text-xs space-y-2.5 max-w-md mx-auto">
              <div className="flex justify-between pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Mã giao dịch:</span>
                <span className="font-mono text-white font-semibold">{paymentData.transactionCode}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Số tiền cọc:</span>
                <span className="font-bold text-emerald-400 text-sm">{formatCurrency(paymentData.amount)}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Thời gian nhận xe:</span>
                <span className="text-zinc-200">{formatDateTime(requestDetails?.startTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Trạng thái đơn:</span>
                <span className="text-emerald-400 font-semibold uppercase">ĐÃ XÁC NHẬN (CONFIRMED)</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                to={`/contracts/sign/${requestId}`}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
              >
                <FileText size={16} />
                <span>Xem hợp đồng điện tử</span>
              </Link>

              <Link
                to="/cars"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <span>Về trang khám phá xe</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : (
          /* ================= PAYMENT FLOW ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: VietQR Code Card */}
            <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <QrCode className="text-emerald-400" size={24} />
                    Quét Mã VietQR Chuyển Khoản
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Sử dụng ứng dụng ngân hàng bất kỳ để quét mã QR và thanh toán tức thì
                  </p>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>NAPAS 247</span>
                </div>
              </div>

              {/* QR Image Frame */}
              <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border-4 border-zinc-800 shadow-inner">
                <div className="relative group">
                  <img
                    src={paymentData.qrCodeUrl}
                    alt="VietQR Deposit"
                    className="w-64 h-64 object-contain rounded-lg"
                  />
                </div>
                <div className="mt-3 text-center">
                  <p className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    {paymentData.bankName}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Hỗ trợ quét tự động điền số tiền và nội dung chuyển khoản
                  </p>
                </div>
              </div>

              {/* Bank Account Details Grid */}
              <div className="space-y-3 bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800 text-xs">
                
                {/* Bank Name */}
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Ngân hàng:</span>
                  <span className="font-semibold text-white">{paymentData.bankName}</span>
                </div>

                {/* Account Number */}
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Số tài khoản:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">{paymentData.accountNumber}</span>
                    <button
                      onClick={() => handleCopy(paymentData.accountNumber, 'acc')}
                      className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                      title="Sao chép"
                    >
                      <Copy size={13} />
                    </button>
                    {copiedField === 'acc' && <span className="text-[10px] text-emerald-400 font-medium">Đã chép!</span>}
                  </div>
                </div>

                {/* Account Name */}
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Chủ tài khoản:</span>
                  <span className="font-bold text-zinc-200">{paymentData.accountName}</span>
                </div>

                {/* Amount */}
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Số tiền đặt cọc:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-emerald-400 text-base">{formatCurrency(paymentData.amount)}</span>
                    <button
                      onClick={() => handleCopy(paymentData.amount.toString(), 'amt')}
                      className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                      title="Sao chép"
                    >
                      <Copy size={13} />
                    </button>
                    {copiedField === 'amt' && <span className="text-[10px] text-emerald-400 font-medium">Đã chép!</span>}
                  </div>
                </div>

                {/* Memo */}
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-zinc-400">Nội dung chuyển:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400 text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {paymentData.transferContent}
                    </span>
                    <button
                      onClick={() => handleCopy(paymentData.transferContent, 'memo')}
                      className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                      title="Sao chép"
                    >
                      <Copy size={13} />
                    </button>
                    {copiedField === 'memo' && <span className="text-[10px] text-emerald-400 font-medium">Đã chép!</span>}
                  </div>
                </div>

              </div>

            </div>

            {/* Right Column: Order Summary & Instant Sandbox Confirmation */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Order Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Car size={16} className="text-amber-400" />
                  Thông Tin Xe Thuê
                </h3>

                {requestDetails && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                      {requestDetails.carImageUrl ? (
                        <img
                          src={requestDetails.carImageUrl}
                          alt={requestDetails.carModel}
                          className="w-16 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500">
                          <Car size={20} />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-white text-sm">{requestDetails.carMake} {requestDetails.carModel}</h4>
                        <p className="text-xs font-mono text-zinc-400 mt-0.5">Biển số: {requestDetails.carLicensePlate}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-zinc-300">
                      <div className="flex justify-between py-1 border-b border-zinc-800">
                        <span className="text-zinc-500">Thời gian nhận:</span>
                        <span>{formatDateTime(requestDetails.startTime)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-800">
                        <span className="text-zinc-500">Thời gian trả:</span>
                        <span>{formatDateTime(requestDetails.endTime)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-800">
                        <span className="text-zinc-500">Tổng ngày thuê:</span>
                        <span className="font-bold text-white">{requestDetails.totalDays} ngày</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-800">
                        <span className="text-zinc-500">Địa điểm giao xe:</span>
                        <span className="truncate max-w-[180px] text-right">{requestDetails.pickupLocation}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-zinc-500">Tổng tiền thuê (ước tính):</span>
                        <span className="text-zinc-200">{formatCurrency(requestDetails.estimatedTotalFee)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Deposit Policy Notice */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-xs text-zinc-400 space-y-2">
                <div className="flex items-center gap-2 text-zinc-200 font-semibold">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  Chính sách bảo toàn tiền cọc:
                </div>
                <p>
                  Khoản tiền cọc này sẽ được hoàn trả 100% về tài khoản của bạn ngay khi hoàn tất kiểm tra biên bản hoàn trả xe và đối soát không phát sinh vi phạm.
                </p>
              </div>

              {/* Instant Sandbox Pay Button (For Grading & Demo) */}
              <div className="bg-gradient-to-br from-emerald-950/40 to-zinc-900 border border-emerald-500/40 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Chế Độ Demo & Chấm Điểm Đồ Án</h4>
                    <p className="text-[11px] text-zinc-400">Mô phỏng ngân hàng gửi webhook xác nhận thanh toán thành công</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmSandbox}
                  disabled={confirming}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-extrabold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {confirming ? (
                    'Đang kết nối cổng ngân hàng...'
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Xác nhận thanh toán ngay (Instant Pay)</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
};

export default DepositPaymentPage;
