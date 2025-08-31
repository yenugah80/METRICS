/**
 * Profile Settings Page - Full CRUD for User Preferences
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useLocalAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Settings, 
  Bell, 
  Target, 
  Shield, 
  Heart,
  Trash2,
  Plus,
  Save,
  Upload
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dailyCalorieGoal: 2000,
    dailyProteinGoal: 150,
    dailyCarbGoal: 250,
    dailyFatGoal: 65,
    activityLevel: 'moderate',
    dietPreferences: [] as string[],
    allergens: [] as string[],
    notifications: {
      email: false,
      push: true,
      meal_reminders: true,
      goal_achievements: true
    }
  });

  const [newDietPref, setNewDietPref] = useState('');
  const [newAllergen, setNewAllergen] = useState('');

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        dailyCalorieGoal: user.dailyCalorieGoal || 2000,
        dailyProteinGoal: user.dailyProteinGoal || 150,
        dailyCarbGoal: user.dailyCarbGoal || 250,
        dailyFatGoal: user.dailyFatGoal || 65,
        activityLevel: user.activityLevel || 'moderate',
        dietPreferences: user.dietPreferences || [],
        allergens: user.allergens || [],
        notifications: user.notifications || {
          email: false,
          push: true,
          meal_reminders: true,
          goal_achievements: true
        }
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      await updateUser(formData);
      setIsEditing(false);
      
      toast({
        title: "Profile Updated! ✅",
        description: "Your preferences have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addDietPreference = () => {
    if (newDietPref.trim() && !formData.dietPreferences.includes(newDietPref.trim())) {
      setFormData(prev => ({
        ...prev,
        dietPreferences: [...prev.dietPreferences, newDietPref.trim()]
      }));
      setNewDietPref('');
    }
  };

  const removeDietPreference = (pref: string) => {
    setFormData(prev => ({
      ...prev,
      dietPreferences: prev.dietPreferences.filter(p => p !== pref)
    }));
  };

  const addAllergen = () => {
    if (newAllergen.trim() && !formData.allergens.includes(newAllergen.trim())) {
      setFormData(prev => ({
        ...prev,
        allergens: [...prev.allergens, newAllergen.trim()]
      }));
      setNewAllergen('');
    }
  };

  const removeAllergen = (allergen: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.filter(a => a !== allergen)
    }));
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and nutrition preferences</p>
        </div>
        <div className="flex gap-3">
          {!isEditing ? (
            <Button 
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-edit-profile"
            >
              <Settings className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-save-profile"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                disabled={!isEditing}
                data-testid="input-first-name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                disabled={!isEditing}
                data-testid="input-last-name"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              disabled={!isEditing}
              data-testid="input-email"
            />
          </div>
        </CardContent>
      </Card>

      {/* Nutrition Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Daily Nutrition Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="calories">Daily Calories</Label>
              <Input
                id="calories"
                type="number"
                value={formData.dailyCalorieGoal}
                onChange={(e) => setFormData(prev => ({ ...prev, dailyCalorieGoal: parseInt(e.target.value) || 0 }))}
                disabled={!isEditing}
                data-testid="input-calorie-goal"
              />
            </div>
            <div>
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                value={formData.dailyProteinGoal}
                onChange={(e) => setFormData(prev => ({ ...prev, dailyProteinGoal: parseInt(e.target.value) || 0 }))}
                disabled={!isEditing}
                data-testid="input-protein-goal"
              />
            </div>
            <div>
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                value={formData.dailyCarbGoal}
                onChange={(e) => setFormData(prev => ({ ...prev, dailyCarbGoal: parseInt(e.target.value) || 0 }))}
                disabled={!isEditing}
                data-testid="input-carb-goal"
              />
            </div>
            <div>
              <Label htmlFor="fat">Fat (g)</Label>
              <Input
                id="fat"
                type="number"
                value={formData.dailyFatGoal}
                onChange={(e) => setFormData(prev => ({ ...prev, dailyFatGoal: parseInt(e.target.value) || 0 }))}
                disabled={!isEditing}
                data-testid="input-fat-goal"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="activity">Activity Level</Label>
            <Select
              value={formData.activityLevel}
              onValueChange={(value) => setFormData(prev => ({ ...prev, activityLevel: value }))}
              disabled={!isEditing}
            >
              <SelectTrigger data-testid="select-activity-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Sedentary</SelectItem>
                <SelectItem value="light">Light Activity</SelectItem>
                <SelectItem value="moderate">Moderate Activity</SelectItem>
                <SelectItem value="active">Very Active</SelectItem>
                <SelectItem value="extremely_active">Extremely Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Diet Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Diet Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {formData.dietPreferences.map((pref) => (
              <Badge key={pref} variant="secondary" className="flex items-center gap-1">
                {pref}
                {isEditing && (
                  <button
                    onClick={() => removeDietPreference(pref)}
                    className="ml-1 hover:text-red-500"
                    data-testid={`remove-diet-${pref}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
          
          {isEditing && (
            <div className="flex gap-2">
              <Input
                placeholder="Add diet preference (e.g., vegan, keto)"
                value={newDietPref}
                onChange={(e) => setNewDietPref(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addDietPreference()}
                data-testid="input-new-diet-preference"
              />
              <Button 
                onClick={addDietPreference}
                variant="outline"
                size="sm"
                data-testid="button-add-diet-preference"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Allergens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Allergens & Restrictions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {formData.allergens.map((allergen) => (
              <Badge key={allergen} variant="destructive" className="flex items-center gap-1">
                {allergen}
                {isEditing && (
                  <button
                    onClick={() => removeAllergen(allergen)}
                    className="ml-1 hover:text-white"
                    data-testid={`remove-allergen-${allergen}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
          
          {isEditing && (
            <div className="flex gap-2">
              <Input
                placeholder="Add allergen (e.g., nuts, dairy, gluten)"
                value={newAllergen}
                onChange={(e) => setNewAllergen(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addAllergen()}
                data-testid="input-new-allergen"
              />
              <Button 
                onClick={addAllergen}
                variant="outline"
                size="sm"
                data-testid="button-add-allergen"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(formData.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key} className="capitalize">
                {key.replace('_', ' ')}
              </Label>
              <input
                id={key}
                type="checkbox"
                checked={value}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  notifications: {
                    ...prev.notifications,
                    [key]: e.target.checked
                  }
                }))}
                disabled={!isEditing}
                className="rounded"
                data-testid={`checkbox-${key}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
  );
}