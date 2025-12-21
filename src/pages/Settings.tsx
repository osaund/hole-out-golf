import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, UserCircle, Mail } from "lucide-react";

const Settings = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const navigate = useNavigate();

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
      </main>
    </div>
  );
};

export default Settings;
