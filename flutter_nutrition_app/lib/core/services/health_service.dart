import 'package:health/health.dart';
import 'package:permission_handler/permission_handler.dart';

class HealthService {
  static final HealthService _instance = HealthService._internal();
  factory HealthService() => _instance;
  HealthService._internal();

  late Health _health;

  // Data types we want to sync
  static const List<HealthDataType> _dataTypes = [
    HealthDataType.ACTIVE_ENERGY_BURNED,
    HealthDataType.DIETARY_ENERGY_CONSUMED,
    HealthDataType.DIETARY_PROTEIN,
    HealthDataType.DIETARY_CARBS,
    HealthDataType.DIETARY_FAT,
    HealthDataType.DIETARY_FIBER,
    HealthDataType.DIETARY_SUGAR,
    HealthDataType.WATER,
    HealthDataType.WEIGHT,
  ];

  /// Initialize health service
  Future<bool> initialize() async {
    _health = Health();
    
    // Request permissions
    final permissions = _dataTypes.map((type) => HealthDataAccess.READ_WRITE).toList();
    
    try {
      final authorized = await _health.requestAuthorization(
        _dataTypes,
        permissions: permissions,
      );
      
      return authorized;
    } catch (e) {
      print('Error initializing health service: $e');
      return false;
    }
  }

  /// Sync meal nutrition data to health app
  Future<bool> syncMealToHealth({
    required DateTime timestamp,
    required double calories,
    required double protein,
    required double carbs,
    required double fat,
    double? fiber,
    double? sugar,
  }) async {
    try {
      final List<HealthDataPoint> dataPoints = [];

      // Add calories
      dataPoints.add(HealthDataPoint(
        value: calories,
        type: HealthDataType.DIETARY_ENERGY_CONSUMED,
        unit: HealthDataUnit.KILOCALORIE,
        dateFrom: timestamp,
        dateTo: timestamp,
      ));

      // Add macronutrients
      dataPoints.add(HealthDataPoint(
        value: protein,
        type: HealthDataType.DIETARY_PROTEIN,
        unit: HealthDataUnit.GRAM,
        dateFrom: timestamp,
        dateTo: timestamp,
      ));

      dataPoints.add(HealthDataPoint(
        value: carbs,
        type: HealthDataType.DIETARY_CARBS,
        unit: HealthDataUnit.GRAM,
        dateFrom: timestamp,
        dateTo: timestamp,
      ));

      dataPoints.add(HealthDataPoint(
        value: fat,
        type: HealthDataType.DIETARY_FAT,
        unit: HealthDataUnit.GRAM,
        dateFrom: timestamp,
        dateTo: timestamp,
      ));

      // Add optional nutrients
      if (fiber != null) {
        dataPoints.add(HealthDataPoint(
          value: fiber,
          type: HealthDataType.DIETARY_FIBER,
          unit: HealthDataUnit.GRAM,
          dateFrom: timestamp,
          dateTo: timestamp,
        ));
      }

      if (sugar != null) {
        dataPoints.add(HealthDataPoint(
          value: sugar,
          type: HealthDataType.DIETARY_SUGAR,
          unit: HealthDataUnit.GRAM,
          dateFrom: timestamp,
          dateTo: timestamp,
        ));
      }

      // Write data to health app
      final success = await _health.writeHealthData(dataPoints);
      return success;
    } catch (e) {
      print('Error syncing to health app: $e');
      return false;
    }
  }

  /// Get daily nutrition summary from health app
  Future<Map<String, double>?> getDailyNutrition(DateTime date) async {
    try {
      final startOfDay = DateTime(date.year, date.month, date.day);
      final endOfDay = startOfDay.add(const Duration(days: 1));

      final healthData = await _health.getHealthDataFromTypes(
        startOfDay,
        endOfDay,
        _dataTypes,
      );

      // Aggregate data by type
      final Map<String, double> summary = {};
      
      for (final dataPoint in healthData) {
        final key = dataPoint.type.toString();
        final value = dataPoint.value as num;
        summary[key] = (summary[key] ?? 0) + value.toDouble();
      }

      return summary;
    } catch (e) {
      print('Error getting health data: $e');
      return null;
    }
  }

  /// Check if health permissions are granted
  Future<bool> hasPermissions() async {
    try {
      final permissions = await _health.hasPermissions(_dataTypes);
      return permissions ?? false;
    } catch (e) {
      return false;
    }
  }

  /// Sync water intake
  Future<bool> syncWaterIntake(double milliliters, DateTime timestamp) async {
    try {
      final dataPoint = HealthDataPoint(
        value: milliliters,
        type: HealthDataType.WATER,
        unit: HealthDataUnit.MILLILITER,
        dateFrom: timestamp,
        dateTo: timestamp,
      );

      return await _health.writeHealthData([dataPoint]);
    } catch (e) {
      print('Error syncing water intake: $e');
      return false;
    }
  }
}