import { MapPin, Target, Trophy, Shield, UserCircle, LogOut, Mail, PartyPopper, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import logo from "@/assets/logo.png";

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin: boolean;
  onLogout: () => void;
  onOpenClaimForm: () => void;
}

const menuItems = [
  { id: "courses", title: "Courses", icon: MapPin },
  { id: "shots", title: "Shots", icon: Target },
];

export function DashboardSidebar({ activeTab, onTabChange, isAdmin, onLogout, onOpenClaimForm }: DashboardSidebarProps) {
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setOpenMobile(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpenMobile(false);
  };
  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Hole Out Golf Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg">Hole Out Golf</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeTab === item.id}
                    onClick={() => handleTabChange(item.id)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Prizes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    onOpenClaimForm();
                    setOpenMobile(false);
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <PartyPopper className="h-4 w-4" />
                  <span>Submit Claim</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === "claims"}
                  onClick={() => handleTabChange("claims")}
                >
                  <Trophy className="h-4 w-4" />
                  <span>My Claims</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => handleNavigate("/admin")}>
                    <Shield className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="mailto:info@holeoutgolf.co.uk" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>info@holeoutgolf.co.uk</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => handleNavigate("/settings")}>
              <UserCircle className="h-4 w-4" />
              <span>Profile</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => handleNavigate("/plan-and-billing")}>
              <CreditCard className="h-4 w-4" />
              <span>Plan & Billing</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
