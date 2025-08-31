// No authentication required - all features available to everyone

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Remove all authentication checks - instant access to all features
  return <>{children}</>;
}