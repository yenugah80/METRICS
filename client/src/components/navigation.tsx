import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Navigation() {
  const { user, signOutMutation } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    signOutMutation.mutate();
  };

  const mobileNavLinks = [
    { href: "/dashboard", label: "Home", icon: "🏠", requiresAuth: true },
    { href: "/camera", label: "Scan", icon: "📷", requiresAuth: true },
    { href: "/recipes", label: "Recipes", icon: "🍽️", requiresAuth: true },
    { href: "/progress", label: "Stats", icon: "📊", requiresAuth: true },
    { href: "/profile", label: "Profile", icon: "👤", requiresAuth: true },
  ];

  if (!user) {
    // Simplified mobile navigation for unauthenticated users
    return (
      <nav className="border-b border-gray-200 bg-white/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-bold text-lg text-black">MyFoodMatrics</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Link href="/auth">
                <Button size="sm" className="btn-gradient text-white px-4 py-2 rounded-lg text-sm font-medium">
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
      <div className="border-b border-gray-200 bg-white/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-bold text-lg text-black">MyFoodMatrics</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={signOutMutation.isPending}
              className="text-gray-600 hover:text-black px-3 py-1 rounded-lg text-sm"
              data-testid="button-logout"
            >
              {signOutMutation.isPending ? "..." : "Sign Out"}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile First */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 safe-area-bottom">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {mobileNavLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <button
                className={`
                  w-full flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 touch-manipulation
                  ${location === link.href 
                    ? "bg-primary/10 text-primary" 
                    : "text-gray-600 hover:text-primary hover:bg-gray-50 active:bg-gray-100"
                  }
                `}
                data-testid={`mobile-nav-${link.label.toLowerCase()}`}
              >
                <span className="text-xl mb-1">{link.icon}</span>
                <span className={`text-xs font-medium ${location === link.href ? 'font-semibold' : ''}`}>
                  {link.label}
                </span>
                {location === link.href && (
                  <div className="w-4 h-1 bg-primary rounded-full mt-1" />
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