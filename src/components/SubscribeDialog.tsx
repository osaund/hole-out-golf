import { useState } from "react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Calendar, Loader2 } from "lucide-react";

interface SubscribeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SubscribeDialog = ({ open, onOpenChange }: SubscribeDialogProps) => {
  const { toast } = useToast();
  const [loadingOption, setLoadingOption] = useState<"single" | "subscribe" | null>(null);

  const handleCheckout = async (type: "single" | "subscribe") => {
    setLoadingOption(type);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Not authenticated",
          description: "Please log in to continue",
          variant: "destructive",
        });
        return;
      }

      const functionName = type === "single" ? "create-single-play-checkout" : "create-checkout";
      const { data, error } = await supabase.functions.invoke(functionName, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Use location.href for better mobile compatibility
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingOption(null);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Choose How to Play</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-2">
              <p className="text-muted-foreground">Select an option to play at our partner courses and compete for prizes.</p>
              
              {/* Single Play Option */}
              <button
                onClick={() => handleCheckout("single")}
                disabled={loadingOption !== null}
                className="w-full p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-left group disabled:opacity-50"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">Play Once</p>
                      <p className="font-bold text-primary">£3.00</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Single shot at any course</p>
                  </div>
                  {loadingOption === "single" && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                </div>
              </button>

              {/* Subscribe Option */}
              <button
                onClick={() => handleCheckout("subscribe")}
                disabled={loadingOption !== null}
                className="w-full p-4 rounded-lg border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-colors text-left group disabled:opacity-50"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary text-primary-foreground">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">Subscribe</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">Best Value</span>
                      </div>
                      <p className="font-bold text-primary">£9.99<span className="text-sm font-normal">/mo</span></p>
                    </div>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>✓ Unlimited shots at all courses</li>
                      <li>✓ Enter all prize draws</li>
                      <li>✓ Track your shot history</li>
                    </ul>
                  </div>
                  {loadingOption === "subscribe" && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                </div>
              </button>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loadingOption !== null}>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
