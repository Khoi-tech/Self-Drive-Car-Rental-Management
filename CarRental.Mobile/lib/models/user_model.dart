class UserModel {
  final String id;
  final String email;
  final String fullName;
  final String? phoneNumber;
  final String role;
  final DateTime? createdAt;

  UserModel({
    required this.id,
    required this.email,
    required this.fullName,
    this.phoneNumber,
    required this.role,
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      email: json['email'] ?? '',
      fullName: json['fullName'] ?? '',
      phoneNumber: json['phoneNumber'],
      role: json['role'] ?? 'CUSTOMER',
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
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  bool get isCustomer => role.toUpperCase() == 'CUSTOMER';
  bool get isStaff => role.toUpperCase() == 'STAFF' || role.toUpperCase() == 'ADMIN';
}
