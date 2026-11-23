class UserModel {
  final String id;
  final String email;
  final String fullName;
  final String? phoneNumber;
  final String role;
  final bool isActive;
  final String? lockReason;
  final String kycStatus;
  final int trustScore;
  final DateTime? dateOfBirth;
  final String? driverLicenseClass;
  final String? licenseClass;
  final DateTime? licenseIssueDate;
  final DateTime? createdAt;

  // Single Source of Truth Membership Tier from Backend
  final String membershipTier;
  final String membershipTierLabel;
  final String? nextTier;
  final String? nextTierLabel;
  final int completedTrips;
  final double totalSpent;
  final int completedTripsToNextTier;
  final double spentToNextTier;
  final int requiredTrustScoreForNextTier;
  final int tierProgressPercent;
  final List<String> membershipPerks;

  UserModel({
    required this.id,
    required this.email,
    required this.fullName,
    this.phoneNumber,
    required this.role,
    this.isActive = true,
    this.lockReason,
    this.kycStatus = 'NOT_SUBMITTED',
    this.trustScore = 100,
    this.dateOfBirth,
    this.driverLicenseClass,
    this.licenseClass,
    this.licenseIssueDate,
    this.createdAt,
    this.membershipTier = 'STANDARD',
    this.membershipTierLabel = 'Thành viên Tiêu chuẩn',
    this.nextTier,
    this.nextTierLabel,
    this.completedTrips = 0,
    this.totalSpent = 0.0,
    this.completedTripsToNextTier = 1,
    this.spentToNextTier = 3000000.0,
    this.requiredTrustScoreForNextTier = 0,
    this.tierProgressPercent = 0,
    this.membershipPerks = const [],
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final rawPerks = json['membershipPerks'];
    final perks = rawPerks is List
        ? rawPerks.map((e) => e.toString()).where((e) => e.trim().isNotEmpty).toList()
        : <String>[];

    return UserModel(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? '',
      phoneNumber: json['phoneNumber']?.toString(),
      role: json['role']?.toString() ?? 'CUSTOMER',
      isActive: json['isActive'] != false,
      lockReason: json['lockReason']?.toString(),
      kycStatus: json['kycStatus']?.toString() ?? 'NOT_SUBMITTED',
      trustScore: (json['trustScore'] is num) ? (json['trustScore'] as num).toInt() : 100,
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
      membershipTier: (json['membershipTier']?.toString() ?? 'STANDARD').toUpperCase(),
      membershipTierLabel: json['membershipTierLabel']?.toString() ?? 'Thành viên Tiêu chuẩn',
      nextTier: json['nextTier']?.toString(),
      nextTierLabel: json['nextTierLabel']?.toString(),
      completedTrips: (json['completedTrips'] is num) ? (json['completedTrips'] as num).toInt() : 0,
      totalSpent: (json['totalSpent'] is num) ? (json['totalSpent'] as num).toDouble() : 0.0,
      completedTripsToNextTier: (json['completedTripsToNextTier'] is num)
          ? (json['completedTripsToNextTier'] as num).toInt()
          : 0,
      spentToNextTier: (json['spentToNextTier'] is num)
          ? (json['spentToNextTier'] as num).toDouble()
          : 0.0,
      requiredTrustScoreForNextTier: (json['requiredTrustScoreForNextTier'] is num)
          ? (json['requiredTrustScoreForNextTier'] as num).toInt()
          : 0,
      tierProgressPercent: (json['tierProgressPercent'] is num)
          ? (json['tierProgressPercent'] as num).toInt()
          : 0,
      membershipPerks: perks,
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
      'trustScore': trustScore,
      'dateOfBirth': dateOfBirth?.toIso8601String(),
      'driverLicenseClass': driverLicenseClass,
      'licenseClass': licenseClass,
      'licenseIssueDate': licenseIssueDate?.toIso8601String(),
      'createdAt': createdAt?.toIso8601String(),
      'membershipTier': membershipTier,
      'membershipTierLabel': membershipTierLabel,
      'nextTier': nextTier,
      'nextTierLabel': nextTierLabel,
      'completedTrips': completedTrips,
      'totalSpent': totalSpent,
      'completedTripsToNextTier': completedTripsToNextTier,
      'spentToNextTier': spentToNextTier,
      'requiredTrustScoreForNextTier': requiredTrustScoreForNextTier,
      'tierProgressPercent': tierProgressPercent,
      'membershipPerks': membershipPerks,
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
