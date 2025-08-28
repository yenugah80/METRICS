import { Link, useLocation } from "wouter";
import { Apple, Home, Search, Camera, BarChart3, ChefHat, Target, User, LogIn, LogOut, Smartphone, Download, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function Navigation() {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated, signOutMutation } = useAuth();

  const isActive = (path: string) => location === path;

  return (
    <>
    <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Premium Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
              <Apple className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black text-gray-900">MyFoodMatrics</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link href="/">
              <Button
                variant={isActive("/") ? "secondary" : "ghost"}
                size="sm"
                className="flex items-center space-x-2"
                data-testid="nav-home"
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button
                variant={isActive("/dashboard") ? "secondary" : "ghost"}
                size="sm"
                className="flex items-center space-x-2"
                data-testid="nav-dashboard"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
            </Link>
            
            <Link href="/search">
              <Button
                variant={isActive("/search") ? "secondary" : "ghost"}
                size="sm"
                className="flex items-center space-x-2"
                data-testid="nav-search"
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
              </Button>
            </Link>

            <Link href="/camera">
              <Button
                variant={isActive("/camera") ? "secondary" : "ghost"}
                size="sm"
                className="flex items-center space-x-2"
                data-testid="nav-camera"
              >
                <Camera className="h-4 w-4" />
                <span>Camera</span>
              </Button>
            </Link>

            <Link href="/recipes">
              <Button
                variant={isActive("/recipes") ? "secondary" : "ghost"}
                size="sm"
                className="flex items-center space-x-2"
                data-testid="nav-recipes"
              >
                <ChefHat className="h-4 w-4" />
                <span>Recipes</span>
              </Button>
            </Link>

            <Link href="/progress">
              <Button
                variant={isActive("/progress") ? "secondary" : "ghost"}
                size="sm"
                className="flex items-center space-x-2"
                data-testid="nav-progress"
              >
                <Target className="h-4 w-4" />
                <span>Progress</span>
              </Button>
            </Link>
          </div>

          {/* Authentication & Mobile Menu */}
          <div className="flex items-center space-x-3">
            {/* Desktop Auth */}
            <div className="hidden md:flex items-center space-x-2">
              {isAuthenticated ? (
                <>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => signOutMutation.mutate()}
                    className="flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </>
              ) : (
                <Link href="/auth">
                  <Button 
                    variant="default" 
                    size="sm"
                    className="flex items-center space-x-2 bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </Button>
                </Link>
              )}
            </div>

            {/* Sidebar Toggle */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="flex items-center space-x-2"
            >
              <Menu className="h-5 w-5" />
              <span className="hidden sm:inline">More</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>

    {/* Sidebar Overlay */}
    {sidebarOpen && (
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
          onClick={() => setSidebarOpen(false)}
        />
        
        {/* Sidebar */}
        <div className="relative ml-auto h-full w-80 bg-white shadow-2xl">
          <div className="flex h-full flex-col">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold text-gray-900">Account & Apps</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Authentication Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Authentication</h3>
                {isAuthenticated ? (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</div>
                          <div className="text-sm text-gray-500">{user?.email}</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <User className="h-4 w-4 mr-2" />
                          Manage Profile
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-start"
                          onClick={() => signOutMutation.mutate()}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <LogIn className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">Sign In Required</h4>
                        <p className="text-sm text-gray-600">Access your nutrition data across all devices</p>
                      </div>
                      <Link href="/auth">
                        <Button 
                          className="w-full bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700"
                        >
                          <LogIn className="h-4 w-4 mr-2" />
                          Sign In
                        </Button>
                      </Link>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Secure authentication with multiple options
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Mobile Apps Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Mobile Apps</h3>
                <div className="space-y-3">
                  {/* iOS App */}
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                          <Apple className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">iOS App</div>
                          <div className="text-sm text-gray-500">MyFoodMatrics for iPhone</div>
                        </div>
                        <Badge variant="secondary">Coming Soon</Badge>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-3" disabled>
                        <Download className="h-4 w-4 mr-2" />
                        App Store
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Android App */}
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                          <Smartphone className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Android App</div>
                          <div className="text-sm text-gray-500">Native Flutter app with health sync</div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Available</Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-3"
                        onClick={() => window.open('/flutter_nutrition_app/index.html', '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download APK
                      </Button>
                    </CardContent>
                  </Card>

                  {/* PWA */}
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                          <Smartphone className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Web App</div>
                          <div className="text-sm text-gray-500">Install as PWA</div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">Available</Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-3"
                        onClick={() => {
                          if ('serviceWorker' in navigator) {
                            alert('Use your browser\'s "Add to Home Screen" feature');
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Install PWA
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Features Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">App Features</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Offline nutrition tracking</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Health app integration</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Camera food recognition</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Sync across all devices</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}