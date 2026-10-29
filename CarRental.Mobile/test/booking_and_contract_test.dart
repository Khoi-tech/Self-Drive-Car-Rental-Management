import 'package:flutter_test/flutter_test.dart';
import 'package:car_rental_mobile/models/contract_model.dart';
import 'package:car_rental_mobile/models/rental_request_model.dart';
import 'package:car_rental_mobile/widgets/signature_pad.dart';

void main() {
  group('Booking and Contract tests', () {
    test('CreateRentalRequestDto serializes to JSON with correct fields', () {
      final start = DateTime(2026, 11, 1, 8, 0);
      final end = DateTime(2026, 11, 3, 20, 0);

      final dto = CreateRentalRequestDto(
        carId: '11111111-2222-3333-4444-555555555555',
        startTime: start,
        endTime: end,
        pickupLocation: 'Trụ sở chính VELORA',
        dropoffLocation: 'Trụ sở chính VELORA',
        customerName: 'Nguyễn Văn Khách',
        customerPhone: '0901234567',
        customerEmail: 'customer@velora.vn',
        customerIdCard: '079201001234',
        driverLicenseNumber: 'GPLX-79112233',
        driverLicenseClass: 'B2',
        notes: 'Giao xe đúng giờ',
      );

      final json = dto.toJson();
      expect(json['carId'], '11111111-2222-3333-4444-555555555555');
      expect(json['customerName'], 'Nguyễn Văn Khách');
      expect(json['driverLicenseClass'], 'B2');
      expect(json['notes'], 'Giao xe đúng giờ');
    });

    test('RentalContractModel status and formatting verification', () {
      final contractJson = {
        'id': '99999999-8888-7777-6666-555555555555',
        'contractNumber': 'HD-2026-0001',
        'totalFee': 2400000.0,
        'depositAmount': 15000000.0,
        'content': 'HỢP ĐỒNG THUÊ XE',
        'status': 'WAITING_SIGNATURE',
        'customerName': 'Nguyễn Văn Khách',
        'carMake': 'Toyota',
        'carModel': 'Camry 2.5Q',
        'carLicensePlate': '51K-999.99',
        'createdAt': '2026-10-26T15:00:00Z',
      };

      final contract = RentalContractModel.fromJson(contractJson);
      expect(contract.contractNumber, 'HD-2026-0001');
      expect(contract.isSigned, false);
      expect(contract.formattedTotalFee.contains('2.400.000'), true);
      expect(contract.formattedDeposit.contains('15.000.000'), true);
    });

    test('SignaturePadController captures points and clears correctly', () {
      final controller = SignaturePadController();
      expect(controller.isEmpty, true);
      expect(controller.isNotEmpty, false);

      controller.addPoint(const Offset(10, 20));
      controller.addPoint(const Offset(20, 30));
      expect(controller.points.length, 2);
      expect(controller.isNotEmpty, true);

      controller.clear();
      expect(controller.isEmpty, true);
      expect(controller.points.length, 0);
    });
  });
}
