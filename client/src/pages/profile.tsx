import { useAuth } from "@/hooks/useLocalAuth";
import { ProfileManagement } from "@/components/ProfileManagement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Crown, Calendar, LogOut, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  interface UserProfile {
    id: string;
    userId: string;
    dietPreferences: string[];
    allergens: string[];
    dailyCalorieTarget: number;
    dailyProteinTarget: number;
    dailyCarbTarget: number;
    dailyFatTarget: number;
    recipesGenerated: number;
  }

  // Fetch user profile data
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['/api/profile'],
    enabled: isAuthenticated
  });

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20">
      <div className="container mx-auto px-4 py-8">
        {/* User Header */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {user?.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-primary" />
                      </div>
                    )}
                    {user?.isPremium && (
                      <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                        <Crown className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h1 className="text-2xl font-bold">
                      {user?.firstName || user?.lastName 
                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                        : user?.email?.split('@')[0] || 'User'
                      }
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-muted-foreground">{user?.email}</p>
                      {user?.isPremium && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    {user?.createdAt && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        Member since {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigate("/settings")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                  <Button variant="outline" onClick={() => window.location.href = "/api/logout"}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        {profile && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{profile.dietPreferences?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Diet Preferences</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{profile.allergens?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Allergen Alerts</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{profile.dailyCalorieTarget || 2000}</div>
                <div className="text-sm text-muted-foreground">Calorie Target</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{profile.recipesGenerated || 0}</div>
                <div className="text-sm text-muted-foreground">Recipes Generated</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Profile Management Component */}
        <ProfileManagement />
      </div>
    </div>
  );
}