import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionContextType {
  session: Session | null;
  user: User | null;
  subscribed: boolean;
  loading: boolean;
  renewalDate: string | null;
  isCancelled: boolean;
  hasSinglePlayCredit: boolean;
  checkSubscription: () => Promise<void>;
  checkSinglePlayCredits: () => Promise<void>;
  useSinglePlayCredit: (courseId: string) => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  session: null,
  user: null,
  subscribed: false,
  loading: true,
  renewalDate: null,
  isCancelled: false,
  hasSinglePlayCredit: false,
  checkSubscription: async () => {},
  checkSinglePlayCredits: async () => {},
  useSinglePlayCredit: async () => false,
});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [renewalDate, setRenewalDate] = useState<string | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasSinglePlayCredit, setHasSinglePlayCredit] = useState(false);

  const checkSinglePlayCredits = async () => {
    if (!user) {
      setHasSinglePlayCredit(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check for unused credits that haven't been used today
      const { data: credits, error } = await supabase
        .from("single_play_credits")
        .select("id, used_at")
        .eq("user_id", user.id)
        .is("used_at", null);

      if (error) throw error;
      
      setHasSinglePlayCredit((credits?.length || 0) > 0);
    } catch (error) {
      console.error("Error checking single play credits:", error);
      setHasSinglePlayCredit(false);
    }
  };

  const useSinglePlayCredit = async (courseId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Find an unused credit
      const { data: credits, error: fetchError } = await supabase
        .from("single_play_credits")
        .select("id")
        .eq("user_id", user.id)
        .is("used_at", null)
        .limit(1);

      if (fetchError || !credits || credits.length === 0) {
        return false;
      }

      // Mark the credit as used
      const { error: updateError } = await supabase
        .from("single_play_credits")
        .update({ 
          used_at: new Date().toISOString(),
          course_id: courseId
        })
        .eq("id", credits[0].id);

      if (updateError) throw updateError;

      // Refresh credits
      await checkSinglePlayCredits();
      return true;
    } catch (error) {
      console.error("Error using single play credit:", error);
      return false;
    }
  };

  const checkSubscription = async () => {
    if (!session || !user) {
      setSubscribed(false);
      setLoading(false);
      return;
    }

    // Skip subscription check for unverified users
    if (user.email_confirmed_at === null || user.email_confirmed_at === undefined) {
      console.log("Skipping subscription check for unverified user");
      setSubscribed(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      setSubscribed(data?.subscribed || false);
      setRenewalDate(data?.subscription_end || null);
      setIsCancelled(data?.is_cancelled || false);
    } catch (error) {
      console.error("Error checking subscription:", error);
      setSubscribed(false);
      setRenewalDate(null);
      setIsCancelled(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      checkSubscription();
      checkSinglePlayCredits();
      
      // Check subscription status every minute
      const interval = setInterval(() => {
        checkSubscription();
        checkSinglePlayCredits();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Check for single play success from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const singlePlaySuccess = urlParams.get('single_play_success');
    const sessionId = urlParams.get('session_id');
    
    if (singlePlaySuccess === 'true' && session) {
      // Verify and record the payment
      const verifyPayment = async () => {
        try {
          await supabase.functions.invoke("verify-single-play", {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            body: { session_id: sessionId },
          });
          
          // Refresh credits
          await checkSinglePlayCredits();
          
          // Clear URL params
          window.history.replaceState({}, '', window.location.pathname);
        } catch (error) {
          console.error("Error verifying single play:", error);
        }
      };
      
      verifyPayment();
    }
  }, [session]);

  return (
    <SubscriptionContext.Provider
      value={{
        session,
        user,
        subscribed,
        loading,
        renewalDate,
        isCancelled,
        hasSinglePlayCredit,
        checkSubscription,
        checkSinglePlayCredits,
        useSinglePlayCredit,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
