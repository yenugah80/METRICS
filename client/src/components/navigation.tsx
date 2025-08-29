import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Home, Camera, ChefHat, TrendingUp, User } from "lucide-react";

export default function Navigation() {
  const { user, signOutMutation } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    signOutMutation.mutate();
  };

  const mobileNavLinks = [
    { href: "/dashboard", label: "Home", icon: Home, requiresAuth: true },
    { href: "/camera", label: "Scan", icon: Camera, requiresAuth: true },
    { href: "/recipes", label: "Recipes", icon: ChefHat, requiresAuth: true },
    { href: "/progress", label: "Stats", icon: TrendingUp, requiresAuth: true },
    { href: "/profile", label: "Profile", icon: User, requiresAuth: true },
  ];

  if (!user) {
    // Simplified mobile navigation for unauthenticated users
    return (
      <nav className="professional-nav sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="group flex items-center space-x-3 transition-all duration-300 hover:scale-105">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:rotate-3 transition-all duration-500">
                <span className="text-white font-bold text-base">M</span>
              </div>
              <span className="font-bold text-xl text-gradient-primary">MyFoodMatrics</span>
            </Link>
            <div className="flex items-center space-x-3">
              <Link href="/auth">
                <Button className="btn-premium shadow-lg hover:shadow-xl" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Top Bar - Mobile Only */}
      <div className="professional-nav sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="group flex items-center space-x-3 transition-all duration-300 hover:scale-105">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:rotate-3 transition-all duration-500">
                <span className="text-white font-bold text-base">M</span>
              </div>
              <span className="font-bold text-xl text-gradient-primary">MyFoodMatrics</span>
            </Link>
            <Button
              className="btn-outline-glow"
              size="sm"
              onClick={handleLogout}
              disabled={signOutMutation.isPending}
              data-testid="button-logout"
            >
              {signOutMutation.isPending ? "..." : "Sign Out"}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile First */}
      <div className="mobile-nav fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
        <div className="grid grid-cols-5 gap-2 px-3 py-3">
          {mobileNavLinks.map((link, index) => (
            <Link key={link.href} href={link.href}>
              <button
                className={`
                  w-full flex flex-col items-center justify-center py-3 px-2 rounded-2xl transition-all duration-300 touch-manipulation transform hover:scale-105 active:scale-95 relative overflow-hidden group
                  ${location === link.href 
                    ? "bg-gradient-to-br from-slate-200 to-slate-100 text-slate-800 shadow-lg border border-slate-300" 
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-50/80 active:bg-slate-100/50"
                  }
                `}
                data-testid={`mobile-nav-${link.label.toLowerCase()}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {location === link.href && (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 via-slate-50/30 to-white/50 rounded-2xl" />
                )}
                <link.icon className={`w-6 h-6 mb-2 transition-transform duration-300 ${location === link.href ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className={`text-xs font-medium transition-all duration-300 ${location === link.href ? 'font-bold text-slate-800' : 'group-hover:font-semibold'}`}>
                  {link.label}
                </span>
                {location === link.href && (
                  <div className="w-6 h-1 bg-gradient-to-r from-slate-600 to-slate-800 rounded-full mt-2 shadow-md" />
                )}
              </button>
            </Link>
          ))}
        </div>
        {/* Safe area padding for devices with home indicator */}
        <div className="h-safe-area-inset-bottom" />
      </div>
    </>
  );
}