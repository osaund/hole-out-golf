import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trophy, DollarSign, ArrowLeft, Calendar } from "lucide-react";
import UserDetailsModal from "@/components/UserDetailsModal";
import AdminPrizeClaims from "@/components/admin/AdminPrizeClaims";
import AdminEvents from "@/components/admin/AdminEvents";
import AdminPrizePots from "@/components/admin/AdminPrizePots";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type AdminSection = "claims" | "events" | "prizes";

const menuItems = [
  { id: "claims" as AdminSection, title: "Prize Claims", icon: Trophy },
  { id: "events" as AdminSection, title: "Events", icon: Calendar },
  { id: "prizes" as AdminSection, title: "Prize Pots", icon: DollarSign },
];

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminCheck();
  const { toast } = useToast();
  const [claims, setClaims] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>("claims");

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    const [claimsData, coursesData, eventsData] = await Promise.all([
      supabase.from("prize_claims").select("*, profiles(id, first_name, last_name, full_name, email, phone_number, created_at), shots:shot_id(created_at)").order("created_at", { ascending: false }),
      supabase.from("courses").select("*").order("name"),
      supabase.from("events").select("*").order("date", { ascending: true }),
    ]);

    if (claimsData.error) {
      console.error("Error fetching claims:", claimsData.error);
      toast({
        title: "Error loading claims",
        description: claimsData.error.message,
        variant: "destructive",
      });
    } else {
      setClaims(claimsData.data || []);
    }

    if (coursesData.error) {
      console.error("Error fetching courses:", coursesData.error);
    } else {
      setCourses(coursesData.data || []);
    }

    if (eventsData.error) {
      console.error("Error fetching events:", eventsData.error);
    } else {
      setEvents(eventsData.data || []);
    }
  };

  const handleUserClick = (user: any) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-muted/20 to-background">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveSection(item.id)}
                        isActive={activeSection === item.id}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <SidebarTrigger />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage prize claims and course settings</p>
              </div>
            </div>

            {activeSection === "claims" && (
              <AdminPrizeClaims
                claims={claims}
                courses={courses}
                onDataChange={fetchData}
                onUserClick={handleUserClick}
              />
            )}

            {activeSection === "events" && (
              <AdminEvents
                events={events}
                onDataChange={fetchData}
                onUserClick={handleUserClick}
              />
            )}

            {activeSection === "prizes" && (
              <AdminPrizePots
                courses={courses}
                onDataChange={fetchData}
              />
            )}
          </div>
        </main>
      </div>
      
      <UserDetailsModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        user={selectedUser}
      />
    </SidebarProvider>
  );
}
