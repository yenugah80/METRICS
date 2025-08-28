import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'http://localhost:5000/api';
  
  // Singleton pattern
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  // Headers for requests
  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  /// Analyze meal image using AI
  Future<Map<String, dynamic>> analyzeMealImage(String base64Image) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/meals/analyze-image'),
        headers: _headers,
        body: jsonEncode({
          'imageBase64': base64Image,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw ApiException('Failed to analyze image: ${response.statusCode}');
      }
    } catch (e) {
      throw ApiException('Network error: $e');
    }
  }

  /// Save analyzed meal to database
  Future<Map<String, dynamic>> saveMeal({
    required String name,
    required String mealType,
    String? imageUrl,
    required List<Map<String, dynamic>> foods,
    required Map<String, dynamic> nutrition,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/meals/save'),
        headers: _headers,
        body: jsonEncode({
          'name': name,
          'mealType': mealType,
          'imageUrl': imageUrl,
          'foods': foods,
          'nutrition': nutrition,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw ApiException('Failed to save meal: ${response.statusCode}');
      }
    } catch (e) {
      throw ApiException('Network error: $e');
    }
  }

  /// Get recent meals
  Future<List<Map<String, dynamic>>> getRecentMeals({int limit = 10}) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/meals/recent?limit=$limit'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.cast<Map<String, dynamic>>();
      } else {
        throw ApiException('Failed to fetch meals: ${response.statusCode}');
      }
    } catch (e) {
      throw ApiException('Network error: $e');
    }
  }

  /// Get daily nutrition stats
  Future<Map<String, dynamic>> getDailyStats() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/stats/today'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw ApiException('Failed to fetch daily stats: ${response.statusCode}');
      }
    } catch (e) {
      throw ApiException('Network error: $e');
    }
  }
}

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  
  @override
  String toString() => message;
}