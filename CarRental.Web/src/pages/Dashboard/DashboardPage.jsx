import React from 'react';
import { Car, CheckCircle, Clock, Wrench } from 'lucide-react';

const StatCard = ({ title, value, icon, trend }) => (
  <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-zinc-500">{title}</p>
        <p className="text-2xl font-bold text-zinc-900 mt-1">{value}</p>
      </div>
      <div className="p-3 bg-zinc-50 rounded-md text-zinc-600">
        {icon}
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center text-sm">
        <span className="text-green-600 font-medium">{trend}</span>
        <span className="text-zinc-500 ml-2">so với tháng trước</span>
      </div>
    )}
  </div>
);

const DashboardPage = () => {
  // Mock data - Will be replaced by API calls
  const stats = [
    { title: 'Tổng số xe', value: '45', icon: <Car size={24} />, trend: '+2' },
    { title: 'Đang sẵn sàng', value: '28', icon: <CheckCircle size={24} /> },
    { title: 'Đang cho thuê', value: '12', icon: <Clock size={24} /> },
    { title: 'Đang bảo dưỡng', value: '5', icon: <Wrench size={24} /> },
  ];

  const recentRequests = [
    { id: 'REQ001', customer: 'Nguyễn Văn A', car: 'Mercedes S450', date: '22/09/2026', status: 'Chờ duyệt' },
    { id: 'REQ002', customer: 'Trần Thị B', car: 'BMW 730Li', date: '21/09/2026', status: 'Đã duyệt' },
    { id: 'REQ003', customer: 'Lê Văn C', car: 'Porsche Macan', date: '21/09/2026', status: 'Đang thuê' },
    { id: 'REQ004', customer: 'Phạm Văn D', car: 'Audi Q8', date: '20/09/2026', status: 'Đã hoàn thành' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Tổng quan</h1>
        <p className="text-zinc-500 mt-1">Thông tin và số liệu hoạt động của hệ thống.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm mt-8">
        <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-zinc-900">Yêu cầu thuê gần đây</h2>
          <button className="text-sm font-medium text-zinc-600 hover:text-zinc-900">Xem tất cả</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 text-sm border-b border-zinc-200">
                <th className="px-6 py-3 font-medium">Mã YC</th>
                <th className="px-6 py-3 font-medium">Khách hàng</th>
                <th className="px-6 py-3 font-medium">Xe thuê</th>
                <th className="px-6 py-3 font-medium">Ngày đặt</th>
                <th className="px-6 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-zinc-200">
              {recentRequests.map((req) => (
                <tr key={req.id} className="hover:bg-zinc-50">
                  <td className="px-6 py-4 font-medium text-zinc-900">{req.id}</td>
                  <td className="px-6 py-4 text-zinc-700">{req.customer}</td>
                  <td className="px-6 py-4 text-zinc-700">{req.car}</td>
                  <td className="px-6 py-4 text-zinc-500">{req.date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${req.status === 'Đã duyệt' ? 'bg-blue-100 text-blue-800' :
                        req.status === 'Đang thuê' ? 'bg-indigo-100 text-indigo-800' :
                        req.status === 'Đã hoàn thành' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
