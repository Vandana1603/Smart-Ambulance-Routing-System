import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Ambulance, Home } from "lucide-react";
import { z } from "zod";

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(20, "Phone number must be less than 20 digits"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72, "Password must be less than 72 characters"),
  role: z.enum(["patient", "driver", "dispatcher"] as const),
});

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [signupRole, setSignupRole] = useState<"patient" | "driver" | "dispatcher">("patient");

  const getPrimaryRole = (roles: string[]): string | null => {
    const rolePriority = ["admin", "dispatcher", "driver", "patient"];
    for (const priority of rolePriority) {
      if (roles.includes(priority)) return priority;
    }
    return roles.length > 0 ? roles[0] : null;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkUserRoleAndNavigate(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        checkUserRoleAndNavigate(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUserRoleAndNavigate = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user roles:", error);
    }

    const roles = (data ?? []).map((r: any) => r.role as string);
    const primary = getPrimaryRole(roles);
    if (primary) {
      navigateByRole(primary);
    } else {
      navigate("/dashboard/patient");
    }
  };

  const navigateByRole = (userRole: string) => {
    switch (userRole) {
      case "driver":
        navigate("/dashboard/driver");
        break;
      case "dispatcher":
        navigate("/dashboard/dispatcher");
        break;
      case "admin":
        navigate("/dashboard/admin");
        break;
      case "patient":
      default:
        navigate("/dashboard/patient");
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!authData.user) throw new Error("No user data returned");

      // Get user role from database
      const { data: userRoleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .single();

      if (roleError) {
        console.error("Error fetching user role:", roleError);
      }

      toast({
        title: "Welcome back!",
        description: `Signed in successfully`,
      });
      
      // Navigate based on actual role from database
      if (userRoleData?.role) {
        navigateByRole(userRoleData.role);
      } else {
        // Default to patient if no role found
        navigate("/dashboard/patient");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input data
      const validationResult = signUpSchema.safeParse({
        fullName,
        phone,
        email,
        password,
        role: signupRole,
      });

      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(err => err.message).join(", ");
        throw new Error(errors);
      }

      const { data, error } = await supabase.auth.signUp({
        email: validationResult.data.email,
        password: validationResult.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: validationResult.data.fullName,
            phone_number: validationResult.data.phone,
            role: validationResult.data.role,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Insert role directly to ensure it exists
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: data.user.id,
            role: validationResult.data.role,
          });

        if (roleError) {
          console.error("Error inserting role:", roleError);
        }
      }

      toast({
        title: "Success!",
        description: "Account created. Please check your email to verify.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Button
        variant="ghost"
        className="absolute top-4 left-4 gap-2"
        onClick={() => navigate("/")}
      >
        <Home className="h-4 w-4" />
        Back to Home
      </Button>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Ambulance className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">SwiftAid</CardTitle>
          <CardDescription>Smart Ambulance Routing System</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-role">I am registering as</Label>
                  <Select value={signupRole} onValueChange={(value: any) => setSignupRole(value)}>
                    <SelectTrigger id="signup-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Patient / Customer</SelectItem>
                      <SelectItem value="driver">Ambulance Driver</SelectItem>
                      <SelectItem value="dispatcher">Dispatcher</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select your role. Admin accounts must be created by existing administrators.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          <p>By signing up, you agree to our Terms of Service</p>
        </CardFooter>
      </Card>
    </div>
  );
}
