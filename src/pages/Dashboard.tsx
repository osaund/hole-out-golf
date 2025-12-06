import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { UserCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { PrizeClaimBanner } from "@/components/PrizeClaimBanner";
import { PrizeClaimForm } from "@/components/PrizeClaimForm";
import { CoursesTab } from "@/components/CoursesTab";
import { PrizeClaimsTab } from "@/components/PrizeClaimsTab";
import { ShotsTab } from "@/components/ShotsTab";
import { EventsTab } from "@/components/EventsTab";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

const Dashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [courses, setCourses] = useState([]);
  const [prizeClaims, setPrizeClaims] = useState([]);
  const [shots, setShots] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  
  // Default to events tab
  const [activeTab, setActiveTab] = useState("events");

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

  const renderContent = () => {
    switch (activeTab) {
      case "courses":
        return <CoursesTab courses={courses} />;
      case "events":
        return <EventsTab />;
      case "shots":
        return <ShotsTab shots={shots} courses={courses} />;
      case "claims":
        return <PrizeClaimsTab claims={prizeClaims} courses={courses} onOpenForm={() => setFormOpen(true)} />;
      default:
        return <CoursesTab courses={courses} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isAdmin={isAdmin}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 border-b bg-card shadow-soft p-4 flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="Hole Out Golf Logo" className="w-8 h-8 object-contain" />
              <div>
                <p className="font-bold text-sm leading-tight">Hole Out Golf</p>
                <p className="text-[11px] text-muted-foreground capitalize leading-tight">{activeTab}</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
                <UserCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </header>

          <div className="flex-1 p-4 md:p-8 overflow-auto">
            {renderContent()}
          </div>
        </main>

        <PrizeClaimForm
          open={formOpen}
          onOpenChange={setFormOpen}
          courses={courses}
          userId={session.user.id}
          onSuccess={fetchData}
        />
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
