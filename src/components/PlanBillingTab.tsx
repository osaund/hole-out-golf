import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface PlanBillingTabProps {
  session: Session;
}

export function PlanBillingTab({ session }: PlanBillingTabProps) {
  const { subscribed, renewalDate, isCancelled, loading: subscriptionLoading } = useSubscription();
  const { toast } = useToast();

  const handleManageSubscription = async () => {
    if (!subscribed) {
      try {
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (error) throw error;

        if (data?.url) {
          window.location.href = data.url;
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      try {
        const { data, error } = await supabase.functions.invoke("customer-portal", {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (error) throw error;

        if (data?.url) {
          window.location.href = data.url;
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

  return (
    <div className="max-w-2xl mx-auto">
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
                disabled
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
    </div>
  );
}
