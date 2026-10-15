import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Printer, 
  ArrowRight, 
  AlertCircle, 
  Car, 
  Calendar, 
  MapPin, 
  User, 
  DollarSign,
  ArrowLeft,
  PenTool,
  Lock,
  Download
} from 'lucide-react';
import contractService from '../../services/contractService';
import Navbar from '../../components/layout/Navbar';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const ContractSignPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Signing state
  const [signatureName, setSignatureName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signSuccess, setSignSuccess] = useState(false);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await contractService.getContractByRequestId(requestId);
        const contractObj = res?.data || res;
        setContract(contractObj);
        if (contractObj?.customerName) {
          setSignatureName(contractObj.customerName);
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Không thể tải thông tin hợp đồng. Vui lòng thử lại!');
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      fetchContract();
    }
  }, [requestId]);

  const handleSign = async (e) => {
    e.preventDefault();
    if (!agreeTerms) {
      alert('Vui lòng tích chọn đồng ý với các điều khoản của hợp đồng trước khi ký.');
      return;
    }
    if (!signatureName.trim()) {
      alert('Vui lòng nhập họ và tên của bạn để xác nhận chữ ký điện tử.');
      return;
    }

    try {
      setSigning(true);
      const res = await contractService.signContract(contract.id, {
        signature: signatureName.trim(),
        agreeTerms: true
      });
      setContract(res?.data || res);
      setSignSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi ký hợp đồng điện tử.');
    } finally {
      setSigning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-slate-300 border-t-blue-900 rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500">Đang chuẩn bị văn bản hợp đồng điện tử...</span>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-slate-50 text-zinc-950 flex flex-col font-sans">
        <Navbar isVisible={true} />
        <div className="flex-1 max-w-xl mx-auto px-4 py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 text-red-600 mx-auto flex items-center justify-center mb-4">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-lg font-bold mb-2">Chưa Thể Khởi Tạo Hợp Đồng</h2>
          <p className="text-slate-500 text-xs mb-6">{error}</p>
          <button
            onClick={() => navigate('/cars')}
            className="px-4 py-2 bg-slate-900 hover:bg-blue-900 text-white rounded-md text-xs font-semibold transition"
          >
            Quay lại danh sách xe
          </button>
        </div>
      </div>
    );
  }

  const isSigned = contract.status === 'SIGNED' || contract.status === 'DEPOSIT_PAID';
  const isDepositPaid = contract.status === 'DEPOSIT_PAID';

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-950 flex flex-col font-sans">
      <Navbar isVisible={true} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-24 pb-16">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-900 transition"
          >
            <ArrowLeft size={14} /> Quay lại
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-700 hover:text-zinc-950 text-xs font-semibold shadow-xs transition"
          >
            <Printer size={14} /> In hợp đồng
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="mb-6 bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle2 size={16} />
              <span>1. Gửi đơn thuê xe</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle2 size={16} />
              <span>2. Thẩm định hồ sơ</span>
            </div>
            <div className={`flex items-center gap-2 font-bold ${isSigned ? 'text-emerald-700' : 'text-blue-900'}`}>
              <div className="w-4 h-4 rounded-full bg-blue-900 text-white flex items-center justify-center text-[10px]">3</div>
              <span>3. Ký hợp đồng số</span>
            </div>
            <div className={`flex items-center gap-2 ${isDepositPaid ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
              <Clock size={16} />
              <span>4. Thanh toán cọc</span>
            </div>
          </div>
        </div>

        {/* PAPER CONTRACT SHEET */}
        <div className="bg-white border border-slate-300 rounded-lg shadow-sm p-6 sm:p-12 space-y-8 font-serif text-slate-900">
          
          {/* Official Document Header */}
          <div className="text-center space-y-1 pb-6 border-b border-slate-200">
            <div className="text-xs uppercase font-bold tracking-widest text-slate-600">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </div>
            <div className="text-xs font-bold text-slate-700 italic">
              Độc lập – Tự do – Hạnh phúc
            </div>
            <div className="text-slate-300 text-xs">━━━━━━━━━━━</div>
            <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-zinc-950 pt-2 font-sans">
              HỢP ĐỒNG CHO THUÊ PHƯƠNG TIỆN TỰ LÁI
            </h1>
            <div className="text-xs text-slate-500 font-mono">
              Mã số hợp đồng: <strong className="text-zinc-950 tabular-nums">{contract.contractNumber || `VELORA-HD-${contract.id?.substring(0, 8)}`}</strong>
            </div>
          </div>

          {/* Legal Body */}
          <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-justify">
            <p>
              Hôm nay, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}, tại văn phòng đại diện Hệ thống Quản trị Cho thuê Xe Tự lái <strong>VELORA</strong>, hai bên tiến hành xác lập hợp đồng điện tử với các điều khoản sau:
            </p>

            {/* Parties Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-md border border-slate-200 font-sans text-xs">
              <div className="space-y-1.5">
                <div className="font-bold text-zinc-950 uppercase border-b border-slate-200 pb-1">BÊN CHO THUÊ (BÊN A):</div>
                <div><strong>CÔNG TY TNHH DỊCH VỤ VẬN TẢI VELORA</strong></div>
                <div>Đại diện: Ban Điều hành Hệ thống VELORA</div>
                <div>Trụ sở: Tòa nhà VELORA, Tân Bình, TP. Hồ Chí Minh</div>
                <div>Hotline CSKH: 1900 8888 99</div>
              </div>
              <div className="space-y-1.5">
                <div className="font-bold text-zinc-950 uppercase border-b border-slate-200 pb-1">BÊN THUÊ XE (BÊN B):</div>
                <div>Họ và tên: <strong className="uppercase text-zinc-950">{contract.customerName}</strong></div>
                <div>Số điện thoại: <strong className="tabular-nums">{contract.customerPhone}</strong></div>
                <div>Số CCCD/CMND: <strong className="tabular-nums">{contract.customerIdCard}</strong></div>
                <div>Giấy phép lái xe: <strong className="tabular-nums">{contract.driverLicenseNumber}</strong></div>
              </div>
            </div>

            {/* Terms Articles */}
            <div className="space-y-4 font-sans text-xs">
              <div>
                <h3 className="font-bold text-zinc-950 text-sm mb-1">ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG & THỜI HẠN THUÊ</h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>Phương tiện thuê: <strong>{contract.vehicleMake} {contract.vehicleModel}</strong> (Biển kiểm soát: <strong className="license-plate text-[10px] py-0.2">{contract.vehicleLicensePlate}</strong>).</li>
                  <li>Thời gian nhận xe: <strong className="tabular-nums">{new Date(contract.startTime).toLocaleString('vi-VN')}</strong>.</li>
                  <li>Thời gian hoàn trả: <strong className="tabular-nums">{new Date(contract.endTime).toLocaleString('vi-VN')}</strong>.</li>
                  <li>Tổng số ngày thuê: <strong className="tabular-nums">{contract.totalDays} ngày</strong>.</li>
                  <li>Địa điểm nhận/trả xe: {contract.pickupLocation || 'Tại showroom VELORA'}.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-zinc-950 text-sm mb-1">ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG & TIỀN ĐẶT CỌC</h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>Tổng chi phí thuê xe: <strong className="text-blue-900 font-bold tabular-nums">{formatCurrency(contract.totalFee)}</strong>.</li>
                  <li>Khoản tiền cọc thế chấp: <strong className="text-zinc-950 font-bold tabular-nums">{formatCurrency(contract.depositAmount || 15000000)}</strong>.</li>
                  <li>Bên B có nghĩa vụ hoàn thành thanh toán tiền đặt cọc theo phương thức chuyển khoản VietQR để hợp đồng có hiệu lực giữ chỗ phương tiện.</li>
                  <li>Khoản đặt cọc sẽ được Bên A hoàn trả 100% về tài khoản của Bên B trong vòng 30 phút sau khi kết thúc chuyến đi và hoàn tất Biên bản Hoàn trả (đối trừ các chi phí phát sinh nếu có).</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-zinc-950 text-sm mb-1">ĐIỀU 3: ĐỊNH MỨC QUÃNG ĐƯỜNG & PHỤ PHÍ</h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>Hạn mức kilomet cho phép: <strong>{contract.maxKm || (contract.totalDays * 300)} km</strong> cho toàn bộ chuyến đi. Phí vượt định mức: <strong>{formatCurrency(contract.extraKmPrice || 5000)}/km</strong>.</li>
                  <li>Quy định nhiên liệu: Bên B có trách nhiệm hoàn trả phương tiện với mức nhiên liệu tương đương lúc bàn giao.</li>
                </ul>
              </div>
            </div>

            {/* Signatures Area */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 font-sans text-center">
              <div className="space-y-12">
                <div className="font-bold text-zinc-950 text-xs uppercase">ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)</div>
                <div className="pt-8">
                  <div className="text-xs font-bold text-blue-900 uppercase">HỆ THỐNG VELORA</div>
                  <div className="text-[10px] text-slate-500 italic">(Đã ký số điện tử xác thực)</div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="font-bold text-zinc-950 text-xs uppercase">ĐẠI DIỆN BÊN THUÊ XE (BÊN B)</div>
                
                {isSigned ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md space-y-1">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                    <div className="font-bold text-emerald-900 text-xs uppercase">{contract.customerSignature || contract.customerName}</div>
                    <div className="text-[10px] text-emerald-700">
                      Ký số lúc: {contract.signedAt ? new Date(contract.signedAt).toLocaleString('vi-VN') : 'Đã xác thực'}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic pt-6">
                    (Vui lòng ký tên vào biểu mẫu bên dưới)
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* SIGNATURE FORM (If not signed yet) */}
          {!isSigned && (
            <div className="pt-8 border-t border-slate-200 font-sans">
              <form onSubmit={handleSign} className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-blue-900" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950">
                    Xác nhận chữ ký điện tử khách hàng
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nhập đầy đủ Họ và tên người thuê để tạo chữ ký số:
                    </label>
                    <input
                      type="text"
                      value={signatureName}
                      onChange={(e) => setSignatureName(e.target.value)}
                      placeholder="NGUYEN VAN A"
                      required
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-bold text-zinc-950 uppercase tracking-wider focus:outline-none focus:border-blue-900 transition-colors"
                    />
                  </div>

                  <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 mt-0.5"
                    />
                    <span>
                      Tôi đã đọc, hiểu rõ và đồng ý với toàn bộ các điều khoản trong hợp đồng điện tử này. Chữ ký số trên có giá trị pháp lý tương đương chữ ký tay.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={signing}
                    className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-blue-900 disabled:bg-slate-400 text-white font-bold text-xs rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                  >
                    {signing ? 'Đang xác thực chữ ký số...' : 'Xác nhận ký hợp đồng điện tử'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* NEXT STEP: PAY DEPOSIT CTA */}
          {isSigned && (
            <div className="pt-6 border-t border-slate-200 font-sans flex flex-col sm:flex-row items-center justify-between gap-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
              <div>
                <div className="text-xs font-bold text-blue-950">Hợp đồng đã được ký số thành công!</div>
                <div className="text-[11px] text-slate-600">Bước tiếp theo: Tiến hành thanh toán tiền đặt cọc giữ xe qua mã VietQR.</div>
              </div>
              <Link
                to={`/payment/deposit/${requestId}`}
                className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-md shadow-xs transition-colors flex items-center gap-2 tracking-wider uppercase shrink-0"
              >
                <span>Thanh toán đặt cọc</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default ContractSignPage;
