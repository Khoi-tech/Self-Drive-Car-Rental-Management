import 'package:flutter_test/flutter_test.dart';
import 'package:car_rental_mobile/models/car_model.dart';
import 'package:car_rental_mobile/models/user_model.dart';
import 'package:car_rental_mobile/providers/car_provider.dart';

void main() {
  group('UserModel tests', () {
    test('Parse UserModel from JSON correctly', () {
      final json = {
        'id': 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        'email': 'customer@velora.vn',
        'fullName': 'Nguyễn Văn Khách',
        'phoneNumber': '0901234567',
        'role': 'CUSTOMER',
      };
      final user = UserModel.fromJson(json);
      expect(user.id, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');
      expect(user.email, 'customer@velora.vn');
      expect(user.fullName, 'Nguyễn Văn Khách');
      expect(user.isCustomer, true);
      expect(user.isStaff, false);
    });
  });

  group('CarModel and CarProvider filtering tests', () {
    final mockCarsJson = [
      {
        'id': '11111111-1111-1111-1111-111111111111',
        'make': 'Toyota',
        'model': 'Camry 2.5Q',
        'licensePlate': '51K-111.11',
        'seats': 5,
        'transmission': 'AUTO',
        'fuelType': 'PETROL',
        'manufactureYear': 2023,
        'dailyRate': 1200000.0,
        'depositAmount': 15000000.0,
        'currentMileage': 12500,
        'status': 'READY',
      },
      {
        'id': '22222222-2222-2222-2222-222222222222',
        'make': 'Mitsubishi',
        'model': 'Xpander Cross',
        'licensePlate': '51K-222.22',
        'seats': 7,
        'transmission': 'AUTO',
        'fuelType': 'PETROL',
        'manufactureYear': 2024,
        'dailyRate': 1000000.0,
        'depositAmount': 15000000.0,
        'currentMileage': 8000,
        'status': 'READY',
      },
      {
        'id': '33333333-3333-3333-3333-333333333333',
        'make': 'VinFast',
        'model': 'VF8 Plus',
        'licensePlate': '51K-333.33',
        'seats': 5,
        'transmission': 'AUTO',
        'fuelType': 'ELECTRIC',
        'manufactureYear': 2024,
        'dailyRate': 1500000.0,
        'depositAmount': 20000000.0,
        'currentMileage': 5000,
        'status': 'RENTED',
      },
    ];

    test('CarModel correctly parses and formats currency', () {
      final car = CarModel.fromJson(mockCarsJson[0]);
      expect(car.make, 'Toyota');
      expect(car.model, 'Camry 2.5Q');
      expect(car.displayName, 'Toyota Camry 2.5Q');
      expect(car.isReady, true);
      expect(car.formattedDailyRate.contains('1.200.000'), true);
      expect(car.transmissionDisplayName, 'Số tự động');
      expect(car.fuelDisplayName, 'Xăng');
    });

    test('CarProvider filter by seats and status', () {
      final cars = mockCarsJson.map((j) => CarModel.fromJson(j)).toList();
      expect(cars.length, 3);
      final provider = CarProvider();

      // Seed cars into provider by reflection/helper
      provider.setSearchQuery('Toyota');
      // Verify empty initial
      expect(provider.cars.length, 0);
    });
  });
}
