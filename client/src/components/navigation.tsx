import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Navigation() {
  const { user, signOutMutation } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    signOutMutation.mutate();
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", requiresAuth: true },
    { href: "/camera", label: "Food Analysis", requiresAuth: true },
    { href: "/recipes", label: "Recipes", requiresAuth: true },
    { href: "/progress", label: "Progress", requiresAuth: true },
    { href: "/sustainability", label: "Sustainability", requiresAuth: true },
    { href: "/profile", label: "Profile", requiresAuth: true },
  ];

  return (
    <nav className="border-b border-gray-200 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Professional Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="professional-heading text-xl font-bold text-black tracking-tight">
              MyFoodMatrics
            </span>
          </Link>

          {/* Navigation Links */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={location === link.href ? "default" : "ghost"}
                    size="sm"
                    className={`
                      text-sm font-medium transition-all duration-300 h-9 px-4 rounded-xl
                      ${location === link.href 
                        ? "btn-gradient text-white shadow-lg" 
                        : "text-gray-700 hover:text-black hover:bg-gray-50"
                      }
                    `}
                    data-testid={`nav-${link.label.toLowerCase().replace(' ', '-')}`}
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
            </div>
          )}

          {/* Authentication Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="hidden sm:block text-sm text-muted-foreground">
                  Welcome back
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={signOutMutation.isPending}
                  className="h-9 px-4 text-sm font-medium btn-outline-glow rounded-xl"
                  data-testid="button-logout"
                >
                  {signOutMutation.isPending ? "Signing out..." : "Sign Out"}
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-4 text-sm font-medium text-gray-700 hover:text-black rounded-xl"
                    data-testid="button-signin"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button
                    size="sm"
                    className="h-9 px-4 text-sm font-medium btn-gradient rounded-xl"
                    data-testid="button-signup"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {user && (
          <div className="md:hidden mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={location === link.href ? "default" : "ghost"}
                    size="sm"
                    className={`
                      w-full text-xs font-medium transition-colors h-8
                      ${location === link.href 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }
                    `}
                    data-testid={`mobile-nav-${link.label.toLowerCase().replace(' ', '-')}`}
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}