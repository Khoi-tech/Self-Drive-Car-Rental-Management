import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Settings, RefreshCw, AlertCircle, Edit2, ShieldAlert, X, Save } from 'lucide-react';
import compensationPolicyService from '../../services/compensationPolicyService';
import { formatCurrencyVND } from '../../utils/formatters';

const CompensationPoliciesPage = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentPolicyId, setCurrentPolicyId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', calculationType: 'FIXED', amount: '' });
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Status Confirm Modal State
  const [statusConfirmModal, setStatusConfirmModal] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await compensationPolicyService.getAllPolicies();
      setPolicies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi tải danh sách chính sách.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Filter policies based on search term
  const filteredPolicies = policies.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openAddModal = () => {
    setModalMode('add');
    setCurrentPolicyId(null);
    setFormData({ name: '', description: '', calculationType: 'FIXED', amount: '' });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (policy) => {
    setModalMode('edit');
    setCurrentPolicyId(policy.id);
    setFormData({
      name: policy.name,
      description: policy.description || '',
      calculationType: policy.calculationType,
      amount: policy.amount.toString()
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setModalSaving(true);
    setModalError(null);

    // Validation
    const name = formData.name.trim();
    if (!name) {
      setModalError('Tên chính sách không được để trống.');
      setModalSaving(false); return;
    }

    const amount = Number(formData.amount);
    if (isNaN(amount) || amount < 0 || formData.amount === '') {
      setModalError('Mức phí không hợp lệ.');
      setModalSaving(false); return;
    }

    const payload = {
      name,
      description: formData.description.trim() || null,
      calculationType: formData.calculationType,
      amount
    };

    try {
      if (modalMode === 'add') {
        await compensationPolicyService.createPolicy(payload);
        setSuccessMsg('Đã thêm chính sách mới.');
      } else {
        await compensationPolicyService.updatePolicy(currentPolicyId, payload);
        setSuccessMsg('Đã cập nhật chính sách.');
      }
      setIsModalOpen(false);
      fetchPolicies();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Lỗi khi lưu chính sách.');
    } finally {
      setModalSaving(false);
    }
  };

  const openStatusConfirmModal = (policy) => {
    setStatusConfirmModal(policy);
  };

  const confirmToggleStatus = async () => {
    if (!statusConfirmModal) return;
    try {
      setStatusLoading(true);
      const newStatus = !statusConfirmModal.isActive;
      await compensationPolicyService.updateStatus(statusConfirmModal.id, newStatus);
      setSuccessMsg(`Đã ${newStatus ? 'kích hoạt' : 'ngừng áp dụng'} chính sách.`);
      setStatusConfirmModal(null);
      fetchPolicies();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái.');
      setStatusConfirmModal(null);
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 flex items-center gap-2">
            Chính Sách Bồi Thường & Phí Vi Phạm
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono border border-slate-200">
              {policies.length} danh mục
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quy định biểu phí phạt vi phạm hợp đồng, bồi thường hư hỏng xe và trầy xước làm căn cứ đối soát quyết toán bàn giao.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0F172A] text-white rounded-md text-xs font-semibold hover:bg-[#1D4ED8] transition shadow-sm"
        >
          <Plus size={15} />
          Thêm chính sách bồi thường
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-xs text-zinc-950 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0F172A]"
            placeholder="Tìm theo tên vi phạm, mô tả mức đền bù..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-md">
          <p className="text-emerald-800 text-xs font-medium">{successMsg}</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-md flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-rose-600" size={18} />
            <p className="text-rose-700 text-xs font-medium">{error}</p>
          </div>
          <button onClick={fetchPolicies} className="text-xs font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1">
            <RefreshCw size={14} /> Thử lại
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 text-left">Danh mục phí / Bồi thường</th>
                <th className="px-6 py-3.5 text-center">Phương thức tính</th>
                <th className="px-6 py-3.5 text-right">Định mức bồi hoàn</th>
                <th className="px-6 py-3.5 text-center">Trạng thái áp dụng</th>
                <th className="px-6 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <RefreshCw className="animate-spin mb-2 text-[#0F172A]" size={22} />
                      <p className="text-xs">Đang tải danh mục bồi thường...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredPolicies.length > 0 ? (
                filteredPolicies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-zinc-950">{policy.name}</div>
                      {policy.description && <div className="text-[11px] text-slate-500 truncate max-w-sm mt-0.5">{policy.description}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs text-slate-700">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                        {policy.calculationType === 'FIXED' ? 'Khoán cố định' : 'Tính theo đơn vị'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-bold font-mono text-zinc-950 tabular-nums">
                      {formatCurrencyVND(policy.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {policy.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Đang hiệu lực
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Tạm dừng
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium space-x-2">
                      <button
                        onClick={() => openEditModal(policy)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition"
                      >
                        <Edit2 size={13} /> Sửa
                      </button>
                      <button
                        onClick={() => openStatusConfirmModal(policy)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded border transition ${
                          policy.isActive 
                            ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100' 
                            : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        <ShieldAlert size={13} /> {policy.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-xs text-slate-400">
                    Không tìm thấy chính sách bồi thường nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => !modalSaving && setIsModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10 border border-slate-200">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-zinc-950">{modalMode === 'add' ? 'Thêm chính sách bồi thường' : 'Chỉnh sửa chính sách bồi thường'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-zinc-950">
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center rounded-md">
                <AlertCircle size={15} className="mr-2 shrink-0 text-rose-600" /> {modalError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên vi phạm / Thiệt hại <span className="text-rose-500">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-[#0F172A] text-xs" placeholder="VD: Trầy xước sơn sâu > 5cm, Phí vệ sinh nội thất..." />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả & Định mức kiểm tra</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="2"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-[#0F172A] text-xs" placeholder="Chi tiết quy chuẩn thẩm định..."></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phương thức tính <span className="text-rose-500">*</span></label>
                <select name="calculationType" value={formData.calculationType} onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-[#0F172A] bg-white text-xs">
                  <option value="FIXED">Khoán trọn gói cố định</option>
                  <option value="UNIT">Tính theo đơn vị (vết, lít, ngày)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Định mức tiền bồi thường (VNĐ) <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <input type="number" min="0" name="amount" value={formData.amount} onChange={handleChange} required
                    className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-[#0F172A] text-xs font-mono tabular-nums" placeholder="0" />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-xs font-mono">VNĐ</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition">
                  Hủy
                </button>
                <button type="submit" disabled={modalSaving} className={`inline-flex items-center px-4 py-2 bg-[#0F172A] text-white rounded-md text-xs font-semibold shadow-sm transition ${modalSaving ? 'opacity-70' : 'hover:bg-[#1D4ED8]'}`}>
                  {modalSaving ? <RefreshCw size={15} className="animate-spin mr-1.5" /> : <Save size={15} className="mr-1.5" />} Lưu chính sách
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Status Confirmation Modal */}
      {statusConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setStatusConfirmModal(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6 z-10 text-center border border-slate-200">
            <ShieldAlert size={40} className={`mx-auto mb-3 ${statusConfirmModal.isActive ? 'text-amber-500' : 'text-emerald-500'}`} />
            <h3 className="text-base font-bold text-zinc-950 mb-1.5">
              Xác nhận {statusConfirmModal.isActive ? 'tạm dừng' : 'kích hoạt'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Bạn có chắc muốn {statusConfirmModal.isActive ? 'ngừng áp dụng' : 'kích hoạt'} chính sách <strong className="text-zinc-950 font-semibold">{statusConfirmModal.name}</strong> không?
            </p>
            <div className="flex justify-center space-x-3">
              <button onClick={() => setStatusConfirmModal(null)} className="px-4 py-2 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition">Hủy</button>
              <button 
                onClick={confirmToggleStatus} 
                disabled={statusLoading} 
                className={`px-4 py-2 text-white rounded-md text-xs font-semibold shadow-sm transition disabled:opacity-70 ${statusConfirmModal.isActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                {statusLoading ? 'Đang xử lý...' : (statusConfirmModal.isActive ? 'Tạm dừng áp dụng' : 'Kích hoạt ngay')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CompensationPoliciesPage;
