class DeliveryZone {
  final String id;
  final String label;
  final double estimatedKm;

  const DeliveryZone({
    required this.id,
    required this.label,
    required this.estimatedKm,
  });
}

const String veloraYardDefault =
    'Bãi xe VELORA - 120 Cộng Hòa, P. 12, Q. Tân Bình, TP.HCM';

const List<DeliveryZone> hcmcDeliveryZones = [
  DeliveryZone(id: 'TSN', label: 'Sân bay Quốc tế Tân Sơn Nhất', estimatedKm: 3),
  DeliveryZone(id: 'TAN_BINH', label: 'Quận Tân Bình', estimatedKm: 4),
  DeliveryZone(id: 'PHU_NHUAN', label: 'Quận Phú Nhuận', estimatedKm: 5),
  DeliveryZone(id: 'Q10', label: 'Quận 10', estimatedKm: 6),
  DeliveryZone(id: 'Q3', label: 'Quận 3', estimatedKm: 7),
  DeliveryZone(id: 'TAN_PHU', label: 'Quận Tân Phú', estimatedKm: 7),
  DeliveryZone(id: 'GO_VAP', label: 'Quận Gò Vấp', estimatedKm: 8),
  DeliveryZone(id: 'Q11', label: 'Quận 11', estimatedKm: 8),
  DeliveryZone(id: 'Q1', label: 'Quận 1', estimatedKm: 9),
  DeliveryZone(id: 'BINH_THANH', label: 'Quận Bình Thạnh', estimatedKm: 9),
  DeliveryZone(id: 'Q5', label: 'Quận 5', estimatedKm: 9),
  DeliveryZone(id: 'Q6', label: 'Quận 6', estimatedKm: 10),
  DeliveryZone(id: 'Q4', label: 'Quận 4', estimatedKm: 11),
  DeliveryZone(id: 'Q8', label: 'Quận 8', estimatedKm: 12),
  DeliveryZone(id: 'Q12', label: 'Quận 12', estimatedKm: 12),
  DeliveryZone(id: 'BINH_TAN', label: 'Quận Bình Tân', estimatedKm: 12),
  DeliveryZone(
    id: 'THU_DUC_Q2',
    label: 'TP. Thủ Đức (Khu vực Quận 2 / Thảo Điền)',
    estimatedKm: 14,
  ),
  DeliveryZone(id: 'Q7', label: 'Quận 7 (Phú Mỹ Hưng)', estimatedKm: 15),
  DeliveryZone(
    id: 'THU_DUC_MAIN',
    label: 'TP. Thủ Đức (Khu vực Quận 9 / Thủ Đức)',
    estimatedKm: 18,
  ),
  DeliveryZone(id: 'BINH_CHANH', label: 'Huyện Bình Chánh', estimatedKm: 18),
  DeliveryZone(id: 'HOC_MON', label: 'Huyện Hóc Môn', estimatedKm: 19),
  DeliveryZone(id: 'NHA_BE', label: 'Huyện Nhà Bè', estimatedKm: 20),
  DeliveryZone(id: 'CU_CHI', label: 'Huyện Củ Chi', estimatedKm: 32),
  DeliveryZone(id: 'CAN_GIO', label: 'Huyện Cần Giờ', estimatedKm: 45),
];

DeliveryZone getDeliveryZoneById(String zoneId) {
  return hcmcDeliveryZones.firstWhere(
    (z) => z.id == zoneId,
    orElse: () => hcmcDeliveryZones.first,
  );
}

String formatYardAddress(String? vehiclePickupLocation) {
  if (vehiclePickupLocation == null || vehiclePickupLocation.trim().isEmpty) {
    return veloraYardDefault;
  }
  final trimmed = vehiclePickupLocation.trim();
  final lower = trimmed.toLowerCase();
  if (lower.contains('bãi') || lower.contains('velora') || lower.contains('trạm')) {
    return trimmed;
  }
  return 'Bãi xe VELORA ($trimmed)';
}
