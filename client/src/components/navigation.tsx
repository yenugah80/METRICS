import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Navigation() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
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
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Professional Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">M</span>
            </div>
            <span className="professional-heading text-xl font-bold text-foreground tracking-tight">
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
                      text-sm font-medium transition-colors h-9 px-4
                      ${location === link.href 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
                  disabled={logoutMutation.isPending}
                  className="h-9 px-4 text-sm font-medium"
                  data-testid="button-logout"
                >
                  {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-4 text-sm font-medium text-muted-foreground hover:text-foreground"
                    data-testid="button-signin"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button
                    size="sm"
                    className="h-9 px-4 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
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