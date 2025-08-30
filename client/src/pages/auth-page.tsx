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
        {/* Left Panel - Creative Professional Design */}
        <div className="relative overflow-hidden flex items-center">
          {/* Sophisticated Multi-Layer Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/30 via-transparent to-indigo-900/20"></div>
          
          {/* Geometric Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-20 left-20 w-40 h-40 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 blur-3xl"></div>
            <div className="absolute bottom-32 right-16 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 blur-2xl"></div>
            <div className="absolute top-1/2 left-1/4 w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-blue-400 blur-xl"></div>
          </div>
          
          {/* Subtle Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          ></div>

          <div className="relative z-10 w-full max-w-lg mx-auto p-8 lg:p-12 text-white">
            {/* Premium Brand Header */}
            <div className="mb-12">
              {/* Sophisticated Logo */}
              <div className="flex items-center mb-8">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(6, 182, 212, 0.8))',
                    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <span className="text-xl font-bold text-white drop-shadow-lg">M</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 shadow-lg"></div>
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold" style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.02em'
                  }}>MyFoodMatrics</h1>
                  <p className="text-sm text-blue-200 font-medium">Professional Nutrition Intelligence</p>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-4 rounded-xl" style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))',
                    border: '1px solid rgba(34, 197, 94, 0.3)'
                  }}>
                    <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">USDA Certified Data</h3>
                    <p className="text-sm text-blue-200">Government-grade nutrition database</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 rounded-xl" style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2))',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}>
                    <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Medical-Grade Engine</h3>
                    <p className="text-sm text-blue-200">Clinical condition intelligence</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 rounded-xl" style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(147, 51, 234, 0.2))',
                    border: '1px solid rgba(168, 85, 247, 0.3)'
                  }}>
                    <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Real-Time Analysis</h3>
                    <p className="text-sm text-blue-200">Instant nutrition intelligence</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Comparison Card */}
            <div className="rounded-2xl p-6" style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}>
              <h3 className="text-lg font-bold text-white mb-6 text-center">Why Choose Professional Intelligence?</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-red-300 flex items-center">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                      Basic Apps
                    </h4>
                    <ul className="space-y-2 text-white/70 text-xs">
                      <li className="flex items-start">
                        <span className="text-red-400 mr-2">×</span>
                        Crowdsourced estimates
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-400 mr-2">×</span>
                        Single scores only
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-400 mr-2">×</span>
                        Generic advice
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-400 mr-2">×</span>
                        Hidden uncertainty
                      </li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-emerald-300 flex items-center">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                      MyFoodMatrics
                    </h4>
                    <ul className="space-y-2 text-white/90 text-xs">
                      <li className="flex items-start">
                        <span className="text-emerald-400 mr-2">✓</span>
                        USDA primary data
                      </li>
                      <li className="flex items-start">
                        <span className="text-emerald-400 mr-2">✓</span>
                        Score + drivers + sources
                      </li>
                      <li className="flex items-start">
                        <span className="text-emerald-400 mr-2">✓</span>
                        Condition-aware guidance
                      </li>
                      <li className="flex items-start">
                        <span className="text-emerald-400 mr-2">✓</span>
                        Confidence transparency
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Footer */}
            <div className="mt-8 text-center">
              <div className="flex justify-center items-center space-x-6 text-xs text-white/60">
                <span className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 0L15 5v5c0 5-5 10-5 10S0 15 0 10V5l5-5z"/>
                  </svg>
                  SOC 2 Certified
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z"/>
                  </svg>
                  256-bit Encryption
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  HIPAA Ready
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Ultra Premium Design */}
        <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
          {/* Sophisticated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-slate-100"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/40 via-transparent to-indigo-50/30"></div>
          
          {/* Floating geometric elements */}
          <div className="absolute top-20 right-20 w-32 h-32 rounded-full opacity-10" style={{
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            filter: 'blur(40px)'
          }}></div>
          <div className="absolute bottom-32 left-16 w-24 h-24 rounded-full opacity-10" style={{
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            filter: 'blur(30px)'
          }}></div>

          <div className="relative z-10 w-full max-w-md mx-auto p-8">
            {/* Ultra Premium Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6" style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(6, 182, 212, 0.1))',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <span className="text-2xl font-bold" style={{
                  background: 'linear-gradient(135deg, #1e40af, #0891b2)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>M</span>
              </div>
              
              <h1 className="text-3xl font-bold mb-3" style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.025em'
              }}>
                {activeTab === "signin" ? "Welcome Back" : "Join MyFoodMatrics"}
              </h1>
              <p className="text-slate-600 font-medium">
                {activeTab === "signin" ? "Access your nutrition dashboard" : "Start your professional nutrition journey"}
              </p>
            </div>

            {/* Ultra Premium Glass Card */}
            <div className="relative">
              {/* Card Background with Advanced Glass Effect */}
              <div className="absolute inset-0 rounded-2xl" style={{
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)',
                backdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: `
                  0 32px 64px rgba(0, 0, 0, 0.08),
                  0 16px 32px rgba(59, 130, 246, 0.12),
                  inset 0 1px 0 rgba(255, 255, 255, 0.9),
                  inset 0 -1px 0 rgba(255, 255, 255, 0.5)
                `
              }}></div>
              
              <Card className="relative z-10 border-0 bg-transparent shadow-none">
                <CardHeader className="space-y-8 p-8">
                  {/* Ultra Premium Tab Selector */}
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="p-1.5 rounded-xl" style={{
                      background: 'linear-gradient(135deg, rgba(241, 245, 249, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      backdropFilter: 'blur(8px)'
                    }}>
                      <TabsList className="grid w-full grid-cols-2 h-12 bg-transparent border-0 gap-1">
                        <TabsTrigger 
                          value="signin" 
                          className="text-sm font-semibold rounded-lg transition-all duration-300 ease-out"
                          style={{
                            color: activeTab === "signin" ? '#ffffff' : '#64748b',
                            background: activeTab === "signin" 
                              ? 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #2563eb 100%)' 
                              : 'transparent',
                            boxShadow: activeTab === "signin" 
                              ? '0 8px 16px rgba(37, 99, 235, 0.24), 0 4px 8px rgba(37, 99, 235, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
                              : 'none',
                            transform: activeTab === "signin" ? 'translateY(-1px)' : 'none'
                          }}
                        >
                          Sign In
                        </TabsTrigger>
                        <TabsTrigger 
                          value="signup" 
                          className="text-sm font-semibold rounded-lg transition-all duration-300 ease-out"
                          style={{
                            color: activeTab === "signup" ? '#ffffff' : '#64748b',
                            background: activeTab === "signup" 
                              ? 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #2563eb 100%)' 
                              : 'transparent',
                            boxShadow: activeTab === "signup" 
                              ? '0 8px 16px rgba(37, 99, 235, 0.24), 0 4px 8px rgba(37, 99, 235, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
                              : 'none',
                            transform: activeTab === "signup" ? 'translateY(-1px)' : 'none'
                          }}
                        >
                          Create Account
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Sign In Tab */}
                    <TabsContent value="signin" className="space-y-6 mt-8">
                      <div className="text-center">
                        <CardTitle className="text-xl font-bold text-slate-800 mb-2">Welcome Back</CardTitle>
                        <CardDescription className="text-slate-600 font-medium">
                          Access your nutrition dashboard
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
                          <Label htmlFor="signin-email" className="text-sm font-semibold text-slate-700">
                            Email Address
                          </Label>
                          <Input
                            id="signin-email"
                            type="email"
                            placeholder="Enter your email"
                            className="h-12 text-base border-0 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
                              backdropFilter: 'blur(8px)',
                              border: '1px solid rgba(226, 232, 240, 0.8)',
                              borderRadius: '10px',
                              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.04)',
                              color: '#334155'
                            }}
                            {...signInForm.register("email")}
                            data-testid="input-signin-email"
                          />
                          {signInForm.formState.errors.email && (
                            <p className="text-sm text-red-500">{signInForm.formState.errors.email.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signin-password" className="text-sm font-semibold text-slate-700">
                            Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="signin-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              className="h-12 text-base border-0 focus:ring-2 focus:ring-blue-500/30 pr-12 transition-all duration-300"
                              style={{
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(226, 232, 240, 0.8)',
                                borderRadius: '10px',
                                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.04)',
                                color: '#334155'
                              }}
                              {...signInForm.register("password")}
                              data-testid="input-signin-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors text-sm"
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
                          className="w-full h-12 text-base font-semibold border-0 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                          disabled={signInMutation.isPending}
                          data-testid="button-signin"
                          style={{
                            background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #2563eb 100%)',
                            color: 'white',
                            borderRadius: '10px',
                            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          {signInMutation.isPending ? "Signing In..." : "Sign In"}
                        </Button>
                      </form>
                    </TabsContent>

                    {/* Sign Up Tab */}
                    <TabsContent value="signup" className="space-y-6 mt-8">
                      <div className="text-center">
                        <CardTitle className="text-xl font-bold text-slate-800 mb-2">Join MyFoodMatrics</CardTitle>
                        <CardDescription className="text-slate-600 font-medium">
                          Create your professional account
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