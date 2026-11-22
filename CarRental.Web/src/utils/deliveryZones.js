export const VELORA_YARD_DEFAULT = 'Bãi xe VELORA - 120 Cộng Hòa, P. 12, Q. Tân Bình, TP.HCM';

export const HCMC_DELIVERY_ZONES = [
  { id: 'TSN', label: 'Sân bay Quốc tế Tân Sơn Nhất', estimatedKm: 3 },
  { id: 'TAN_BINH', label: 'Quận Tân Bình', estimatedKm: 4 },
  { id: 'PHU_NHUAN', label: 'Quận Phú Nhuận', estimatedKm: 5 },
  { id: 'Q10', label: 'Quận 10', estimatedKm: 6 },
  { id: 'Q3', label: 'Quận 3', estimatedKm: 7 },
  { id: 'TAN_PHU', label: 'Quận Tân Phú', estimatedKm: 7 },
  { id: 'GO_VAP', label: 'Quận Gò Vấp', estimatedKm: 8 },
  { id: 'Q11', label: 'Quận 11', estimatedKm: 8 },
  { id: 'Q1', label: 'Quận 1', estimatedKm: 9 },
  { id: 'BINH_THANH', label: 'Quận Bình Thạnh', estimatedKm: 9 },
  { id: 'Q5', label: 'Quận 5', estimatedKm: 9 },
  { id: 'Q6', label: 'Quận 6', estimatedKm: 10 },
  { id: 'Q4', label: 'Quận 4', estimatedKm: 11 },
  { id: 'Q8', label: 'Quận 8', estimatedKm: 12 },
  { id: 'Q12', label: 'Quận 12', estimatedKm: 12 },
  { id: 'BINH_TAN', label: 'Quận Bình Tân', estimatedKm: 12 },
  { id: 'THU_DUC_Q2', label: 'TP. Thủ Đức (Khu vực Quận 2 / Thảo Điền)', estimatedKm: 14 },
  { id: 'Q7', label: 'Quận 7 (Phú Mỹ Hưng)', estimatedKm: 15 },
  { id: 'THU_DUC_MAIN', label: 'TP. Thủ Đức (Khu vực Quận 9 / Thủ Đức)', estimatedKm: 18 },
  { id: 'BINH_CHANH', label: 'Huyện Bình Chánh', estimatedKm: 18 },
  { id: 'HOC_MON', label: 'Huyện Hóc Môn', estimatedKm: 19 },
  { id: 'NHA_BE', label: 'Huyện Nhà Bè', estimatedKm: 20 },
  { id: 'CU_CHI', label: 'Huyện Củ Chi', estimatedKm: 32 },
  { id: 'CAN_GIO', label: 'Huyện Cần Giờ', estimatedKm: 45 },
];

export const getZoneById = (zoneId) =>
  HCMC_DELIVERY_ZONES.find((z) => z.id === zoneId) || HCMC_DELIVERY_ZONES[0];

export const formatYardAddress = (vehiclePickupLocation) => {
  if (!vehiclePickupLocation || !vehiclePickupLocation.trim()) {
    return VELORA_YARD_DEFAULT;
  }
  const trimmed = vehiclePickupLocation.trim();
  if (trimmed.toLowerCase().includes('bãi') || trimmed.toLowerCase().includes('velora') || trimmed.toLowerCase().includes('trạm')) {
    return trimmed;
  }
  return `Bãi xe VELORA (${trimmed})`;
};
