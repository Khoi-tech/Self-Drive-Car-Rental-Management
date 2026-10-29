import 'package:flutter_test/flutter_test.dart';
import 'package:car_rental_mobile/models/settlement_model.dart';

void main() {
  group('SettlementModel tests', () {
    test('SettlementModel correctly parses 2-stage escrow fields', () {
      final json = {
        'id': 'settlement-uuid-1234',
        'settlementNumber': 'QT-2026-0001',
        'rentalRequestId': 'req-uuid-1234',
        'contractId': 'con-uuid-1234',
        'depositAmount': 15000000.0,
        'rentalFee': 2400000.0,
        'lateReturnFee': 0.0,
        'fuelFee': 150000.0,
        'damageFee': 500000.0,
        'cleaningFee': 200000.0,
        'otherFee': 0.0,
        'totalDeduction': 850000.0,
        'balanceAmount': 14150000.0,
        'refundAmount': 12150000.0,
        'trafficFineHoldAmount': 2000000.0,
        'trafficFineRefundStatus': 'HOLDING',
        'refundStatus': 'REFUNDED',
        'status': 'SETTLED',
      };

      final model = SettlementModel.fromJson(json);
      expect(model.settlementNumber, 'QT-2026-0001');
      expect(model.depositAmount, 15000000.0);
      expect(model.totalDeduction, 850000.0);
      expect(model.cleaningFee, 200000.0);
      expect(model.refundAmount, 12150000.0);
      expect(model.trafficFineHoldAmount, 2000000.0);

      // Check 2-stage escrow flags
      expect(model.isRound1Refunded, true);
      expect(model.isRound2Holding, true);
      expect(model.isDisputed, false);
      expect(model.formatCurrency(model.refundAmount).contains('12.150.000'), true);
      expect(model.formatCurrency(model.trafficFineHoldAmount).contains('2.000.000'), true);
    });

    test('SettlementModel with DISPUTED status', () {
      final json = {
        'id': 'settlement-uuid-5678',
        'depositAmount': 15000000.0,
        'rentalFee': 2000000.0,
        'lateReturnFee': 0.0,
        'fuelFee': 0.0,
        'damageFee': 0.0,
        'cleaningFee': 200000.0,
        'otherFee': 0.0,
        'totalDeduction': 200000.0,
        'balanceAmount': 14800000.0,
        'refundAmount': 12800000.0,
        'trafficFineHoldAmount': 2000000.0,
        'trafficFineRefundStatus': 'HOLDING',
        'refundStatus': 'PENDING',
        'status': 'DISPUTED',
      };

      final model = SettlementModel.fromJson(json);
      expect(model.isDisputed, true);
      expect(model.isRound1Refunded, false);
    });
  });
}
