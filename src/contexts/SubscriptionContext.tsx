import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionContextType {
  session: Session | null;
  user: User | null;
  subscribed: boolean;
  loading: boolean;
  checkSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  session: null,
  user: null,
  subscribed: false,
  loading: true,
  checkSubscription: async () => {},
});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!session) {
      setSubscribed(false);
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
    } catch (error) {
      console.error("Error checking subscription:", error);
      setSubscribed(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
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
        checkSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
