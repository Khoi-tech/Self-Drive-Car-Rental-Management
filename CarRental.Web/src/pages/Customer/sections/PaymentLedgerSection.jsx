import React, { useState } from 'react';
import { 
  CreditCard, 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Download, 
  ShieldCheck, 
  Eye, 
  X, 
  Receipt,
  QrCode,
  Zap,
  Building,
  Info
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../../utils/formatters';

const DEFAULT_TRANSACTIONS = [
  {
    id: 'TX-90214',
    type: 'HOLD_DEPOSIT',
    title: 'Cọc giữ xe siêu tốc 500k (Fast Hold)',
    car: 'Porsche Taycan 4S (30H-999.99)',
    amount: 500000,
    isIncome: false,
    method: 'VietQR Napas 247',
    date: '02/11/2026 14:30',
    status: 'SUCCESS',
    statusLabel: 'Thành công',
    refNo: 'MBB8291049281'
  },
  {
    id: 'TX-89102',
    type: 'RENTAL_PAYMENT',
    title: 'Thanh toán tiền thuê xe 3 ngày',
    car: 'Mercedes-Benz E300 AMG (51K-234.56)',
    amount: 8400000,
    isIncome: false,
    method: 'Vietcombank Chuyển khoản',
    date: '24/10/2026 09:15',
    status: 'SUCCESS',
    statusLabel: 'Thành công',
    refNo: 'VCB4910291928'
  },
  {
    id: 'TX-89103',
    type: 'DEPOSIT_COLLATERAL',
    title: 'Đặt cọc thế chân bàn giao xe',
    car: 'Mercedes-Benz E300 AMG (51K-234.56)',
    amount: 45000000,
    isIncome: false,
    isCollateralHold: true,
    method: 'VietQR Escrow Phong tỏa',
    date: '24/10/2026 09:40',
    status: 'HELD',
    statusLabel: 'Đang giữ cọc',
    holdNote: 'Dự kiến giải tỏa sau 14 ngày đối soát phạt nguội',
    refNo: 'ESC9012948123'
  },
  {
    id: 'TX-88219',
    type: 'DEPOSIT_REFUND',
    title: 'Hoàn trả tiền cọc thế chân xe Porsche Taycan',
    car: 'Porsche Taycan 4S (30H-999.99)',
    amount: 30000000,
    isIncome: true,
    method: 'VietQR Napas 247 Hoàn cọc tự động',
    date: '20/10/2026 15:20',
    status: 'REFUNDED',
    statusLabel: 'Đã hoàn cọc',
    refNo: 'REF9021948120'
  },
  {
    id: 'TX-87421',
    type: 'DEPOSIT_REFUND',
    title: 'Hoàn trả tiền cọc thế chân BMW 530i',
    car: 'BMW 530i M Sport (51K-556.78)',
    amount: 44800000,
    isIncome: true,
    method: 'VietQR Napas 247 Hoàn cọc tự động',
    date: '18/10/2026 17:05',
    status: 'REFUNDED',
    statusLabel: 'Đã hoàn cọc',
    refNo: 'REF8912039120'
  },
  {
    id: 'TX-87422',
    type: 'SURCHARGE',
    title: 'Khấu trừ phụ phí vệ sinh nội thất',
    car: 'BMW 530i M Sport (51K-556.78)',
    amount: 200000,
    isIncome: false,
    method: 'Khấu trừ cọc thế chân',
    date: '18/10/2026 17:00',
    status: 'SETTLED',
    statusLabel: 'Đã quyết toán',
    refNo: 'SET7712903192'
  }
];

const PaymentLedgerSection = ({ requests = [] }) => {
  const [selectedTx, setSelectedTx] = useState(null);

  // Dynamic figures
  let totalPaid = 8900000;
  let depositHeld = 45000000;
  let depositRefunded = 74800000;
  let surcharges = 200000;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Thanh toán & Tiền cọc minh bạch
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sổ cái tài chính minh bạch: kiểm tra chi tiết tiền thuê, cọc thế chân đang phong tỏa, hoàn cọc tự động VietQR và biên lai quyết toán.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 flex items-center gap-1.5 border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Ký quỹ VietQR Escrow Chuẩn B2C</span>
          </span>
        </div>
      </div>

      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Tổng tiền thuê đã thanh toán */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tổng tiền thuê
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 tabular-nums">
            {formatCurrency(totalPaid)}
          </div>
          <span className="text-[10px] text-slate-500 block">Đã thanh toán qua ngân hàng</span>
        </div>

        {/* Card 2: Tiền cọc đang giữ */}
        <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              Cọc đang được giữ
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-200/80 text-amber-900 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-900 tabular-nums">
            {formatCurrency(depositHeld)}
          </div>
          <span className="text-[10px] text-amber-700 block">Dự kiến giải tỏa sau 14 ngày phạt nguội</span>
        </div>

        {/* Card 3: Tiền cọc đã hoàn trả */}
        <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Cọc đã hoàn trả
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-200/80 text-emerald-900 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-900 tabular-nums">
            {formatCurrency(depositRefunded)}
          </div>
          <span className="text-[10px] text-emerald-700 block">Chuyển hoàn 100% qua Napas 247</span>
        </div>

        {/* Card 4: Phụ phí phát sinh */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Phụ phí phát sinh
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 tabular-nums">
            {formatCurrency(surcharges)}
          </div>
          <span className="text-[10px] text-slate-500 block">Đã đối soát theo biên bản trả xe</span>
        </div>

      </div>

      {/* Transaction History Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 tracking-tight">
            Lịch sử giao dịch & Sổ cái tiền cọc
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Tự động cập nhật thời gian thực
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Mã GD & Thời gian</th>
                <th className="py-3 px-4">Nội dung giao dịch</th>
                <th className="py-3 px-4">Phương thức</th>
                <th className="py-3 px-4 text-right">Số tiền</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Biên nhận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {DEFAULT_TRANSACTIONS.map((tx) => {
                const isRefund = tx.isIncome;
                const isHeld = tx.isCollateralHold;

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-slate-900 block">{tx.id}</span>
                      <span className="text-[11px] text-slate-500">{tx.date}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">{tx.title}</span>
                      <span className="text-[11px] text-slate-500">{tx.car}</span>
                      {tx.holdNote && (
                        <div className="text-[10px] text-amber-700 font-medium flex items-center gap-1 mt-0.5">
                          <Info className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>{tx.holdNote}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        <QrCode className="w-3.5 h-3.5 text-blue-900" />
                        {tx.method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums">
                      <span className={`font-black text-sm ${
                        isRefund 
                          ? 'text-emerald-700' 
                          : isHeld 
                          ? 'text-amber-800' 
                          : 'text-slate-900'
                      }`}>
                        {isRefund ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                        tx.status === 'REFUNDED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : tx.status === 'HELD'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}>
                        {tx.statusLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTx(tx)}
                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                        title="Xem biên nhận"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Linked Bank / Refund Details */}
      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <Building className="w-4 h-4 text-blue-900" />
            <span>Tài khoản ngân hàng nhận tiền hoàn cọc (VietQR Napas 247)</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Đã xác thực chủ tài khoản
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-lg border border-slate-200 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 block text-sm">NGUYEN HOANG MINH</span>
            <span className="font-mono text-slate-700 block">Số tài khoản: 1903 8920 4910 • Techcombank (Kỹ Thương)</span>
            <span className="text-[11px] text-slate-500">Chi nhánh Bến Nghé, Quận 1, TP. Hồ Chí Minh</span>
          </div>
          <div className="text-[11px] text-slate-500 bg-slate-50 px-3 py-2 rounded-md border border-slate-200">
            Khoản hoàn trả cọc xe sau 14 ngày đối soát phạt nguội sẽ được giải ngân trực tiếp vào STK này.
          </div>
        </div>
      </div>

      {/* Receipt Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-900" />
                <span>Biên lai giao dịch #{selectedTx.id}</span>
              </h3>
              <button onClick={() => setSelectedTx(null)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl text-center space-y-1">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Số tiền giao dịch</span>
                <div className={`text-2xl font-black tabular-nums ${
                  selectedTx.isIncome ? 'text-emerald-700' : selectedTx.isCollateralHold ? 'text-amber-800' : 'text-slate-900'
                }`}>
                  {selectedTx.isIncome ? '+' : '-'}{formatCurrency(selectedTx.amount)}
                </div>
                <span className="text-[11px] text-emerald-700 font-bold block">{selectedTx.statusLabel}</span>
              </div>

              <div className="space-y-2 py-2 border-t border-b border-slate-100">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Mã tham chiếu:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedTx.refNo}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Nội dung:</span>
                  <span className="font-semibold text-slate-900 text-right">{selectedTx.title}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Phương tiện liên quan:</span>
                  <span className="font-medium text-slate-800">{selectedTx.car}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Kênh thanh toán:</span>
                  <span className="font-semibold text-slate-900">{selectedTx.method}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Thời gian xác thực:</span>
                  <span className="tabular-nums font-medium text-slate-700">{selectedTx.date}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => alert('Đang xuất hóa đơn điện tử PDF...')}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Tải PDF
              </button>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PaymentLedgerSection;
