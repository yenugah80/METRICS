// Minimal auth hook for testing
export function useAuth() {
  return {
    user: null,
    isLoading: false,
    error: null,
    loginMutation: { mutate: () => {} },
    logoutMutation: { mutate: () => {} },
    registerMutation: { mutate: () => {} }
  };
}

export function AuthProvider({ children }: { children: any }) {
  return children;
}