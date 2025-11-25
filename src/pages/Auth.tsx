import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/history");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate("/history");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Client-side validation helper
  const validateSignUp = (data: { name: string; email: string; password: string }) => {
    const trimmedName = data.name.trim();
    const trimmedEmail = data.email.trim();
    
    if (trimmedName.length < 2) {
      return { valid: false, error: "Name must be at least 2 characters" };
    }
    if (trimmedName.length > 100) {
      return { valid: false, error: "Name must be less than 100 characters" };
    }
    if (!trimmedEmail.includes('@')) {
      return { valid: false, error: "Invalid email address" };
    }
    if (trimmedEmail.length > 255) {
      return { valid: false, error: "Email must be less than 255 characters" };
    }
    if (data.password.length < 6) {
      return { valid: false, error: "Password must be at least 6 characters" };
    }
    if (data.password.length > 128) {
      return { valid: false, error: "Password must be less than 128 characters" };
    }
    
    return { valid: true, data: { name: trimmedName, email: trimmedEmail, password: data.password } };
  };

  const validateSignIn = (data: { email: string; password: string }) => {
    const trimmedEmail = data.email.trim();
    
    if (!trimmedEmail.includes('@')) {
      return { valid: false, error: "Invalid email address" };
    }
    if (trimmedEmail.length > 255) {
      return { valid: false, error: "Email must be less than 255 characters" };
    }
    if (data.password.length < 1) {
      return { valid: false, error: "Password is required" };
    }
    if (data.password.length > 128) {
      return { valid: false, error: "Password must be less than 128 characters" };
    }
    
    return { valid: true, data: { email: trimmedEmail, password: data.password } };
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs before submission
    const validation = validateSignUp({ name, email, password });
    
    if (!validation.valid) {
      toast({
        title: "Validation Error",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // SignupForm: Use Supabase client to register new client
      const { error } = await supabase.auth.signUp({
        email: validation.data!.email,
        password: validation.data!.password,
        options: {
          emailRedirectTo: `${window.location.origin}/history`,
          data: {
            full_name: validation.data!.name,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Please check your email to confirm your account.",
      });
      
      // Clear form
      setEmail("");
      setPassword("");
      setName("");
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs before submission
    const validation = validateSignIn({ email, password });
    
    if (!validation.valid) {
      toast({
        title: "Validation Error",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // LoginForm: Use Supabase client to authenticate the client
      const { error } = await supabase.auth.signInWithPassword({
        email: validation.data!.email,
        password: validation.data!.password,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "You've been signed in. Redirecting...",
      });
      
      // Redirection: After successful login, redirect to Transaction History page
      // Note: The useEffect with onAuthStateChange handles the actual redirect
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Client Portal</CardTitle>
          <CardDescription>Sign in to view your purchase history</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
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
                    maxLength={255}
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
                    maxLength={128}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
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
                    maxLength={255}
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
                    minLength={6}
                    maxLength={128}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign Up
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}