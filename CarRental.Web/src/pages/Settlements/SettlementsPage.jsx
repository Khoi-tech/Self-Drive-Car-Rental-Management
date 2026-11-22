import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Receipt,
  Clock,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  X,
  Car,
  Phone,
  DollarSign,
  Eye,
  FileCheck,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import rentalRequestService from '../../services/rentalRequestService';
import settlementService from '../../services/settlementService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { getPrimaryImageUrl, handleImageError } from '../../utils/imageGalleryHelper';
import SettlementModal from '../../components/operations/SettlementModal';

const TRAFFIC_FINE_DUE_DAYS = 15;

const calcDaysHeld = (settlement) => {
  const refDateStr = settlement?.settledAt || settlement?.refundedAt || settlement?.createdAt;
  if (!refDateStr) return 0;
  const refDate = new Date(refDateStr);
  if (Number.isNaN(refDate.getTime())) return 0;
  const diffMs = Date.now() - refDate.getTime();
  return Math.max(0, Math.floor(diffMs / 86400000));
};

const extractDisputeReason = (staffNotes) => {
  if (!staffNotes) return 'Khách hàng khiếu nại khoản khấu trừ quyết toán.';
  if (staffNotes.includes('[KHIẾU NẠI KHÁCH HÀNG')) {
    return staffNotes.split('[KHIẾU NẠI KHÁCH HÀNG').pop()?.replace(/^[^\]]*\]:\s*/, '').trim() || 'Khách hàng khiếu nại quyết toán.';
  }
  return staffNotes;
};

const SettlementsPage = () => {
  const { isManagement, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetRequestId = searchParams.get('requestId');
  const autoOpenedRef = useRef(null);

  const [requests, setRequests] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [activeTab, setActiveTab] = useState('AWAITING_SETTLEMENT');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [selectedRentalRequest, setSelectedRentalRequest] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [reqRes, settleRes] = await Promise.allSettled([
        rentalRequestService.getAllRequests(),
        settlementService.getAll()
      ]);

      const reqList = reqRes.status === 'fulfilled'
        ? (Array.isArray(reqRes.value)
            ? reqRes.value
            : (reqRes.value?.items || reqRes.value?.data?.items || (Array.isArray(reqRes.value?.data) ? reqRes.value.data : [])))
        : [];
      setRequests(reqList);

      const settleList = settleRes.status === 'fulfilled'
        ? (Array.isArray(settleRes.value)
            ? settleRes.value
            : (Array.isArray(settleRes.value?.data) ? settleRes.value.data : []))
        : [];
      setSettlements(settleList);
    } catch (err) {
      console.error(err);
      setError('Không thể tải dữ liệu quyết toán & hoàn cọc. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Maps for fast cross-lookup
  const requestsMap = useMemo(() => {
    const map = {};
    requests.forEach((r) => {
      if (r.id) map[r.id] = r;
    });
    return map;
  }, [requests]);

  const settlementsByReqMap = useMemo(() => {
    const map = {};
    settlements.forEach((s) => {
      if (s.rentalRequestId) map[s.rentalRequestId] = s;
    });
    return map;
  }, [settlements]);

  // Helper to build a rentalRequest object compatible with SettlementModal
  const resolveRentalRequestForSettlement = (settlement) => {
    if (settlement?.rentalRequestId && requestsMap[settlement.rentalRequestId]) {
      return requestsMap[settlement.rentalRequestId];
    }
    return {
      id: settlement.rentalRequestId || settlement.id,
      contractId: settlement.contractId,
      customerName: settlement.customerName || 'Khách hàng',
      customerPhone: settlement.customerPhone || '',
      carMake: settlement.carMake || '',
      carModel: settlement.carModel || '',
      carLicensePlate: settlement.licensePlate || '',
      depositAmount: settlement.depositAmount || 0,
      estimatedTotalFee: settlement.rentalFee || 0,
      status: settlement.status === 'DISPUTED' ? 'DISPUTED' : 'SETTLED'
    };
  };

  // Classify items into the 5 tabs
  const classified = useMemo(() => {
    // 1. Chờ lập quyết toán: RETURNED / INSPECTION chưa có RentalSettlement
    const awaitingSettlement = requests
      .filter((r) => ['RETURNED', 'INSPECTION'].includes(r.status) && !settlementsByReqMap[r.id])
      .map((req) => ({
        key: req.id,
        requestId: req.id,
        rentalRequest: req,
        settlement: null,
        tab: 'AWAITING_SETTLEMENT'
      }));

    const pendingRound1 = [];
    const disputed = [];
    const holdingFine = [];
    const closed = [];

    settlements.forEach((s) => {
      const req = resolveRentalRequestForSettlement(s);
      const item = {
        key: s.id,
        requestId: s.rentalRequestId || s.id,
        rentalRequest: req,
        settlement: s
      };

      const isDisputed = s.status === 'DISPUTED' || req?.status === 'DISPUTED';
      const isAwaitingAdditional =
        s.refundStatus === 'AWAITING_ADDITIONAL_PAYMENT' ||
        (Number(s.additionalAmountDue || 0) > 0 && s.refundStatus !== 'PAID' && s.status !== 'CLOSED');
      const isClosed =
        !isAwaitingAdditional &&
        (s.status === 'CLOSED' || (s.status === 'SETTLED' && s.trafficFineRefundStatus !== 'HOLDING' && s.refundStatus !== 'PENDING'));
      const isPending =
        !isDisputed &&
        !isClosed &&
        (isAwaitingAdditional || s.status === 'PENDING' || s.refundStatus === 'PENDING');
      const isHoldingFine =
        !isDisputed &&
        !isClosed &&
        !isPending &&
        (s.status === 'PARTIALLY_SETTLED' || s.trafficFineRefundStatus === 'HOLDING');

      if (isDisputed) {
        disputed.push({ ...item, tab: 'DISPUTED' });
      } else if (isPending) {
        pendingRound1.push({ ...item, tab: 'PENDING' });
      } else if (isHoldingFine) {
        const daysHeld = calcDaysHeld(s);
        holdingFine.push({
          ...item,
          daysHeld,
          isDueForRefund: daysHeld >= TRAFFIC_FINE_DUE_DAYS,
          tab: 'PARTIALLY_SETTLED'
        });
      } else {
        closed.push({ ...item, tab: 'CLOSED' });
      }
    });

    // Sort holding fine: due items (>= 15 days) first, then oldest first
    holdingFine.sort((a, b) => b.daysHeld - a.daysHeld);

    return {
      AWAITING_SETTLEMENT: awaitingSettlement,
      PENDING: pendingRound1,
      DISPUTED: disputed,
      PARTIALLY_SETTLED: holdingFine,
      CLOSED: closed
    };
  }, [requests, settlements, requestsMap, settlementsByReqMap]);

  const dueFineCount = useMemo(
    () => classified.PARTIALLY_SETTLED.filter((item) => item.isDueForRefund).length,
    [classified]
  );

  // Auto-open SettlementModal if ?requestId={id} is provided
  useEffect(() => {
    if (loading || !targetRequestId || autoOpenedRef.current === targetRequestId) return;

    const allTabs = ['AWAITING_SETTLEMENT', 'PENDING', 'DISPUTED', 'PARTIALLY_SETTLED', 'CLOSED'];
    let matchedItem = null;
    for (const tabKey of allTabs) {
      const found = classified[tabKey].find((i) => i.requestId === targetRequestId);
      if (found) {
        matchedItem = found;
        setActiveTab(tabKey);
        break;
      }
    }

    const reqObj = matchedItem?.rentalRequest || requestsMap[targetRequestId];
    if (reqObj) {
      autoOpenedRef.current = targetRequestId;
      setSelectedRentalRequest(reqObj);
      setIsSettlementModalOpen(true);
    }
  }, [loading, targetRequestId, classified, requestsMap]);

  // Filtered rows for active tab
  const currentRows = useMemo(() => {
    const list = classified[activeTab] || [];
    if (!searchTerm.trim()) return list;
    const q = searchTerm.trim().toLowerCase();
    return list.filter(({ rentalRequest: req, settlement: s }) => {
      return (
        req?.id?.toLowerCase().includes(q) ||
        s?.settlementNumber?.toLowerCase().includes(q) ||
        (s?.customerName || req?.customerName || '').toLowerCase().includes(q) ||
        (s?.customerPhone || req?.customerPhone || '').toLowerCase().includes(q) ||
        (s?.licensePlate || req?.carLicensePlate || '').toLowerCase().includes(q) ||
        (s?.carModel || req?.carModel || '').toLowerCase().includes(q)
      );
    });
  }, [classified, activeTab, searchTerm]);

  const openModalForItem = (item) => {
    setSelectedRentalRequest(item.rentalRequest);
    setIsSettlementModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsSettlementModalOpen(false);
    setSelectedRentalRequest(null);
    if (targetRequestId) {
      const next = new URLSearchParams(searchParams);
      next.delete('requestId');
      setSearchParams(next, { replace: true });
    }
  };

  const tabs = [
    { key: 'AWAITING_SETTLEMENT', label: 'Chờ lập quyết toán', count: classified.AWAITING_SETTLEMENT.length },
    { key: 'PENDING', label: 'Chờ hoàn / thu đợt 1', count: classified.PENDING.length },
    { key: 'DISPUTED', label: 'Đang khiếu nại', count: classified.DISPUTED.length, alert: classified.DISPUTED.length > 0 },
    { key: 'PARTIALLY_SETTLED', label: 'Giữ phạt nguội 2tr', count: classified.PARTIALLY_SETTLED.length, highlightDue: dueFineCount },
    { key: 'CLOSED', label: 'Đã tất toán', count: classified.CLOSED.length }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Quyết Toán & Hoàn Cọc
            </h1>
            {!isManagement && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold whitespace-nowrap">
                Quyền {user?.role || 'STAFF'}: Lập dự toán & Xem
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            Quản lý tập trung luồng quyết toán phụ phí, hoàn cọc đợt 1, xử lý khiếu nại và đối soát quỹ phạt nguội 2.000.000đ (15–30 ngày)
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-300 rounded-lg text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50 transition shadow-sm self-start"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* Error Alert */}
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

      {/* 4 Quick KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Chờ lập quyết toán */}
        <div
          onClick={() => setActiveTab('AWAITING_SETTLEMENT')}
          className={`bg-white p-4 rounded-xl border transition cursor-pointer select-none flex items-center justify-between ${
            activeTab === 'AWAITING_SETTLEMENT'
              ? 'ring-2 ring-purple-600 border-purple-600 bg-purple-50/20 shadow-sm'
              : 'border-slate-200 hover:border-purple-300'
          }`}
        >
          <div>
            <p className="text-[11px] text-purple-700 uppercase font-bold tracking-wider">Chờ lập quyết toán</p>
            <p className="text-2xl font-extrabold text-zinc-950 mt-1 tabular-nums">
              {classified.AWAITING_SETTLEMENT.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Xe đã trả, chưa tạo phiếu QT</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Receipt size={20} />
          </div>
        </div>

        {/* Card 2: Chờ hoàn / thu đợt 1 */}
        <div
          onClick={() => setActiveTab('PENDING')}
          className={`bg-white p-4 rounded-xl border transition cursor-pointer select-none flex items-center justify-between ${
            activeTab === 'PENDING'
              ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/20 shadow-sm'
              : 'border-slate-200 hover:border-blue-300'
          }`}
        >
          <div>
            <p className="text-[11px] text-blue-700 uppercase font-bold tracking-wider">Chờ hoàn / thu đợt 1</p>
            <p className="text-2xl font-extrabold text-zinc-950 mt-1 tabular-nums">
              {classified.PENDING.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Chờ Quản lý xác nhận VietQR</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Card 3: Đang khiếu nại */}
        <div
          onClick={() => setActiveTab('DISPUTED')}
          className={`bg-white p-4 rounded-xl border transition cursor-pointer select-none flex items-center justify-between ${
            activeTab === 'DISPUTED'
              ? 'ring-2 ring-rose-600 border-rose-600 bg-rose-50/30 shadow-sm'
              : classified.DISPUTED.length > 0
                ? 'border-rose-300 bg-rose-50/20 hover:border-rose-400'
                : 'border-slate-200 hover:border-rose-300'
          }`}
        >
          <div>
            <p className="text-[11px] text-rose-700 uppercase font-bold tracking-wider">Đang khiếu nại</p>
            <p className="text-2xl font-extrabold text-rose-700 mt-1 tabular-nums">
              {classified.DISPUTED.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Cần Quản lý rà soát & phân xử</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* Card 4: Đang giữ phạt nguội 2tr */}
        <div
          onClick={() => setActiveTab('PARTIALLY_SETTLED')}
          className={`bg-white p-4 rounded-xl border transition cursor-pointer select-none flex items-center justify-between ${
            activeTab === 'PARTIALLY_SETTLED'
              ? 'ring-2 ring-amber-600 border-amber-600 bg-amber-50/30 shadow-sm'
              : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <div>
            <p className="text-[11px] text-amber-800 uppercase font-bold tracking-wider">Đang giữ phạt nguội 2tr</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-extrabold text-zinc-950 tabular-nums">
                {classified.PARTIALLY_SETTLED.length}
              </p>
              {dueFineCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold whitespace-nowrap">
                  {dueFineCount} đơn ≥ 15 ngày
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">0 đơn đến hạn</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Đối soát CSGT sau 15–30 ngày</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Tabs + Search + Table Container */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 justify-between lg:items-center">
          {/* 5 Filter Tabs */}
          <div className="flex border-b border-slate-200 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'border-[#0F172A] text-zinc-950'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                    tab.alert
                      ? 'bg-rose-100 text-rose-700'
                      : activeTab === tab.key
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
                {tab.highlightDue > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title={`${tab.highlightDue} đơn quá 15 ngày đến hạn hoàn`} />
                )}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full lg:w-72 shrink-0">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Tìm mã đơn, mã QT, khách, biển số..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-slate-200 bg-slate-50 rounded-md text-xs text-zinc-950 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0F172A]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3.5 py-3 whitespace-nowrap">Mã đơn / Phiếu QT</th>
                <th className="px-3.5 py-3 whitespace-nowrap">Khách hàng</th>
                <th className="px-3.5 py-3 whitespace-nowrap">Xe thuê</th>

                {activeTab === 'AWAITING_SETTLEMENT' && (
                  <>
                    <th className="px-3.5 py-3 text-right whitespace-nowrap">Tiền thuê / Cọc</th>
                    <th className="px-3.5 py-3 whitespace-nowrap">Lịch thuê</th>
                    <th className="px-3.5 py-3 text-center whitespace-nowrap">Trạng thái</th>
                  </>
                )}

                {activeTab === 'PENDING' && (
                  <>
                    <th className="px-3.5 py-3 text-right whitespace-nowrap">Cọc / Khấu trừ</th>
                    <th className="px-3.5 py-3 text-right whitespace-nowrap">Hoàn / Thu Đợt 1</th>
                    <th className="px-3.5 py-3 text-right whitespace-nowrap">Giữ phạt nguội</th>
                  </>
                )}

                {activeTab === 'DISPUTED' && (
                  <>
                    <th className="px-3.5 py-3 text-right whitespace-nowrap">Cọc / Khấu trừ</th>
                    <th className="px-3.5 py-3">Nội dung khiếu nại</th>
                    <th className="px-3.5 py-3 text-center whitespace-nowrap">Trạng thái</th>
                  </>
                )}

                {activeTab === 'PARTIALLY_SETTLED' && (
                  <>
                    <th className="px-3.5 py-3 text-right whitespace-nowrap">Quỹ phạt nguội</th>
                    <th className="px-3.5 py-3 text-center whitespace-nowrap">Số ngày đã giữ</th>
                    <th className="px-3.5 py-3 whitespace-nowrap">Hạn đối soát CSGT</th>
                  </>
                )}

                {activeTab === 'CLOSED' && (
                  <>
                    <th className="px-3.5 py-3 text-right whitespace-nowrap">Cọc / Khấu trừ</th>
                    <th className="px-3.5 py-3 text-right whitespace-nowrap">Tổng đã hoàn</th>
                    <th className="px-3.5 py-3 whitespace-nowrap">Ngày tất toán</th>
                  </>
                )}

                <th className="px-3.5 py-3 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw size={18} className="animate-spin text-[#0F172A]" />
                      <span>Đang tải dữ liệu quyết toán & hoàn cọc...</span>
                    </div>
                  </td>
                </tr>
              ) : currentRows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-slate-400">
                    <Receipt size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">Không có hồ sơ nào trong mục này</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Chuyển tab khác hoặc thay đổi từ khóa tìm kiếm
                    </p>
                  </td>
                </tr>
              ) : (
                currentRows.map((item) => {
                  const { rentalRequest: req, settlement: s, daysHeld, isDueForRefund } = item;
                  const customerName = s?.customerName || req?.customerName || 'Khách hàng';
                  const customerPhone = s?.customerPhone || req?.customerPhone || '';
                  const carName = `${s?.carMake || req?.carMake || ''} ${s?.carModel || req?.carModel || ''}`.trim() || 'Xe thuê';
                  const licensePlate = s?.licensePlate || req?.carLicensePlate || 'CHƯA GÁN';
                  const shortCode = (req?.id || s?.rentalRequestId || s?.id || '').substring(0, 8).toUpperCase();

                  // Round 1 immediate refund or additional due
                  const isAdditionalDue = (s?.additionalAmountDue || 0) > 0;
                  const immediateRefund = Math.max(0, (s?.refundAmount || 0) - (s?.trafficFineHoldAmount || 0));

                  const rowBg =
                    activeTab === 'DISPUTED'
                      ? 'bg-rose-50/40 hover:bg-rose-50/80'
                      : activeTab === 'PARTIALLY_SETTLED' && isDueForRefund
                        ? 'bg-amber-50/40 hover:bg-amber-50/80'
                        : 'hover:bg-slate-50/80';

                  return (
                    <tr
                      key={item.key}
                      onClick={() => openModalForItem(item)}
                      className={`${rowBg} transition cursor-pointer group`}
                    >
                      {/* Mã đơn / Phiếu QT */}
                      <td className="px-3.5 py-3 font-mono text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-zinc-950 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {shortCode}
                          </span>
                        </div>
                        {s?.settlementNumber ? (
                          <div className="text-[11px] text-blue-700 font-semibold mt-1">
                            {s.settlementNumber}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 mt-1 tabular-nums">
                            {formatDateTime(req?.updatedAt || req?.createdAt)}
                          </div>
                        )}
                      </td>

                      {/* Khách hàng */}
                      <td className="px-3.5 py-3">
                        <div className="font-semibold text-zinc-950 whitespace-nowrap">{customerName}</div>
                        {customerPhone && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 tabular-nums whitespace-nowrap">
                            <Phone size={10} className="text-slate-400" />
                            {customerPhone}
                          </div>
                        )}
                      </td>

                      {/* Xe thuê */}
                      <td className="px-3.5 py-3">
                        <div className="flex items-center gap-2.5">
                          {req?.carImageUrl ? (
                            <img
                              src={getPrimaryImageUrl(req.carImageUrl)}
                              alt={carName}
                              onError={handleImageError}
                              className="w-11 h-8 object-cover rounded border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-400 shrink-0">
                              <Car size={15} />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-zinc-950 whitespace-nowrap">{carName}</div>
                            <span className="license-plate text-[10px] px-1.5 py-0.2 inline-block mt-0.5">
                              {licensePlate}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* TAB 1 COLUMNS: Chờ lập quyết toán */}
                      {activeTab === 'AWAITING_SETTLEMENT' && (
                        <>
                          <td className="px-3.5 py-3 text-right whitespace-nowrap">
                            <div className="font-bold text-zinc-950 tabular-nums">
                              {formatCurrency(req?.estimatedTotalFee || 0)}
                            </div>
                            <div className="text-[11px] text-slate-500 tabular-nums">
                              Cọc: {formatCurrency(req?.depositAmount || 0)}
                            </div>
                          </td>
                          <td className="px-3.5 py-3 whitespace-nowrap text-[11px] text-slate-600 tabular-nums">
                            {req?.startTime && req?.endTime
                              ? `${new Date(req.startTime).toLocaleDateString('vi-VN')} - ${new Date(req.endTime).toLocaleDateString('vi-VN')}`
                              : '—'}
                          </td>
                          <td className="px-3.5 py-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                              <FileCheck size={12} />
                              {req?.status === 'INSPECTION' ? 'Đang kiểm định' : 'Đã trả xe'}
                            </span>
                          </td>
                        </>
                      )}

                      {/* TAB 2 COLUMNS: Chờ hoàn / thu đợt 1 */}
                      {activeTab === 'PENDING' && (
                        <>
                          <td className="px-3.5 py-3 text-right whitespace-nowrap tabular-nums">
                            <div className="text-slate-700 font-medium">
                              Cọc: {formatCurrency(s?.depositAmount || 0)}
                            </div>
                            <div className="text-[11px] text-rose-600 font-semibold">
                              Trừ: -{formatCurrency(s?.totalDeduction || 0)}
                            </div>
                          </td>
                          <td className="px-3.5 py-3 text-right whitespace-nowrap tabular-nums">
                            {isAdditionalDue ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                                <ArrowDownLeft size={12} />
                                Thu thêm: {formatCurrency(s.additionalAmountDue)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                                <ArrowUpRight size={12} />
                                Hoàn Đ1: {formatCurrency(immediateRefund)}
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-3 text-right whitespace-nowrap tabular-nums">
                            {(s?.trafficFineHoldAmount || 0) > 0 ? (
                              <span className="text-indigo-700 font-bold">
                                {formatCurrency(s.trafficFineHoldAmount)}
                              </span>
                            ) : (
                              <span className="text-slate-400">0đ</span>
                            )}
                          </td>
                        </>
                      )}

                      {/* TAB 3 COLUMNS: Đang khiếu nại */}
                      {activeTab === 'DISPUTED' && (
                        <>
                          <td className="px-3.5 py-3 text-right whitespace-nowrap tabular-nums">
                            <div className="font-semibold text-zinc-900">
                              Cọc: {formatCurrency(s?.depositAmount || 0)}
                            </div>
                            <div className="text-[11px] text-rose-600 font-bold">
                              Khấu trừ: -{formatCurrency(s?.totalDeduction || 0)}
                            </div>
                          </td>
                          <td className="px-3.5 py-3 max-w-[260px]">
                            <p
                              className="text-rose-900 font-medium line-clamp-2"
                              title={extractDisputeReason(s?.staffNotes)}
                            >
                              "{extractDisputeReason(s?.staffNotes)}"
                            </p>
                          </td>
                          <td className="px-3.5 py-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <AlertTriangle size={12} />
                              Chờ phân xử
                            </span>
                          </td>
                        </>
                      )}

                      {/* TAB 4 COLUMNS: Giữ phạt nguội 2tr */}
                      {activeTab === 'PARTIALLY_SETTLED' && (
                        <>
                          <td className="px-3.5 py-3 text-right whitespace-nowrap tabular-nums">
                            <div className="font-extrabold text-indigo-800 text-sm">
                              {formatCurrency(s?.trafficFineHoldAmount || 0)}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Đã hoàn Đ1: {formatCurrency(immediateRefund)}
                            </div>
                          </td>
                          <td className="px-3.5 py-3 text-center whitespace-nowrap">
                            <div className="inline-flex flex-col items-center gap-1">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tabular-nums border ${
                                  isDueForRefund
                                    ? 'bg-amber-100 text-amber-950 border-amber-400'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                <Clock size={11} />
                                {daysHeld} / {TRAFFIC_FINE_DUE_DAYS} ngày
                              </span>
                              {isDueForRefund && (
                                <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wide">
                                  ✓ Đến hạn hoàn
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3.5 py-3 whitespace-nowrap text-[11px] text-slate-600 tabular-nums">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} className="text-slate-400" />
                              {s?.trafficFineRefundDate
                                ? new Date(s.trafficFineRefundDate).toLocaleDateString('vi-VN')
                                : 'Sau 15–30 ngày'}
                            </div>
                          </td>
                        </>
                      )}

                      {/* TAB 5 COLUMNS: Đã tất toán */}
                      {activeTab === 'CLOSED' && (
                        <>
                          <td className="px-3.5 py-3 text-right whitespace-nowrap tabular-nums">
                            <div className="text-slate-700 font-medium">
                              Cọc: {formatCurrency(s?.depositAmount || 0)}
                            </div>
                            <div className="text-[11px] text-rose-600">
                              Trừ: -{formatCurrency((s?.totalDeduction || 0) + (s?.trafficFineActualDeduction || 0))}
                            </div>
                          </td>
                          <td className="px-3.5 py-3 text-right whitespace-nowrap tabular-nums">
                            <span className="font-bold text-emerald-700">
                              {formatCurrency(
                                immediateRefund + (s?.trafficFineActualRefund || 0)
                              )}
                            </span>
                            {(s?.trafficFineActualDeduction || 0) > 0 && (
                              <div className="text-[10px] text-amber-700 font-medium">
                                Trừ phạt nguội: {formatCurrency(s.trafficFineActualDeduction)}
                              </div>
                            )}
                          </td>
                          <td className="px-3.5 py-3 whitespace-nowrap text-[11px] text-slate-500 tabular-nums">
                            {formatDateTime(s?.trafficFineRefundedAt || s?.settledAt || s?.updatedAt)}
                          </td>
                        </>
                      )}

                      {/* THAO TÁC */}
                      <td
                        className="px-3.5 py-3 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {activeTab === 'AWAITING_SETTLEMENT' && (
                          <button
                            onClick={() => openModalForItem(item)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-xs"
                          >
                            <DollarSign size={13} />
                            <span>Lập quyết toán</span>
                          </button>
                        )}

                        {activeTab === 'PENDING' && (
                          isManagement ? (
                            <button
                              onClick={() => openModalForItem(item)}
                              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-xs"
                            >
                              <CheckCircle2 size={13} />
                              <span>{isAdditionalDue ? 'Xác nhận thu' : 'Xác nhận hoàn'}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => openModalForItem(item)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition"
                            >
                              <Eye size={13} />
                              <span>Xem chi tiết</span>
                            </button>
                          )
                        )}

                        {activeTab === 'DISPUTED' && (
                          isManagement ? (
                            <button
                              onClick={() => openModalForItem(item)}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-xs"
                            >
                              <ShieldAlert size={13} />
                              <span>Phân xử</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => openModalForItem(item)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition"
                            >
                              <Eye size={13} />
                              <span>Xem khiếu nại</span>
                            </button>
                          )
                        )}

                        {activeTab === 'PARTIALLY_SETTLED' && (
                          isManagement ? (
                            <button
                              onClick={() => openModalForItem(item)}
                              className={`px-3 py-1.5 text-white rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-xs ${
                                isDueForRefund
                                  ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-200'
                                  : 'bg-purple-700 hover:bg-purple-800'
                              }`}
                            >
                              <DollarSign size={13} />
                              <span>Hoàn Đợt 2</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => openModalForItem(item)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition"
                            >
                              <Eye size={13} />
                              <span>Xem chi tiết</span>
                            </button>
                          )
                        )}

                        {activeTab === 'CLOSED' && (
                          <button
                            onClick={() => openModalForItem(item)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition"
                          >
                            <Eye size={13} />
                            <span>Xem hồ sơ</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settlement Modal (Preserves 100% of Phase 3-4 logic & 3-role RBAC) */}
      {isSettlementModalOpen && selectedRentalRequest && (
        <SettlementModal
          isOpen={isSettlementModalOpen}
          onClose={handleCloseModal}
          rentalRequest={selectedRentalRequest}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};

export default SettlementsPage;
