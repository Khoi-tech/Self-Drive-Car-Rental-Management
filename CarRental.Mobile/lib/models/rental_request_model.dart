import 'package:intl/intl.dart';

class CreateRentalRequestDto {
  final String carId;
  final DateTime startTime;
  final DateTime endTime;
  final String pickupLocation;
  final String dropoffLocation;
  final String customerName;
  final String customerPhone;
  final String customerEmail;
  final String customerIdCard;
  final String driverLicenseNumber;
  final String? driverLicenseClass;
  final DateTime? declaredDob;
  final String? declaredLicenseClass;
  final DateTime? declaredLicenseIssueDate;
  final String bookingType; // STANDARD, FAST_HOLD
  final String depositMethod; // VIETQR, CASH
  final double holdDepositAmount;
  final String deliveryMethod; // SELF_PICKUP, DELIVERY
  final double estimatedDeliveryDistanceKm;
  final String? notes;

  CreateRentalRequestDto({
    required this.carId,
    required this.startTime,
    required this.endTime,
    required this.pickupLocation,
    required this.dropoffLocation,
    required this.customerName,
    required this.customerPhone,
    required this.customerEmail,
    required this.customerIdCard,
    required this.driverLicenseNumber,
    this.driverLicenseClass,
    this.declaredDob,
    this.declaredLicenseClass,
    this.declaredLicenseIssueDate,
    this.bookingType = 'STANDARD',
    this.depositMethod = 'VIETQR',
    this.holdDepositAmount = 0,
    this.deliveryMethod = 'SELF_PICKUP',
    this.estimatedDeliveryDistanceKm = 0,
    this.notes,
  });

  static String? _formatDateOnly(DateTime? dt) {
    if (dt == null) return null;
    final y = dt.year.toString().padLeft(4, '0');
    final m = dt.month.toString().padLeft(2, '0');
    final d = dt.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }

  Map<String, dynamic> toJson() {
    final licenseCls = driverLicenseClass ?? 'B1';
    return {
      'carId': carId,
      'startTime': startTime.toUtc().toIso8601String(),
      'endTime': endTime.toUtc().toIso8601String(),
      'pickupLocation': pickupLocation,
      'dropoffLocation': dropoffLocation,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'customerEmail': customerEmail,
      'customerIdCard': customerIdCard,
      'driverLicenseNumber': driverLicenseNumber,
      'driverLicenseClass': licenseCls,
      if (declaredDob != null) 'declaredDob': _formatDateOnly(declaredDob),
      'declaredLicenseClass': declaredLicenseClass ?? licenseCls,
      if (declaredLicenseIssueDate != null)
        'declaredLicenseIssueDate': _formatDateOnly(declaredLicenseIssueDate),
      'bookingType': bookingType,
      'depositMethod': depositMethod,
      'holdDepositAmount': holdDepositAmount,
      'deliveryMethod': deliveryMethod,
      'estimatedDeliveryDistanceKm': estimatedDeliveryDistanceKm,
      'notes': notes,
    };
  }
}

class RentalRequestModel {
  final String id;
  final String carId;
  final DateTime startTime;
  final DateTime endTime;
  final String pickupLocation;
  final String dropoffLocation;
  final String customerName;
  final String customerPhone;
  final String customerEmail;
  final String customerIdCard;
  final String driverLicenseNumber;
  final String? driverLicenseClass;
  final DateTime? declaredDob;
  final String? declaredLicenseClass;
  final DateTime? declaredLicenseIssueDate;
  final String? notes;
  final String deliveryMethod;
  final double? estimatedDeliveryDistanceKm;
  final int totalDays;
  final double dailyRate;
  final double discountPercent;
  final double holidaySurchargePercent;
  final double estimatedTotalFee;
  final double depositAmount;
  final String bookingType;
  final String depositMethod;
  final double holdDepositAmount;
  final bool isSecurityDepositPaid;
  final DateTime? holdExpiresAt;
  final double remainingSecurityDeposit;
  final bool isHoldExpired;
  final String status;
  final String? rejectReason;
  final String? carMake;
  final String? carModel;
  final String? carLicensePlate;
  final String? carImageUrl;
  final DateTime createdAt;

  RentalRequestModel({
    required this.id,
    required this.carId,
    required this.startTime,
    required this.endTime,
    required this.pickupLocation,
    required this.dropoffLocation,
    required this.customerName,
    required this.customerPhone,
    required this.customerEmail,
    required this.customerIdCard,
    required this.driverLicenseNumber,
    this.driverLicenseClass,
    this.declaredDob,
    this.declaredLicenseClass,
    this.declaredLicenseIssueDate,
    this.notes,
    this.deliveryMethod = 'SELF_PICKUP',
    this.estimatedDeliveryDistanceKm,
    required this.totalDays,
    required this.dailyRate,
    this.discountPercent = 0,
    this.holidaySurchargePercent = 0,
    required this.estimatedTotalFee,
    required this.depositAmount,
    this.bookingType = 'STANDARD',
    this.depositMethod = 'VIETQR',
    this.holdDepositAmount = 0,
    this.isSecurityDepositPaid = false,
    this.holdExpiresAt,
    this.remainingSecurityDeposit = 0,
    this.isHoldExpired = false,
    required this.status,
    this.rejectReason,
    this.carMake,
    this.carModel,
    this.carLicensePlate,
    this.carImageUrl,
    required this.createdAt,
  });

  factory RentalRequestModel.fromJson(Map<String, dynamic> json) {
    return RentalRequestModel(
      id: json['id']?.toString() ?? '',
      carId: json['carId']?.toString() ?? '',
      startTime: DateTime.tryParse(json['startTime']?.toString() ?? '') ??
          DateTime.now(),
      endTime: DateTime.tryParse(json['endTime']?.toString() ?? '') ??
          DateTime.now(),
      pickupLocation: json['pickupLocation']?.toString() ?? '',
      dropoffLocation: json['dropoffLocation']?.toString() ?? '',
      customerName: json['customerName']?.toString() ?? '',
      customerPhone: json['customerPhone']?.toString() ?? '',
      customerEmail: json['customerEmail']?.toString() ?? '',
      customerIdCard: json['customerIdCard']?.toString() ?? '',
      driverLicenseNumber: json['driverLicenseNumber']?.toString() ?? '',
      driverLicenseClass: json['driverLicenseClass']?.toString(),
      declaredDob: json['declaredDob'] != null
          ? DateTime.tryParse(json['declaredDob'].toString())
          : null,
      declaredLicenseClass: json['declaredLicenseClass']?.toString(),
      declaredLicenseIssueDate: json['declaredLicenseIssueDate'] != null
          ? DateTime.tryParse(json['declaredLicenseIssueDate'].toString())
          : null,
      notes: json['notes']?.toString(),
      deliveryMethod: json['deliveryMethod']?.toString() ?? 'SELF_PICKUP',
      estimatedDeliveryDistanceKm: (json['estimatedDeliveryDistanceKm'] is num)
          ? (json['estimatedDeliveryDistanceKm'] as num).toDouble()
          : null,
      totalDays:
          (json['totalDays'] is num) ? (json['totalDays'] as num).toInt() : 1,
      dailyRate: (json['dailyRate'] is num)
          ? (json['dailyRate'] as num).toDouble()
          : 0.0,
      discountPercent: (json['discountPercent'] is num)
          ? (json['discountPercent'] as num).toDouble()
          : 0.0,
      holidaySurchargePercent: (json['holidaySurchargePercent'] is num)
          ? (json['holidaySurchargePercent'] as num).toDouble()
          : 0.0,
      estimatedTotalFee: (json['estimatedTotalFee'] is num)
          ? (json['estimatedTotalFee'] as num).toDouble()
          : 0.0,
      depositAmount: (json['depositAmount'] is num)
          ? (json['depositAmount'] as num).toDouble()
          : 0.0,
      bookingType: json['bookingType']?.toString() ?? 'STANDARD',
      depositMethod: json['depositMethod']?.toString() ?? 'VIETQR',
      holdDepositAmount: (json['holdDepositAmount'] is num)
          ? (json['holdDepositAmount'] as num).toDouble()
          : 0.0,
      isSecurityDepositPaid: json['isSecurityDepositPaid'] == true,
      holdExpiresAt: json['holdExpiresAt'] != null
          ? DateTime.tryParse(json['holdExpiresAt'].toString())
          : null,
      remainingSecurityDeposit: (json['remainingSecurityDeposit'] is num)
          ? (json['remainingSecurityDeposit'] as num).toDouble()
          : 0.0,
      isHoldExpired: json['isHoldExpired'] == true,
      status: json['status']?.toString() ?? 'PENDING',
      rejectReason: json['rejectReason']?.toString(),
      carMake: json['carMake']?.toString(),
      carModel: json['carModel']?.toString(),
      carLicensePlate: json['carLicensePlate']?.toString(),
      carImageUrl: json['carImageUrl']?.toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }

  bool get isCashDeposit => depositMethod.toUpperCase() == 'CASH';
  bool get isFastHold => bookingType.toUpperCase() == 'FAST_HOLD';
  bool get isDelivery => deliveryMethod.toUpperCase() == 'DELIVERY';

  String get carDisplayName => '${carMake ?? ''} ${carModel ?? ''}'.trim();

  String get formattedTotalFee {
    final f = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');
    return f.format(estimatedTotalFee);
  }

  String get formattedDeposit {
    final f = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');
    return f.format(depositAmount);
  }
}
