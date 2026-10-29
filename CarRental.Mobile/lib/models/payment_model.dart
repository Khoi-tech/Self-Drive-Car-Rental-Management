import 'package:intl/intl.dart';

class PaymentModel {
  final String id;
  final String? contractId;
  final String? rentalRequestId;
  final double amount;
  final String paymentType;
  final String paymentMethod;
  final String transactionCode;
  final String status;
  final String accountName;
  final String accountNumber;
  final String bankName;
  final String transferContent;
  final String qrCodeUrl;
  final DateTime? paidAt;
  final String? note;
  final DateTime createdAt;

  PaymentModel({
    required this.id,
    this.contractId,
    this.rentalRequestId,
    required this.amount,
    required this.paymentType,
    required this.paymentMethod,
    required this.transactionCode,
    required this.status,
    required this.accountName,
    required this.accountNumber,
    required this.bankName,
    required this.transferContent,
    required this.qrCodeUrl,
    this.paidAt,
    this.note,
    required this.createdAt,
  });

  factory PaymentModel.fromJson(Map<String, dynamic> json) {
    return PaymentModel(
      id: json['id']?.toString() ?? '',
      contractId: json['contractId']?.toString(),
      rentalRequestId: json['rentalRequestId']?.toString(),
      amount: (json['amount'] is num) ? (json['amount'] as num).toDouble() : 0.0,
      paymentType: json['paymentType']?.toString() ?? 'DEPOSIT',
      paymentMethod: json['paymentMethod']?.toString() ?? 'VIETQR',
      transactionCode: json['transactionCode']?.toString() ?? '',
      status: json['status']?.toString() ?? 'PENDING',
      accountName: json['accountName']?.toString() ?? 'VELORA CAR RENTAL CORP',
      accountNumber: json['accountNumber']?.toString() ?? '21011501030206',
      bankName: json['bankName']?.toString() ?? 'MBBank',
      transferContent: json['transferContent']?.toString() ?? '',
      qrCodeUrl: json['qrCodeUrl']?.toString() ?? '',
      paidAt: json['paidAt'] != null
          ? DateTime.tryParse(json['paidAt'].toString())
          : null,
      note: json['note']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  bool get isSuccess => status.toUpperCase() == 'SUCCESS';

  String get formattedAmount {
    final f = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');
    return f.format(amount);
  }
}
