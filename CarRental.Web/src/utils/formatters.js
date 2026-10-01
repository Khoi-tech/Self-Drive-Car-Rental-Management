/**
 * Format currency to VND (e.g. 1000000 -> "1.000.000 ₫")
 */
export const formatCurrencyVND = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    currencyDisplay: 'symbol',
  })
    .format(value)
    .replace('VND', '₫');
};

export const formatCurrency = formatCurrencyVND;

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Translate vehicle status to Vietnamese and get its corresponding color
 */
export const getVehicleStatusDisplay = (status) => {
  const map = {
    READY: { label: 'Sẵn sàng', color: 'bg-green-100 text-green-800' },
    BOOKED: { label: 'Đã đặt trước', color: 'bg-yellow-100 text-yellow-800' },
    RENTED: { label: 'Đang cho thuê', color: 'bg-blue-100 text-blue-800' },
    INSPECTION: { label: 'Đang kiểm tra', color: 'bg-purple-100 text-purple-800' },
    MAINTENANCE: { label: 'Đang bảo trì', color: 'bg-orange-100 text-orange-800' },
    REPAIR: { label: 'Đang sửa chữa', color: 'bg-red-100 text-red-800' },
    INACTIVE: { label: 'Ngừng hoạt động', color: 'bg-zinc-100 text-zinc-800' },
  };

  return map[status] || { label: status || 'Không rõ', color: 'bg-gray-100 text-gray-800' };
};

/**
 * Translate transmission type
 */
export const getTransmissionDisplay = (transmission) => {
  const map = {
    AUTO: 'Tự động',
    MANUAL: 'Số sàn',
  };
  return map[transmission] || transmission || 'Không rõ';
};

/**
 * Translate fuel type
 */
export const getFuelTypeDisplay = (fuelType) => {
  const map = {
    PETROL: 'Xăng',
    DIESEL: 'Dầu Diesel',
    ELECTRIC: 'Điện',
  };
  return map[fuelType] || fuelType || 'Không rõ';
};
