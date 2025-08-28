import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: any;
  logoutMutation: any;
  registerMutation: any;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Mock user data for demo
  const mockUser = { id: 1, email: "demo@myfoomatrics.com", name: "Demo User" };
  
  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockUser;
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], mockUser);
      toast({ title: "Welcome back!", description: "Successfully logged in." });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: any) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockUser;
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], mockUser);
      toast({ title: "Welcome!", description: "Account created successfully." });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({ title: "Logged out", description: "See you next time!" });
    },
  });

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
    queryFn: () => mockUser, // Auto-login for demo
    retry: false,
  });

  return (
    <AuthContext.Provider 
      value={{
        user: user || null,
        isLoading: false,
        error: null,
        loginMutation,
        logoutMutation,
        registerMutation,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}