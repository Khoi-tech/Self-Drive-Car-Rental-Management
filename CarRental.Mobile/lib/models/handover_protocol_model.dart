import 'dart:convert';

class DamageMarker {
  final double x;
  final double y;
  final String stage; // PRE_EXISTING, TRANSIT_DELIVERY, CUSTOMER_RENTAL
  final String type;
  final String note;
  final double fee;

  const DamageMarker({
    required this.x,
    required this.y,
    required this.stage,
    required this.type,
    required this.note,
    required this.fee,
  });

  factory DamageMarker.fromJson(Map<String, dynamic> json) {
    return DamageMarker(
      x: (json['x'] is num) ? (json['x'] as num).toDouble() : 50.0,
      y: (json['y'] is num) ? (json['y'] as num).toDouble() : 50.0,
      stage: json['stage']?.toString() ?? 'PRE_EXISTING',
      type: json['type']?.toString() ?? 'EXISTING',
      note: json['note']?.toString() ?? json['description']?.toString() ?? 'Vết xước',
      fee: (json['fee'] is num) ? (json['fee'] as num).toDouble() : 0.0,
    );
  }

  static List<DamageMarker> parseList(String? rawJson) {
    if (rawJson == null || rawJson.trim().isEmpty) return [];
    try {
      final decoded = jsonDecode(rawJson);
      if (decoded is List) {
        return decoded
            .whereType<Map<String, dynamic>>()
            .map(DamageMarker.fromJson)
            .toList();
      }
    } catch (_) {}
    return [];
  }
}

class HandoverProtocolModel {
  final String id;
  final String protocolNumber;
  final String rentalRequestId;
  final String? carMake;
  final String? carModel;
  final String? licensePlate;
  final DateTime handoverDate;
  final String staffName;
  final int? dispatchOdo;
  final int handoverOdo;
  final double? dispatchFuelLevel;
  final double handoverFuelLevel;
  final String? handoverDashPhotoUrl;
  final bool hasTransitAnomaly;
  final String? transitAnomalyNote;
  final String? dispatchDamageMap;
  final String? handoverDamageMap;
  final String? damagePointsJson;
  final String exteriorCondition;
  final String interiorCondition;
  final String tireCondition;
  final String accessoriesChecklist;
  final String? existingScratchesNotes;
  final String? staffNotes;
  final String? staffSignature;
  final String? customerSignature;
  final String status;

  HandoverProtocolModel({
    required this.id,
    required this.protocolNumber,
    required this.rentalRequestId,
    this.carMake,
    this.carModel,
    this.licensePlate,
    required this.handoverDate,
    required this.staffName,
    this.dispatchOdo,
    required this.handoverOdo,
    this.dispatchFuelLevel,
    required this.handoverFuelLevel,
    this.handoverDashPhotoUrl,
    this.hasTransitAnomaly = false,
    this.transitAnomalyNote,
    this.dispatchDamageMap,
    this.handoverDamageMap,
    this.damagePointsJson,
    this.exteriorCondition = '',
    this.interiorCondition = '',
    this.tireCondition = '',
    this.accessoriesChecklist = '',
    this.existingScratchesNotes,
    this.staffNotes,
    this.staffSignature,
    this.customerSignature,
    this.status = 'IN_TRANSIT',
  });

  factory HandoverProtocolModel.fromJson(Map<String, dynamic> json) {
    final odo = (json['handoverOdo'] is num && (json['handoverOdo'] as num) > 0)
        ? (json['handoverOdo'] as num).toInt()
        : ((json['odoAtHandover'] is num) ? (json['odoAtHandover'] as num).toInt() : 0);

    return HandoverProtocolModel(
      id: json['id']?.toString() ?? '',
      protocolNumber: json['protocolNumber']?.toString() ?? '',
      rentalRequestId: json['rentalRequestId']?.toString() ?? '',
      carMake: json['carMake']?.toString(),
      carModel: json['carModel']?.toString(),
      licensePlate: json['licensePlate']?.toString(),
      handoverDate:
          DateTime.tryParse(json['handoverDate']?.toString() ?? '') ?? DateTime.now(),
      staffName: json['staffName']?.toString() ?? 'Nhân viên VELORA',
      dispatchOdo: (json['dispatchOdo'] is num) ? (json['dispatchOdo'] as num).toInt() : null,
      handoverOdo: odo,
      dispatchFuelLevel: (json['dispatchFuelLevel'] is num)
          ? (json['dispatchFuelLevel'] as num).toDouble()
          : null,
      handoverFuelLevel: (json['handoverFuelLevel'] is num)
          ? (json['handoverFuelLevel'] as num).toDouble()
          : 100.0,
      handoverDashPhotoUrl: json['handoverDashPhotoUrl']?.toString(),
      hasTransitAnomaly: json['hasTransitAnomaly'] == true,
      transitAnomalyNote: json['transitAnomalyNote']?.toString(),
      dispatchDamageMap: json['dispatchDamageMap']?.toString(),
      handoverDamageMap: json['handoverDamageMap']?.toString(),
      damagePointsJson: json['damagePointsJson']?.toString(),
      exteriorCondition: json['exteriorCondition']?.toString() ?? '',
      interiorCondition: json['interiorCondition']?.toString() ?? '',
      tireCondition: json['tireCondition']?.toString() ?? '',
      accessoriesChecklist: json['accessoriesChecklist']?.toString() ?? '',
      existingScratchesNotes: json['existingScratchesNotes']?.toString(),
      staffNotes: json['staffNotes']?.toString(),
      staffSignature: json['staffSignature']?.toString(),
      customerSignature: json['customerSignature']?.toString(),
      status: json['status']?.toString() ?? 'IN_TRANSIT',
    );
  }

  List<DamageMarker> get markers {
    final source = (handoverDamageMap != null && handoverDamageMap!.trim().isNotEmpty)
        ? handoverDamageMap
        : (damagePointsJson != null && damagePointsJson!.trim().isNotEmpty
            ? damagePointsJson
            : dispatchDamageMap);
    return DamageMarker.parseList(source);
  }

  bool get isCompleted => status.toUpperCase() == 'COMPLETED';
}
