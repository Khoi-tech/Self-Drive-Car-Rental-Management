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
    this.notes,
  });

  Map<String, dynamic> toJson() {
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
      'driverLicenseClass': driverLicenseClass ?? 'B2',
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
  final int totalDays;
  final double dailyRate;
  final double estimatedTotalFee;
  final double depositAmount;
  final String status;
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
    required this.totalDays,
    required this.dailyRate,
    required this.estimatedTotalFee,
    required this.depositAmount,
    required this.status,
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
      startTime: DateTime.tryParse(json['startTime']?.toString() ?? '') ?? DateTime.now(),
      endTime: DateTime.tryParse(json['endTime']?.toString() ?? '') ?? DateTime.now(),
      pickupLocation: json['pickupLocation'] ?? '',
      dropoffLocation: json['dropoffLocation'] ?? '',
      customerName: json['customerName'] ?? '',
      customerPhone: json['customerPhone'] ?? '',
      customerEmail: json['customerEmail'] ?? '',
      customerIdCard: json['customerIdCard'] ?? '',
      driverLicenseNumber: json['driverLicenseNumber'] ?? '',
      driverLicenseClass: json['driverLicenseClass'],
      totalDays: (json['totalDays'] is num) ? (json['totalDays'] as num).toInt() : 1,
      dailyRate: (json['dailyRate'] is num) ? (json['dailyRate'] as num).toDouble() : 0.0,
      estimatedTotalFee: (json['estimatedTotalFee'] is num)
          ? (json['estimatedTotalFee'] as num).toDouble()
          : 0.0,
      depositAmount: (json['depositAmount'] is num)
          ? (json['depositAmount'] as num).toDouble()
          : 0.0,
      status: json['status']?.toString() ?? 'PENDING',
      carMake: json['carMake'],
      carModel: json['carModel'],
      carLicensePlate: json['carLicensePlate'],
      carImageUrl: json['carImageUrl'],
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }

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
