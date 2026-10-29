import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class CarModel {
  final String id;
  final String make;
  final String model;
  final String licensePlate;
  final int seats;
  final String transmission;
  final String fuelType;
  final int manufactureYear;
  final double dailyRate;
  final double depositAmount;
  final int currentMileage;
  final int? mileageLimit;
  final double? extraKmRate;
  final String? pickupLocation;
  final String status;
  final String? imageUrl;
  final bool isActive;
  final bool hasRentalCondition;
  final int? rentalConditionMinAge;
  final int? rentalConditionRequireDrivingYears;

  CarModel({
    required this.id,
    required this.make,
    required this.model,
    required this.licensePlate,
    required this.seats,
    required this.transmission,
    required this.fuelType,
    required this.manufactureYear,
    required this.dailyRate,
    required this.depositAmount,
    required this.currentMileage,
    this.mileageLimit,
    this.extraKmRate,
    this.pickupLocation,
    required this.status,
    this.imageUrl,
    this.isActive = true,
    this.hasRentalCondition = false,
    this.rentalConditionMinAge,
    this.rentalConditionRequireDrivingYears,
  });

  factory CarModel.fromJson(Map<String, dynamic> json) {
    return CarModel(
      id: json['id']?.toString() ?? '',
      make: json['make'] ?? '',
      model: json['model'] ?? '',
      licensePlate: json['licensePlate'] ?? '',
      seats: (json['seats'] is num) ? (json['seats'] as num).toInt() : 4,
      transmission: json['transmission']?.toString() ?? 'AUTO',
      fuelType: json['fuelType']?.toString() ?? 'PETROL',
      manufactureYear: (json['manufactureYear'] is num)
          ? (json['manufactureYear'] as num).toInt()
          : DateTime.now().year,
      dailyRate: (json['dailyRate'] is num)
          ? (json['dailyRate'] as num).toDouble()
          : 0.0,
      depositAmount: (json['depositAmount'] is num)
          ? (json['depositAmount'] as num).toDouble()
          : 0.0,
      currentMileage: (json['currentMileage'] is num)
          ? (json['currentMileage'] as num).toInt()
          : 0,
      mileageLimit: (json['mileageLimit'] is num)
          ? (json['mileageLimit'] as num).toInt()
          : null,
      extraKmRate: (json['extraKmRate'] is num)
          ? (json['extraKmRate'] as num).toDouble()
          : null,
      pickupLocation: json['pickupLocation'],
      status: json['status']?.toString() ?? 'READY',
      imageUrl: json['imageUrl'],
      isActive: json['isActive'] ?? true,
      hasRentalCondition: json['hasRentalCondition'] ?? false,
      rentalConditionMinAge: (json['rentalConditionMinAge'] is num)
          ? (json['rentalConditionMinAge'] as num).toInt()
          : null,
      rentalConditionRequireDrivingYears:
          (json['rentalConditionRequireDrivingYears'] is num)
              ? (json['rentalConditionRequireDrivingYears'] as num).toInt()
              : null,
    );
  }

  String get displayName => '$make $model';

  String get formattedDailyRate {
    final formatter = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');
    return '${formatter.format(dailyRate)}/ngày';
  }

  String get formattedDeposit {
    final formatter = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');
    return formatter.format(depositAmount);
  }

  String get transmissionDisplayName {
    switch (transmission.toUpperCase()) {
      case 'AUTO':
        return 'Số tự động';
      case 'MANUAL':
        return 'Số sàn';
      default:
        return transmission;
    }
  }

  String get fuelDisplayName {
    switch (fuelType.toUpperCase()) {
      case 'PETROL':
        return 'Xăng';
      case 'DIESEL':
        return 'Dầu';
      case 'ELECTRIC':
        return 'Điện';
      default:
        return fuelType;
    }
  }

  bool get isReady => status.toUpperCase() == 'READY';

  String get statusDisplayName {
    switch (status.toUpperCase()) {
      case 'READY':
        return 'Sẵn sàng';
      case 'BOOKED':
        return 'Đã đặt';
      case 'RENTED':
        return 'Đang thuê';
      case 'INSPECTION':
        return 'Kiểm tra';
      case 'MAINTENANCE':
        return 'Bảo dưỡng';
      case 'REPAIR':
        return 'Sửa chữa';
      default:
        return status;
    }
  }

  Color get statusColor {
    switch (status.toUpperCase()) {
      case 'READY':
        return const Color(0xFF10B981); // Emerald Green
      case 'BOOKED':
        return const Color(0xFF3B82F6); // Blue
      case 'RENTED':
        return const Color(0xFFF59E0B); // Amber
      case 'MAINTENANCE':
      case 'REPAIR':
        return const Color(0xFFEF4444); // Red
      default:
        return Colors.grey;
    }
  }
}
