import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, UserCircle, CreditCard, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";

const Settings = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { subscribed, renewalDate, isCancelled, checkSubscription, loading: subscriptionLoading } = useSubscription();
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
    
    setFirstName(session.user.user_metadata?.first_name || "");
    setLastName(session.user.user_metadata?.last_name || "");
  };


  const handleManageSubscription = async () => {
    if (!subscribed) {
      // Redirect to create checkout
      try {
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (error) throw error;

        if (data?.url) {
          window.open(data.url, "_blank");
          // Check subscription after a delay to allow for checkout completion
          setTimeout(checkSubscription, 5000);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      // Open customer portal
      try {
        const { data, error } = await supabase.functions.invoke("customer-portal", {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (error) throw error;

        if (data?.url) {
          window.open(data.url, "_blank");
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    }
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
          <h1 className="text-3xl font-bold">Profile</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Account Information */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-primary" />
              Profile Information
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <div className="p-3 bg-muted rounded-lg">
                <span className="text-sm">{firstName || "Not set"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Last Name</Label>
              <div className="p-3 bg-muted rounded-lg">
                <span className="text-sm">{lastName || "Not set"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{session.user.email}</span>
              </div>
            </div>

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
            {subscriptionLoading ? (
              <div className="p-4 bg-muted/50 rounded-lg animate-pulse">
                <div className="h-20 bg-muted rounded"></div>
              </div>
            ) : (
              <>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">Current Plan</h3>
                      <p className="text-sm text-muted-foreground">
                        {subscribed ? "Monthly Subscription" : "Free Trial"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-accent">
                        {subscribed ? "£9.99" : "£0"}
                      </p>
                      <p className="text-sm text-muted-foreground">per month</p>
                    </div>
                  </div>
              
              <ul className="space-y-2 mb-4">
                {subscribed ? (
                  <>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
                      Unlimited shots at partner courses
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
                      Prize claim submissions
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
                      Shot history tracking
                    </li>
                    {renewalDate && (
                      <li className="flex items-center gap-2 text-sm mt-4 pt-3 border-t border-border">
                        <span className="font-medium">
                          {isCancelled ? "Access ends:" : "Next renewal:"}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(renewalDate).toLocaleDateString('en-GB', { 
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </li>
                    )}
                    {isCancelled && renewalDate && (
                      <li className="flex items-center gap-2 text-sm text-warning">
                        <span className="w-1.5 h-1.5 bg-warning rounded-full"></span>
                        Subscription cancelled - access continues until expiry
                      </li>
                    )}
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></span>
                      View courses only
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></span>
                      No shot logging
                    </li>
                  </>
                )}
              </ul>
            </div>

            <Button 
              variant={subscribed ? "outline" : "default"}
              className="w-full"
              onClick={handleManageSubscription}
            >
              {subscribed ? "Manage Subscription" : "Subscribe Now - £9.99/month"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Subscription powered by Stripe. Manage billing and payment methods.
            </p>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
