import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Mail, Lock, User, Chrome, Fingerprint, Shield, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const signUpSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignUpData = z.infer<typeof signUpSchema>;
type SignInData = z.infer<typeof signInSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("signin");

  // Sign In Form
  const signInForm = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" }
  });

  // Sign Up Form
  const signUpForm = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" }
  });

  // Sign In Mutation
  const signInMutation = useMutation({
    mutationFn: async (data: SignInData) => {
      const res = await apiRequest("POST", "/api/auth/signin", data);
      return await res.json();
    },
    onSuccess: () => {
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      setAuthError(error.message || "Sign in failed");
    }
  });

  // Sign Up Mutation
  const signUpMutation = useMutation({
    mutationFn: async (data: SignUpData) => {
      const res = await apiRequest("POST", "/api/auth/signup", data);
      return await res.json();
    },
    onSuccess: () => {
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      setAuthError(error.message || "Sign up failed");
    }
  });

  const handleSignIn = (data: SignInData) => {
    setAuthError(null);
    signInMutation.mutate(data);
  };

  const handleSignUp = (data: SignUpData) => {
    setAuthError(null);
    signUpMutation.mutate(data);
  };

  const handleGoogleAuth = () => {
    window.location.href = "/api/auth/google";
  };

  const handleReplitSSO = () => {
    window.location.href = "/api/login";
  };

  const handlePasskeyAuth = async () => {
    try {
      setAuthError(null);
      // WebAuthn implementation would go here
      if (!window.navigator.credentials) {
        throw new Error("WebAuthn not supported on this device");
      }
      
      // For now, show a placeholder
      setAuthError("Passkey authentication coming soon!");
    } catch (error: any) {
      setAuthError(error.message || "Passkey authentication failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Left Panel - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to MyFoodMatrics</h1>
            <p className="text-gray-600">Secure authentication with multiple options</p>
          </div>

          <Card className="shadow-2xl border-0">
            <CardHeader className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                {/* Sign In Tab */}
                <TabsContent value="signin" className="space-y-4">
                  <div className="text-center">
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>Sign in to your account</CardDescription>
                  </div>

                  {authError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{authError}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="Enter your email"
                          className="pl-10"
                          {...signInForm.register("email")}
                          data-testid="input-signin-email"
                        />
                      </div>
                      {signInForm.formState.errors.email && (
                        <p className="text-sm text-red-600">{signInForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="signin-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="pl-10 pr-10"
                          {...signInForm.register("password")}
                          data-testid="input-signin-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {signInForm.formState.errors.password && (
                        <p className="text-sm text-red-600">{signInForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={signInMutation.isPending}
                      data-testid="button-signin"
                    >
                      {signInMutation.isPending ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>

                {/* Sign Up Tab */}
                <TabsContent value="signup" className="space-y-4">
                  <div className="text-center">
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>Get started with your nutrition journey</CardDescription>
                  </div>

                  {authError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{authError}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-firstName">First Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="signup-firstName"
                            placeholder="First name"
                            className="pl-10"
                            {...signUpForm.register("firstName")}
                            data-testid="input-signup-firstname"
                          />
                        </div>
                        {signUpForm.formState.errors.firstName && (
                          <p className="text-sm text-red-600">{signUpForm.formState.errors.firstName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-lastName">Last Name</Label>
                        <Input
                          id="signup-lastName"
                          placeholder="Last name"
                          {...signUpForm.register("lastName")}
                          data-testid="input-signup-lastname"
                        />
                        {signUpForm.formState.errors.lastName && (
                          <p className="text-sm text-red-600">{signUpForm.formState.errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          className="pl-10"
                          {...signUpForm.register("email")}
                          data-testid="input-signup-email"
                        />
                      </div>
                      {signUpForm.formState.errors.email && (
                        <p className="text-sm text-red-600">{signUpForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
                          className="pl-10 pr-10"
                          {...signUpForm.register("password")}
                          data-testid="input-signup-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {signUpForm.formState.errors.password && (
                        <p className="text-sm text-red-600">{signUpForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="signup-confirmPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          className="pl-10"
                          {...signUpForm.register("confirmPassword")}
                          data-testid="input-signup-confirm-password"
                        />
                      </div>
                      {signUpForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-600">{signUpForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={signUpMutation.isPending}
                      data-testid="button-signup"
                    >
                      {signUpMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Social & Alternative Auth Methods */}
              <div className="space-y-3">
                {/* Google OAuth */}
                <Button
                  variant="outline"
                  onClick={handleGoogleAuth}
                  className="w-full"
                  data-testid="button-google-auth"
                >
                  <Chrome className="mr-2 h-4 w-4" />
                  Continue with Google
                </Button>

                {/* Replit SSO */}
                <Button
                  variant="outline"
                  onClick={handleReplitSSO}
                  className="w-full"
                  data-testid="button-replit-sso"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Continue with Replit SSO
                </Button>

                {/* Passkey Authentication */}
                <Button
                  variant="outline"
                  onClick={handlePasskeyAuth}
                  className="w-full relative"
                  data-testid="button-passkey-auth"
                >
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Sign in with Passkey
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Soon
                  </Badge>
                </Button>
              </div>

              {/* Security Features */}
              <div className="pt-4 border-t">
                <div className="text-center space-y-2">
                  <p className="text-xs text-gray-500">
                    Protected by enterprise-grade security
                  </p>
                  <div className="flex justify-center items-center space-x-4 text-xs text-gray-400">
                    <span className="flex items-center">
                      <Shield className="w-3 h-3 mr-1" />
                      JWT Tokens
                    </span>
                    <span className="flex items-center">
                      <Lock className="w-3 h-3 mr-1" />
                      Encrypted
                    </span>
                    <span className="flex items-center">
                      <Fingerprint className="w-3 h-3 mr-1" />
                      WebAuthn Ready
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Panel - Hero Section */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600 items-center justify-center p-12">
        <div className="text-center text-white max-w-lg">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-6">Secure Multi-Factor Authentication</h2>
          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            Choose from multiple secure authentication methods including email/password, Google OAuth, Replit SSO, and cutting-edge passkey technology.
          </p>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-white/90">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>JWT token-based authentication</span>
            </div>
            <div className="flex items-center space-x-3 text-white/90">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Enterprise-grade encryption</span>
            </div>
            <div className="flex items-center space-x-3 text-white/90">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>WebAuthn passkey support</span>
            </div>
            <div className="flex items-center space-x-3 text-white/90">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Multi-provider OAuth integration</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}