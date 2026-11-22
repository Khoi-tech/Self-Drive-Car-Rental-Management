import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Award,
  Sparkles,
  RefreshCw,
  PlusCircle,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TIER_STYLES = {
  PLATINUM: {
    badgeClass: 'bg-indigo-100/95 text-indigo-950 border-indigo-300 font-extrabold shadow-xs',
    iconClass: 'text-indigo-700',
    barClass: 'bg-indigo-400'
  },
  GOLD: {
    badgeClass: 'bg-amber-100/95 text-amber-950 border-amber-300 font-extrabold shadow-xs',
    iconClass: 'text-amber-700',
    barClass: 'bg-amber-400'
  },
  SILVER: {
    badgeClass: 'bg-slate-200/95 text-slate-900 border-slate-300 font-extrabold shadow-xs',
    iconClass: 'text-slate-600',
    barClass: 'bg-slate-300'
  },
  STANDARD: {
    badgeClass: 'bg-white/15 text-slate-100 border-white/25 font-bold',
    iconClass: 'text-slate-300',
    barClass: 'bg-blue-400'
  }
};

const ProfileHeaderBanner = ({
  user,
  requests = [],
  refreshing,
  onRefresh,
  kycStatus
}) => {
  const effectiveKyc = (kycStatus || user?.kycStatus || 'NOT_SUBMITTED').toUpperCase();

  // Real trip statistics strictly separated to match Admin 100%
  const totalTrips = requests.length;
  const completedTrips = requests.filter(r => r.status === 'COMPLETED').length;
  const activeTrips = requests.filter(r => ['ACTIVE', 'IN_TRANSIT'].includes(r.status)).length;
  const upcomingTrips = requests.filter(r =>
    ['APPROVED', 'CONFIRMED', 'HOLD_CONFIRMED', 'DEPOSIT_PAID', 'SIGNED'].includes(r.status)
  ).length;

  // Single Source of Truth from Backend (GET /api/auth/me)
  const tierKey = (user?.membershipTier || 'STANDARD').toUpperCase();
  const tierStyle = TIER_STYLES[tierKey] || TIER_STYLES.STANDARD;
  const tierLabel = user?.membershipTierLabel || (
    tierKey === 'PLATINUM' ? 'Hội viên Platinum'
      : tierKey === 'GOLD' ? 'Hội viên Gold'
      : tierKey === 'SILVER' ? 'Hội viên Silver'
      : 'Thành viên Tiêu chuẩn'
  );
  const perks = Array.isArray(user?.membershipPerks) && user.membershipPerks.length > 0
    ? user.membershipPerks
    : ['Hoàn thành 1 chuyến đầu tiên để lên hạng Silver', 'Ưu đãi VietQR 5% khi thanh toán trả trước'];

  const trustScore = typeof user?.trustScore === 'number' ? user.trustScore : 100;
  const nextTier = user?.nextTier || null;
  const nextTierLabel = user?.nextTierLabel || nextTier;
  const tripsToNext = user?.completedTripsToNextTier ?? 0;
  const progressPercent = Math.max(0, Math.min(100, user?.tierProgressPercent ?? 0));

  const displayName = user?.fullName || 'Khách hàng VELORA';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .slice(-2)
    .join('')
    .toUpperCase() || 'VL';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })
    : '2026';

  const trustBadgeStyle = trustScore >= 90
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
    : trustScore >= 80
    ? 'bg-amber-500/20 text-amber-200 border-amber-400/30'
    : 'bg-red-500/20 text-red-200 border-red-400/30';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white p-6 md:p-8 shadow-xl border border-slate-800 mb-8 transition-all">
      {/* Geometric background accent */}
      <div className="absolute -right-24 -top-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-12 bottom-0 w-64 h-64 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">

        {/* User Identity Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 flex-1 min-w-0">
          {/* Avatar with dynamic initials */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 border-2 border-white/20 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-950/50">
              {initials}
            </div>
            <div
              className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center shadow ${
                effectiveKyc === 'VERIFIED'
                  ? 'bg-emerald-500'
                  : effectiveKyc === 'PENDING'
                  ? 'bg-amber-500'
                  : 'bg-slate-600'
              }`}
              title={
                effectiveKyc === 'VERIFIED'
                  ? 'Tài khoản đã xác minh KYC'
                  : effectiveKyc === 'PENDING'
                  ? 'Hồ sơ KYC đang chờ duyệt'
                  : 'Chưa xác minh KYC'
              }
            >
              {effectiveKyc === 'VERIFIED' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              ) : effectiveKyc === 'PENDING' ? (
                <Clock className="w-3.5 h-3.5 text-white" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-white" />
              )}
            </div>
          </div>

          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {displayName}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs border flex items-center gap-1 ${tierStyle.badgeClass}`}>
                <Award className={`w-3.5 h-3.5 ${tierStyle.iconClass}`} />
                <span>{tierLabel}</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border inline-flex items-center gap-1 tabular-nums ${trustBadgeStyle}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Tín nhiệm {trustScore}/100</span>
              </span>
            </div>

            <p className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
              <span>Khách hàng VELORA</span>
              <span className="text-slate-500">•</span>
              <span>Thành viên từ {memberSince}</span>
              <span className="text-slate-500">•</span>
              {effectiveKyc === 'VERIFIED' ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Đã xác minh KYC
                </span>
              ) : effectiveKyc === 'PENDING' ? (
                <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  KYC đang chờ duyệt
                </span>
              ) : effectiveKyc === 'REJECTED' ? (
                <span className="inline-flex items-center gap-1 text-red-300 font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  KYC cần bổ sung lại
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Chưa xác minh KYC
                </span>
              )}
            </p>

            {/* Perks line */}
            <div className="text-[11px] text-amber-300/90 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{perks.join(' • ')}</span>
            </div>

            {/* Tier Progress Bar */}
            <div className="pt-1 max-w-md">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-300 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-blue-400" />
                  {nextTier ? (
                    tripsToNext > 0
                      ? `Còn ${tripsToNext} chuyến hoàn thành để lên hạng ${nextTierLabel}`
                      : `Đủ số chuyến — cần Tín nhiệm ≥ ${user?.requiredTrustScoreForNextTier || 80} để lên ${nextTierLabel}`
                  ) : (
                    'Bạn đang ở hạng thành viên cao nhất (Platinum)'
                  )}
                </span>
                <span className="text-slate-400 font-mono font-bold tabular-nums">{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${tierStyle.barClass}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Metric Cards: Tổng chuyến / Hoàn thành / Đang lưu hành / Sắp nhận xe */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 overflow-x-auto pb-1 sm:pb-0">

          <div className="bg-white/5 border border-white/10 hover:border-white/20 transition-all rounded-xl px-3.5 py-3 min-w-[88px] text-center backdrop-blur-md">
            <div className="text-2xl font-black tracking-tight text-white tabular-nums">
              {String(totalTrips).padStart(2, '0')}
            </div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Tổng đơn
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all rounded-xl px-3.5 py-3 min-w-[88px] text-center backdrop-blur-md">
            <div className="text-2xl font-black tracking-tight text-emerald-400 tabular-nums">
              {String(completedTrips).padStart(2, '0')}
            </div>
            <div className="text-[10px] font-semibold text-emerald-300/80 uppercase tracking-wider mt-0.5">
              Hoàn thành
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all rounded-xl px-3.5 py-3 min-w-[88px] text-center backdrop-blur-md">
            <div className="text-2xl font-black tracking-tight text-indigo-300 tabular-nums">
              {String(activeTrips).padStart(2, '0')}
            </div>
            <div className="text-[10px] font-semibold text-indigo-200/80 uppercase tracking-wider mt-0.5">
              Đang chạy
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all rounded-xl px-3.5 py-3 min-w-[88px] text-center backdrop-blur-md">
            <div className="text-2xl font-black tracking-tight text-amber-400 tabular-nums">
              {String(upcomingTrips).padStart(2, '0')}
            </div>
            <div className="text-[10px] font-semibold text-amber-300/80 uppercase tracking-wider mt-0.5">
              Sắp nhận
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-1.5 pl-1">
            <button
              onClick={onRefresh}
              disabled={refreshing}
              title="Đồng bộ dữ liệu mới nhất"
              className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer flex items-center justify-center border border-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-300' : ''}`} />
            </button>
            <Link
              to="/cars"
              title="Đặt thêm xe mới"
              className="p-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm flex items-center justify-center border border-blue-400/30"
            >
              <PlusCircle className="w-4 h-4" />
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ProfileHeaderBanner;
