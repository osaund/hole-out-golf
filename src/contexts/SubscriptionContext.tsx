import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionContextType {
  session: Session | null;
  user: User | null;
  subscribed: boolean;
  loading: boolean;
  renewalDate: string | null;
  checkSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  session: null,
  user: null,
  subscribed: false,
  loading: true,
  renewalDate: null,
  checkSubscription: async () => {},
});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [renewalDate, setRenewalDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error("Error checking subscription:", error);
      setSubscribed(false);
      setRenewalDate(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Don't set loading to false here - wait for subscription check
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Don't set loading to false here - wait for subscription check
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      checkSubscription();
      
      // Check subscription status every minute
      const interval = setInterval(checkSubscription, 60000);
      return () => clearInterval(interval);
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
        checkSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
