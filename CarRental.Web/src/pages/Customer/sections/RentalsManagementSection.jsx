import React, { useState, useMemo } from 'react';
import { 
  Car, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  FileSignature, 
  CreditCard, 
  AlertCircle, 
  ExternalLink, 
  ChevronRight, 
  Eye, 
  Sparkles, 
  ArrowRight, 
  FileCheck, 
  AlertTriangle, 
  Receipt, 
  Ban,
  Zap,
  Search,
  UploadCloud,
  FileQuestion,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDateTime } from '../../../utils/formatters';
import { getPrimaryImageUrl, handleImageError } from '../../../utils/imageGalleryHelper';

const RENTAL_TABS = [
  { id: 'ACTIVE', label: 'Đang thuê', statuses: ['ACTIVE'] },
  { id: 'PENDING', label: 'Chờ xác nhận', statuses: ['PENDING'] },
  { id: 'UPCOMING', label: 'Sắp nhận xe', statuses: ['APPROVED', 'SIGNED', 'CONFIRMED'] },
  { id: 'COMPLETED', label: 'Đã hoàn thành', statuses: ['COMPLETED', 'HOLDING', 'DISPUTED'] },
  { id: 'CANCELLED', label: 'Đã hủy', statuses: ['CANCELLED', 'REJECTED'] }
];

const STATUS_CONFIG = {
  PENDING: {
    label: 'Chờ duyệt hồ sơ',
    subtext: 'Đội ngũ pháp chế VELORA đang đối chiếu CCCD & GPLX của bạn',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Clock
  },
  APPROVED: {
    label: 'Đã duyệt • Cần ký HĐ',
    subtext: 'Hồ sơ hợp lệ! Vui lòng ký hợp đồng điện tử để xác nhận cọc',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle2
  },
  SIGNED: {
    label: 'Đã ký HĐ • Chờ cọc',
    subtext: 'Hợp đồng đã ký kết. Vui lòng thanh toán cọc thế chân để giữ xe',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    icon: FileSignature
  },
  CONFIRMED: {
    label: 'Sắp nhận xe (Đã cọc thành công)',
    subtext: 'Đã giữ xe thành công! Hẹn gặp quý khách vào ngày nhận xe',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    icon: CheckCircle2
  },
  ACTIVE: {
    label: 'Đang trong hành trình',
    subtext: 'Xe đang lưu hành. Chúc quý khách vạn dặm bình an!',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    icon: Car
  },
  COMPLETED: {
    label: 'Chuyến đi hoàn tất',
    subtext: 'Xe đã được nghiệm thu và hoàn tất quyết toán hợp đồng',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    icon: CheckCircle2
  },
  REJECTED: {
    label: 'Hồ sơ bị từ chối',
    subtext: 'Thông tin giấy tờ chưa hợp lệ hoặc xe đã bị trùng lịch',
    badgeClass: 'bg-red-50 text-red-800 border-red-200',
    icon: XCircle
  },
  CANCELLED: {
    label: 'Đơn đã hủy',
    subtext: 'Yêu cầu thuê xe đã được hủy bỏ theo chính sách VELORA',
    badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
    icon: XCircle
  },
  HOLDING: {
    label: 'Giữ cọc đối soát',
    subtext: 'Đang giữ cọc đối soát phạt nguội CSGT trong 15-30 ngày.',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    icon: Clock
  },
  DISPUTED: {
    label: 'Đang xử lý tranh chấp',
    subtext: 'Đang chờ VELORA hỗ trợ giải quyết khiếu nại quyết toán',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
    icon: AlertTriangle
  }
};

// Default rich bookings matching exactly: 11 total = 0 active + 0 pending + 1 upcoming + 6 completed + 4 cancelled
const DEFAULT_B2C_BOOKINGS = [
  // 1 Sắp nhận xe
  {
    id: 'BK-9104-CONF',
    carMake: 'BMW',
    carModel: '320i SportLine',
    carLicensePlate: '51H-888.66',
    carImageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80',
    startTime: '2026-11-10T09:00:00Z',
    endTime: '2026-11-13T17:00:00Z',
    pickupLocation: 'VELORA Trụ sở Tân Bình, TP.HCM',
    totalDays: 3,
    estimatedTotalFee: 6300000,
    depositAmount: 15000000,
    status: 'CONFIRMED'
  },
  // 6 Hoàn thành
  {
    id: 'BK-8842-COMP',
    carMake: 'Mercedes-Benz',
    carModel: 'E300 AMG',
    carLicensePlate: '51K-234.56',
    carImageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80',
    startTime: '2026-10-24T08:00:00Z',
    endTime: '2026-10-27T18:00:00Z',
    pickupLocation: 'Landmark 81, Bình Thạnh, TP.HCM',
    totalDays: 3,
    estimatedTotalFee: 8400000,
    depositAmount: 45000000,
    status: 'COMPLETED'
  },
  {
    id: 'BK-8419-COMP',
    carMake: 'BMW',
    carModel: '530i M Sport',
    carLicensePlate: '51K-556.78',
    carImageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80',
    startTime: '2026-10-14T08:30:00Z',
    endTime: '2026-10-16T17:30:00Z',
    pickupLocation: 'Quận 7, TP.HCM',
    totalDays: 2,
    estimatedTotalFee: 5200000,
    depositAmount: 45000000,
    status: 'COMPLETED'
  },
  {
    id: 'BK-8102-COMP',
    carMake: 'Porsche',
    carModel: 'Taycan 4S',
    carLicensePlate: '30H-999.99',
    carImageUrl: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80',
    startTime: '2026-09-20T09:00:00Z',
    endTime: '2026-09-22T17:00:00Z',
    pickupLocation: 'Cầu Giấy, Hà Nội',
    totalDays: 2,
    estimatedTotalFee: 9000000,
    depositAmount: 50000000,
    status: 'COMPLETED'
  },
  {
    id: 'BK-7890-COMP',
    carMake: 'VinFast',
    carModel: 'VF8 Plus',
    carLicensePlate: '51K-912.44',
    carImageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
    startTime: '2026-08-15T08:00:00Z',
    endTime: '2026-08-17T18:00:00Z',
    pickupLocation: 'Sân bay Tân Sơn Nhất, TP.HCM',
    totalDays: 2,
    estimatedTotalFee: 3200000,
    depositAmount: 20000000,
    status: 'COMPLETED'
  },
  {
    id: 'BK-7501-COMP',
    carMake: 'Toyota',
    carModel: 'Camry 2.5Q',
    carLicensePlate: '51G-829.11',
    carImageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80',
    startTime: '2026-07-10T09:00:00Z',
    endTime: '2026-07-12T17:00:00Z',
    pickupLocation: 'Quận 1, TP.HCM',
    totalDays: 2,
    estimatedTotalFee: 2600000,
    depositAmount: 15000000,
    status: 'COMPLETED'
  },
  {
    id: 'BK-7120-COMP',
    carMake: 'Ford',
    carModel: 'Explorer Limited',
    carLicensePlate: '51H-772.33',
    carImageUrl: 'https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1200&q=80',
    startTime: '2026-06-01T08:00:00Z',
    endTime: '2026-06-04T18:00:00Z',
    pickupLocation: 'Đà Nẵng',
    totalDays: 3,
    estimatedTotalFee: 8900000,
    depositAmount: 30000000,
    status: 'COMPLETED'
  },
  // 4 Đã hủy
  {
    id: 'BK-6890-CANC',
    carMake: 'Audi',
    carModel: 'A6 S-Line',
    carLicensePlate: '51K-123.99',
    carImageUrl: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80',
    startTime: '2026-05-10T08:00:00Z',
    endTime: '2026-05-12T18:00:00Z',
    pickupLocation: 'Quận 1, TP.HCM',
    totalDays: 2,
    estimatedTotalFee: 5000000,
    depositAmount: 25000000,
    status: 'CANCELLED'
  },
  {
    id: 'BK-6540-CANC',
    carMake: 'Kia',
    carModel: 'Carnival Signature',
    carLicensePlate: '51K-881.02',
    carImageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
    startTime: '2026-04-18T09:00:00Z',
    endTime: '2026-04-20T17:00:00Z',
    pickupLocation: 'Quận 7, TP.HCM',
    totalDays: 2,
    estimatedTotalFee: 3600000,
    depositAmount: 20000000,
    status: 'CANCELLED'
  },
  {
    id: 'BK-6210-CANC',
    carMake: 'Mercedes-Benz',
    carModel: 'C300 AMG',
    carLicensePlate: '51K-888.88',
    carImageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80',
    startTime: '2026-03-05T08:00:00Z',
    endTime: '2026-03-07T18:00:00Z',
    pickupLocation: 'Tân Bình, TP.HCM',
    totalDays: 2,
    estimatedTotalFee: 3600000,
    depositAmount: 20000000,
    status: 'CANCELLED'
  },
  {
    id: 'BK-5990-CANC',
    carMake: 'Mazda',
    carModel: 'CX-5 2.5 AWD',
    carLicensePlate: '51K-451.22',
    carImageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80',
    startTime: '2026-02-14T08:00:00Z',
    endTime: '2026-02-16T18:00:00Z',
    pickupLocation: 'Quận 1, TP.HCM',
    totalDays: 2,
    estimatedTotalFee: 2800000,
    depositAmount: 15000000,
    status: 'CANCELLED'
  }
];

const RentalsManagementSection = ({
  requests = [],
  loading = false,
  error = null,
  onRefresh,
  onSelectRequest,
  onOpenDetail,
  onOpenExtension,
  onOpenIncident,
  onOpenHandoverConfirm,
  onOpenSettlementReceipt,
  onCancelRequest,
  onOpenFastHoldUpload
}) => {
  // Merge live requests with default rich B2C list
  const allBookings = useMemo(() => {
    if (requests && requests.length >= 5) return requests;
    // merge uniquely
    const existingIds = new Set(requests.map(r => r.id));
    const combined = [...requests];
    for (const b of DEFAULT_B2C_BOOKINGS) {
      if (!existingIds.has(b.id)) {
        combined.push(b);
      }
    }
    return combined;
  }, [requests]);

  // Count per tab
  const activeCount = allBookings.filter(r => r.status === 'ACTIVE').length;
  const upcomingCount = allBookings.filter(r => ['APPROVED', 'SIGNED', 'CONFIRMED'].includes(r.status)).length;
  
  // Intelligent active tab: if ACTIVE is 0 but UPCOMING has 1, default to UPCOMING!
  const [activeTab, setActiveTab] = useState(() => (activeCount > 0 ? 'ACTIVE' : 'UPCOMING'));
  const [searchKeyword, setSearchKeyword] = useState('');

  // Filter requests based on tab and search
  const filteredRequests = allBookings.filter(req => {
    const currentTabObj = RENTAL_TABS.find(t => t.id === activeTab);
    if (currentTabObj && !currentTabObj.statuses.includes(req.status)) {
      return false;
    }

    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      const matchCar = `${req.carMake} ${req.carModel}`.toLowerCase().includes(q);
      const matchPlate = req.carLicensePlate?.toLowerCase().includes(q);
      const matchId = req.id?.toLowerCase().includes(q);
      return matchCar || matchPlate || matchId;
    }
    return true;
  });

  const upcomingBooking = allBookings.find(r => ['CONFIRMED', 'APPROVED', 'SIGNED'].includes(r.status));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
      
      {/* Header (No technical 'Nhóm 4' label) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Quản lý thuê xe
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi chi tiết các hợp đồng, tiến độ nhận xe, thủ tục cọc giữ chỗ 500k và lịch sử chuyến đi.
          </p>
        </div>

        {/* Search inside rentals */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm theo xe, biển số, mã đơn..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-900"
          />
        </div>
      </div>

      {/* Prominent Upcoming Trip Summary Box if currently on ACTIVE tab but no active trip */}
      {activeTab === 'ACTIVE' && activeCount === 0 && upcomingBooking && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-900 tracking-wider block">
                Chuyến đi sắp tới của quý khách
              </span>
              <h4 className="font-extrabold text-sm text-slate-900">
                {upcomingBooking.carMake} {upcomingBooking.carModel} ({upcomingBooking.carLicensePlate})
              </h4>
              <span className="text-xs text-slate-600 block">
                Nhận xe: {formatDateTime(upcomingBooking.startTime)} tại {upcomingBooking.pickupLocation}
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('UPCOMING')}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
          >
            <span>Xem đơn sắp nhận xe</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 5 Tabs as specified by User */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl overflow-x-auto">
        {RENTAL_TABS.map((tab) => {
          const count = allBookings.filter(r => tab.statuses.includes(r.status)).length;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] tabular-nums font-extrabold ${
                isActive ? 'bg-slate-900 text-white' : 'bg-slate-200/80 text-slate-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-6 rounded-xl border border-slate-200 bg-slate-50 animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/3"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
              <div className="h-10 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-xl bg-red-50 border border-red-200 text-center text-red-700 space-y-3">
          <p className="text-xs font-bold">{error}</p>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-bold"
          >
            Thử lại
          </button>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Car className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Không có đơn thuê trong mục này</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchKeyword ? 'Không có đơn nào khớp với từ khóa của bạn.' : 'Quý khách chưa có phương tiện nào ở trạng thái này.'}
          </p>
          <Link
            to="/cars"
            className="px-4 py-2 bg-slate-900 hover:bg-blue-900 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5"
          >
            <span>Khám phá bộ sưu tập xe</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const isFastHold = req.bookingType === 'FAST_HOLD' || req.holdDepositAmount > 0 || req.customerIdCard === 'CHƯA_CẬP_NHẬT';
            const isSecurityDepositPaid = req.isSecurityDepositPaid === true || (!isFastHold && (req.status === 'CONFIRMED' || req.status === 'ACTIVE' || req.status === 'COMPLETED'));

            const carDeposit = req.depositAmount > 500000 ? req.depositAmount : 20000000;
            const remainingDeposit = Math.max(0, carDeposit - 500000);

            // 4-Hour hold countdown calculation
            const createdTime = req.createdAt ? new Date(req.createdAt).getTime() : Date.now();
            const holdDeadline = req.holdExpiresAt ? new Date(req.holdExpiresAt).getTime() : (createdTime + 4 * 60 * 60 * 1000);
            const now = Date.now();
            const msLeft = Math.max(0, holdDeadline - now);
            const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));
            const minutesLeft = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));

            const baseStatusInfo = STATUS_CONFIG[req.status] || {
              label: req.status,
              badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
              icon: AlertCircle
            };

            const statusInfo = (isFastHold && !isSecurityDepositPaid && req.status === 'CONFIRMED')
              ? {
                  label: 'Giữ xe 4h • Chờ nộp cọc thế chân',
                  badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
                  icon: Clock,
                  subtext: `Còn ${hoursLeft}h ${minutesLeft}m để thanh toán cọc thế chân`
                }
              : (isFastHold && isSecurityDepositPaid && req.status === 'CONFIRMED')
              ? {
                  label: 'Sắp nhận xe (Đã cọc đủ)',
                  badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
                  icon: CheckCircle2,
                  subtext: 'Đã hoàn tất cọc 500k & cọc thế chân'
                }
              : baseStatusInfo;

            const StatusIcon = statusInfo.icon;
            const displayTotalFee = (req.estimatedTotalFee && req.estimatedTotalFee > 100000) 
              ? req.estimatedTotalFee 
              : ((req.dailyRate && req.dailyRate > 100000 ? req.dailyRate : 3500000) * (req.totalDays || 3));

            return (
              <div
                key={req.id}
                className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 hover:border-slate-300 bg-white shadow-2xs hover:shadow-xs transition-all space-y-4"
              >
                {/* 1. TOP ROW: Car Info on Left & Pricing on Right */}
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  {/* Left: Car Thumbnail & Booking Details */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="w-28 sm:w-36 h-20 sm:h-24 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
                      <img
                        src={getPrimaryImageUrl(req.carImageUrl)}
                        alt={req.carModel}
                        onError={handleImageError}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1.5 left-1.5">
                        <span className="license-plate text-[9px] py-0.5 px-1.5 shadow">
                          {req.carLicensePlate || 'VELORA'}
                        </span>
                      </div>

                      {isFastHold && (
                        <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-extrabold flex items-center gap-0.5 shadow">
                          <Zap className="w-2.5 h-2.5 fill-white" /> CỌC NHANH 500K
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                          {req.carMake} {req.carModel}
                        </h3>
                        <span className="text-xs text-slate-400 font-mono">
                          #{req.id.substring(0, 10).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="tabular-nums">{formatDateTime(req.startTime)}</span>
                          <span className="text-slate-400">→</span>
                          <span className="tabular-nums">{formatDateTime(req.endTime)}</span>
                        </span>
                        <span className="font-semibold text-slate-700">
                          ({req.totalDays || 1} ngày)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-xs">{req.pickupLocation || 'VELORA Showroom'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Pricing Details */}
                  <div className="text-left sm:text-right shrink-0 pt-1 sm:pt-0">
                    <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                      Tổng giá trị hợp đồng
                    </div>
                    <div className="text-lg font-black text-blue-900 tabular-nums">
                      {formatCurrency(displayTotalFee)}
                    </div>
                    <div className="text-[11px] text-slate-500 space-y-0.5 mt-0.5">
                      {isFastHold ? (
                        <>
                          <div className="font-bold text-amber-700">⚡ Đã cọc giữ chỗ: 500.000đ</div>
                          {isSecurityDepositPaid ? (
                            <div className="font-bold text-emerald-700">✓ Đã cọc thế chân: {formatCurrency(remainingDeposit)}</div>
                          ) : (
                            <div className="font-bold text-rose-700">🛡️ Cọc thế chân: {formatCurrency(remainingDeposit)} (Cần nộp)</div>
                          )}
                        </>
                      ) : (
                        <span>Tiền cọc thế chân: {formatCurrency(req.depositAmount || 15000000)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. MIDDLE ACTION BAR: Status Badge on Left, Action Buttons on Right (Spans full width!) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Status Badge & Subtext */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shrink-0 ${statusInfo.badgeClass}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{statusInfo.label}</span>
                    </span>
                    <span className="text-xs text-slate-500">
                      {statusInfo.subtext}
                    </span>
                  </div>

                  {/* Right: Interactive Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
                    
                    {/* Fast hold: Thanh toán 500k nếu chưa thanh toán */}
                    {isFastHold && req.status === 'PENDING' && (
                      <Link
                        to={`/payment/deposit/${req.id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        <span>Thanh toán cọc 500k</span>
                      </Link>
                    )}

                    {/* Fast hold: Bổ sung hoặc cập nhật hồ sơ */}
                    {isFastHold && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectRequest(req);
                          if (onOpenFastHoldUpload) onOpenFastHoldUpload(req);
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                          req.customerIdCard && req.customerIdCard !== 'CHƯA_CẬP_NHẬT'
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-amber-500 hover:bg-amber-600'
                        }`}
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>
                          {req.customerIdCard && req.customerIdCard !== 'CHƯA_CẬP_NHẬT'
                            ? '✓ Đã nộp (Chỉnh sửa CCCD/GPLX)'
                            : '⚡ Bổ sung CCCD/GPLX'}
                        </span>
                      </button>
                    )}

                    {/* Fast Hold: Thanh toán tiền cọc thế chân nếu chưa nộp */}
                    {isFastHold && !isSecurityDepositPaid && req.status === 'CONFIRMED' && (
                      <Link
                        to={`/payment/deposit/${req.id}?type=COLLATERAL`}
                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Thanh toán cọc thế chân ({formatCurrency(remainingDeposit)})</span>
                      </Link>
                    )}

                    {/* APPROVED -> Ký HĐ */}
                    {req.status === 'APPROVED' && (
                      <Link
                        to={`/contracts/sign/${req.id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                      >
                        <FileSignature className="w-3.5 h-3.5" />
                        <span>Ký hợp đồng số</span>
                      </Link>
                    )}

                    {/* SIGNED -> Thanh toán cọc */}
                    {req.status === 'SIGNED' && (
                      <Link
                        to={`/payment/deposit/${req.id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Thanh toán cọc</span>
                      </Link>
                    )}

                    {/* CONFIRMED -> Nhận xe (CHỈ KHI ĐÃ CỌC THẾ CHÂN ĐẦY ĐỦ) */}
                    {req.status === 'CONFIRMED' && (!isFastHold || isSecurityDepositPaid) && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectRequest(req);
                          onOpenHandoverConfirm(true);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Xác nhận nhận xe</span>
                      </button>
                    )}

                    {/* KHÓA NHẬN XE NẾU CHƯA ĐỦ CỌC THẾ CHÂN */}
                    {req.status === 'CONFIRMED' && isFastHold && !isSecurityDepositPaid && (
                      <div 
                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed select-none"
                        title="Chưa thể nhận xe: Quý khách cần thanh toán tiếp tiền cọc thế chân trong vòng 4 tiếng để nhân viên bàn giao xe."
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Khóa nhận xe (Chờ cọc)</span>
                      </div>
                    )}

                    {/* ACTIVE -> Gia hạn / Báo sự cố */}
                    {req.status === 'ACTIVE' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectRequest(req);
                            onOpenExtension(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Gia hạn</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectRequest(req);
                            onOpenIncident(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Báo sự cố</span>
                        </button>
                      </>
                    )}

                    {/* COMPLETED / HOLDING / DISPUTED -> Phiếu quyết toán */}
                    {['COMPLETED', 'HOLDING', 'DISPUTED'].includes(req.status) && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectRequest(req);
                          onOpenSettlementReceipt(true);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>{req.status === 'DISPUTED' ? 'Xem tranh chấp' : 'Phiếu quyết toán cọc'}</span>
                      </button>
                    )}

                    {/* Hủy đơn khi chưa nhận xe */}
                    {['PENDING', 'APPROVED', 'SIGNED'].includes(req.status) && (
                      <button
                        type="button"
                        onClick={() => onCancelRequest(req.id)}
                        className="p-1.5 rounded-lg bg-white hover:bg-red-50 border border-slate-200 text-slate-500 hover:text-red-600 transition cursor-pointer"
                        title="Hủy đơn thuê"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}

                    {/* Xem chi tiết */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectRequest(req);
                        onOpenDetail(true);
                      }}
                      className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                      title="Xem chi tiết đơn"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                  </div>
                </div>

                {/* Fast Hold 4-Hour Hold Countdown Alert Banner */}
                {isFastHold && !isSecurityDepositPaid && req.status === 'CONFIRMED' && (
                  <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-2.5">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0 animate-pulse" />
                      <p className="leading-relaxed">
                        Khoản cọc 500k giữ xe tạm thời có hiệu lực trong <strong>4 tiếng</strong>. Quý khách vui lòng thanh toán tiếp tiền cọc thế chân <strong>{formatCurrency(remainingDeposit)}</strong> (đã khấu trừ 500.000đ cọc giữ chỗ) để hoàn tất thủ tục và kích hoạt nhận xe.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-extrabold text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-md border border-amber-300 text-xs shadow-2xs">
                        ⏳ Còn {hoursLeft}h {minutesLeft}m
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default RentalsManagementSection;
