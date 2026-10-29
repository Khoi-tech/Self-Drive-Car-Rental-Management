import 'package:intl/intl.dart';

class SettlementModel {
  final String id;
  final String? settlementNumber;
  final String? rentalRequestId;
  final String? contractId;
  final double depositAmount;
  final double rentalFee;
  final double lateReturnFee;
  final double fuelFee;
  final double damageFee;
  final double cleaningFee;
  final double otherFee;
  final String? otherFeeNotes;
  final double totalDeduction;
  final double balanceAmount;
  final double refundAmount;
  final double trafficFineHoldAmount;
  final String trafficFineRefundStatus;
  final DateTime? trafficFineRefundDate;
  final String? trafficFineNotes;
  final String refundStatus;
  final String? refundBankName;
  final String? refundAccountNumber;
  final String? refundAccountName;
  final String status;
  final DateTime? settledAt;

  SettlementModel({
    required this.id,
    this.settlementNumber,
    this.rentalRequestId,
    this.contractId,
    required this.depositAmount,
    required this.rentalFee,
    required this.lateReturnFee,
    required this.fuelFee,
    required this.damageFee,
    required this.cleaningFee,
    required this.otherFee,
    this.otherFeeNotes,
    required this.totalDeduction,
    required this.balanceAmount,
    required this.refundAmount,
    required this.trafficFineHoldAmount,
    required this.trafficFineRefundStatus,
    this.trafficFineRefundDate,
    this.trafficFineNotes,
    required this.refundStatus,
    this.refundBankName,
    this.refundAccountNumber,
    this.refundAccountName,
    required this.status,
    this.settledAt,
  });

  factory SettlementModel.fromJson(Map<String, dynamic> json) {
    return SettlementModel(
      id: json['id']?.toString() ?? '',
      settlementNumber: json['settlementNumber']?.toString(),
      rentalRequestId: json['rentalRequestId']?.toString(),
      contractId: json['contractId']?.toString(),
      depositAmount: (json['depositAmount'] is num) ? (json['depositAmount'] as num).toDouble() : 0.0,
      rentalFee: (json['rentalFee'] is num) ? (json['rentalFee'] as num).toDouble() : 0.0,
      lateReturnFee: (json['lateReturnFee'] is num) ? (json['lateReturnFee'] as num).toDouble() : 0.0,
      fuelFee: (json['fuelFee'] is num) ? (json['fuelFee'] as num).toDouble() : 0.0,
      damageFee: (json['damageFee'] is num) ? (json['damageFee'] as num).toDouble() : 0.0,
      cleaningFee: (json['cleaningFee'] is num) ? (json['cleaningFee'] as num).toDouble() : 0.0,
      otherFee: (json['otherFee'] is num) ? (json['otherFee'] as num).toDouble() : 0.0,
      otherFeeNotes: json['otherFeeNotes']?.toString(),
      totalDeduction: (json['totalDeduction'] is num) ? (json['totalDeduction'] as num).toDouble() : 0.0,
      balanceAmount: (json['balanceAmount'] is num) ? (json['balanceAmount'] as num).toDouble() : 0.0,
      refundAmount: (json['refundAmount'] is num) ? (json['refundAmount'] as num).toDouble() : 0.0,
      trafficFineHoldAmount: (json['trafficFineHoldAmount'] is num)
          ? (json['trafficFineHoldAmount'] as num).toDouble()
          : 0.0,
      trafficFineRefundStatus: json['trafficFineRefundStatus']?.toString() ?? 'NONE',
      trafficFineRefundDate: json['trafficFineRefundDate'] != null
          ? DateTime.tryParse(json['trafficFineRefundDate'].toString())
          : null,
      trafficFineNotes: json['trafficFineNotes']?.toString(),
      refundStatus: json['refundStatus']?.toString() ?? 'PENDING',
      refundBankName: json['refundBankName']?.toString(),
      refundAccountNumber: json['refundAccountNumber']?.toString(),
      refundAccountName: json['refundAccountName']?.toString(),
      status: json['status']?.toString() ?? 'SETTLED',
      settledAt: json['settledAt'] != null
          ? DateTime.tryParse(json['settledAt'].toString())
          : null,
    );
  }

  bool get isDisputed => status.toUpperCase() == 'DISPUTED';
  bool get isRound1Refunded => refundStatus.toUpperCase() == 'REFUNDED';
  bool get isRound2Holding => trafficFineRefundStatus.toUpperCase() == 'HOLDING';

  String formatCurrency(double amount) {
    final f = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');
    return f.format(amount);
  }
}
