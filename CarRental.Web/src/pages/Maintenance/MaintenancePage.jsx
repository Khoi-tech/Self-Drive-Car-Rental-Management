import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Car, 
  Search, 
  RefreshCw, 
  Plus, 
  ShieldAlert, 
  DollarSign, 
  ArrowRight, 
  FileText, 
  X,
  Gauge,
  Sparkles,
  Check,
  AlertCircle
} from 'lucide-react';
import maintenanceService from '../../services/maintenanceService';
import vehicleService from '../../services/vehicleService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const MAINTENANCE_TYPE_MAP = {
  ROUTINE: { label: 'Định kỳ tiêu chuẩn', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
  OIL_CHANGE: { label: 'Thay dầu & Lọc nhớt', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
  TIRE_BRAKE: { label: 'Thay Lốp & Má phanh', bg: 'bg-orange-100 text-orange-800 border-orange-200' },
  INSPECTION: { label: 'Đăng kiểm lưu hành', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
  REPAIR: { label: 'Đại tu kỹ thuật', bg: 'bg-rose-100 text-rose-800 border-rose-200' }
};

const STATUS_CONFIG = {
  SCHEDULED: { label: 'Đã lên lịch', bg: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
  IN_PROGRESS: { label: 'Đang bảo dưỡng', bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: Wrench },
  COMPLETED: { label: 'Hoàn tất', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  CANCELLED: { label: 'Đã hủy', bg: 'bg-zinc-100 text-zinc-600 border-zinc-200', icon: X }
};

const URGENCY_CONFIG = {
  CRITICAL: { label: 'Cần bảo dưỡng ngay', bg: 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' },
  WARNING: { label: 'Sắp đến hạn', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
  NORMAL: { label: 'Bình thường', bg: 'bg-zinc-100 text-zinc-700 border-zinc-200' }
};

const MaintenancePage = () => {
  const [activeTab, setActiveTab] = useState('ALERTS'); // 'ALERTS' or 'RECORDS'
  const [alerts, setAlerts] = useState([]);
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State: Create Schedule
  const [createForm, setCreateForm] = useState({
    carId: '',
    maintenanceType: 'ROUTINE',
    title: 'Bảo dưỡng định kỳ cấp 10,000 km',
    garageName: 'Gara chính hãng VELORA Care',
    cost: 1500000,
    odoAtMaintenance: 0,
    scheduledDate: new Date().toISOString().slice(0, 16),
    details: 'Thay nhớt tổng hợp, lọc nhớt, vệ sinh lọc gió, kiểm tra phanh và áp suất lốp.'
  });

  // Form State: Complete Maintenance
  const [completeForm, setCompleteForm] = useState({
    actualCost: 0,
    completedDate: new Date().toISOString().slice(0, 16),
    details: 'Đã hoàn tất bảo dưỡng các hạng mục theo quy chuẩn kỹ thuật VELORA.',
    nextMaintenanceMileage: 0,
    nextMaintenanceDate: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [alertsRes, recordsRes, vehiclesRes] = await Promise.all([
        maintenanceService.getAlerts(),
        maintenanceService.getAll(),
        vehicleService.getAllVehicles()
      ]);

      setAlerts(Array.isArray(alertsRes) ? alertsRes : (alertsRes?.data || []));
      setRecords(Array.isArray(recordsRes) ? recordsRes : (recordsRes?.data || []));
      setVehicles(Array.isArray(vehiclesRes) ? vehiclesRes : (vehiclesRes?.data || []));
    } catch (err) {
      console.error(err);
      setError('Không thể tải dữ liệu bảo dưỡng xe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter alerts
  const filteredAlerts = alerts.filter(item => {
    const s = searchTerm.toLowerCase();
    return !searchTerm ||
      item.carLicensePlate?.toLowerCase().includes(s) ||
      item.carMake?.toLowerCase().includes(s) ||
      item.carModel?.toLowerCase().includes(s) ||
      item.alertReason?.toLowerCase().includes(s);
  });

  // Filter records
  const filteredRecords = records.filter(item => {
    const s = searchTerm.toLowerCase();
    return !searchTerm ||
      item.maintenanceCode?.toLowerCase().includes(s) ||
      item.carLicensePlate?.toLowerCase().includes(s) ||
      item.carMake?.toLowerCase().includes(s) ||
      item.carModel?.toLowerCase().includes(s) ||
      item.garageName?.toLowerCase().includes(s) ||
      item.title?.toLowerCase().includes(s);
  });

  const criticalCount = alerts.filter(a => a.urgencyLevel === 'CRITICAL').length;
  const warningCount = alerts.filter(a => a.urgencyLevel === 'WARNING').length;
  const inProgressCount = records.filter(r => r.status === 'SCHEDULED' || r.status === 'IN_PROGRESS').length;

  const handleOpenCreateForCar = (car) => {
    const mileage = car.currentMileage || car.mileage || 0;
    setCreateForm({
      carId: car.carId || car.id,
      maintenanceType: 'ROUTINE',
      title: `Bảo dưỡng định kỳ ODO ${mileage.toLocaleString()} km`,
      garageName: 'Gara chính hãng VELORA Care',
      cost: 1500000,
      odoAtMaintenance: mileage,
      scheduledDate: new Date().toISOString().slice(0, 16),
      details: 'Kiểm tra tổng quát động cơ, thay dầu nhớt, kiểm tra hệ thống phanh, điện chiếu sáng.'
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.carId) {
      alert('Vui lòng chọn xe bảo dưỡng!');
      return;
    }
    try {
      setActionLoading(true);
      await maintenanceService.create({
        ...createForm,
        cost: Number(createForm.cost) || 0,
        odoAtMaintenance: Number(createForm.odoAtMaintenance) || 0,
        scheduledDate: new Date(createForm.scheduledDate).toISOString()
      });
      alert('Đã lập lịch bảo dưỡng xe thành công! Xe đã được chuyển sang trạng thái MAINTENANCE.');
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi tạo lịch bảo dưỡng.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenComplete = (record) => {
    setSelectedRecord(record);
    const nextMileage = (record.odoAtMaintenance || record.currentMileage || 0) + 10000;
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 6);

    setCompleteForm({
      actualCost: record.cost || 0,
      completedDate: new Date().toISOString().slice(0, 16),
      details: record.details || 'Đã kiểm tra và hoàn thành các hạng mục bảo dưỡng theo lịch.',
      nextMaintenanceMileage: nextMileage,
      nextMaintenanceDate: nextDate.toISOString().slice(0, 10)
    });
    setIsCompleteModalOpen(true);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      setActionLoading(true);
      await maintenanceService.complete(selectedRecord.id, {
        actualCost: Number(completeForm.actualCost) || 0,
        completedDate: new Date(completeForm.completedDate).toISOString(),
        details: completeForm.details,
        nextMaintenanceMileage: Number(completeForm.nextMaintenanceMileage) || null,
        nextMaintenanceDate: completeForm.nextMaintenanceDate ? new Date(completeForm.nextMaintenanceDate).toISOString() : null
      });
      alert('Đã hoàn tất bảo dưỡng! Xe đã được chuyển trạng thái về READY để tiếp tục phục vụ khách hàng.');
      setIsCompleteModalOpen(false);
      setSelectedRecord(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi khi cập nhật hoàn tất bảo dưỡng.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            Quản Lý Kế Hoạch Bảo Dưỡng Xe (US-24)
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-900 text-white font-mono">
              Sprint 4
            </span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Theo dõi cảnh báo định kỳ theo ODO/thời gian, tự động chuyển xe sang MAINTENANCE và khôi phục READY khi hoàn tất
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-300 rounded-lg text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50 transition shadow-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>

          <button
            onClick={() => {
              setCreateForm({
                carId: '',
                maintenanceType: 'ROUTINE',
                title: 'Bảo dưỡng định kỳ',
                garageName: 'Gara chính hãng VELORA Care',
                cost: 1500000,
                odoAtMaintenance: 0,
                scheduledDate: new Date().toISOString().slice(0, 16),
                details: 'Bảo dưỡng tổng quát định kỳ'
              });
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm transition"
          >
            <Plus size={16} />
            Lập lịch bảo dưỡng mới
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-rose-600" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 uppercase font-semibold">Tổng xe đội xe</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{vehicles.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600">
            <Car size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm flex items-center justify-between bg-gradient-to-br from-rose-50/50 to-white">
          <div>
            <p className="text-xs text-rose-700 uppercase font-semibold">Khẩn cấp cần bảo dưỡng</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{criticalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm flex items-center justify-between bg-gradient-to-br from-amber-50/50 to-white">
          <div>
            <p className="text-xs text-amber-700 uppercase font-semibold">Cảnh báo sắp đến hạn</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{warningCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm flex items-center justify-between bg-gradient-to-br from-blue-50/50 to-white">
          <div>
            <p className="text-xs text-blue-700 uppercase font-semibold">Đang bảo dưỡng / Lên lịch</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{inProgressCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
            <Wrench size={20} />
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex border-b border-zinc-200 w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('ALERTS')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'ALERTS'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <AlertCircle size={16} />
              <span>Cảnh Báo Đến Hạn ({alerts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('RECORDS')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'RECORDS'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <Calendar size={16} />
              <span>Lịch Sử & Tiến Độ Bảo Dưỡng ({records.length})</span>
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Tìm biển số, mẫu xe, gara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
        </div>

        {/* TAB 1: ALERTS TABLE */}
        {activeTab === 'ALERTS' && (
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full text-left text-sm text-zinc-600">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-3">Xe & Biển số</th>
                  <th className="px-4 py-3">Trạng thái xe</th>
                  <th className="px-4 py-3 text-right">Số ODO hiện tại</th>
                  <th className="px-4 py-3 text-right">Định mức kế tiếp</th>
                  <th className="px-4 py-3 text-center">Mức độ khẩn</th>
                  <th className="px-4 py-3">Lý do cảnh báo</th>
                  <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-zinc-500">
                      <div className="inline-flex items-center gap-2">
                        <RefreshCw size={18} className="animate-spin text-zinc-400" />
                        <span>Đang phân tích dữ liệu bảo dưỡng xe...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-zinc-400">
                      <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500" />
                      <p className="font-medium text-zinc-700">Tất cả xe đều an toàn và chưa đến hạn bảo dưỡng!</p>
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((item) => {
                    const urgency = URGENCY_CONFIG[item.urgencyLevel] || URGENCY_CONFIG.NORMAL;

                    return (
                      <tr key={item.carId} className="hover:bg-zinc-50/80 transition">
                        
                        {/* Vehicle */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-zinc-900">{item.carMake} {item.carModel}</div>
                          <div className="text-xs font-mono text-zinc-500">{item.carLicensePlate}</div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-700 border">
                            {item.carStatus}
                          </span>
                        </td>

                        {/* Current Mileage */}
                        <td className="px-4 py-3 text-right font-mono font-bold text-zinc-900">
                          {item.currentMileage?.toLocaleString()} km
                        </td>

                        {/* Next Target */}
                        <td className="px-4 py-3 text-right text-xs">
                          <div className="font-mono text-zinc-600">
                            {item.nextMaintenanceMileage ? `${item.nextMaintenanceMileage.toLocaleString()} km` : 'Chưa định mức'}
                          </div>
                          {item.remainingKmUntilMaintenance != null && (
                            <div className={`text-[11px] font-bold ${item.remainingKmUntilMaintenance < 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                              {item.remainingKmUntilMaintenance < 0 
                                ? `Quá hạn ${Math.abs(item.remainingKmUntilMaintenance).toLocaleString()} km` 
                                : `Còn ${item.remainingKmUntilMaintenance.toLocaleString()} km`}
                            </div>
                          )}
                        </td>

                        {/* Urgency */}
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${urgency.bg}`}>
                            {urgency.label}
                          </span>
                        </td>

                        {/* Reason */}
                        <td className="px-4 py-3 text-xs text-zinc-700 font-medium">
                          {item.alertReason}
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleOpenCreateForCar(item)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-sm inline-flex items-center gap-1"
                          >
                            <Wrench size={13} />
                            <span>Lập lịch ngay</span>
                          </button>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: RECORDS TABLE */}
        {activeTab === 'RECORDS' && (
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full text-left text-sm text-zinc-600">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-3">Mã phiếu / Ngày hẹn</th>
                  <th className="px-4 py-3">Xe bảo dưỡng</th>
                  <th className="px-4 py-3">Hạng mục & Gara</th>
                  <th className="px-4 py-3 text-right">Chi phí (Dự kiến/Thực tế)</th>
                  <th className="px-4 py-3 text-right">ODO bảo dưỡng</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-zinc-500">
                      <div className="inline-flex items-center gap-2">
                        <RefreshCw size={18} className="animate-spin text-zinc-400" />
                        <span>Đang tải lịch sử bảo dưỡng...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-zinc-400">
                      <FileText size={36} className="mx-auto mb-2 text-zinc-300" />
                      <p className="font-medium text-zinc-700">Chưa có phiếu bảo dưỡng nào được ghi nhận</p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item) => {
                    const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.SCHEDULED;
                    const StatusIcon = statusInfo.icon;
                    const typeInfo = MAINTENANCE_TYPE_MAP[item.maintenanceType] || MAINTENANCE_TYPE_MAP.ROUTINE;

                    return (
                      <tr key={item.id} className="hover:bg-zinc-50/80 transition">
                        
                        {/* Code & Schedule */}
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-zinc-900">{item.maintenanceCode || 'MNT-PENDING'}</div>
                          <div className="text-xs text-zinc-500">{formatDateTime(item.scheduledDate).slice(0, 16)}</div>
                        </td>

                        {/* Vehicle */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-zinc-900">{item.carMake} {item.carModel}</div>
                          <div className="text-xs font-mono text-zinc-500">{item.carLicensePlate}</div>
                        </td>

                        {/* Type & Garage */}
                        <td className="px-4 py-3 text-xs">
                          <div className="font-semibold text-zinc-900">{item.title}</div>
                          <div className="text-zinc-500 flex items-center gap-1.5 mt-0.5">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${typeInfo.bg}`}>
                              {typeInfo.label}
                            </span>
                            <span>{item.garageName}</span>
                          </div>
                        </td>

                        {/* Cost */}
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          <div className="font-bold text-zinc-900">{formatCurrency(item.cost)}</div>
                          {item.completedDate && (
                            <div className="text-[11px] text-emerald-600">
                              Xong: {formatDateTime(item.completedDate).slice(0, 10)}
                            </div>
                          )}
                        </td>

                        {/* ODO */}
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          <div className="font-medium text-zinc-800">{item.odoAtMaintenance?.toLocaleString()} km</div>
                          {item.nextMaintenanceMileage && (
                            <div className="text-[11px] text-zinc-400">
                              Tiếp: {item.nextMaintenanceMileage?.toLocaleString()} km
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.bg}`}>
                            <StatusIcon size={12} />
                            {statusInfo.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          {item.status !== 'COMPLETED' && item.status !== 'CANCELLED' ? (
                            <button
                              onClick={() => handleOpenComplete(item)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm inline-flex items-center gap-1"
                              title="Nghiệm thu hoàn tất bảo dưỡng"
                            >
                              <CheckCircle2 size={13} />
                              <span>Hoàn tất</span>
                            </button>
                          ) : (
                            <span className="text-xs text-zinc-400 italic">Đã nghiệm thu</span>
                          )}
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Modal 1: Lập Lịch Bảo Dưỡng Mới (US-24) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-blue-800 flex items-center gap-2">
                <Wrench size={20} />
                <span>Lập Lịch Bảo Dưỡng Xe Mới</span>
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              
              {/* Chọn xe */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700">Chọn xe bảo dưỡng:</label>
                <select
                  value={createForm.carId}
                  onChange={(e) => {
                    const selCar = vehicles.find(v => v.id === e.target.value);
                    const mileage = selCar ? (selCar.currentMileage || selCar.mileage || 0) : 0;
                    setCreateForm({
                      ...createForm,
                      carId: e.target.value,
                      odoAtMaintenance: mileage,
                      title: `Bảo dưỡng định kỳ ODO ${mileage.toLocaleString()} km`
                    });
                  }}
                  required
                  className="w-full p-2.5 border border-zinc-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-600"
                >
                  <option value="">-- Chọn xe từ danh sách --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model} ({v.licensePlate}) - Trạng thái: {v.status}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-blue-600">
                  Lưu ý: Sau khi lưu lịch, xe sẽ tự động chuyển trạng thái sang MAINTENANCE (Tạm ngừng cho thuê).
                </p>
              </div>

              {/* Loại bảo dưỡng */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Loại bảo dưỡng:</label>
                  <select
                    value={createForm.maintenanceType}
                    onChange={(e) => setCreateForm({ ...createForm, maintenanceType: e.target.value })}
                    className="w-full p-2 border border-zinc-300 rounded-lg text-xs bg-white"
                  >
                    <option value="ROUTINE">Định kỳ tiêu chuẩn</option>
                    <option value="OIL_CHANGE">Thay dầu & Lọc nhớt</option>
                    <option value="TIRE_BRAKE">Thay Lốp & Má phanh</option>
                    <option value="INSPECTION">Đăng kiểm lưu hành</option>
                    <option value="REPAIR">Đại tu sửa chữa</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Số ODO lúc bảo dưỡng:</label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.odoAtMaintenance}
                    onChange={(e) => setCreateForm({ ...createForm, odoAtMaintenance: e.target.value })}
                    className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Tiêu đề & Gara */}
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Tiêu đề phiếu bảo dưỡng:</label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Gara tiếp nhận:</label>
                  <input
                    type="text"
                    required
                    value={createForm.garageName}
                    onChange={(e) => setCreateForm({ ...createForm, garageName: e.target.value })}
                    className="w-full p-2 border border-zinc-300 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Chi phí dự kiến (VNĐ):</label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={createForm.cost}
                    onChange={(e) => setCreateForm({ ...createForm, cost: e.target.value })}
                    className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Ngày hẹn */}
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Ngày giờ hẹn vào gara:</label>
                <input
                  type="datetime-local"
                  required
                  value={createForm.scheduledDate}
                  onChange={(e) => setCreateForm({ ...createForm, scheduledDate: e.target.value })}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs"
                />
              </div>

              {/* Chi tiết hạng mục */}
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Chi tiết các hạng mục kiểm tra:</label>
                <textarea
                  rows="3"
                  value={createForm.details}
                  onChange={(e) => setCreateForm({ ...createForm, details: e.target.value })}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  {actionLoading ? 'Đang lưu...' : 'Xác Nhận Lập Lịch'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Nghiệm Thu Hoàn Tất Bảo Dưỡng (US-24) */}
      {isCompleteModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 size={20} />
                <span>Nghiệm Thu Hoàn Tất Bảo Dưỡng</span>
              </h3>
              <button onClick={() => setIsCompleteModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div>Xe: <strong>{selectedRecord.carMake} {selectedRecord.carModel}</strong> ({selectedRecord.carLicensePlate})</div>
              <div>Hạng mục: <strong>{selectedRecord.title}</strong></div>
              <div>Gara: <strong>{selectedRecord.garageName}</strong></div>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-3.5 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Chi phí thực tế (VNĐ):</label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    required
                    value={completeForm.actualCost}
                    onChange={(e) => setCompleteForm({ ...completeForm, actualCost: e.target.value })}
                    className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Ngày hoàn tất:</label>
                  <input
                    type="datetime-local"
                    required
                    value={completeForm.completedDate}
                    onChange={(e) => setCompleteForm({ ...completeForm, completedDate: e.target.value })}
                    className="w-full p-2 border border-zinc-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Định mức ODO kế tiếp:</label>
                  <input
                    type="number"
                    min="0"
                    value={completeForm.nextMaintenanceMileage}
                    onChange={(e) => setCompleteForm({ ...completeForm, nextMaintenanceMileage: e.target.value })}
                    className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Ngày bảo dưỡng kế tiếp:</label>
                  <input
                    type="date"
                    value={completeForm.nextMaintenanceDate}
                    onChange={(e) => setCompleteForm({ ...completeForm, nextMaintenanceDate: e.target.value })}
                    className="w-full p-2 border border-zinc-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Ghi chú kết quả nghiệm thu:</label>
                <textarea
                  rows="2"
                  value={completeForm.details}
                  onChange={(e) => setCompleteForm({ ...completeForm, details: e.target.value })}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs"
                />
              </div>

              <p className="text-[11px] text-zinc-500 italic">
                Sau khi xác nhận hoàn tất, hệ thống sẽ tự động cập nhật xe trở lại trạng thái <strong>READY</strong> để sẵn sàng nhận đơn thuê xe mới.
              </p>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="px-4 py-2 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  {actionLoading ? 'Đang lưu...' : 'Nghiệm Thu & Chuyển READY'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MaintenancePage;
