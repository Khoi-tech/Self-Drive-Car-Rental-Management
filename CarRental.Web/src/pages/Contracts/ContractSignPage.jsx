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
  Lock
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
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-zinc-400">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span>Đang chuẩn bị hợp đồng điện tử...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-950/60 border border-rose-800 text-rose-400 mx-auto flex items-center justify-center mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">Chưa Thể Khởi Tạo Hợp Đồng</h2>
          <p className="text-zinc-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/cars')}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition"
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft size={14} /> Quay lại
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs transition"
          >
            <Printer size={14} /> In hợp đồng
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="mb-8 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 size={16} />
              <span>1. Gửi yêu cầu thuê xe</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 size={16} />
              <span>2. Nhân viên duyệt hồ sơ</span>
            </div>
            <div className={`flex items-center gap-2 font-semibold ${isSigned ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isSigned ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] border border-amber-500/40">3</div>}
              <span>3. Ký hợp đồng điện tử</span>
            </div>
            <div className={`flex items-center gap-2 ${isDepositPaid ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}`}>
              {isDepositPaid ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center text-[10px]">4</div>}
              <span>4. Đặt cọc & Nhận xe</span>
            </div>
          </div>
        </div>

        {/* Success Alert Banner when signed */}
        {signSuccess && (
          <div className="mb-6 p-4 bg-emerald-950/60 border border-emerald-600/50 rounded-xl flex items-center justify-between text-emerald-300 text-sm animate-fadeIn">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-emerald-400" />
              <span>Bạn đã ký hợp đồng điện tử thành công! Hãy tiến hành đặt cọc để giữ xe ngay.</span>
            </div>
            <button
              onClick={() => navigate(`/payment/deposit/${requestId}`)}
              className="px-4 py-1.5 bg-emerald-500 text-black font-semibold text-xs rounded-lg hover:bg-emerald-400 transition"
            >
              Đặt cọc ngay
            </button>
          </div>
        )}

        {/* Legal Document Sheet */}
        <div className="bg-white text-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden mb-8">
          {/* Header Band */}
          <div className="bg-zinc-900 text-white px-8 py-6 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {contract.contractNumber}
                </span>
                <span className="text-xs text-zinc-400">
                  Ngày lập: {formatDateTime(contract.createdAt)}
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white mt-2">
                HỢP ĐỒNG THUÊ XE Ô TÔ TỰ LÁI ĐIỆN TỬ
              </h1>
            </div>

            <div className="text-right">
              {isSigned ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <ShieldCheck size={14} />
                  <span>ĐÃ KÝ ĐIỆN TỬ</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                  <Clock size={14} />
                  <span>CHỜ KHÁCH HÀNG KÝ</span>
                </div>
              )}
            </div>
          </div>

          {/* Document Content */}
          <div className="p-8 sm:p-12 space-y-8 font-serif leading-relaxed text-[15px] text-zinc-800">
            {/* National Motto */}
            <div className="text-center space-y-1 font-sans">
              <p className="font-bold tracking-widest text-sm uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p className="text-xs italic underline">Độc lập - Tự do - Hạnh phúc</p>
              <div className="w-24 h-0.5 bg-zinc-300 mx-auto mt-2" />
            </div>

            {/* Document Body from Backend Template */}
            <div className="whitespace-pre-line font-sans text-sm text-zinc-800 leading-relaxed bg-zinc-50/50 p-6 rounded-xl border border-zinc-200">
              {contract.content}
            </div>

            {/* Structured Summary Box */}
            <div className="font-sans grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-100/80 p-5 rounded-xl border border-zinc-300 text-xs">
              <div className="space-y-1.5">
                <p className="font-bold text-zinc-700 uppercase tracking-wider mb-2">Đại diện Bên A (Cho thuê)</p>
                <p><span className="text-zinc-500">Đơn vị:</span> <strong>CÔNG TY TNHH VELORA VIỆT NAM</strong></p>
                <p><span className="text-zinc-500">Hotline:</span> <strong>1900 6868</strong></p>
                <p><span className="text-zinc-500">Trạm giao xe:</span> {contract.pickupLocation}</p>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-zinc-700 uppercase tracking-wider mb-2">Đại diện Bên B (Khách thuê)</p>
                <p><span className="text-zinc-500">Họ và tên:</span> <strong>{contract.customerName}</strong></p>
                <p><span className="text-zinc-500">Số CCCD / CMND:</span> <strong>{contract.customerIdCard}</strong></p>
                <p><span className="text-zinc-500">Số GPLX:</span> <strong>{contract.driverLicenseNumber}</strong></p>
              </div>
            </div>

            {/* Signatures Section */}
            <div className="font-sans pt-6 grid grid-cols-2 gap-8 text-center text-xs">
              {/* Party A Signature */}
              <div className="space-y-3">
                <p className="font-bold uppercase tracking-wider text-zinc-600">ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)</p>
                <p className="text-zinc-400 italic">(Đã ký số và xác thực hệ thống)</p>
                <div className="h-20 flex items-center justify-center">
                  <div className="border-2 border-emerald-600 rounded-lg px-4 py-2 text-emerald-700 font-bold text-xs uppercase rotate-[-4deg] bg-emerald-50">
                    VELORA VERIFIED ✓<br />
                    <span className="text-[10px] font-normal text-emerald-600">Ban Điều Hành Hệ Thống</span>
                  </div>
                </div>
              </div>

              {/* Party B Signature */}
              <div className="space-y-3">
                <p className="font-bold uppercase tracking-wider text-zinc-600">ĐẠI DIỆN BÊN THUÊ XE (BÊN B)</p>
                <p className="text-zinc-400 italic">(Ký và ghi rõ họ tên)</p>
                
                <div className="h-20 flex items-center justify-center">
                  {isSigned ? (
                    <div className="border-2 border-blue-600 rounded-lg px-4 py-2 text-blue-800 font-bold text-xs rotate-[2deg] bg-blue-50">
                      ĐÃ KÝ ĐIỆN TỬ ✓<br />
                      <span className="font-serif italic text-sm text-blue-900">{contract.customerSignature}</span><br />
                      <span className="text-[9px] font-normal text-zinc-500">{formatDateTime(contract.customerSignedAt)}</span>
                    </div>
                  ) : (
                    <span className="text-zinc-400 italic text-xs">Chưa ký</span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Digital Signing Action Card */}
        {!isSigned ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <PenTool size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Ký Hợp Đồng Điện Tử Trực Tuyến</h3>
                <p className="text-xs text-zinc-400">
                  Xác nhận chữ ký số cá nhân để hoàn tất thủ tục pháp lý thuê xe theo Nghị định về giao dịch điện tử
                </p>
              </div>
            </div>

            <form onSubmit={handleSign} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Họ và tên người ký (Chữ ký điện tử):
                </label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Nhập họ và tên đầy đủ..."
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-zinc-300 group-hover:text-white transition leading-relaxed">
                  Tôi xác nhận đã đọc, hiểu rõ và hoàn toàn đồng ý với toàn bộ các điều khoản, quyền và nghĩa vụ quy định trong 
                  <strong> Hợp đồng thuê xe điện tử VELORA</strong> và chính sách bảo hiểm phương tiện.
                </span>
              </label>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800">
                <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <Lock size={14} className="text-emerald-500" />
                  Mã hóa chữ ký SHA-256 bảo mật chuẩn quốc tế
                </div>

                <button
                  type="submit"
                  disabled={signing || !agreeTerms || !signatureName.trim()}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {signing ? (
                    'Đang chứng thực chữ ký...'
                  ) : (
                    <>
                      <span>Xác nhận ký & Tiếp tục đặt cọc</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Next Step: Proceed to Deposit Payment */
          <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 flex-shrink-0">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Hợp đồng điện tử đã được ký kết hợp lệ</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Bước cuối cùng: Quý khách vui lòng thanh toán tiền đặt cọc ({formatCurrency(contract.depositAmount)}) để hoàn tất việc giữ xe.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/payment/deposit/${requestId}`)}
              className="w-full sm:w-auto px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>{isDepositPaid ? 'Xem biên lai đặt cọc' : 'Tiến hành đặt cọc qua VietQR'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ContractSignPage;
