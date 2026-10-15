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
  Zap,
  ArrowLeft
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

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-slate-300 border-t-blue-900 rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500">Đang khởi tạo cổng thanh toán VietQR...</span>
        </div>
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-slate-50 text-zinc-950 flex flex-col font-sans">
        <Navbar isVisible={true} />
        <div className="flex-1 max-w-md mx-auto px-4 py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 text-red-600 mx-auto flex items-center justify-center mb-4">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-lg font-bold mb-2">Không Thể Thanh Toán</h2>
          <p className="text-slate-500 text-xs mb-6">{error}</p>
          <button
            onClick={() => navigate('/cars')}
            className="px-4 py-2 bg-slate-900 hover:bg-blue-900 text-white rounded-md text-xs font-semibold transition"
          >
            Quay lại danh mục xe
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-950 flex flex-col font-sans">
      <Navbar isVisible={true} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-24 pb-16">
        
        {/* Navigation */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-900 transition"
          >
            <ArrowLeft size={14} /> Quay lại
          </button>
        </div>

        {/* Stepper Header */}
        <div className="mb-6 bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle2 size={16} />
              <span>1. Gửi đơn thuê</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle2 size={16} />
              <span>2. Thẩm định hồ sơ</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle2 size={16} />
              <span>3. Ký hợp đồng</span>
            </div>
            <div className={`flex items-center gap-2 font-bold ${isSuccess ? 'text-emerald-700' : 'text-blue-900'}`}>
              <div className="w-4 h-4 rounded-full bg-blue-900 text-white flex items-center justify-center text-[10px]">4</div>
              <span>4. Đặt cọc VietQR</span>
            </div>
          </div>
        </div>

        {/* SUCCESS STATE */}
        {isSuccess ? (
          <div className="bg-white border border-emerald-200 rounded-lg p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Giao Dịch Đã Xác Nhận Thành Công
              </span>
              <h2 className="text-2xl font-extrabold text-zinc-950 mt-3 mb-2">
                Hoàn Tất Đặt Cọc Giữ Xe!
              </h2>
              <p className="text-slate-600 text-xs max-w-md mx-auto">
                Hệ thống VELORA đã ghi nhận tiền cọc cho xe <strong className="text-zinc-950">{requestDetails?.carMake} {requestDetails?.carModel} ({requestDetails?.carLicensePlate})</strong>. Đơn thuê đã chính thức chuyển sang trạng thái <strong>CONFIRMED</strong>.
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Mã giao dịch:</span>
                <span className="font-mono text-zinc-950 font-bold">{paymentData.transactionCode}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Số tiền cọc:</span>
                <span className="font-extrabold text-blue-900 tabular-nums">{formatCurrency(paymentData.amount)}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Thời gian nhận xe:</span>
                <span className="text-zinc-900 font-semibold tabular-nums">{formatDateTime(requestDetails?.startTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="badge-rented">CONFIRMED (Đã giữ chỗ)</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to={`/contracts/sign/${requestId}`}
                className="w-full sm:w-auto px-5 py-2.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-2"
              >
                <FileText size={14} />
                <span>Xem hợp đồng đã ký</span>
              </Link>

              <Link
                to="/profile"
                className="w-full sm:w-auto px-5 py-2.5 rounded-md bg-slate-900 hover:bg-blue-900 text-white text-xs font-bold transition flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <span>Xem đơn trong hồ sơ cá nhân</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          /* PAYMENT FLOW - 2 COLUMNS */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: VietQR Terminal (7 Cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-6 shadow-sm">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                    <QrCode className="text-blue-900" size={20} />
                    Cổng Thanh Toán VietQR Chuẩn Ngân Hàng
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mở ứng dụng ngân hàng bất kỳ để quét mã chuyển tiền tức thì
                  </p>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-bold">
                  <span>NAPAS 24/7</span>
                </div>
              </div>

              {/* QR Image Box */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-lg border border-slate-200">
                <div className="p-3 bg-white rounded-md border border-slate-200 shadow-xs">
                  <img
                    src={paymentData.qrCodeUrl}
                    alt="VietQR Deposit"
                    className="w-56 h-56 object-contain"
                  />
                </div>
                <div className="mt-3 text-center">
                  <div className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
                    {paymentData.bankName}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Mã QR tự động điền đúng số tiền và nội dung chuyển khoản
                  </div>
                </div>
              </div>

              {/* Account Details Table */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-md border border-slate-200 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
                  <span className="font-bold text-zinc-950">{paymentData.bankName}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Số tài khoản:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-zinc-950 tabular-nums">{paymentData.accountNumber}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(paymentData.accountNumber, 'acc')}
                      className="p-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 transition"
                      title="Sao chép"
                    >
                      <Copy size={12} />
                    </button>
                    {copiedField === 'acc' && <span className="text-[10px] text-emerald-600 font-bold">Đã chép!</span>}
                  </div>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Chủ tài khoản:</span>
                  <span className="font-bold text-zinc-950">{paymentData.accountName}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Số tiền đặt cọc:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-blue-900 text-sm tabular-nums">{formatCurrency(paymentData.amount)}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(paymentData.amount.toString(), 'amt')}
                      className="p-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 transition"
                      title="Sao chép"
                    >
                      <Copy size={12} />
                    </button>
                    {copiedField === 'amt' && <span className="text-[10px] text-emerald-600 font-bold">Đã chép!</span>}
                  </div>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Nội dung chuyển khoản:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-950 text-xs bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                      {paymentData.transferContent}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(paymentData.transferContent, 'memo')}
                      className="p-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 transition"
                      title="Sao chép"
                    >
                      <Copy size={12} />
                    </button>
                    {copiedField === 'memo' && <span className="text-[10px] text-emerald-600 font-bold">Đã chép!</span>}
                  </div>
                </div>
              </div>

              {/* Instant Confirmation Action (Sandbox / Real-time Webhook Simulator) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConfirmSandbox}
                  disabled={confirming}
                  className="w-full bg-slate-900 hover:bg-blue-900 disabled:bg-slate-400 text-white font-bold text-xs py-3 px-4 rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
                >
                  {confirming ? (
                    <span>Đang kiểm tra giao dịch liên ngân hàng...</span>
                  ) : (
                    <>
                      <Zap size={14} className="text-amber-400" />
                      <span>Tôi đã hoàn tất chuyển tiền (Xác nhận ngay)</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Right Column: Order Summary (5 Cols) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6 space-y-5 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Car className="w-4 h-4 text-blue-900" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950">
                  Thông tin chuyến đi
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-slate-500 text-[11px]">Dòng xe:</div>
                  <div className="font-bold text-zinc-950 text-sm">
                    {requestDetails?.carMake} {requestDetails?.carModel}
                  </div>
                  <div className="license-plate text-[10px] mt-1">{requestDetails?.carLicensePlate}</div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="text-slate-500 text-[11px]">Khách hàng:</div>
                  <div className="font-semibold text-zinc-950">{requestDetails?.customerName}</div>
                  <div className="text-slate-500">{requestDetails?.customerPhone}</div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="text-slate-500 text-[11px]">Lịch trình:</div>
                  <div className="text-zinc-950 tabular-nums">Nhận: {formatDateTime(requestDetails?.startTime)}</div>
                  <div className="text-zinc-950 tabular-nums">Trả: {formatDateTime(requestDetails?.endTime)}</div>
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tiền thuê xe:</span>
                    <span className="tabular-nums font-semibold text-zinc-950">{formatCurrency(requestDetails?.totalEstimatedFee)}</span>
                  </div>
                  <div className="flex justify-between text-blue-900 font-bold">
                    <span>Khoản cọc cần thanh toán:</span>
                    <span className="tabular-nums text-base">{formatCurrency(paymentData.amount)}</span>
                  </div>
                </div>
              </div>

              {/* Deposit Refund Guarantee Callout */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-md text-[11px] text-blue-950 leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-900" />
                  <span>Cam kết hoàn cọc minh bạch:</span>
                </div>
                <p className="text-slate-600">
                  Tiền cọc của bạn được giữ an toàn trên tài khoản thanh toán chuyên dụng. Khi hoàn trả phương tiện, hệ thống tự động sinh lệnh VietQR hoàn tiền ngược lại vào tài khoản ngân hàng của bạn chỉ trong 30 giây.
                </p>
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
};

export default DepositPaymentPage;
