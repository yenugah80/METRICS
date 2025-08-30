import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    alert("Single Sign-On integration coming soon! Please use email/password or Google authentication.");
  };

  const handlePasskeyAuth = async () => {
    try {
      if (!window.navigator.credentials) {
        alert("WebAuthn not supported on this device");
        return;
      }
      alert("Passkey authentication coming soon!");
    } catch (error: any) {
      alert(error.message || "Passkey authentication failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <h1 className="professional-heading text-3xl lg:text-4xl font-bold mb-4">
              {activeTab === "signin" ? "Welcome Back" : "Join MyFoodMatrics"}
            </h1>
            <p className="body-text text-lg">
              {activeTab === "signin" ? "Your nutrition dashboard" : "Start your nutrition intelligence journey"}
            </p>
          </div>

          <Card className="glow-card-hero border-0 shadow-xl">
            <CardHeader className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12">
                  <TabsTrigger value="signin" className="text-sm font-medium">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="text-sm font-medium">Create Account</TabsTrigger>
                </TabsList>

                {/* Sign In Tab */}
                <TabsContent value="signin" className="space-y-6 mt-8">
                  <div className="text-center">
                    <CardTitle className="professional-heading text-2xl font-bold">Welcome Back</CardTitle>
                    <CardDescription className="body-text text-base mt-2 font-medium">
                      Access your nutrition intelligence dashboard
                    </CardDescription>
                  </div>

                  {signInMutation.error && (
                    <Alert variant="destructive" className="border-danger bg-danger/5">
                      <AlertDescription className="text-sm">
                        {signInMutation.error.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-sm font-medium text-foreground">
                        Email Address
                      </Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your.email@example.com"
                        className="h-12 text-base border-2 border-border focus:border-primary"
                        {...signInForm.register("email")}
                        data-testid="input-signin-email"
                      />
                      {signInForm.formState.errors.email && (
                        <p className="text-sm text-danger">{signInForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-sm font-medium text-foreground">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="h-12 text-base border-2 border-border focus:border-primary pr-12"
                          {...signInForm.register("password")}
                          data-testid="input-signin-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      {signInForm.formState.errors.password && (
                        <p className="text-sm text-danger">{signInForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base font-bold btn-gradient"
                      disabled={signInMutation.isPending}
                      data-testid="button-signin"
                    >
                      {signInMutation.isPending ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>

                {/* Sign Up Tab */}
                <TabsContent value="signup" className="space-y-6 mt-8">
                  <div className="text-center">
                    <CardTitle className="professional-heading text-2xl font-bold">Create Your Account</CardTitle>
                    <CardDescription className="body-text text-base mt-2 font-medium">
                      Begin your professional nutrition journey
                    </CardDescription>
                  </div>

                  {signUpMutation.error && (
                    <Alert variant="destructive" className="border-danger bg-danger/5">
                      <AlertDescription className="text-sm">
                        {signUpMutation.error.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-firstName" className="text-sm font-medium text-foreground">
                          First Name
                        </Label>
                        <Input
                          id="signup-firstName"
                          placeholder="John"
                          className="h-12 text-base border-2 border-border focus:border-primary"
                          {...signUpForm.register("firstName")}
                          data-testid="input-signup-firstname"
                        />
                        {signUpForm.formState.errors.firstName && (
                          <p className="text-sm text-danger">{signUpForm.formState.errors.firstName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-lastName" className="text-sm font-medium text-foreground">
                          Last Name
                        </Label>
                        <Input
                          id="signup-lastName"
                          placeholder="Doe"
                          className="h-12 text-base border-2 border-border focus:border-primary"
                          {...signUpForm.register("lastName")}
                          data-testid="input-signup-lastname"
                        />
                        {signUpForm.formState.errors.lastName && (
                          <p className="text-sm text-danger">{signUpForm.formState.errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium text-foreground">
                        Email Address
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your.email@example.com"
                        className="h-12 text-base border-2 border-border focus:border-primary"
                        {...signUpForm.register("email")}
                        data-testid="input-signup-email"
                      />
                      {signUpForm.formState.errors.email && (
                        <p className="text-sm text-danger">{signUpForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium text-foreground">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a secure password"
                          className="h-12 text-base border-2 border-border focus:border-primary pr-12"
                          {...signUpForm.register("password")}
                          data-testid="input-signup-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      {signUpForm.formState.errors.password && (
                        <p className="text-sm text-danger">{signUpForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirmPassword" className="text-sm font-medium text-foreground">
                        Confirm Password
                      </Label>
                      <Input
                        id="signup-confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className="h-12 text-base border-2 border-border focus:border-primary"
                        {...signUpForm.register("confirmPassword")}
                        data-testid="input-signup-confirm-password"
                      />
                      {signUpForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-danger">{signUpForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base font-bold btn-gradient"
                      disabled={signUpMutation.isPending}
                      data-testid="button-signup"
                    >
                      {signUpMutation.isPending ? "Creating Account..." : "Create Professional Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardHeader>

            <CardContent className="space-y-6 pt-0">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-4 text-muted-foreground">Alternative Methods</span>
                </div>
              </div>

              {/* Alternative Authentication Methods */}
              <div className="space-y-3">
                <Button
                  onClick={handleGoogleAuth}
                  variant="outline"
                  className="w-full h-12 text-base font-semibold btn-outline-glow"
                  data-testid="button-google-auth"
                >
                  Continue with Google
                </Button>

                <Button
                  variant="outline"
                  onClick={handleSSOLogin}
                  className="w-full h-12 text-base font-semibold btn-outline-glow"
                  data-testid="button-sso-auth"
                >
                  Enterprise Single Sign-On
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Available Soon
                  </Badge>
                </Button>

                <Button
                  variant="outline"
                  onClick={handlePasskeyAuth}
                  className="w-full h-12 text-base font-semibold btn-outline-glow"
                  data-testid="button-passkey-auth"
                >
                  Biometric Authentication
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Available Soon
                  </Badge>
                </Button>
              </div>

              {/* Security Information */}
              <div className="pt-6 border-t border-border">
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Enterprise-grade security with end-to-end encryption
                  </p>
                  <div className="flex justify-center items-center space-x-6 text-xs text-muted-foreground">
                    <span>JWT Authentication</span>
                    <span>•</span>
                    <span>AES-256 Encryption</span>
                    <span>•</span>
                    <span>SOC 2 Compliant</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Panel - Professional Hero */}
      <div className="hidden lg:flex lg:flex-1 bg-muted/30 items-center justify-center p-12 relative">
        <div className="text-center max-w-lg">
          <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
            <span className="text-primary-foreground font-bold text-2xl">M</span>
          </div>
          
          <h2 className="professional-heading text-4xl font-bold mb-6 text-foreground">
            Professional Nutrition Intelligence
          </h2>
          
          <p className="body-text text-xl text-muted-foreground mb-12 leading-relaxed">
            Advanced artificial intelligence technology providing comprehensive nutritional analysis 
            and personalized health insights for professional and personal use.
          </p>
          
          <div className="space-y-6">
            <div className="bg-background border border-border rounded-lg p-4 text-left">
              <div className="font-medium text-foreground mb-2">Enterprise Security</div>
              <div className="text-sm text-muted-foreground">
                Multi-factor authentication with enterprise-grade encryption and compliance standards.
              </div>
            </div>
            
            <div className="bg-background border border-border rounded-lg p-4 text-left">
              <div className="font-medium text-foreground mb-2">AI-Powered Analysis</div>
              <div className="text-sm text-muted-foreground">
                Revolutionary computer vision and machine learning for precise nutritional assessment.
              </div>
            </div>
            
            <div className="bg-background border border-border rounded-lg p-4 text-left">
              <div className="font-medium text-foreground mb-2">Professional Dashboard</div>
              <div className="text-sm text-muted-foreground">
                Comprehensive analytics platform with detailed reporting and health trend analysis.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}