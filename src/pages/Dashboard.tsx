import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrizeClaimBanner } from "@/components/PrizeClaimBanner";
import { PrizeClaimForm } from "@/components/PrizeClaimForm";
import { CoursesTab } from "@/components/CoursesTab";
import { PrizeClaimsTab } from "@/components/PrizeClaimsTab";
import { ShotsTab } from "@/components/ShotsTab";
import { LogOut, Settings as SettingsIcon, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import logo from "@/assets/logo.png";

const Dashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [courses, setCourses] = useState([]);
  const [prizeClaims, setPrizeClaims] = useState([]);
  const [shots, setShots] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

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
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    const { data: coursesData } = await supabase.from("courses").select("*");
    const { data: claimsData } = await supabase
      .from("prize_claims")
      .select("*")
      .eq("user_id", session?.user.id)
      .order("created_at", { ascending: false });
    const { data: shotsData } = await supabase
      .from("shots")
      .select("*")
      .eq("user_id", session?.user.id)
      .order("created_at", { ascending: false });

    setCourses(coursesData || []);
    setPrizeClaims(claimsData || []);
    setShots(shotsData || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
    navigate("/auth");
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Hole Out Golf Logo" className="w-10 h-10 object-contain" />
            <h1 className="text-2xl font-bold">Hole Out Golf</h1>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="ghost" onClick={() => navigate("/admin")}>
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
            <Button variant="ghost" onClick={() => navigate("/settings")}>
              <SettingsIcon className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <PrizeClaimBanner onOpenForm={() => setFormOpen(true)} />

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="shots">Shots</TabsTrigger>
            <TabsTrigger value="claims">Prize Claims</TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            <CoursesTab courses={courses} />
          </TabsContent>

          <TabsContent value="shots">
            <ShotsTab shots={shots} courses={courses} />
          </TabsContent>

          <TabsContent value="claims">
            <PrizeClaimsTab claims={prizeClaims} courses={courses} />
          </TabsContent>
        </Tabs>
      </main>

      <PrizeClaimForm
        open={formOpen}
        onOpenChange={setFormOpen}
        courses={courses}
        userId={session.user.id}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default Dashboard;
