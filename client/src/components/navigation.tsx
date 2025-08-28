import { Link, useLocation } from "wouter";
import { Apple, Home, Search, Camera, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
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
          </div>

          {/* Mobile menu placeholder */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm">
              <BarChart3 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}