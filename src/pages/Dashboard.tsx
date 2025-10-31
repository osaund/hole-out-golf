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

  useEffect(() => {
    if (!session) return;

    // Set up realtime subscription for shots
    const shotsChannel = supabase
      .channel('shots-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shots',
          filter: `user_id=eq.${session.user.id}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(shotsChannel);
    };
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
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img src={logo} alt="Hole Out Golf Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0" />
            <h1 className="text-lg sm:text-2xl font-bold truncate">Hole Out Golf</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="hidden sm:flex">
                <Shield className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="sm:hidden">
                <Shield className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate("/settings")} className="hidden sm:flex">
              <SettingsIcon className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/settings")} className="sm:hidden">
              <SettingsIcon className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="hidden sm:flex">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="sm:hidden">
              <LogOut className="w-4 h-4" />
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
