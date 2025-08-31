/**
 * Local Authentication System (No JWT Required)
 * Provides full app functionality using localStorage only
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { localStorageManager, type LocalUser } from "@/lib/localStorageManager";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: LocalUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initializeUser: () => void;
  updateUser: (updates: Partial<LocalUser>) => void;
  signOut: () => void;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Initialize user on app start
  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = () => {
    setIsLoading(true);
    try {
      // Always initialize a guest user - no authentication required
      const guestUser = localStorageManager.initializeGuestUser();
      setUser(guestUser);
      
      toast({
        title: "Welcome!",
        description: "You can use all features without signing up. Your data is saved locally.",
      });
    } catch (error) {
      console.error('Failed to initialize user:', error);
      toast({
        title: "Initialization Error",
        description: "Failed to initialize app. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updates: Partial<LocalUser>) => {
    try {
      const updatedUser = localStorageManager.updateUser(updates);
      setUser(updatedUser);
      
      toast({
        title: "Profile Updated",
        description: "Your preferences have been saved locally.",
      });
    } catch (error) {
      console.error('Failed to update user:', error);
      toast({
        title: "Update Failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const signOut = () => {
    // Clear all local data and reinitialize
    localStorageManager.clearAllData();
    initializeUser();
    
    toast({
      title: "Data Cleared",
      description: "All local data has been cleared. Starting fresh!",
    });
  };

  const isGuest = user?.id?.startsWith('guest_') || false;

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user, // Always true once initialized
    isLoading,
    initializeUser,
    updateUser,
    signOut,
    isGuest,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}