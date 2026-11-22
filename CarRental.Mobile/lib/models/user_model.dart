class UserModel {
  final String id;
  final String email;
  final String fullName;
  final String? phoneNumber;
  final String role;
  final bool isActive;
  final String? lockReason;
  final String kycStatus;
  final DateTime? dateOfBirth;
  final String? driverLicenseClass;
  final String? licenseClass;
  final DateTime? licenseIssueDate;
  final DateTime? createdAt;

  UserModel({
    required this.id,
    required this.email,
    required this.fullName,
    this.phoneNumber,
    required this.role,
    this.isActive = true,
    this.lockReason,
    this.kycStatus = 'NOT_SUBMITTED',
    this.dateOfBirth,
    this.driverLicenseClass,
    this.licenseClass,
    this.licenseIssueDate,
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? '',
      phoneNumber: json['phoneNumber']?.toString(),
      role: json['role']?.toString() ?? 'CUSTOMER',
      isActive: json['isActive'] != false,
      lockReason: json['lockReason']?.toString(),
      kycStatus: json['kycStatus']?.toString() ?? 'NOT_SUBMITTED',
      dateOfBirth: json['dateOfBirth'] != null
          ? DateTime.tryParse(json['dateOfBirth'].toString())
          : null,
      driverLicenseClass: json['driverLicenseClass']?.toString(),
      licenseClass: json['licenseClass']?.toString(),
      licenseIssueDate: json['licenseIssueDate'] != null
          ? DateTime.tryParse(json['licenseIssueDate'].toString())
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'fullName': fullName,
      'phoneNumber': phoneNumber,
      'role': role,
      'isActive': isActive,
      'lockReason': lockReason,
      'kycStatus': kycStatus,
      'dateOfBirth': dateOfBirth?.toIso8601String(),
      'driverLicenseClass': driverLicenseClass,
      'licenseClass': licenseClass,
      'licenseIssueDate': licenseIssueDate?.toIso8601String(),
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  bool get isCustomer => role.toUpperCase() == 'CUSTOMER';
  bool get isStaff =>
      role.toUpperCase() == 'STAFF' ||
      role.toUpperCase() == 'MANAGER' ||
      role.toUpperCase() == 'ADMIN';
  bool get isKycVerified => kycStatus.toUpperCase() == 'VERIFIED';
  String? get effectiveLicenseClass =>
      (licenseClass != null && licenseClass!.trim().isNotEmpty)
          ? licenseClass
          : driverLicenseClass;

  String get kycStatusDisplayName {
    switch (kycStatus.toUpperCase()) {
      case 'VERIFIED':
        return 'Đã xác minh KYC';
      case 'PENDING':
        return 'Đang chờ duyệt KYC';
      case 'REJECTED':
        return 'KYC bị từ chối';
      default:
        return 'Chưa xác minh KYC';
    }
  }
}
