import React, { useState, useEffect } from 'react';
import { 
  CircleDollarSign, 
  Car, 
  Clock, 
  CheckCircle2, 
  Wrench, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  RefreshCw, 
  Calendar, 
  BarChart3, 
  ShieldCheck, 
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  PieChart,
  Users
} from 'lucide-react';
import analyticsService from '../../services/analyticsService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [fleetReport, setFleetReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // OVERVIEW, FLEET_UTILIZATION

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewRes, fleetRes] = await Promise.all([
        analyticsService.getDashboardOverview(),
        analyticsService.getFleetUtilization()
      ]);
      setData(overviewRes?.data || overviewRes);
      setFleetReport(fleetRes?.data || fleetRes);
    } catch (err) {
      console.error(err);
      setError('Không thể tải dữ liệu phân tích hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-zinc-400 space-y-3 flex-col">
        <RefreshCw size={32} className="animate-spin text-amber-400" />
        <p className="text-sm font-medium">Đang tổng hợp dữ liệu kinh doanh & đội xe thời gian thực...</p>
      </div>
    );
  }

  // Fallbacks if data empty
  const totalRev = data?.totalRevenue ?? 0;
  const monthRev = data?.thisMonthRevenue ?? 0;
  const growth = data?.revenueGrowthPercent ?? 0;
  const fleetUtil = data?.fleetUtilizationRate ?? 0;
  const totalVehicles = data?.totalVehicles ?? 27;
  const readyVehicles = data?.availableVehicles ?? 0;
  const rentedVehicles = data?.rentedVehicles ?? 0;
  const maintVehicles = (data?.maintenanceVehicles ?? 0) + (data?.repairVehicles ?? 0);

  const maxMonthRev = Math.max(...(data?.monthlyRevenue?.map(m => m.revenue) || [1000000]));

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-light text-white tracking-wide">
              Tổng Quan Điều Hành (US-25)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Data
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Báo cáo doanh thu tài chính, hiệu suất khai thác đội xe và giám sát vận hành thời gian thực
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab buttons */}
          <div className="p-1 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'OVERVIEW' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tổng Quan & Doanh Thu
            </button>
            <button
              onClick={() => setActiveTab('FLEET_UTILIZATION')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'FLEET_UTILIZATION' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Hiệu Suất Đội Xe ({totalVehicles})
            </button>
          </div>

          <button
            onClick={fetchAnalytics}
            className="p-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl transition flex items-center gap-1.5 text-xs"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1: Total Revenue */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-lg group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Tổng Doanh Thu</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CircleDollarSign size={20} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-light text-white tracking-tight">
              {formatCurrency(totalRev)}
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className={`inline-flex items-center gap-0.5 font-semibold ${
                growth >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {growth >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {growth >= 0 ? `+${growth}%` : `${growth}%`}
              </span>
              <span className="text-zinc-500">so với tháng trước</span>
            </div>
          </div>
        </div>

        {/* Card 2: Fleet Utilization */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-lg group hover:border-purple-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Tỷ Lệ Khai Thác Đội Xe</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <BarChart3 size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-light text-white tracking-tight">
                {fleetUtil}%
              </p>
              <span className="text-xs text-zinc-400">({rentedVehicles}/{totalVehicles} xe đang lưu hành)</span>
            </div>
            <div className="mt-2.5 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-purple-500 h-1.5 rounded-full transition-all duration-1000"
                style={{ width: `${Math.max(5, fleetUtil)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 3: Rental Requests */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-lg group hover:border-blue-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Lượt Thuê Xe</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-light text-white tracking-tight">
                {data?.totalRentalRequests ?? 0}
              </p>
              <span className="text-xs text-emerald-400 font-medium">({data?.completedRentals ?? 0} hoàn tất)</span>
            </div>
            <p className="mt-2 text-xs text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>{data?.pendingRequests ?? 0} đơn đang chờ duyệt</span>
            </p>
          </div>
        </div>

        {/* Card 4: Operations & Health */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-lg group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Sẵn Sàng Khai Thác</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Car size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-light text-emerald-400 tracking-tight">
                {readyVehicles} xe
              </p>
              <span className="text-xs text-zinc-400">/ {totalVehicles} xe</span>
            </div>
            <p className="mt-2 text-xs text-zinc-400 flex items-center justify-between">
              <span>Bảo dưỡng / Gara: {maintVehicles}</span>
              <span>Sự cố: {data?.totalIncidents ?? 0}</span>
            </p>
          </div>
        </div>

      </div>

      {activeTab === 'OVERVIEW' ? (
        <>
          {/* Main Visual: Revenue Chart & Fleet Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 6-Month Revenue Bar Visualization */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <TrendingUp size={18} className="text-amber-400" />
                    Biểu Đồ Doanh Thu 6 Tháng Gần Nhất
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Thu nhập từ hợp đồng thuê xe và các khoản phụ phí quyết toán
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-500 block">Tháng này ({data?.monthlyRevenue?.slice(-1)[0]?.monthLabel})</span>
                  <span className="text-base font-semibold text-amber-400 block">
                    {formatCurrency(monthRev)}
                  </span>
                </div>
              </div>

              {/* Bar visualization */}
              <div className="pt-6 pb-2">
                <div className="grid grid-cols-6 gap-3 sm:gap-6 items-end h-52 border-b border-zinc-800 pb-2">
                  {data?.monthlyRevenue?.map((item, idx) => {
                    const heightPercent = maxMonthRev > 0 
                      ? Math.max(8, Math.round((item.revenue / maxMonthRev) * 100)) 
                      : 8;
                    const isCurrent = idx === (data.monthlyRevenue.length - 1);

                    return (
                      <div key={item.monthLabel} className="flex flex-col items-center gap-2 h-full justify-end group">
                        {/* Hover Tooltip Value */}
                        <span className="text-[10px] text-zinc-400 font-medium opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                          {formatCurrency(item.revenue).slice(0, -2)}
                        </span>

                        {/* Bar */}
                        <div 
                          className={`w-full max-w-[42px] rounded-t-xl transition-all duration-700 relative overflow-hidden ${
                            isCurrent
                              ? 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-lg shadow-amber-500/20'
                              : 'bg-gradient-to-t from-zinc-800 to-zinc-700 hover:from-zinc-700 hover:to-zinc-600'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        >
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition"></div>
                        </div>

                        {/* Month Label */}
                        <span className={`text-[11px] font-medium mt-1 ${
                          isCurrent ? 'text-amber-400 font-semibold' : 'text-zinc-500'
                        }`}>
                          {item.monthLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/60">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-zinc-700"></span>
                    Các tháng trước
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-amber-400"></span>
                    Tháng hiện tại
                  </span>
                </div>
                <span>Tự động cập nhật từ hệ thống kế toán</span>
              </div>
            </div>

            {/* Fleet Composition Card */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <PieChart size={18} className="text-purple-400" />
                  Cơ Cấu Trạng Thái Đội Xe
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Tổng quy mô: <span className="text-white font-semibold">{totalVehicles} xe</span>
                </p>

                {/* Progress bar stack */}
                <div className="mt-6 space-y-3">
                  <div className="w-full bg-zinc-800 h-3 rounded-full flex overflow-hidden">
                    <div 
                      style={{ width: `${(readyVehicles / totalVehicles) * 100}%` }} 
                      className="bg-emerald-500 h-full" 
                      title="Sẵn sàng"
                    />
                    <div 
                      style={{ width: `${(rentedVehicles / totalVehicles) * 100}%` }} 
                      className="bg-purple-500 h-full" 
                      title="Đang thuê"
                    />
                    <div 
                      style={{ width: `${(maintVehicles / totalVehicles) * 100}%` }} 
                      className="bg-amber-500 h-full" 
                      title="Bảo dưỡng/Gara"
                    />
                  </div>

                  <div className="space-y-2.5 pt-2 text-xs">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                      <span className="flex items-center gap-2 text-zinc-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        Sẵn sàng cho thuê (READY)
                      </span>
                      <span className="font-semibold text-emerald-400">{readyVehicles} xe ({Math.round(readyVehicles/totalVehicles*100)}%)</span>
                    </div>

                    <div className="flex justify-between items-center p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                      <span className="flex items-center gap-2 text-zinc-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                        Đang lưu hành thuê (RENTED)
                      </span>
                      <span className="font-semibold text-purple-400">{rentedVehicles} xe ({Math.round(rentedVehicles/totalVehicles*100)}%)</span>
                    </div>

                    <div className="flex justify-between items-center p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                      <span className="flex items-center gap-2 text-zinc-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        Đang bảo dưỡng / Sửa chữa
                      </span>
                      <span className="font-semibold text-amber-400">{maintVehicles} xe ({Math.round(maintVehicles/totalVehicles*100)}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Health Summary */}
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-400 space-y-1">
                <span className="text-zinc-300 font-semibold block">Chỉ số vận hành:</span>
                <p>• Trả xe trễ hạn: <span className="text-white font-medium">{data?.lateReturnsCount ?? 0} trường hợp</span></p>
                <p>• Gia hạn thuê: <span className="text-white font-medium">{data?.activeExtensions ?? 0} yêu cầu</span></p>
                <p>• Sự cố phát sinh: <span className="text-white font-medium">{data?.totalIncidents ?? 0} vụ</span></p>
              </div>
            </div>

          </div>

          {/* Bottom Row: Top Vehicles & Live Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top 5 Revenue Vehicles */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-400" />
                  Top Dòng Xe Doanh Thu Cao Nhất
                </h3>
                <span className="text-xs text-zinc-500">Đóng góp nhiều nhất</span>
              </div>

              <div className="divide-y divide-zinc-800/80 text-xs">
                {data?.topVehicles?.map((veh, i) => (
                  <div key={veh.vehicleId} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                        i === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                        i === 1 ? 'bg-zinc-700 text-zinc-200' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {i + 1}
                      </span>
                      {veh.imageUrl ? (
                        <img 
                          src={veh.imageUrl} 
                          alt={veh.model} 
                          className="w-12 h-9 object-cover rounded-lg border border-zinc-800 flex-shrink-0" 
                        />
                      ) : (
                        <div className="w-12 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600">
                          <Car size={16} />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white">{veh.make} {veh.model}</p>
                        <p className="text-[11px] text-zinc-400 font-mono">{veh.licensePlate} • {veh.rentalCount} lượt thuê</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-amber-400">{formatCurrency(veh.totalRevenue)}</p>
                      <p className="text-[10px] text-zinc-500">Tổng thu</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Recent Activities */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Clock size={18} className="text-blue-400" />
                  Nhật Ký Vận Hành Mới Nhất
                </h3>
                <span className="text-xs text-zinc-500">Thời gian thực</span>
              </div>

              <div className="divide-y divide-zinc-800/80 text-xs">
                {data?.recentActivities?.map((act) => (
                  <div key={act.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        act.type === 'REQUEST' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                        act.type === 'RETURN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {act.type === 'REQUEST' ? <Clock size={14} /> :
                         act.type === 'RETURN' ? <CheckCircle2 size={14} /> :
                         <AlertTriangle size={14} />}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{act.title}</p>
                        <p className="text-[11px] text-zinc-400">{act.subtitle}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block">
                        {formatDateTime(act.timestamp).slice(11, 16)} {formatDateTime(act.timestamp).slice(0, 10)}
                      </span>
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase">
                        {act.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      ) : (
        /* TAB 2: DETAILED FLEET UTILIZATION REPORT */
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Báo Cáo Hiệu Suất & Tỷ Lệ Khai Thác Đội Xe
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Theo dõi số lượt thuê, tổng ngày lăn bánh, doanh thu mang lại và lịch sử sự cố từng xe
              </p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-4 text-xs">
              <div>
                <span className="text-zinc-500 block text-[10px]">Tỷ lệ khai thác chung</span>
                <span className="text-base font-bold text-purple-400">{fleetReport?.overallUtilizationRate ?? fleetUtil}%</span>
              </div>
              <div className="w-px h-8 bg-zinc-800"></div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Xe đang cho thuê</span>
                <span className="text-base font-bold text-white">{fleetReport?.currentlyRentedCount ?? rentedVehicles} xe</span>
              </div>
            </div>
          </div>

          {/* Detailed Vehicle Table */}
          <div className="overflow-x-auto border border-zinc-800/80 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3.5 font-semibold">Phương tiện</th>
                  <th className="px-4 py-3.5 font-semibold">Biển số</th>
                  <th className="px-4 py-3.5 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3.5 font-semibold">ODO hiện tại</th>
                  <th className="px-4 py-3.5 font-semibold">Lượt thuê</th>
                  <th className="px-4 py-3.5 font-semibold">Tổng ngày thuê</th>
                  <th className="px-4 py-3.5 font-semibold">Tỷ lệ khai thác %</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Doanh thu đóng góp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {fleetReport?.vehicles?.map((veh) => (
                  <tr key={veh.vehicleId} className="hover:bg-zinc-900/60 transition">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-white">{veh.make} {veh.model}</p>
                      <p className="text-[11px] text-zinc-500">Đời {veh.manufactureYear} • {formatCurrency(veh.dailyRate)}/ngày</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                        {veh.licensePlate}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        veh.status === 'READY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        veh.status === 'RENTED' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                        veh.status === 'MAINTENANCE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {veh.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-300 font-mono">
                      {veh.currentMileage.toLocaleString()} km
                    </td>
                    <td className="px-4 py-3.5 text-zinc-300">
                      {veh.totalRentalCount} lượt
                    </td>
                    <td className="px-4 py-3.5 text-zinc-300">
                      {veh.totalDaysRented} ngày
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white w-10">{veh.utilizationPercentage}%</span>
                        <div className="w-16 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-purple-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, veh.utilizationPercentage)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-amber-400">
                      {formatCurrency(veh.totalRevenueGenerated)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardPage;
