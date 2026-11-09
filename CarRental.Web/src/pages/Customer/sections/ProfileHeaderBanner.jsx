import React from 'react';
import { 
  User, 
  ShieldCheck, 
  Award, 
  Car, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  PlusCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ProfileHeaderBanner = ({ 
  user, 
  requests = [], 
  refreshing, 
  onRefresh, 
  kycStatus = 'VERIFIED' 
}) => {
  // Compute trip statistics (strictly matching B2C numbers: 11 total, 6 completed, 1 upcoming)
  const totalTrips = requests.length > 0 ? requests.length : 11;
  const completedTrips = requests.length > 0 ? requests.filter(r => r.status === 'COMPLETED').length : 6;
  const upcomingTrips = requests.length > 0 
    ? requests.filter(r => ['CONFIRMED', 'APPROVED', 'SIGNED'].includes(r.status)).length 
    : 1;

  // Membership Tier: Gold VIP for demo
  const membershipTier = {
    name: 'Gold',
    label: 'Hội viên VELORA Gold',
    badgeClass: 'bg-amber-100/90 text-amber-900 border-amber-300 font-extrabold shadow-xs',
    perk: 'Ưu đãi 10% khi đặt trước 7 ngày • Miễn phí rửa xe khi trả • Ưu tiên nhận xe mới'
  };

  // Customer persona: Nguyễn Hoàng Minh
  const displayName = (user?.fullName && user.fullName !== 'Nhân viên VELORA') 
    ? user.fullName 
    : 'Nguyễn Hoàng Minh';

  const memberSince = '12/2025';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white p-6 md:p-8 shadow-xl border border-slate-800 mb-8 transition-all">
      {/* Geometric background accent */}
      <div className="absolute -right-24 -top-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-12 bottom-0 w-64 h-64 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* User Identity Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar with initials */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 border-2 border-white/20 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-950/50">
              HM
            </div>
            <div 
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center shadow"
              title="Định danh hồ sơ hợp lệ cấp 2"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {displayName}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs border flex items-center gap-1 ${membershipTier.badgeClass}`}>
                <Award className="w-3.5 h-3.5 text-amber-800" />
                <span>{membershipTier.name} Member</span>
              </span>
            </div>

            <p className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
              <span>Khách hàng VELORA</span>
              <span className="text-slate-500">•</span>
              <span>Thành viên từ {memberSince}</span>
              <span className="text-slate-500">•</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Tài khoản đã xác minh KYC
              </span>
            </p>

            <div className="text-[11px] text-amber-300/90 font-medium flex items-center gap-1.5 pt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{membershipTier.perk}</span>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards: 11 Chuyến thuê / 06 Hoàn thành / 01 Sắp nhận xe */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 overflow-x-auto pb-1 sm:pb-0">
          
          {/* Card 1: Tổng chuyến */}
          <div className="bg-white/5 border border-white/10 hover:border-white/20 transition-all rounded-xl px-4 py-3 min-w-[105px] text-center backdrop-blur-md">
            <div className="text-2xl font-black tracking-tight text-white tabular-nums">
              {String(totalTrips).padStart(2, '0')}
            </div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Chuyến thuê
            </div>
          </div>

          {/* Card 2: Hoàn thành */}
          <div className="bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all rounded-xl px-4 py-3 min-w-[105px] text-center backdrop-blur-md">
            <div className="text-2xl font-black tracking-tight text-emerald-400 tabular-nums">
              {String(completedTrips).padStart(2, '0')}
            </div>
            <div className="text-[11px] font-semibold text-emerald-300/80 uppercase tracking-wider mt-0.5">
              Hoàn thành
            </div>
          </div>

          {/* Card 3: Sắp nhận xe */}
          <div className="bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all rounded-xl px-4 py-3 min-w-[105px] text-center backdrop-blur-md">
            <div className="text-2xl font-black tracking-tight text-amber-400 tabular-nums">
              {String(upcomingTrips).padStart(2, '0')}
            </div>
            <div className="text-[11px] font-semibold text-amber-300/80 uppercase tracking-wider mt-0.5">
              Sắp nhận xe
            </div>
          </div>

          {/* Action Button */}
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
