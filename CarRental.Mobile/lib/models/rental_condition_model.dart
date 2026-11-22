class RentalConditionModel {
  final String id;
  final String? carId;
  final int minAge;
  final int requireDrivingYears;
  final String requiredLicenseClass;
  final int minCompletedTrips;
  final bool requireVerifiedKyc;
  final String? otherConditions;
  final bool isCustom;

  RentalConditionModel({
    required this.id,
    this.carId,
    this.minAge = 21,
    this.requireDrivingYears = 1,
    this.requiredLicenseClass = 'B1',
    this.minCompletedTrips = 0,
    this.requireVerifiedKyc = false,
    this.otherConditions,
    this.isCustom = false,
  });

  factory RentalConditionModel.fromJson(Map<String, dynamic> json) {
    return RentalConditionModel(
      id: json['id']?.toString() ?? '',
      carId: json['carId']?.toString(),
      minAge: (json['minAge'] is num) ? (json['minAge'] as num).toInt() : 21,
      requireDrivingYears: (json['requireDrivingYears'] is num)
          ? (json['requireDrivingYears'] as num).toInt()
          : 1,
      requiredLicenseClass: json['requiredLicenseClass']?.toString() ?? 'B1',
      minCompletedTrips: (json['minCompletedTrips'] is num)
          ? (json['minCompletedTrips'] as num).toInt()
          : 0,
      requireVerifiedKyc: json['requireVerifiedKyc'] == true,
      otherConditions: json['otherConditions']?.toString(),
      isCustom: json['isCustom'] == true,
    );
  }
}
