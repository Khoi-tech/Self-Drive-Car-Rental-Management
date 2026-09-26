import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  Edit2, 
  ShieldAlert, 
  X, 
  Save, 
  Eye, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  Printer, 
  Tag, 
  FileCheck
} from 'lucide-react';
import contractTemplateService from '../../services/contractTemplateService';

// Available template placeholders that users can click to insert
const PLACEHOLDERS = [
  { tag: '{{CustomerName}}', desc: 'Họ tên khách hàng' },
  { tag: '{{CarModel}}', desc: 'Dòng xe / Tên xe' },
  { tag: '{{LicensePlate}}', desc: 'Biển số xe' },
  { tag: '{{DailyRate}}', desc: 'Giá thuê ngày' },
  { tag: '{{DepositAmount}}', desc: 'Tiền đặt cọc' },
  { tag: '{{StartDate}}', desc: 'Thời gian bắt đầu' },
  { tag: '{{EndDate}}', desc: 'Thời gian kết thúc' },
  { tag: '{{PickupLocation}}', desc: 'Trạm bàn giao xe' },
];

// Sample mock data for previewing contract templates
const MOCK_DATA = {
  '{{CustomerName}}': 'NGUYỄN VĂN AN',
  '{{CarModel}}': 'BMW M4 Competition Coupé 2024',
  '{{LicensePlate}}': '51K-888.88',
  '{{DailyRate}}': '3.500.000',
  '{{DepositAmount}}': '15.000.000',
  '{{StartDate}}': '01/10/2026 08:00',
  '{{EndDate}}': '04/10/2026 18:00',
  '{{PickupLocation}}': 'Trạm VELORA Tân Bình - 120 Cộng Hòa, P. 12, Q. Tân Bình, TP.HCM',
};

const ContractTemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    templateType: 'DAILY',
    version: 'v1.0',
    description: '',
    content: ''
  });
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState(null);
  const textareaRef = useRef(null);

  // Preview Modal
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Status Toggle Modal
  const [statusModal, setStatusModal] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (statusFilter !== 'ALL') params.isActive = statusFilter === 'ACTIVE';

      const data = await contractTemplateService.getAll(params);
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi tải danh sách mẫu hợp đồng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [typeFilter, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTemplates();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Open Add Modal
  const openAddModal = () => {
    setModalMode('add');
    setCurrentId(null);
    setFormData({
      name: '',
      templateType: 'DAILY',
      version: 'v1.0',
      description: '',
      content: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
---o0o---

HỢP ĐỒNG THUÊ XE Ô TÔ TỰ LÁI
Mã hợp đồng: HD-{{LicensePlate}}-{{StartDate}}

Hôm nay, ngày ký hợp đồng, các bên gồm:

BÊN CHO THUÊ (BÊN A):
- Đơn vị: CÔNG TY TNHH DỊCH VỤ VẬN TẢI VELORA
- Đại diện: Ban Điều Hành Hệ Thống Thuê Xe Tự Lái VELORA
- Trụ sở / Trạm giao nhận: {{PickupLocation}}

BÊN THUÊ XE (BÊN B):
- Họ và tên khách hàng: {{CustomerName}}
- Giấy phép lái xe: Đã xác thực thành công trên hệ thống VELORA

Hai bên cùng thống nhất ký kết Hợp đồng với các điều khoản:

ĐIỀU 1: THÔNG TIN XE VÀ THỜI GIAN THUÊ
1. Dòng xe: {{CarModel}}
2. Biển số xe: {{LicensePlate}}
3. Bắt đầu từ: {{StartDate}} đến {{EndDate}}
4. Địa điểm giao nhận: {{PickupLocation}}

ĐIỀU 2: ĐƠN GIÁ VÀ TIỀN ĐẶT CỌC
1. Đơn giá thuê: {{DailyRate}} VNĐ/ngày.
2. Tiền đặt cọc bảo đảm: {{DepositAmount}} VNĐ.

ĐIỀU 3: NGHĨA VỤ CÁC BÊN
- Bên B cam kết chấp hành luật giao thông, không chở hàng cấm, không cho thuê lại xe.
- Bên A đảm bảo xe an toàn, đầy đủ giấy tờ đăng kiểm.`
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (template) => {
    setModalMode('edit');
    setCurrentId(template.id);
    setFormData({
      name: template.name,
      templateType: template.templateType,
      version: template.version,
      description: template.description || '',
      content: template.content
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Insert placeholder tag into textarea at cursor position
  const insertPlaceholder = (tag) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setFormData(prev => ({ ...prev, content: prev.content + ' ' + tag }));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const oldContent = formData.content;
    const newContent = oldContent.substring(0, start) + tag + oldContent.substring(end);
    setFormData(prev => ({ ...prev, content: newContent }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  // Save Modal
  const handleSave = async (e) => {
    e.preventDefault();
    setModalSaving(true);
    setModalError(null);

    const name = formData.name.trim();
    if (!name) {
      setModalError('Tên mẫu hợp đồng không được để trống.');
      setModalSaving(false);
      return;
    }

    if (!formData.content.trim()) {
      setModalError('Nội dung mẫu hợp đồng không được để trống.');
      setModalSaving(false);
      return;
    }

    const payload = {
      name,
      templateType: formData.templateType,
      version: formData.version.trim() || 'v1.0',
      description: formData.description.trim() || null,
      content: formData.content
    };

    try {
      if (modalMode === 'add') {
        await contractTemplateService.create(payload);
        setSuccessMsg('Đã tạo mới mẫu hợp đồng thành công.');
      } else {
        await contractTemplateService.update(currentId, payload);
        setSuccessMsg('Đã cập nhật mẫu hợp đồng thành công.');
      }
      setIsModalOpen(false);
      fetchTemplates();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Lỗi khi lưu mẫu hợp đồng.');
    } finally {
      setModalSaving(false);
    }
  };

  // Confirm Status Toggle
  const confirmToggleStatus = async () => {
    if (!statusModal) return;
    try {
      setStatusLoading(true);
      const newStatus = !statusModal.isActive;
      await contractTemplateService.updateStatus(statusModal.id, newStatus);
      setSuccessMsg(`Đã ${newStatus ? 'kích hoạt' : 'ngừng áp dụng'} mẫu hợp đồng.`);
      setStatusModal(null);
      fetchTemplates();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi thay đổi trạng thái.');
      setStatusModal(null);
    } finally {
      setStatusLoading(false);
    }
  };

  // Confirm Delete
  const confirmDelete = async () => {
    if (!deleteModal) return;
    try {
      setDeleteLoading(true);
      await contractTemplateService.delete(deleteModal.id);
      setSuccessMsg('Đã xóa mẫu hợp đồng thành công.');
      setDeleteModal(null);
      fetchTemplates();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi xóa mẫu hợp đồng.');
      setDeleteModal(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Generate preview text replacing placeholders with mock data
  const renderPreviewContent = (rawContent) => {
    if (!rawContent) return '';
    let result = rawContent;
    Object.entries(MOCK_DATA).forEach(([placeholder, value]) => {
      result = result.split(placeholder).join(value);
    });
    return result;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <FileText size={26} className="text-zinc-700" />
            Mẫu hợp đồng & điều khoản dịch vụ
          </h1>
          <p className="text-zinc-500 mt-1">
            Quản lý các mẫu hợp đồng điện tử, điều khoản và quy định thuê xe làm cơ sở pháp lý giao dịch.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Thêm mẫu hợp đồng
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-zinc-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-md leading-5 bg-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
            placeholder="Tìm theo tên mẫu hợp đồng, mô tả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Type */}
        <div className="w-full md:w-48">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
          >
            <option value="ALL">Tất cả loại mẫu</option>
            <option value="DAILY">Thuê theo ngày (DAILY)</option>
            <option value="MONTHLY">Thuê theo tháng (MONTHLY)</option>
          </select>
        </div>

        {/* Filter Status */}
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang áp dụng</option>
            <option value="INACTIVE">Ngừng áp dụng</option>
          </select>
        </div>

        <button
          onClick={fetchTemplates}
          className="inline-flex items-center justify-center px-3 py-2 border border-zinc-300 rounded-md text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
          title="Tải lại danh sách"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle2 size={18} className="text-green-600 mr-2" />
            <p className="text-green-700 text-sm font-medium">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-green-600 hover:text-green-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex justify-between items-center">
          <div className="flex items-center">
            <AlertCircle className="text-red-500 mr-3" size={20} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <button onClick={fetchTemplates} className="text-sm font-medium text-red-700 hover:text-red-600 flex items-center">
            <RefreshCw size={14} className="mr-1" /> Thử lại
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Tên mẫu hợp đồng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Loại mẫu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Phiên bản</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-500">
                      <RefreshCw className="animate-spin mb-2" size={24} />
                      <p>Đang tải danh sách mẫu hợp đồng...</p>
                    </div>
                  </td>
                </tr>
              ) : templates.length > 0 ? (
                templates.map((template) => (
                  <tr key={template.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-zinc-900">{template.name}</div>
                      {template.description && (
                        <div className="text-xs text-zinc-500 truncate max-w-md mt-0.5">{template.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        template.templateType === 'DAILY' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {template.templateType === 'DAILY' ? 'Thuê ngày' : 'Thuê tháng'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-700 font-mono">
                      {template.version}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                      {new Date(template.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {template.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Đang áp dụng
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
                          Ngừng áp dụng
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {/* Preview Button */}
                      <button
                        onClick={() => setPreviewTemplate(template)}
                        className="inline-flex items-center text-teal-600 hover:text-teal-900 px-2 py-1 rounded hover:bg-teal-50"
                        title="Xem trước hợp đồng"
                      >
                        <Eye size={16} className="mr-1" /> Xem trước
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => openEditModal(template)}
                        className="inline-flex items-center text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50"
                        title="Chỉnh sửa mẫu"
                      >
                        <Edit2 size={16} className="mr-1" /> Sửa
                      </button>

                      {/* Toggle Status Button */}
                      <button
                        onClick={() => setStatusModal(template)}
                        className={`inline-flex items-center px-2 py-1 rounded ${
                          template.isActive 
                            ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50' 
                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                        }`}
                        title={template.isActive ? 'Ngừng áp dụng' : 'Kích hoạt mẫu'}
                      >
                        <ShieldAlert size={16} className="mr-1" />
                        {template.isActive ? 'Ngừng' : 'Bật'}
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeleteModal(template)}
                        className="inline-flex items-center text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50"
                        title="Xóa mẫu"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-zinc-500">
                    <FileCheck size={36} className="mx-auto text-zinc-300 mb-2" />
                    <p className="text-zinc-600 font-medium">Không tìm thấy mẫu hợp đồng nào phù hợp.</p>
                    <p className="text-xs text-zinc-400 mt-1">Hãy thử thay đổi điều kiện lọc hoặc tạo mẫu hợp đồng mới.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== ADD / EDIT MODAL ===================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => !modalSaving && setIsModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col z-10 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
              <h3 className="text-lg font-bold text-zinc-900">
                {modalMode === 'add' ? 'Thêm mới mẫu hợp đồng' : 'Chỉnh sửa mẫu hợp đồng'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-zinc-400 hover:text-zinc-600 focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {modalError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700 flex items-center">
                  <AlertCircle size={16} className="mr-2 shrink-0" /> {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Tên mẫu hợp đồng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    placeholder="VD: Hợp đồng thuê xe tự lái theo ngày chuẩn"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Loại mẫu <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="templateType"
                    value={formData.templateType}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white text-sm"
                  >
                    <option value="DAILY">Thuê theo ngày (DAILY)</option>
                    <option value="MONTHLY">Thuê theo tháng (MONTHLY)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Phiên bản
                  </label>
                  <input
                    type="text"
                    name="version"
                    value={formData.version}
                    onChange={handleFormChange}
                    placeholder="v1.0"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 text-sm font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Mô tả phạm vi áp dụng (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="VD: Áp dụng cho các giao dịch thuê xe tự lái nội thành..."
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 text-sm"
                  />
                </div>
              </div>

              {/* Placeholder suggestions banner */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-md p-3">
                <div className="flex items-center text-xs font-semibold text-zinc-700 mb-2">
                  <Tag size={14} className="mr-1 text-zinc-500" />
                  Bấm vào tag bên dưới để tự động chèn trường dữ liệu vào vị trí con trỏ:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PLACEHOLDERS.map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => insertPlaceholder(item.tag)}
                      className="inline-flex items-center px-2 py-1 rounded bg-white border border-zinc-300 text-xs font-mono text-zinc-800 hover:bg-zinc-100 hover:border-zinc-400 transition-colors shadow-2xs cursor-pointer"
                      title={item.desc}
                    >
                      <span className="font-semibold text-blue-600 mr-1">{item.tag}</span>
                      <span className="text-zinc-500 text-[10px]">({item.desc})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contract Content */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-zinc-700">
                    Nội dung mẫu hợp đồng <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-zinc-400">Hỗ trợ các placeholder động theo cú pháp {`{{TênBiến}}`}</span>
                </div>
                <textarea
                  ref={textareaRef}
                  name="content"
                  value={formData.content}
                  onChange={handleFormChange}
                  rows={14}
                  required
                  placeholder="Nhập nội dung các điều khoản hợp đồng..."
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 font-mono text-xs leading-relaxed"
                ></textarea>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-zinc-200 bg-zinc-50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-zinc-300 rounded-md text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={modalSaving}
                className={`inline-flex items-center px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium ${
                  modalSaving ? 'opacity-70' : 'hover:bg-zinc-800'
                }`}
              >
                {modalSaving ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                Lưu mẫu hợp đồng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== PREVIEW MODAL ===================== */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setPreviewTemplate(null)} />
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col z-10 overflow-hidden">
            {/* Preview Header */}
            <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-100">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <Eye size={20} className="text-teal-600" />
                  Xem trước: {previewTemplate.name}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Văn bản hợp đồng đã được giả lập điền dữ liệu khách hàng & phương tiện mẫu.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center px-3 py-1.5 bg-white border border-zinc-300 text-zinc-700 text-xs font-medium rounded hover:bg-zinc-50 transition-colors shadow-2xs"
                >
                  <Printer size={14} className="mr-1.5 text-zinc-600" /> In / Tải PDF
                </button>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded hover:bg-zinc-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Document Body (A4 Simulation) */}
            <div className="p-4 sm:p-8 overflow-y-auto bg-zinc-200/60 flex-1">
              <div className="mx-auto bg-white shadow-lg border border-zinc-300 w-full max-w-3xl min-h-full p-8 sm:p-12 font-serif text-sm leading-relaxed text-zinc-900 whitespace-pre-wrap select-text rounded-sm">
                {renderPreviewContent(previewTemplate.content)}
              </div>
            </div>

            {/* Preview Footer */}
            <div className="px-6 py-3 border-t border-zinc-200 bg-zinc-50 flex justify-between items-center text-xs text-zinc-500">
              <div>
                Phiên bản: <span className="font-mono font-bold text-zinc-700">{previewTemplate.version}</span> | 
                Loại: <span className="font-semibold text-zinc-700 ml-1">{previewTemplate.templateType === 'DAILY' ? 'Thuê ngày' : 'Thuê tháng'}</span>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-1.5 bg-zinc-900 text-white rounded text-xs font-medium hover:bg-zinc-800"
              >
                Đóng xem trước
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TOGGLE STATUS CONFIRM MODAL ===================== */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setStatusModal(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6 z-10 text-center">
            <ShieldAlert size={48} className={`mx-auto mb-4 ${statusModal.isActive ? 'text-orange-500' : 'text-green-500'}`} />
            <h3 className="text-lg font-bold text-zinc-900 mb-2">
              Xác nhận {statusModal.isActive ? 'ngừng áp dụng' : 'kích hoạt'}
            </h3>
            <p className="text-sm text-zinc-500 mb-6">
              Bạn có chắc muốn {statusModal.isActive ? 'ngừng áp dụng' : 'kích hoạt'} mẫu hợp đồng <strong>{statusModal.name}</strong> không?
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setStatusModal(null)}
                className="px-4 py-2 border border-zinc-300 rounded-md text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50"
              >
                Hủy
              </button>
              <button
                onClick={confirmToggleStatus}
                disabled={statusLoading}
                className={`px-4 py-2 text-white rounded-md text-sm font-medium disabled:opacity-70 ${
                  statusModal.isActive ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {statusLoading ? 'Đang xử lý...' : (statusModal.isActive ? 'Ngừng áp dụng' : 'Kích hoạt')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRM MODAL ===================== */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDeleteModal(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6 z-10 text-center">
            <Trash2 size={48} className="mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-bold text-zinc-900 mb-2">
              Xác nhận xóa mẫu hợp đồng
            </h3>
            <p className="text-sm text-zinc-500 mb-6">
              Bạn có chắc chắn muốn xóa mẫu hợp đồng <strong>{deleteModal.name}</strong>? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 border border-zinc-300 rounded-md text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-70"
              >
                {deleteLoading ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ContractTemplatesPage;
