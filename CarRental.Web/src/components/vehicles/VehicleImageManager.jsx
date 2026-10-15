import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  Clipboard, 
  X, 
  Check, 
  AlertCircle, 
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
  Layers,
  Eye
} from 'lucide-react';
import { 
  DEFAULT_PHOTO_SLOTS, 
  CURATED_PRESETS, 
  parseVehicleImages, 
  serializeVehicleImages 
} from '../../utils/imageGalleryHelper';

const VehicleImageManager = ({ value = '', onChange, vehicleMake = '' }) => {
  // Array of images: [{ id, url, title, tag, description }]
  const [images, setImages] = useState([]);
  const [activeSlot, setActiveSlot] = useState(0);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [previewZoomUrl, setPreviewZoomUrl] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  // Initialize from props.value
  useEffect(() => {
    const parsed = parseVehicleImages(value);
    
    // Ensure we always have at least the 5 standard slots represented
    const initialSlots = DEFAULT_PHOTO_SLOTS.map((slot, idx) => {
      const existing = parsed[idx];
      return {
        id: existing?.id || `slot-${idx}`,
        url: existing?.url || '',
        title: existing?.title || slot.suggestedTitle,
        tag: existing?.tag || slot.tag,
        description: existing?.description || slot.description,
        isCustom: false
      };
    });

    // If there were extra custom images beyond 5
    if (parsed.length > 5) {
      for (let i = 5; i < parsed.length; i++) {
        initialSlots.push({
          id: parsed[i].id || `custom-${i}`,
          url: parsed[i].url || '',
          title: parsed[i].title || `Góc chụp #${i + 1}`,
          tag: parsed[i].tag || 'Bổ sung',
          description: parsed[i].description || '',
          isCustom: true
        });
      }
    }

    setImages(initialSlots);
  }, [value]);

  // Notify parent of changes
  const notifyChange = (updatedList) => {
    setImages(updatedList);
    if (onChange) {
      const serialized = serializeVehicleImages(updatedList);
      onChange(serialized, updatedList);
    }
  };

  const handleUpdateSlot = (index, field, val) => {
    const updated = [...images];
    updated[index] = {
      ...updated[index],
      [field]: val
    };

    // Clear error for this slot if url changed
    if (field === 'url') {
      setImageErrors(prev => ({ ...prev, [index]: false }));
    }

    notifyChange(updated);
  };

  const handleClearSlot = (index) => {
    const updated = [...images];
    if (updated[index].isCustom) {
      // Remove custom slot completely
      updated.splice(index, 1);
    } else {
      // Reset standard slot to empty
      const defaultSlot = DEFAULT_PHOTO_SLOTS[index];
      updated[index] = {
        ...updated[index],
        url: '',
        title: defaultSlot?.suggestedTitle || '',
        description: defaultSlot?.description || ''
      };
    }
    notifyChange(updated);
  };

  const handleAddCustomSlot = () => {
    const nextIdx = images.length + 1;
    const newSlot = {
      id: `custom-${Date.now()}`,
      url: '',
      title: `Chi tiết bổ sung #${nextIdx}`,
      tag: 'Bổ sung',
      description: 'Hình ảnh góc chụp thực tế bổ sung của xe.',
      isCustom: true
    };
    notifyChange([...images, newSlot]);
    setActiveSlot(images.length);
  };

  // Preset Auto-fill
  const handleApplyPreset = (preset) => {
    if (!preset || !preset.images) return;
    const updated = [...images];

    preset.images.forEach((presetImg, idx) => {
      if (idx < updated.length) {
        updated[idx] = {
          ...updated[idx],
          url: presetImg.url,
          title: presetImg.title,
          tag: presetImg.tag,
          description: presetImg.description
        };
      } else {
        updated.push({
          id: `preset-${idx}-${Date.now()}`,
          url: presetImg.url,
          title: presetImg.title,
          tag: presetImg.tag,
          description: presetImg.description,
          isCustom: true
        });
      }
    });

    setImageErrors({});
    notifyChange(updated);
  };

  // Bulk URL paste handler
  const handleApplyBulk = () => {
    if (!bulkText.trim()) {
      setIsBulkModalOpen(false);
      return;
    }

    const lines = bulkText.split(/[\r\n,]+/).map(s => s.trim()).filter(s => s.startsWith('http://') || s.startsWith('https://'));
    if (lines.length === 0) {
      alert('Không tìm thấy đường dẫn hình ảnh hợp lệ (bắt đầu bằng http:// hoặc https://).');
      return;
    }

    const updated = [...images];
    lines.forEach((url, idx) => {
      if (idx < updated.length) {
        updated[idx] = {
          ...updated[idx],
          url: url
        };
      } else {
        updated.push({
          id: `bulk-${idx}-${Date.now()}`,
          url: url,
          title: `Góc ảnh #${idx + 1}`,
          tag: 'Bổ sung',
          description: '',
          isCustom: true
        });
      }
    });

    setImageErrors({});
    notifyChange(updated);
    setBulkText('');
    setIsBulkModalOpen(false);
  };

  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách ảnh đã cấu hình?')) {
      const resetSlots = DEFAULT_PHOTO_SLOTS.map((slot, idx) => ({
        id: `slot-${idx}`,
        url: '',
        title: slot.suggestedTitle,
        tag: slot.tag,
        description: slot.description,
        isCustom: false
      }));
      setImageErrors({});
      notifyChange(resetSlots);
    }
  };

  // Count configured images
  const filledCount = images.filter(i => Boolean(i.url && i.url.trim())).length;
  const currentSlot = images[activeSlot] || images[0];

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-900" />
              Thư viện ảnh xe & Miêu tả chi tiết
            </h3>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold tabular-nums border ${
              filledCount > 0 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {filledCount}/{images.length} góc ảnh
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý từng góc chụp (Ngoại thất, Khoang lái, Ghế sau, Đuôi xe, Mâm xe) để hiển thị đồng bộ trên trang chi tiết xe của khách hàng.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Selector */}
          <div className="relative group">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 hover:text-blue-900 hover:border-blue-900/40 shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-900" />
              <span>Nạp bộ ảnh mẫu</span>
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-lg shadow-xl p-1.5 z-20 hidden group-hover:block group-focus-within:block">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                Chọn mẫu ảnh theo dòng xe:
              </div>
              {CURATED_PRESETS.map((preset) => (
                <button
                  key={preset.brand}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-900 rounded-md transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate">{preset.name}</span>
                  <span className="text-[10px] text-slate-400">5 góc</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Paste */}
          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 hover:text-blue-900 shadow-xs transition-colors cursor-pointer"
            title="Dán nhiều link ảnh cùng lúc"
          >
            <Clipboard className="w-3.5 h-3.5 text-slate-500" />
            <span>Dán hàng loạt</span>
          </button>

          {/* Reset All */}
          {filledCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
              title="Xóa tất cả ảnh đã nhập"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xóa hết</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace: Slot Navigation Rail + Slot Detail Editor */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (5 Cols): Thumbnails & Slot Selector */}
        <div className="lg:col-span-5 space-y-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Danh sách góc chụp ({images.length})
          </label>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {images.map((item, idx) => {
              const hasUrl = Boolean(item.url && item.url.trim());
              const isSelected = activeSlot === idx;
              const hasError = imageErrors[idx];

              return (
                <div
                  key={item.id || idx}
                  onClick={() => setActiveSlot(idx)}
                  className={`group relative p-2.5 rounded-lg border transition-all cursor-pointer flex items-center gap-3 ${
                    isSelected 
                      ? 'bg-blue-50/70 border-blue-900/60 shadow-xs ring-1 ring-blue-900/30' 
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  {/* Thumbnail Preview Box */}
                  <div className="relative w-20 h-14 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                    {hasUrl ? (
                      <img 
                        src={item.url} 
                        alt={item.title} 
                        onError={() => setImageErrors(prev => ({ ...prev, [idx]: true }))}
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <Camera className="w-5 h-5 text-slate-300" />
                    )}

                    {hasError && (
                      <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center text-white" title="Link ảnh bị lỗi">
                        <AlertCircle className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {/* Number Badge */}
                    <span className="absolute top-0.5 left-0.5 bg-black/70 text-white text-[9px] font-bold px-1 rounded tabular-nums">
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Slot Text Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded border bg-white border-slate-200 text-slate-700 shrink-0">
                        {item.tag || 'Góc ảnh'}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] font-extrabold text-blue-900 uppercase">
                          (Ảnh bìa)
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-zinc-900 truncate">
                      {item.title || `Góc chụp #${idx + 1}`}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {hasUrl ? item.url : 'Chưa nhập liên kết ảnh...'}
                    </div>
                  </div>

                  {/* Quick Status Icon */}
                  <div className="shrink-0">
                    {hasUrl && !hasError ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add custom extra angle button */}
          <button
            type="button"
            onClick={handleAddCustomSlot}
            className="w-full py-2.5 px-3 border border-dashed border-slate-300 hover:border-blue-900 hover:bg-blue-50/40 text-blue-900 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-3"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm góc chụp khác</span>
          </button>
        </div>

        {/* Right Column (7 Cols): Active Slot Detail Editor */}
        <div className="lg:col-span-7 bg-slate-50/50 border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                Đang chỉnh sửa: Góc #{activeSlot + 1}
              </span>
              <h4 className="text-base font-bold text-zinc-950 mt-0.5">
                {currentSlot?.title || `Góc chụp #${activeSlot + 1}`}
              </h4>
            </div>

            {/* Clear or delete this slot */}
            <div className="flex items-center gap-2">
              {currentSlot?.url && (
                <button
                  type="button"
                  onClick={() => setPreviewZoomUrl(currentSlot.url)}
                  className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-900 rounded-md shadow-xs transition-colors cursor-pointer"
                  title="Phóng to ảnh góc này"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleClearSlot(activeSlot)}
                className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:text-rose-600 rounded-md shadow-xs transition-colors cursor-pointer"
                title={currentSlot?.isCustom ? 'Xóa góc này' : 'Xóa trắng góc này'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Large Live Preview Container */}
          <div className="relative aspect-[16/10] bg-slate-900 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center group shadow-xs">
            {currentSlot?.url ? (
              <>
                <img 
                  src={currentSlot.url} 
                  alt={currentSlot.title} 
                  onError={() => setImageErrors(prev => ({ ...prev, [activeSlot]: true }))}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102" 
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/20">
                  {currentSlot.tag || 'Góc chụp'}
                </div>
                <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-md text-white p-2 rounded-md border border-white/10">
                  <p className="text-xs font-bold leading-tight truncate">{currentSlot.title}</p>
                  {currentSlot.description && (
                    <p className="text-[10px] text-slate-300 truncate mt-0.5">{currentSlot.description}</p>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center p-6 text-slate-400">
                <ImageIcon className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-slate-300">Chưa có liên kết ảnh cho góc này</p>
                <p className="text-[11px] text-slate-500 mt-1">Dán URL ảnh vào ô bên dưới để xem trước tức thì</p>
              </div>
            )}

            {imageErrors[activeSlot] && (
              <div className="absolute inset-0 bg-rose-950/85 flex flex-col items-center justify-center p-4 text-center text-white">
                <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
                <p className="text-xs font-bold">Không thể tải hình ảnh từ liên kết này</p>
                <p className="text-[11px] text-rose-200 mt-1">Vui lòng kiểm tra lại URL ảnh công khai (Unsplash, Cloudinary, Imgur, v.v.)</p>
              </div>
            )}
          </div>

          {/* Form Fields for this slot */}
          <div className="space-y-3.5 pt-2">
            {/* Image URL Input */}
            <div>
              <label className="block text-xs font-bold text-zinc-900 mb-1 flex items-center justify-between">
                <span>Đường dẫn hình ảnh (URL) <span className="text-rose-500">*</span></span>
                <span className="text-[10px] font-normal text-slate-500">Hỗ trợ JPG, PNG, WebP (https://...)</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={currentSlot?.url || ''}
                  onChange={(e) => handleUpdateSlot(activeSlot, 'url', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-xs font-mono text-zinc-950"
                />
                {currentSlot?.url && (
                  <button
                    type="button"
                    onClick={() => handleUpdateSlot(activeSlot, 'url', '')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Title / Caption */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Tiêu đề góc chụp (Hiển thị cho khách hàng)
                </label>
                <input
                  type="text"
                  placeholder="VD: Khoang lái & Vô lăng thể thao"
                  value={currentSlot?.title || ''}
                  onChange={(e) => handleUpdateSlot(activeSlot, 'title', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-xs font-medium text-zinc-950"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1">
                  Phân loại (Tag)
                </label>
                <select
                  value={currentSlot?.tag || 'Góc chính'}
                  onChange={(e) => handleUpdateSlot(activeSlot, 'tag', e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-xs font-medium text-zinc-950"
                >
                  <option value="Góc chính">Góc chính</option>
                  <option value="Nội thất">Nội thất</option>
                  <option value="Không gian">Không gian</option>
                  <option value="Góc sau">Góc sau</option>
                  <option value="Chi tiết">Chi tiết</option>
                  <option value="Bổ sung">Bổ sung</option>
                </select>
              </div>
            </div>

            {/* Description note */}
            <div>
              <label className="block text-xs font-bold text-zinc-900 mb-1">
                Miêu tả ngắn gọn tiện ích góc này
              </label>
              <input
                type="text"
                placeholder="VD: Màn hình kép cảm ứng 14 inch, tay lái bọc da đục lỗ có lẫy chuyển số..."
                value={currentSlot?.description || ''}
                onChange={(e) => handleUpdateSlot(activeSlot, 'description', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 text-xs text-zinc-950"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Bulk Paste Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h4 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
                <Clipboard className="w-4 h-4 text-blue-900" />
                Dán danh sách liên kết ảnh hàng loạt
              </h4>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-500">
                Nhập hoặc dán các URL ảnh (mỗi dòng một đường dẫn hoặc phân tách bằng dấu phẩy). Hệ thống sẽ tự động gán lần lượt vào các góc chụp từ 1 đến 5:
              </p>
              <textarea
                rows={6}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"https://images.unsplash.com/photo-front...\nhttps://images.unsplash.com/photo-cockpit...\nhttps://images.unsplash.com/photo-seats...\nhttps://images.unsplash.com/photo-rear...\nhttps://images.unsplash.com/photo-wheels..."}
                className="w-full p-3 border border-slate-300 rounded-md text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleApplyBulk}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-md shadow-xs"
              >
                Áp dụng danh sách
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {previewZoomUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewZoomUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-lg shadow-2xl">
            <img src={previewZoomUrl} alt="Preview" className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={() => setPreviewZoomUrl(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleImageManager;
