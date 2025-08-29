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
    // iOS-style navigation for unauthenticated users
    return (
      <header className="sticky top-0 z-50 mx-auto mt-3 w-[min(1100px,92%)]">
        <div className="rounded-2xl border border-white/50 bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 text-white font-semibold text-sm">
                M
              </div>
              <span className="text-[17px] font-semibold tracking-[-0.01em] text-neutral-900">MyFoodMatrics</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-2">
              <Link href="#features">
                <button className="rounded-full px-4 py-2 text-[14px] font-medium hover:bg-black/5 transition-colors">
                  Features
                </button>
              </Link>
              <Link href="#pricing">
                <button className="rounded-full px-4 py-2 text-[14px] font-medium hover:bg-black/5 transition-colors">
                  Pricing
                </button>
              </Link>
              <Link href="/auth">
                <button className="rounded-full bg-black text-white px-4 py-2 text-[14px] font-medium hover:opacity-90 transition-opacity">
                  Get Started
                </button>
              </Link>
            </nav>
            {/* Mobile menu button */}
            <div className="sm:hidden">
              <Link href="/auth">
                <button className="rounded-full bg-black text-white px-4 py-2 text-[14px] font-medium hover:opacity-90 transition-opacity">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* iOS-style Glassy Top Bar */}
      <header className="sticky top-0 z-50 mx-auto mt-3 w-[min(1100px,92%)]">
        <div className="rounded-2xl border border-white/50 bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 text-white font-semibold text-sm">
                M
              </div>
              <span className="text-[17px] font-semibold tracking-[-0.01em] text-neutral-900">MyFoodMatrics</span>
            </Link>
            <button
              className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-[14px] font-medium backdrop-blur hover:bg-white transition-colors"
              onClick={handleLogout}
              disabled={signOutMutation.isPending}
              data-testid="button-logout"
            >
              {signOutMutation.isPending ? "..." : "Sign Out"}
            </button>
          </div>
        </div>
      </header>

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