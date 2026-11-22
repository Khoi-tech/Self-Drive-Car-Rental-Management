class PricingPolicyModel {
  final String id;
  final String vehicleId;
  final int minDays;
  final double discountPercentage;
  final double holidaySurcharge;
  final DateTime? createdAt;

  PricingPolicyModel({
    required this.id,
    required this.vehicleId,
    required this.minDays,
    required this.discountPercentage,
    required this.holidaySurcharge,
    this.createdAt,
  });

  factory PricingPolicyModel.fromJson(Map<String, dynamic> json) {
    return PricingPolicyModel(
      id: json['id']?.toString() ?? '',
      vehicleId: json['vehicleId']?.toString() ?? '',
      minDays: (json['minDays'] is num) ? (json['minDays'] as num).toInt() : 1,
      discountPercentage: (json['discountPercentage'] is num)
          ? (json['discountPercentage'] as num).toDouble()
          : 0.0,
      holidaySurcharge: (json['holidaySurcharge'] is num)
          ? (json['holidaySurcharge'] as num).toDouble()
          : 0.0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }
}

class PricingPreviewModel {
  final double basePrice;
  final int rentalDays;
  final int? selectedMinDays;
  final double discountPercentage;
  final double holidaySurcharge;
  final double vietQrDiscountPercentage;
  final double baseSubtotal;
  final double discountAmount;
  final double holidaySurchargeAmount;
  final double vietQrDiscountAmount;
  final double adjustedDailyPrice;
  final double rentalPrice;

  PricingPreviewModel({
    required this.basePrice,
    required this.rentalDays,
    this.selectedMinDays,
    required this.discountPercentage,
    required this.holidaySurcharge,
    this.vietQrDiscountPercentage = 0.0,
    required this.baseSubtotal,
    required this.discountAmount,
    required this.holidaySurchargeAmount,
    this.vietQrDiscountAmount = 0.0,
    required this.adjustedDailyPrice,
    required this.rentalPrice,
  });

  factory PricingPreviewModel.fromJson(Map<String, dynamic> json) {
    final basePrice =
        (json['basePrice'] is num) ? (json['basePrice'] as num).toDouble() : 0.0;
    final rentalDays =
        (json['rentalDays'] is num) ? (json['rentalDays'] as num).toInt() : 1;
    final discountPct = (json['discountPercentage'] is num)
        ? (json['discountPercentage'] as num).toDouble()
        : 0.0;
    final holidayPct = (json['holidaySurcharge'] is num)
        ? (json['holidaySurcharge'] as num).toDouble()
        : 0.0;
    final baseSubtotal = (json['baseSubtotal'] is num)
        ? (json['baseSubtotal'] as num).toDouble()
        : basePrice * rentalDays;
    final discountAmount = (json['discountAmount'] is num)
        ? (json['discountAmount'] as num).toDouble()
        : (baseSubtotal * discountPct / 100.0).roundToDouble();
    final holidayAmount = (json['holidaySurchargeAmount'] is num)
        ? (json['holidaySurchargeAmount'] as num).toDouble()
        : (baseSubtotal * holidayPct / 100.0).roundToDouble();

    return PricingPreviewModel(
      basePrice: basePrice,
      rentalDays: rentalDays,
      selectedMinDays: (json['selectedMinDays'] is num)
          ? (json['selectedMinDays'] as num).toInt()
          : null,
      discountPercentage: discountPct,
      holidaySurcharge: holidayPct,
      vietQrDiscountPercentage: (json['vietQrDiscountPercentage'] is num)
          ? (json['vietQrDiscountPercentage'] as num).toDouble()
          : 0.0,
      baseSubtotal: baseSubtotal,
      discountAmount: discountAmount,
      holidaySurchargeAmount: holidayAmount,
      vietQrDiscountAmount: (json['vietQrDiscountAmount'] is num)
          ? (json['vietQrDiscountAmount'] as num).toDouble()
          : 0.0,
      adjustedDailyPrice: (json['adjustedDailyPrice'] is num)
          ? (json['adjustedDailyPrice'] as num).toDouble()
          : basePrice,
      rentalPrice: (json['rentalPrice'] is num)
          ? (json['rentalPrice'] as num).toDouble()
          : baseSubtotal,
    );
  }
}
