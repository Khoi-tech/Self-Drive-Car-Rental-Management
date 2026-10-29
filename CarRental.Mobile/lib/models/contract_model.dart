import 'package:intl/intl.dart';

class RentalContractModel {
  final String id;
  final String? requestId;
  final String contractNumber;
  final double totalFee;
  final double depositAmount;
  final int? maxKm;
  final String content;
  final String status;
  final String? customerSignature;
  final DateTime? customerSignedAt;
  final DateTime createdAt;

  final String? customerName;
  final String? customerPhone;
  final String? customerEmail;
  final String? customerIdCard;
  final String? driverLicenseNumber;
  final String? carMake;
  final String? carModel;
  final String? carLicensePlate;
  final DateTime? startTime;
  final DateTime? endTime;
  final int? totalDays;

  RentalContractModel({
    required this.id,
    this.requestId,
    required this.contractNumber,
    required this.totalFee,
    required this.depositAmount,
    this.maxKm,
    required this.content,
    required this.status,
    this.customerSignature,
    this.customerSignedAt,
    required this.createdAt,
    this.customerName,
    this.customerPhone,
    this.customerEmail,
    this.customerIdCard,
    this.driverLicenseNumber,
    this.carMake,
    this.carModel,
    this.carLicensePlate,
    this.startTime,
    this.endTime,
    this.totalDays,
  });

  factory RentalContractModel.fromJson(Map<String, dynamic> json) {
    return RentalContractModel(
      id: json['id']?.toString() ?? '',
      requestId: json['requestId']?.toString(),
      contractNumber: json['contractNumber'] ?? '',
      totalFee: (json['totalFee'] is num) ? (json['totalFee'] as num).toDouble() : 0.0,
      depositAmount: (json['depositAmount'] is num)
          ? (json['depositAmount'] as num).toDouble()
          : 0.0,
      maxKm: (json['maxKm'] is num) ? (json['maxKm'] as num).toInt() : null,
      content: json['content'] ?? '',
      status: json['status']?.toString() ?? 'WAITING_SIGNATURE',
      customerSignature: json['customerSignature'],
      customerSignedAt: json['customerSignedAt'] != null
          ? DateTime.tryParse(json['customerSignedAt'].toString())
          : null,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      customerName: json['customerName'],
      customerPhone: json['customerPhone'],
      customerEmail: json['customerEmail'],
      customerIdCard: json['customerIdCard'],
      driverLicenseNumber: json['driverLicenseNumber'],
      carMake: json['carMake'],
      carModel: json['carModel'],
      carLicensePlate: json['carLicensePlate'],
      startTime: json['startTime'] != null
          ? DateTime.tryParse(json['startTime'].toString())
          : null,
      endTime: json['endTime'] != null
          ? DateTime.tryParse(json['endTime'].toString())
          : null,
      totalDays: (json['totalDays'] is num) ? (json['totalDays'] as num).toInt() : null,
    );
  }

  bool get isSigned => status == 'SIGNED' || status == 'DEPOSIT_PAID' || status == 'ACTIVE' || status == 'COMPLETED';

  String get formattedTotalFee {
    final f = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');
    return f.format(totalFee);
  }

  String get formattedDeposit {
    final f = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');
    return f.format(depositAmount);
  }
}
