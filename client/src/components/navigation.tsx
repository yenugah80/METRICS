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
      <nav className="border-b border-white/20 bg-white/90 backdrop-blur-xl sticky top-0 z-50 shadow-xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="group flex items-center space-x-3 transition-all duration-300 hover:scale-105">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:rotate-6 transition-all duration-500">
                <span className="text-white font-bold text-base">M</span>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">MyFoodMatrics</span>
            </Link>
            <div className="flex items-center space-x-3">
              <Link href="/auth">
                <Button variant="premium" size="sm" className="shadow-lg hover:shadow-xl">
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
      <div className="border-b border-white/20 bg-white/90 backdrop-blur-xl sticky top-0 z-50 shadow-xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="group flex items-center space-x-3 transition-all duration-300 hover:scale-105">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:rotate-6 transition-all duration-500">
                <span className="text-white font-bold text-base">M</span>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">MyFoodMatrics</span>
            </Link>
            <Button
              variant="glass"
              size="sm"
              onClick={handleLogout}
              disabled={signOutMutation.isPending}
              className="text-slate-700 hover:text-white shadow-lg"
              data-testid="button-logout"
            >
              {signOutMutation.isPending ? "..." : "Sign Out"}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile First */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-white/20 shadow-2xl safe-area-bottom">
        <div className="grid grid-cols-5 gap-2 px-3 py-3">
          {mobileNavLinks.map((link, index) => (
            <Link key={link.href} href={link.href}>
              <button
                className={`
                  w-full flex flex-col items-center justify-center py-3 px-2 rounded-2xl transition-all duration-300 touch-manipulation transform hover:scale-105 active:scale-95 relative overflow-hidden group
                  ${location === link.href 
                    ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-600 shadow-lg" 
                    : "text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 active:bg-blue-100/50"
                  }
                `}
                data-testid={`mobile-nav-${link.label.toLowerCase()}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {location === link.href && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl" />
                )}
                <span className={`text-2xl mb-2 transition-transform duration-300 ${location === link.href ? 'scale-110' : 'group-hover:scale-110'}`}>{link.icon}</span>
                <span className={`text-xs font-medium transition-all duration-300 ${location === link.href ? 'font-bold text-blue-700' : 'group-hover:font-semibold'}`}>
                  {link.label}
                </span>
                {location === link.href && (
                  <div className="w-6 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-2 shadow-lg animate-pulse" />
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