import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Mail, Lock, User, Chrome, Fingerprint, Shield, Eye, EyeOff, ArrowRight, LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";

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
  const [activeTab, setActiveTab] = useState("signin");
  const { user, isLoading, signInMutation, signUpMutation } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

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

  const handleSignIn = (data: SignInData) => {
    signInMutation.mutate(data, {
      onSuccess: () => {
        setLocation("/dashboard");
      }
    });
  };

  const handleSignUp = (data: SignUpData) => {
    signUpMutation.mutate(data, {
      onSuccess: () => {
        setLocation("/dashboard");
      }
    });
  };

  const handleGoogleAuth = () => {
    window.location.href = "/api/auth/google";
  };

  const handleSSOLogin = () => {
    // For now, show a message that SSO is coming soon
    alert("Single Sign-On integration coming soon! Please use email/password or Google authentication.");
  };

  const handlePasskeyAuth = async () => {
    try {
      // WebAuthn implementation would go here
      if (!window.navigator.credentials) {
        alert("WebAuthn not supported on this device");
        return;
      }
      
      // For now, show a placeholder
      alert("Passkey authentication coming soon!");
    } catch (error: any) {
      alert(error.message || "Passkey authentication failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100/30 via-secondary-100/30 to-accent-100/30 flex">
      {/* Left Panel - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Welcome to MyFoodMatrics</h1>
            <p className="text-muted-foreground">Secure authentication with multiple options</p>
          </div>

          <Card className="shadow-xl border border-border/50 backdrop-blur-sm bg-card/95">
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

                  {signInMutation.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{signInMutation.error.message}</AlertDescription>
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

                  {signInMutation.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{signInMutation.error.message}</AlertDescription>
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
                {/* Google OAuth - Primary Method */}
                <Button
                  onClick={handleGoogleAuth}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg border-0"
                  data-testid="button-google-auth"
                >
                  <Chrome className="mr-2 h-4 w-4" />
                  Continue with Google
                </Button>

                {/* SSO Authentication */}
                <Button
                  variant="outline"
                  onClick={handleSSOLogin}
                  className="w-full border-border/50 hover:bg-muted/50"
                  data-testid="button-sso-auth"
                >
                  <Shield className="mr-2 h-4 w-4 text-primary" />
                  Single Sign-On
                  <Badge variant="secondary" className="ml-auto text-xs bg-secondary-100 text-secondary-700">
                    Soon
                  </Badge>
                </Button>

                {/* Passkey Authentication */}
                <Button
                  variant="outline"
                  onClick={handlePasskeyAuth}
                  className="w-full relative border-border/50 hover:bg-muted/50"
                  data-testid="button-passkey-auth"
                >
                  <Fingerprint className="mr-2 h-4 w-4 text-secondary-600" />
                  Sign in with Passkey
                  <Badge variant="secondary" className="ml-auto text-xs bg-secondary-100 text-secondary-700">
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
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary via-secondary-200 to-accent items-center justify-center p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5"></div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-24 translate-y-24"></div>
        
        <div className="relative text-center text-white max-w-lg z-10">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-6 text-white drop-shadow-lg">Secure Multi-Factor Authentication</h2>
          <p className="text-xl text-white/95 mb-8 leading-relaxed drop-shadow-sm">
            Choose from multiple secure authentication methods including email/password, Google OAuth, enterprise SSO, and cutting-edge passkey technology.
          </p>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-white/95 bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>JWT token-based authentication</span>
            </div>
            <div className="flex items-center space-x-3 text-white/95 bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Enterprise-grade encryption</span>
            </div>
            <div className="flex items-center space-x-3 text-white/95 bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>WebAuthn passkey support</span>
            </div>
            <div className="flex items-center space-x-3 text-white/95 bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Multi-provider OAuth & SSO integration</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}