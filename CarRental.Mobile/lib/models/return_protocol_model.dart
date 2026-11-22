import 'handover_protocol_model.dart';

class ReturnProtocolModel {
  final String id;
  final String? protocolNumber;
  final String? rentalRequestId;
  final String staffName;
  final DateTime returnDate;
  final int customerReturnOdo;
  final int? yardCheckinOdo;
  final double customerReturnFuelLevel;
  final double? yardCheckinFuelLevel;
  final String? returnDashPhotoUrl;
  final bool hasReturnAnomaly;
  final String? returnAnomalyNote;
  final String? returnDamageMap;
  final int startOdo;
  final int endOdo;
  final int totalKmDriven;
  final int? maxKmAllowed;
  final int excessKm;
  final int initialFuelLevel;
  final int returnFuelLevel;
  final int fuelDifference;
  final String? newDamagesNotes;
  final String? damagePointsJson;
  final String nextVehicleStatus;
  final String status;

  ReturnProtocolModel({
    required this.id,
    this.protocolNumber,
    this.rentalRequestId,
    required this.staffName,
    required this.returnDate,
    required this.customerReturnOdo,
    this.yardCheckinOdo,
    required this.customerReturnFuelLevel,
    this.yardCheckinFuelLevel,
    this.returnDashPhotoUrl,
    this.hasReturnAnomaly = false,
    this.returnAnomalyNote,
    this.returnDamageMap,
    required this.startOdo,
    required this.endOdo,
    required this.totalKmDriven,
    this.maxKmAllowed,
    required this.excessKm,
    required this.initialFuelLevel,
    required this.returnFuelLevel,
    required this.fuelDifference,
    this.newDamagesNotes,
    this.damagePointsJson,
    this.nextVehicleStatus = 'READY',
    this.status = 'COMPLETED',
  });

  factory ReturnProtocolModel.fromJson(Map<String, dynamic> json) {
    final start = (json['startOdo'] is num) ? (json['startOdo'] as num).toInt() : 0;
    final custReturn = (json['customerReturnOdo'] is num && (json['customerReturnOdo'] as num) > 0)
        ? (json['customerReturnOdo'] as num).toInt()
        : ((json['endOdo'] is num) ? (json['endOdo'] as num).toInt() : 0);

    return ReturnProtocolModel(
      id: json['id']?.toString() ?? '',
      protocolNumber: json['protocolNumber']?.toString(),
      rentalRequestId: json['rentalRequestId']?.toString(),
      staffName: json['staffName']?.toString() ?? 'Nhân viên VELORA',
      returnDate:
          DateTime.tryParse(json['returnDate']?.toString() ?? '') ?? DateTime.now(),
      customerReturnOdo: custReturn,
      yardCheckinOdo: (json['yardCheckinOdo'] is num)
          ? (json['yardCheckinOdo'] as num).toInt()
          : null,
      customerReturnFuelLevel: (json['customerReturnFuelLevel'] is num)
          ? (json['customerReturnFuelLevel'] as num).toDouble()
          : ((json['returnFuelLevel'] is num)
              ? (json['returnFuelLevel'] as num).toDouble()
              : 100.0),
      yardCheckinFuelLevel: (json['yardCheckinFuelLevel'] is num)
          ? (json['yardCheckinFuelLevel'] as num).toDouble()
          : null,
      returnDashPhotoUrl: json['returnDashPhotoUrl']?.toString(),
      hasReturnAnomaly: json['hasReturnAnomaly'] == true,
      returnAnomalyNote: json['returnAnomalyNote']?.toString(),
      returnDamageMap: json['returnDamageMap']?.toString(),
      startOdo: start,
      endOdo: (json['endOdo'] is num) ? (json['endOdo'] as num).toInt() : custReturn,
      totalKmDriven: (json['totalKmDriven'] is num)
          ? (json['totalKmDriven'] as num).toInt()
          : (custReturn > start ? custReturn - start : 0),
      maxKmAllowed: (json['maxKmAllowed'] is num)
          ? (json['maxKmAllowed'] as num).toInt()
          : null,
      excessKm: (json['excessKm'] is num) ? (json['excessKm'] as num).toInt() : 0,
      initialFuelLevel: (json['initialFuelLevel'] is num)
          ? (json['initialFuelLevel'] as num).toInt()
          : 100,
      returnFuelLevel: (json['returnFuelLevel'] is num)
          ? (json['returnFuelLevel'] as num).toInt()
          : 100,
      fuelDifference: (json['fuelDifference'] is num)
          ? (json['fuelDifference'] as num).toInt()
          : 0,
      newDamagesNotes: json['newDamagesNotes']?.toString(),
      damagePointsJson: json['damagePointsJson']?.toString(),
      nextVehicleStatus: json['nextVehicleStatus']?.toString() ?? 'READY',
      status: json['status']?.toString() ?? 'COMPLETED',
    );
  }

  List<DamageMarker> get customerRentalDamages {
    final source = (returnDamageMap != null && returnDamageMap!.trim().isNotEmpty)
        ? returnDamageMap
        : damagePointsJson;
    return DamageMarker.parseList(source)
        .where((m) =>
            m.stage.toUpperCase() == 'CUSTOMER_RENTAL' ||
            (m.type.toUpperCase() == 'NEW' &&
                m.stage.toUpperCase() != 'TRANSIT_DELIVERY' &&
                m.stage.toUpperCase() != 'PRE_EXISTING'))
        .toList();
  }
}
