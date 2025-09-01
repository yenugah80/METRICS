import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'dart:convert';
import '../../../core/services/api_service.dart';
import '../../../core/services/health_service.dart';
import '../widgets/ai_analysis_animation.dart';

class EnhancedMealCameraScreen extends StatefulWidget {
  const EnhancedMealCameraScreen({super.key});

  @override
  State<EnhancedMealCameraScreen> createState() => _EnhancedMealCameraScreenState();
}

class _EnhancedMealCameraScreenState extends State<EnhancedMealCameraScreen>
    with TickerProviderStateMixin {
  File? _selectedImage;
  bool _isAnalyzing = false;
  Map<String, dynamic>? _analysisResult;
  
  late AnimationController _successAnimationController;
  late Animation<double> _successScaleAnimation;
  
  final ApiService _apiService = ApiService();
  final HealthService _healthService = HealthService();

  @override
  void initState() {
    super.initState();
    _successAnimationController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _successScaleAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _successAnimationController,
      curve: Curves.elasticOut,
    ));
    
    _initializeHealthService();
  }

  Future<void> _initializeHealthService() async {
    await _healthService.initialize();
  }

  @override
  void dispose() {
    _successAnimationController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: source,
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 85,
    );
    
    if (pickedFile != null) {
      setState(() {
        _selectedImage = File(pickedFile.path);
        _isAnalyzing = true;
        _analysisResult = null;
      });
      
      await _analyzeImage();
    }
  }

  Future<void> _analyzeImage() async {
    if (_selectedImage == null) return;

    try {
      // Convert image to base64
      final bytes = await _selectedImage!.readAsBytes();
      final base64Image = base64Encode(bytes);

      // Call API for analysis
      final result = await _apiService.analyzeMealImage(base64Image);
      
      setState(() {
        _analysisResult = result;
        _isAnalyzing = false;
      });
      
      _successAnimationController.forward();
      
    } catch (e) {
      setState(() {
        _isAnalyzing = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Analysis failed: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _saveMeal() async {
    if (_analysisResult == null) return;

    try {
      // Save to backend
      final mealName = 'Meal from ${DateTime.now().toString().substring(11, 16)}';
      await _apiService.saveMeal(
        name: mealName,
        mealType: 'lunch',
        imageUrl: _selectedImage?.path,
        foods: List<Map<String, dynamic>>.from(_analysisResult!['foods'] ?? []),
        nutrition: _analysisResult!,
      );

      // Sync to health app
      final nutrition = _analysisResult!;
      await _healthService.syncMealToHealth(
        timestamp: DateTime.now(),
        calories: (nutrition['total_calories'] ?? 0).toDouble(),
        protein: (nutrition['total_protein'] ?? 0).toDouble(),
        carbs: (nutrition['total_carbs'] ?? 0).toDouble(),
        fat: (nutrition['total_fat'] ?? 0).toDouble(),
        fiber: (nutrition['detailed_nutrition']?['fiber'] ?? 0).toDouble(),
        sugar: (nutrition['detailed_nutrition']?['sugar'] ?? 0).toDouble(),
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Meal saved and synced to Health app!'),
            backgroundColor: Colors.green,
          ),
        );
      }

      // Reset for next meal
      setState(() {
        _selectedImage = null;
        _analysisResult = null;
      });
      _successAnimationController.reset();

    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save meal: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Camera Analysis'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header with modern design
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Theme.of(context).colorScheme.primary.withOpacity(0.1),
                      Theme.of(context).colorScheme.secondary.withOpacity(0.1),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  children: [
                    Icon(
                      Icons.camera_enhance,
                      size: 48,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'AI-Powered Meal Analysis',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Capture your meal and get instant nutrition insights',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey[600],
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 30),
              
              // Enhanced image preview with AI animation
              AIAnalysisAnimation(
                isAnalyzing: _isAnalyzing,
                child: _buildImagePreview(),
              ),
              
              const SizedBox(height: 30),
              
              // Analysis results with animation
              if (_analysisResult != null) ...[
                AnimatedBuilder(
                  animation: _successScaleAnimation,
                  builder: (context, child) {
                    return Transform.scale(
                      scale: _successScaleAnimation.value,
                      child: _buildAnalysisResults(),
                    );
                  },
                ),
                const SizedBox(height: 20),
              ],
              
              // Enhanced action buttons
              _buildActionButtons(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImagePreview() {
    if (_selectedImage == null) {
      return Container(
        height: 280,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceVariant,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: Theme.of(context).colorScheme.outline,
            width: 2,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.add_a_photo,
                size: 40,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Select a photo to analyze',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      height: 280,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Image.file(
          _selectedImage!,
          fit: BoxFit.cover,
          width: double.infinity,
        ),
      ),
    );
  }

  Widget _buildAnalysisResults() {
    if (_analysisResult == null) return const SizedBox.shrink();

    final nutrition = _analysisResult!;
    final foods = List<Map<String, dynamic>>.from(nutrition['foods'] ?? []);

    return Card(
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.analytics,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  'Nutrition Analysis',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // Macro nutrients grid
            Row(
              children: [
                Expanded(child: _buildNutrientCard('Calories', '${nutrition['total_calories']}', 'kcal', Colors.orange)),
                const SizedBox(width: 12),
                Expanded(child: _buildNutrientCard('Protein', '${nutrition['total_protein']}', 'g', Colors.red)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _buildNutrientCard('Carbs', '${nutrition['total_carbs']}', 'g', Colors.blue)),
                const SizedBox(width: 12),
                Expanded(child: _buildNutrientCard('Fat', '${nutrition['total_fat']}', 'g', Colors.green)),
              ],
            ),
            
            const SizedBox(height: 20),
            
            // Identified foods
            Text(
              'Identified Foods',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            ...foods.map((food) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      food['name'] ?? '',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                  Text(
                    '${food['quantity']} ${food['unit']}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildNutrientCard(String label, String value, String unit, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                value,
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
              Text(
                unit,
                style: TextStyle(
                  color: color.withOpacity(0.7),
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Column(
      children: [
        // Camera and Gallery buttons
        Row(
          children: [
            Expanded(
              child: _buildModernButton(
                onTap: () => _pickImage(ImageSource.camera),
                icon: Icons.camera_alt,
                label: 'Camera',
                isPrimary: true,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildModernButton(
                onTap: () => _pickImage(ImageSource.gallery),
                icon: Icons.photo_library,
                label: 'Gallery',
                isPrimary: false,
              ),
            ),
          ],
        ),
        
        if (_analysisResult != null) ...[
          const SizedBox(height: 16),
          _buildModernButton(
            onTap: _saveMeal,
            icon: Icons.save,
            label: 'Save & Sync to Health',
            isPrimary: true,
            isFullWidth: true,
          ),
        ],
      ],
    );
  }

  Widget _buildModernButton({
    required VoidCallback onTap,
    required IconData icon,
    required String label,
    required bool isPrimary,
    bool isFullWidth = false,
  }) {
    return Container(
      width: isFullWidth ? double.infinity : null,
      height: 64,
      child: Material(
        elevation: isPrimary ? 8 : 2,
        borderRadius: BorderRadius.circular(16),
        color: isPrimary 
            ? Theme.of(context).colorScheme.primary
            : Theme.of(context).colorScheme.surfaceVariant,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: isPrimary ? LinearGradient(
                colors: [
                  Theme.of(context).colorScheme.primary,
                  Theme.of(context).colorScheme.primary.withOpacity(0.8),
                ],
              ) : null,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  icon,
                  color: isPrimary ? Colors.white : Theme.of(context).colorScheme.primary,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Text(
                  label,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: isPrimary ? Colors.white : Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}