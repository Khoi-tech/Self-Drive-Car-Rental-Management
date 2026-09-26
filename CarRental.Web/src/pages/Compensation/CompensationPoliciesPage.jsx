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
          <h1 className="text-2xl font-bold text-zinc-900">Chính sách phí & bồi thường</h1>
          <p className="text-zinc-500 mt-1">Cấu hình các danh mục phí phạt, bồi thường thiệt hại làm cơ sở tham chiếu.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          Thêm chính sách
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-zinc-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-md leading-5 bg-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
            placeholder="Tìm theo tên chính sách..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
          <p className="text-green-700 text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex justify-between items-center">
          <div className="flex items-center">
            <AlertCircle className="text-red-500 mr-3" size={20} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <button onClick={fetchPolicies} className="text-sm font-medium text-red-700 hover:text-red-600 flex items-center">
            <RefreshCw size={14} className="mr-1" /> Thử lại
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Tên chính sách</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Cách tính</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Mức phí</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-500">
                      <RefreshCw className="animate-spin mb-2" size={24} />
                      <p>Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredPolicies.length > 0 ? (
                filteredPolicies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-zinc-900">{policy.name}</div>
                      {policy.description && <div className="text-xs text-zinc-500 truncate max-w-xs">{policy.description}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-700">
                      {policy.calculationType === 'FIXED' ? 'Cố định' : 'Theo đơn vị'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                      {formatCurrencyVND(policy.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {policy.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Đang áp dụng
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
                          Ngừng áp dụng
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => openEditModal(policy)}
                        className="inline-flex items-center text-blue-600 hover:text-blue-900"
                      >
                        <Edit2 size={16} className="mr-1" /> Sửa
                      </button>
                      <button
                        onClick={() => openStatusConfirmModal(policy)}
                        className={`inline-flex items-center ${policy.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                      >
                        <ShieldAlert size={16} className="mr-1" /> {policy.isActive ? 'Ngừng' : 'Kích hoạt'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-zinc-500">
                    Không tìm thấy chính sách nào.
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
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-zinc-900">{modalMode === 'add' ? 'Thêm chính sách' : 'Chỉnh sửa chính sách'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700 flex items-center">
                <AlertCircle size={16} className="mr-2 shrink-0" /> {modalError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Tên chính sách <span className="text-red-500">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900" placeholder="VD: Phí vệ sinh xe" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Mô tả (Tùy chọn)</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="2"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900" placeholder="Chi tiết chính sách..."></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Cách tính <span className="text-red-500">*</span></label>
                <select name="calculationType" value={formData.calculationType} onChange={handleChange}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white">
                  <option value="FIXED">Cố định</option>
                  <option value="UNIT">Theo đơn vị</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Mức phí <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type="number" min="0" name="amount" value={formData.amount} onChange={handleChange} required
                    className="w-full pl-3 pr-10 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900" placeholder="0" />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-zinc-500 sm:text-sm">VND</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-zinc-300 rounded-md text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50">
                  Hủy
                </button>
                <button type="submit" disabled={modalSaving} className={`inline-flex items-center px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium ${modalSaving ? 'opacity-70' : 'hover:bg-zinc-800'}`}>
                  {modalSaving ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />} Lưu
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
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6 z-10 text-center">
            <ShieldAlert size={48} className={`mx-auto mb-4 ${statusConfirmModal.isActive ? 'text-orange-500' : 'text-green-500'}`} />
            <h3 className="text-lg font-bold text-zinc-900 mb-2">
              Xác nhận {statusConfirmModal.isActive ? 'ngừng áp dụng' : 'kích hoạt'}
            </h3>
            <p className="text-sm text-zinc-500 mb-6">
              Bạn có chắc muốn {statusConfirmModal.isActive ? 'ngừng áp dụng' : 'kích hoạt'} chính sách <strong>{statusConfirmModal.name}</strong> không?
            </p>
            <div className="flex justify-center space-x-3">
              <button onClick={() => setStatusConfirmModal(null)} className="px-4 py-2 border border-zinc-300 rounded-md text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50">Hủy</button>
              <button 
                onClick={confirmToggleStatus} 
                disabled={statusLoading} 
                className={`px-4 py-2 text-white rounded-md text-sm font-medium disabled:opacity-70 ${statusConfirmModal.isActive ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {statusLoading ? 'Đang xử lý...' : (statusConfirmModal.isActive ? 'Ngừng áp dụng' : 'Kích hoạt')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CompensationPoliciesPage;
