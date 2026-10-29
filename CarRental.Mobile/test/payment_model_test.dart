import 'package:flutter_test/flutter_test.dart';
import 'package:car_rental_mobile/models/payment_model.dart';

void main() {
  group('PaymentModel tests', () {
    test('PaymentModel parses from JSON correctly and formats currency', () {
      final json = {
        'id': '11112222-3333-4444-5555-666677778888',
        'contractId': 'contract-uuid',
        'rentalRequestId': 'request-uuid',
        'amount': 15000000.0,
        'paymentType': 'DEPOSIT',
        'paymentMethod': 'VIETQR',
        'transactionCode': 'TXN20261026123',
        'status': 'PENDING',
        'accountName': 'VELORA CAR RENTAL CORP',
        'accountNumber': '21011501030206',
        'bankName': 'MBBank',
        'transferContent': 'VELORA COC TXN20261026123',
        'qrCodeUrl': 'https://img.vietqr.io/image/MB-21011501030206-compact2.png',
        'createdAt': '2026-10-26T16:00:00Z',
      };

      final payment = PaymentModel.fromJson(json);
      expect(payment.id, '11112222-3333-4444-5555-666677778888');
      expect(payment.transactionCode, 'TXN20261026123');
      expect(payment.isSuccess, false);
      expect(payment.formattedAmount.contains('15.000.000'), true);
      expect(payment.accountName, 'VELORA CAR RENTAL CORP');
      expect(payment.accountNumber, '21011501030206');
      expect(payment.transferContent, 'VELORA COC TXN20261026123');
    });

    test('PaymentModel with SUCCESS status', () {
      final json = {
        'id': '22223333-4444-5555-6666-777788889999',
        'amount': 15000000.0,
        'transactionCode': 'TXN20261026999',
        'status': 'SUCCESS',
        'accountName': 'VELORA CAR RENTAL CORP',
        'accountNumber': '21011501030206',
        'bankName': 'MBBank',
        'transferContent': 'VELORA COC TXN20261026999',
        'qrCodeUrl': 'https://img.vietqr.io/image/MB-21011501030206-compact2.png',
        'paidAt': '2026-10-26T16:05:00Z',
        'createdAt': '2026-10-26T16:00:00Z',
      };

      final payment = PaymentModel.fromJson(json);
      expect(payment.isSuccess, true);
      expect(payment.paidAt, isNotNull);
    });
  });
}
