import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";

// User type definition
type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  isPremium: boolean;
  isEmailVerified?: boolean;
  lastLoginAt?: string;
};

// Authentication form data types
type SignInData = {
  email: string;
  password: string;
};

type SignUpData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  signInMutation: UseMutationResult<any, Error, SignInData>;
  signUpMutation: UseMutationResult<any, Error, SignUpData>;
  signOutMutation: UseMutationResult<void, Error, void>;
  refreshTokenMutation: UseMutationResult<any, Error, void>;
};

// Create context
export const AuthContext = createContext<AuthContextType | null>(null);

// API helper functions
async function apiRequest(method: string, endpoint: string, data?: any) {
  const token = localStorage.getItem('accessToken');
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    credentials: 'include', // Include cookies for refresh token
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(endpoint, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response;
}

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  
  // Simple toast function since useToast might not be available
  const toast = (options: { title: string; description: string; variant?: "destructive" }) => {
    console.log(`Toast: ${options.title} - ${options.description}`);
  };

  // Get current user
  const userQuery = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/auth/me');
        const data = await res.json();
        return data.user;
      } catch (error) {
        // If unauthorized, try to refresh token
        if (error instanceof Error && error.message.includes('401')) {
          try {
            await refreshToken();
            const res = await apiRequest('GET', '/api/auth/me');
            const data = await res.json();
            return data.user;
          } catch (refreshError) {
            // Clear tokens and return null
            localStorage.removeItem('accessToken');
            return null;
          }
        }
        throw error;
      }
    },
    enabled: true,
    retry: false,
  });

  // Refresh token function
  const refreshToken = async () => {
    const refreshResponse = await apiRequest('POST', '/api/auth/refresh');
    const refreshData = await refreshResponse.json();
    
    if (refreshData.accessToken) {
      localStorage.setItem('accessToken', refreshData.accessToken);
    }
    
    return refreshData;
  };

  // Sign in mutation
  const signInMutation = useMutation({
    mutationFn: async (data: SignInData) => {
      const res = await apiRequest('POST', '/api/auth/signin', data);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      setUser(data.user);
      queryClient.setQueryData(['/api/auth/me'], data.user);
      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      });
    },
    onError: (error: Error) => {
      setError(error);
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Sign up mutation
  const signUpMutation = useMutation({
    mutationFn: async (data: SignUpData) => {
      const res = await apiRequest('POST', '/api/auth/signup', data);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      setUser(data.user);
      queryClient.setQueryData(['/api/auth/me'], data.user);
      toast({
        title: "Account created!",
        description: "Welcome to MyFoodMatrics! Your account has been created successfully.",
      });
    },
    onError: (error: Error) => {
      setError(error);
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Sign out mutation
  const signOutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/auth/signout');
    },
    onSuccess: () => {
      localStorage.removeItem('accessToken');
      setUser(null);
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.clear();
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      });
    },
    onError: (error: Error) => {
      // Even if sign out fails on server, clear local state
      localStorage.removeItem('accessToken');
      setUser(null);
      queryClient.setQueryData(['/api/auth/me'], null);
      toast({
        title: "Signed out",
        description: "You've been signed out.",
      });
    },
  });

  // Refresh token mutation
  const refreshTokenMutation = useMutation({
    mutationFn: refreshToken,
    onSuccess: (data) => {
      // Token refresh successful, user data should be refetched automatically
    },
    onError: (error: Error) => {
      // Refresh failed, sign out user
      localStorage.removeItem('accessToken');
      setUser(null);
      queryClient.setQueryData(['/api/auth/me'], null);
    },
  });

  // Update state based on query result
  useEffect(() => {
    if (userQuery.data !== undefined) {
      setUser(userQuery.data);
      setIsLoading(false);
    }
    if (userQuery.error) {
      setError(userQuery.error as Error);
      setIsLoading(false);
    }
    if (!userQuery.isLoading) {
      setIsLoading(false);
    }
  }, [userQuery.data, userQuery.error, userQuery.isLoading]);

  // Set up automatic token refresh
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || user) return;

    const refreshInterval = setInterval(() => {
      if (user && !refreshTokenMutation.isPending) {
        refreshTokenMutation.mutate();
      }
    }, 14 * 60 * 1000); // Refresh every 14 minutes (tokens expire in 15)

    return () => clearInterval(refreshInterval);
  }, [user, refreshTokenMutation]);

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    signInMutation,
    signUpMutation,
    signOutMutation,
    refreshTokenMutation,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}