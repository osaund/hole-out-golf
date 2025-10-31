import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, CreditCard, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    if (!session) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (data) {
      setProfile(data);
      setFullName(data.full_name || "");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", session.user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      fetchProfile();
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

  const handleManageSubscription = async () => {
    toast({
      title: "Subscription Management",
      description: "Opening subscription portal...",
    });
    // This would typically redirect to Stripe Customer Portal
    // For now, it's a placeholder for the subscription management flow
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Account Information */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Account Information
            </CardTitle>
            <CardDescription>Manage your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{session.user.email}</span>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </form>

            <Separator className="my-4" />

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Member since: {new Date(session.user.created_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Management */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Subscription
            </CardTitle>
            <CardDescription>Manage your subscription and billing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Current Plan</h3>
                  <p className="text-sm text-muted-foreground">Free Trial</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-accent">£0</p>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>
              </div>
              
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  Unlimited shots at partner courses
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  Prize claim submissions
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  Shot history tracking
                </li>
              </ul>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleManageSubscription}
            >
              Upgrade to Premium
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Subscription powered by Stripe. Manage billing and payment methods.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
