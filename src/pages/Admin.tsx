import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Trophy, DollarSign, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [claims, setClaims] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/");
      return;
    }

    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, roleLoading, navigate]);

  const fetchData = async () => {
    try {
      const [claimsRes, coursesRes] = await Promise.all([
        supabase
          .from("prize_claims")
          .select("*, profiles(full_name)")
          .order("created_at", { ascending: false }),
        supabase.from("courses").select("*").order("name"),
      ]);

      if (claimsRes.error) throw claimsRes.error;
      if (coursesRes.error) throw coursesRes.error;

      setClaims(claimsRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateClaimStatus = async (claimId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("prize_claims")
        .update({ status })
        .eq("id", claimId);

      if (error) throw error;

      toast({
        title: "Claim updated",
        description: `Prize claim ${status} successfully.`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error updating claim",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updatePrizeAmount = async (courseId: string, amount: number) => {
    try {
      const { error } = await supabase
        .from("courses")
        .update({ prize_amount: amount })
        .eq("id", courseId);

      if (error) throw error;

      toast({
        title: "Prize amount updated",
        description: "Course prize pot updated successfully.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error updating prize amount",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-success text-success-foreground";
      case "rejected":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.name : "Unknown Course";
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage prize claims and prize pots</p>
          </div>
        </div>

        <Tabs defaultValue="claims" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="claims">Prize Claims</TabsTrigger>
            <TabsTrigger value="prizes">Prize Pots</TabsTrigger>
          </TabsList>

          <TabsContent value="claims" className="space-y-4">
            {claims.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No prize claims yet</p>
                </CardContent>
              </Card>
            ) : (
              claims.map((claim) => (
                <Card key={claim.id} className="shadow-soft">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-accent" />
                          {getCourseName(claim.course_id)} - Hole {claim.hole_number}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Player: {claim.profiles?.full_name || "Unknown"}
                          <br />
                          Claimed: {format(new Date(claim.claim_date), "PPP")}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(claim.status)}>
                        {claim.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {claim.prize_amount && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Prize Amount:</span>
                          <span className="font-semibold text-accent">
                            £{claim.prize_amount.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {claim.notes && (
                        <div className="pt-3 border-t">
                          <p className="text-sm text-muted-foreground">{claim.notes}</p>
                        </div>
                      )}
                      {claim.status === "pending" && (
                        <div className="flex gap-2 pt-3 border-t">
                          <Button
                            size="sm"
                            onClick={() => updateClaimStatus(claim.id, "approved")}
                            className="flex-1"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateClaimStatus(claim.id, "rejected")}
                            className="flex-1"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="prizes" className="space-y-4">
            {courses.map((course) => (
              <Card key={course.id} className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-accent" />
                    {course.name}
                  </CardTitle>
                  <CardDescription>{course.location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <Label htmlFor={`prize-${course.id}`}>Prize Pot (£)</Label>
                        <Input
                          id={`prize-${course.id}`}
                          type="number"
                          step="0.01"
                          defaultValue={course.prize_amount || 0}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value) && value !== course.prize_amount) {
                              updatePrizeAmount(course.id, value);
                            }
                          }}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Current: £{(course.prize_amount || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
