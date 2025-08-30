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
    <div className="min-h-screen">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left Panel - Comparison */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-8 lg:p-12 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-8">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Professional Nutrition Intelligence</h2>
              
              {/* Comparison Table */}
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <h4 className="font-bold text-white/80 mb-3">Generic app</h4>
                    <ul className="space-y-2 text-white/70">
                      <li>• Crowdsourced or averaged nutrition</li>
                      <li>• Single number, no explanation</li>
                      <li>• One-dish or barcode only</li>
                      <li>• Generic tips ("eat less salt")</li>
                      <li>• Hides uncertainty</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-3">MyFoodMatrics</h4>
                    <ul className="space-y-2 text-white/90">
                      <li>• USDA primary + verified barcodes</li>
                      <li>• Drivers + sources on every score</li>
                      <li>• Mixed-plate + sauce intelligence</li>
                      <li>• Condition-aware, quantified tweaks</li>
                      <li>• Confidence ranges & user control</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Premium Auth Forms */}
        <div className="flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
          <div className="w-full max-w-lg">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold mb-4" style={{ 
                background: 'linear-gradient(135deg, hsl(220, 100%, 30%) 0%, hsl(200, 90%, 40%) 50%, hsl(180, 80%, 45%) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {activeTab === "signin" ? "Welcome Back" : "Join MyFoodMatrics"}
              </h1>
              <p className="text-lg" style={{ color: 'hsl(210, 40%, 50%)' }}>
                {activeTab === "signin" ? "Access your nutrition intelligence dashboard" : "Begin your professional nutrition journey"}
              </p>
            </div>

            {/* Premium Auth Card */}
            <div className="relative">
              {/* Background blur effect */}
              <div className="absolute inset-0 rounded-3xl" style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(200, 220, 255, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.9)'
              }}></div>
              
              <Card className="relative z-10 border-0 bg-transparent shadow-none">
                <CardHeader className="space-y-8 p-8">
                  {/* Premium Tab Selector */}
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="p-1 rounded-2xl" style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(240, 248, 255, 0.5) 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <TabsList className="grid w-full grid-cols-2 h-14 bg-transparent border-0 gap-1">
                        <TabsTrigger 
                          value="signin" 
                          className="text-sm font-semibold rounded-xl data-[state=active]:shadow-lg transition-all duration-300"
                          style={{
                            color: activeTab === "signin" ? 'white' : 'hsl(210, 60%, 40%)',
                            background: activeTab === "signin" 
                              ? 'linear-gradient(135deg, hsl(220, 100%, 60%) 0%, hsl(200, 90%, 65%) 100%)' 
                              : 'transparent',
                            boxShadow: activeTab === "signin" 
                              ? '0 4px 16px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)' 
                              : 'none'
                          }}
                        >
                          Sign In
                        </TabsTrigger>
                        <TabsTrigger 
                          value="signup" 
                          className="text-sm font-semibold rounded-xl data-[state=active]:shadow-lg transition-all duration-300"
                          style={{
                            color: activeTab === "signup" ? 'white' : 'hsl(210, 60%, 40%)',
                            background: activeTab === "signup" 
                              ? 'linear-gradient(135deg, hsl(220, 100%, 60%) 0%, hsl(200, 90%, 65%) 100%)' 
                              : 'transparent',
                            boxShadow: activeTab === "signup" 
                              ? '0 4px 16px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)' 
                              : 'none'
                          }}
                        >
                          Create Account
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Sign In Tab */}
                    <TabsContent value="signin" className="space-y-8 mt-8">
                      <div className="text-center">
                        <CardTitle className="text-2xl font-bold" style={{ color: 'hsl(220, 80%, 25%)' }}>Welcome Back</CardTitle>
                        <CardDescription className="text-base mt-3 font-medium" style={{ color: 'hsl(210, 50%, 45%)' }}>
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

                      <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-6">
                        <div className="space-y-3">
                          <Label htmlFor="signin-email" className="text-sm font-semibold" style={{ color: 'hsl(220, 60%, 30%)' }}>
                            Email Address
                          </Label>
                          <Input
                            id="signin-email"
                            type="email"
                            placeholder="your.email@example.com"
                            className="h-14 text-base border-0 focus:ring-2 transition-all duration-300"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255, 255, 255, 0.5)',
                              borderRadius: '12px',
                              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02), 0 4px 12px rgba(0, 0, 0, 0.08)',
                              color: 'hsl(220, 60%, 30%)'
                            }}
                            {...signInForm.register("email")}
                            data-testid="input-signin-email"
                          />
                          {signInForm.formState.errors.email && (
                            <p className="text-sm text-red-500">{signInForm.formState.errors.email.message}</p>
                          )}
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="signin-password" className="text-sm font-semibold" style={{ color: 'hsl(220, 60%, 30%)' }}>
                            Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="signin-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              className="h-14 text-base border-0 focus:ring-2 pr-12 transition-all duration-300"
                              style={{
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.5)',
                                borderRadius: '12px',
                                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02), 0 4px 12px rgba(0, 0, 0, 0.08)',
                                color: 'hsl(220, 60%, 30%)'
                              }}
                              {...signInForm.register("password")}
                              data-testid="input-signin-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              {showPassword ? "Hide" : "Show"}
                            </button>
                          </div>
                          {signInForm.formState.errors.password && (
                            <p className="text-sm text-red-500">{signInForm.formState.errors.password.message}</p>
                          )}
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full h-14 text-base font-bold border-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                          disabled={signInMutation.isPending}
                          data-testid="button-signin"
                          style={{
                            background: 'linear-gradient(135deg, hsl(220, 100%, 60%) 0%, hsl(200, 90%, 65%) 50%, hsl(180, 80%, 70%) 100%)',
                            color: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px hsla(200, 90%, 60%, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          {signInMutation.isPending ? "Signing In..." : "Sign In"}
                        </Button>
                      </form>
                    </TabsContent>

                    {/* Sign Up Tab - Same styling */}
                    <TabsContent value="signup" className="space-y-8 mt-8">
                      <div className="text-center">
                        <CardTitle className="text-2xl font-bold" style={{ color: 'hsl(220, 80%, 25%)' }}>Create Your Account</CardTitle>
                        <CardDescription className="text-base mt-3 font-medium" style={{ color: 'hsl(210, 50%, 45%)' }}>
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

                      <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <Label htmlFor="signup-firstName" className="text-sm font-semibold" style={{ color: 'hsl(220, 60%, 30%)' }}>
                              First Name
                            </Label>
                            <Input
                              id="signup-firstName"
                              placeholder="John"
                              className="h-14 text-base border-0 focus:ring-2 transition-all duration-300"
                              style={{
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.5)',
                                borderRadius: '12px',
                                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02), 0 4px 12px rgba(0, 0, 0, 0.08)',
                                color: 'hsl(220, 60%, 30%)'
                              }}
                              {...signUpForm.register("firstName")}
                              data-testid="input-signup-firstname"
                            />
                            {signUpForm.formState.errors.firstName && (
                              <p className="text-sm text-red-500">{signUpForm.formState.errors.firstName.message}</p>
                            )}
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="signup-lastName" className="text-sm font-semibold" style={{ color: 'hsl(220, 60%, 30%)' }}>
                              Last Name
                            </Label>
                            <Input
                              id="signup-lastName"
                              placeholder="Doe"
                              className="h-14 text-base border-0 focus:ring-2 transition-all duration-300"
                              style={{
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.5)',
                                borderRadius: '12px',
                                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02), 0 4px 12px rgba(0, 0, 0, 0.08)',
                                color: 'hsl(220, 60%, 30%)'
                              }}
                              {...signUpForm.register("lastName")}
                              data-testid="input-signup-lastname"
                            />
                            {signUpForm.formState.errors.lastName && (
                              <p className="text-sm text-red-500">{signUpForm.formState.errors.lastName.message}</p>
                            )}
                          </div>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full h-14 text-base font-bold border-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                          disabled={signUpMutation.isPending}
                          data-testid="button-signup"
                          style={{
                            background: 'linear-gradient(135deg, hsl(220, 100%, 60%) 0%, hsl(200, 90%, 65%) 50%, hsl(180, 80%, 70%) 100%)',
                            color: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px hsla(200, 90%, 60%, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          {signUpMutation.isPending ? "Creating Account..." : "Create Professional Account"}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardHeader>

                <CardContent className="space-y-6 p-8 pt-0">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full opacity-30" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="px-3 text-gray-500 font-medium" style={{ background: 'rgba(255, 255, 255, 0.8)' }}>Alternative Methods</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button
                      onClick={handleGoogleAuth}
                      variant="outline"
                      className="w-full h-12 text-base font-semibold border-0 transition-all duration-300 hover:scale-[1.02]"
                      data-testid="button-google-auth"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.7) 100%)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.6)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                        color: 'hsl(220, 60%, 30%)'
                      }}
                    >
                      Continue with Google
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleSSOLogin}
                      className="w-full h-12 text-base font-semibold border-0 transition-all duration-300"
                      data-testid="button-sso-auth"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(248, 250, 252, 0.4) 100%)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                        color: 'hsl(220, 40%, 50%)'
                      }}
                    >
                      Enterprise Single Sign-On
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Available Soon
                      </Badge>
                    </Button>
                  </div>

                  {/* Security Information */}
                  <div className="pt-6 border-t border-gray-200/50">
                    <div className="text-center space-y-3">
                      <p className="text-sm" style={{ color: 'hsl(210, 40%, 50%)' }}>
                        Enterprise-grade security with end-to-end encryption
                      </p>
                      <div className="flex justify-center items-center space-x-6 text-xs" style={{ color: 'hsl(210, 40%, 45%)' }}>
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
        </div>
      </div>
    </div>
  );
}