import 'package:flutter/material.dart';
import '../models/car_model.dart';
import '../services/car_service.dart';

class CarProvider extends ChangeNotifier {
  final CarService _carService = CarService();

  List<CarModel> _allCars = [];
  List<CarModel> _filteredCars = [];
  bool _isLoading = false;
  String? _errorMessage;

  String _searchQuery = '';
  int? _seatsFilter;
  String? _transmissionFilter;
  bool _onlyReady = false;

  List<CarModel> get cars => _filteredCars;
  List<CarModel> get allCars => _allCars;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  String get searchQuery => _searchQuery;
  int? get seatsFilter => _seatsFilter;
  String? get transmissionFilter => _transmissionFilter;
  bool get onlyReady => _onlyReady;

  int get totalAvailableCars =>
      _allCars.where((c) => c.status.toUpperCase() == 'READY').length;

  Future<void> loadCars() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final list = await _carService.getVehicles();
      _allCars = list;
      _applyFilters();
      _isLoading = false;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
    }
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    _applyFilters();
    notifyListeners();
  }

  void setSeatsFilter(int? seats) {
    if (_seatsFilter == seats) {
      _seatsFilter = null; // Toggle off if clicked again
    } else {
      _seatsFilter = seats;
    }
    _applyFilters();
    notifyListeners();
  }

  void setTransmissionFilter(String? transmission) {
    if (_transmissionFilter == transmission) {
      _transmissionFilter = null; // Toggle off
    } else {
      _transmissionFilter = transmission;
    }
    _applyFilters();
    notifyListeners();
  }

  void toggleOnlyReady() {
    _onlyReady = !_onlyReady;
    _applyFilters();
    notifyListeners();
  }

  void resetFilters() {
    _searchQuery = '';
    _seatsFilter = null;
    _transmissionFilter = null;
    _onlyReady = false;
    _applyFilters();
    notifyListeners();
  }

  void _applyFilters() {
    _filteredCars = _allCars.where((car) {
      // Search text match
      if (_searchQuery.trim().isNotEmpty) {
        final query = _searchQuery.toLowerCase().trim();
        final matchMake = car.make.toLowerCase().contains(query);
        final matchModel = car.model.toLowerCase().contains(query);
        final matchPlate = car.licensePlate.toLowerCase().contains(query);
        if (!matchMake && !matchModel && !matchPlate) {
          return false;
        }
      }

      // Seats filter
      if (_seatsFilter != null && car.seats != _seatsFilter) {
        return false;
      }

      // Transmission filter
      if (_transmissionFilter != null &&
          car.transmission.toUpperCase() != _transmissionFilter!.toUpperCase()) {
        return false;
      }

      // Ready filter
      if (_onlyReady && car.status.toUpperCase() != 'READY') {
        return false;
      }

      return true;
    }).toList();
  }
}
