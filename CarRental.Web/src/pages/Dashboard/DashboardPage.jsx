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
  Users,
  FileCheck
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
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500 space-y-3 flex-col">
        <RefreshCw size={28} className="animate-spin text-blue-900" />
        <p className="text-xs font-semibold">Đang tổng hợp dữ liệu kinh doanh & đội xe thời gian thực...</p>
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
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-950 tracking-tight">
              Trung Tâm Điều Hành & Doanh Thu
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Live Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Giám sát thời gian thực: Doanh thu tài chính, tỷ lệ khai thác đội xe và dòng sự kiện vận hành
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab buttons */}
          <div className="p-1 rounded-md bg-white border border-slate-200 flex items-center gap-1 text-xs shadow-xs">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-3 py-1.5 rounded font-semibold transition ${
                activeTab === 'OVERVIEW' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-zinc-950'
              }`}
            >
              Tổng Quan & Biểu Đồ
            </button>
            <button
              onClick={() => setActiveTab('FLEET_UTILIZATION')}
              className={`px-3 py-1.5 rounded font-semibold transition ${
                activeTab === 'FLEET_UTILIZATION' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-zinc-950'
              }`}
            >
              Hiệu Suất Đội Xe ({totalVehicles})
            </button>
          </div>

          <button
            onClick={fetchAnalytics}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md shadow-xs transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-blue-900' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Row (Strictly Clean White & Navy, Anti-AI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Revenue */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Doanh Thu</span>
            <div className="p-1.5 rounded bg-slate-100 text-blue-900 border border-slate-200">
              <CircleDollarSign size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-blue-900 tabular-nums tracking-tight">
              {formatCurrency(totalRev)}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
              <span className={`inline-flex items-center gap-0.5 font-bold ${
                growth >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {growth >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {growth >= 0 ? `+${growth}%` : `${growth}%`}
              </span>
              <span className="text-slate-500">so với tháng trước</span>
            </div>
          </div>
        </div>

        {/* Card 2: Fleet Utilization */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỷ Lệ Khai Thác Đội Xe</span>
            <div className="p-1.5 rounded bg-slate-100 text-blue-900 border border-slate-200">
              <BarChart3 size={16} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-blue-900 tabular-nums tracking-tight">
                {fleetUtil}%
              </span>
              <span className="text-xs text-slate-500 tabular-nums">({rentedVehicles}/{totalVehicles} xe lăn bánh)</span>
            </div>
            <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-blue-900 h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(5, fleetUtil)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 3: Rental Bookings */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lượt Thuê Xe</span>
            <div className="p-1.5 rounded bg-slate-100 text-blue-900 border border-slate-200">
              <Clock size={16} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-zinc-950 tabular-nums tracking-tight">
                {data?.totalRentalRequests ?? 0}
              </span>
              <span className="text-xs text-emerald-700 font-bold tabular-nums">({data?.completedRentals ?? 0} hoàn tất)</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="tabular-nums">{data?.pendingRequests ?? 0} đơn đang chờ duyệt</span>
            </p>
          </div>
        </div>

        {/* Card 4: Fleet Status */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Xe Sẵn Sàng Giao</span>
            <div className="p-1.5 rounded bg-slate-100 text-emerald-700 border border-slate-200">
              <Car size={16} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-emerald-700 tabular-nums tracking-tight">
                {readyVehicles} xe
              </span>
              <span className="text-xs text-slate-500 tabular-nums">/ {totalVehicles} xe</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 flex items-center justify-between">
              <span>Bảo dưỡng: <strong className="text-zinc-950 tabular-nums">{maintVehicles}</strong></span>
              <span>Sự cố: <strong className="text-zinc-950 tabular-nums">{data?.totalIncidents ?? 0}</strong></span>
            </p>
          </div>
        </div>

      </div>

      {activeTab === 'OVERVIEW' ? (
        <>
          {/* Main Visual: Revenue Chart & Fleet Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 6-Month Revenue Bar Visualization */}
            <div className="lg:col-span-2 p-6 rounded-lg bg-white border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-900" />
                    Doanh Thu 6 Tháng Gần Nhất
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thu nhập từ hợp đồng cho thuê và các khoản quyết toán phụ phí
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Tháng này ({data?.monthlyRevenue?.slice(-1)[0]?.monthLabel})</span>
                  <span className="text-base font-extrabold text-blue-900 block tabular-nums">
                    {formatCurrency(monthRev)}
                  </span>
                </div>
              </div>

              {/* Bar visualization */}
              <div className="pt-4 pb-2">
                <div className="grid grid-cols-6 gap-3 sm:gap-6 items-end h-48 border-b border-slate-200 pb-2">
                  {data?.monthlyRevenue?.map((item, idx) => {
                    const heightPercent = maxMonthRev > 0 
                      ? Math.max(8, Math.round((item.revenue / maxMonthRev) * 100)) 
                      : 8;
                    const isCurrent = idx === (data.monthlyRevenue.length - 1);

                    return (
                      <div key={item.monthLabel} className="flex flex-col items-center gap-2 h-full justify-end group">
                        {/* Hover Tooltip Value */}
                        <span className="text-[10px] text-slate-600 font-semibold opacity-0 group-hover:opacity-100 transition tabular-nums whitespace-nowrap">
                          {formatCurrency(item.revenue).slice(0, -2)}
                        </span>

                        {/* Bar */}
                        <div 
                          className={`w-full max-w-[38px] rounded-t-md transition-all duration-500 ${
                            isCurrent
                              ? 'bg-blue-900 shadow-xs'
                              : 'bg-slate-200 hover:bg-slate-300'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        ></div>

                        {/* Month Label */}
                        <span className={`text-[11px] font-semibold mt-1 ${
                          isCurrent ? 'text-blue-900 font-bold' : 'text-slate-500'
                        }`}>
                          {item.monthLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-900"></span>
                    <span>Tháng hiện tại</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-200"></span>
                    <span>Các tháng trước</span>
                  </span>
                </div>
                <span className="text-[11px]">Đơn vị: VNĐ</span>
              </div>
            </div>

            {/* Fleet Status Breakdown */}
            <div className="p-6 rounded-lg bg-white border border-slate-200 shadow-xs space-y-5">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                  <PieChart size={16} className="text-blue-900" />
                  Cơ Cấu Trạng Thái Đội Xe
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phân bổ trạng thái 27 phương tiện thời gian thực
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600 font-medium">Sẵn sàng bàn giao (READY)</span>
                    <span className="font-bold text-emerald-800 tabular-nums">
                      {readyVehicles} xe ({Math.round((readyVehicles / totalVehicles) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-2 rounded-full" 
                      style={{ width: `${(readyVehicles / totalVehicles) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600 font-medium">Đang cho thuê (RENTED)</span>
                    <span className="font-bold text-blue-900 tabular-nums">
                      {rentedVehicles} xe ({Math.round((rentedVehicles / totalVehicles) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-900 h-2 rounded-full" 
                      style={{ width: `${(rentedVehicles / totalVehicles) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600 font-medium">Bảo dưỡng & Gara sửa chữa</span>
                    <span className="font-bold text-amber-700 tabular-nums">
                      {maintVehicles} xe ({Math.round((maintVehicles / totalVehicles) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-amber-500 h-2 rounded-full" 
                      style={{ width: `${(maintVehicles / totalVehicles) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-zinc-950">Chỉ số khai thác:</div>
                <p>Mục tiêu tối ưu đội xe là đạt tỷ lệ khai thác trên 70% vào các dịp cuối tuần và ngày lễ.</p>
              </div>
            </div>

          </div>

          {/* Bottom Row: Top Cars & Live Operational Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top 5 Revenue Cars */}
            <div className="p-6 rounded-lg bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={16} className="text-blue-900" />
                  Top Xe Sinh Lời Cao Nhất
                </h3>
                <span className="text-xs text-slate-500">Tháng này</span>
              </div>

              <div className="space-y-3">
                {data?.topEarningVehicles?.map((v, i) => (
                  <div key={v.vehicleId} className="flex items-center justify-between p-2.5 rounded-md hover:bg-slate-50 transition border border-transparent hover:border-slate-200">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold tabular-nums">
                        {i + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-zinc-950">
                          {v.make} {v.model}
                        </div>
                        <span className="license-plate text-[9px] py-0.2">{v.licensePlate}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-blue-900 tabular-nums">
                        {formatCurrency(v.totalRevenue)}
                      </div>
                      <div className="text-[10px] text-slate-500 tabular-nums">
                        {v.rentCount} lượt ({v.rentDays} ngày)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Operational Activity Log */}
            <div className="p-6 rounded-lg bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} className="text-blue-900" />
                  Dòng Sự Kiện Vận Hành (Live Feed)
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              </div>

              <div className="space-y-3">
                {data?.recentActivities?.map((act, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-2.5 rounded-md hover:bg-slate-50 transition text-xs">
                    <div className="w-7 h-7 rounded bg-slate-100 text-blue-900 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                      <FileCheck size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-zinc-950 truncate">
                        {act.title || act.action}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {act.description || act.details}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                      {act.timeAgo || 'Vừa xong'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      ) : (
        /* TAB 2: FLEET UTILIZATION REPORT (Table for all 27 cars) */
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
                Báo Cáo Chi Tiết Khai Thác Toàn Bộ Đội Xe (27 Xe)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hiệu suất ngày lăn bánh, số lượt thuê và doanh thu đóng góp theo từng phương tiện
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 text-left">Phương tiện & Biển số</th>
                  <th className="py-3 px-4 text-left">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Số ODO</th>
                  <th className="py-3 px-4 text-center">Lượt thuê</th>
                  <th className="py-3 px-4 text-center">Ngày lăn bánh</th>
                  <th className="py-3 px-4 text-right">Doanh thu tích lũy</th>
                  <th className="py-3 px-4 text-right">Tỷ lệ khai thác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fleetReport?.vehicles?.map((car) => {
                  const isReady = car.status === 'READY';
                  const isRented = car.status === 'RENTED';

                  return (
                    <tr key={car.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-950">{car.make} {car.model}</div>
                        <span className="license-plate text-[9px] py-0.2 mt-0.5">{car.licensePlate}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={isReady ? 'badge-ready' : isRented ? 'badge-rented' : 'badge-maint'}>
                          {car.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center tabular-nums font-semibold text-slate-700">
                        {car.currentMileage?.toLocaleString() || '12,500'} km
                      </td>
                      <td className="py-3 px-4 text-center tabular-nums font-semibold text-zinc-950">
                        {car.rentCount || 0}
                      </td>
                      <td className="py-3 px-4 text-center tabular-nums text-slate-600">
                        {car.totalDaysRented || 0} ngày
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-extrabold text-blue-900">
                        {formatCurrency(car.totalRevenue || 0)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-bold text-zinc-950">
                        {car.utilizationRate || 0}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardPage;
