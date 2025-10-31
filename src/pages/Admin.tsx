import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trophy, DollarSign, CheckCircle, XCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminCheck();
  const { toast } = useToast();
  const [claims, setClaims] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [prizeAmounts, setPrizeAmounts] = useState<{ [key: string]: string }>({});
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>({});

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
    const [claimsData, coursesData] = await Promise.all([
      supabase.from("prize_claims").select("*, profiles(full_name)").order("created_at", { ascending: false }),
      supabase.from("courses").select("*").order("name"),
    ]);

    if (claimsData.error) {
      console.error("Error fetching claims:", claimsData.error);
      toast({
        title: "Error loading claims",
        description: claimsData.error.message,
        variant: "destructive",
      });
    } else {
      console.log("Claims fetched:", claimsData.data);
      setClaims(claimsData.data || []);
      const notes: { [key: string]: string } = {};
      (claimsData.data || []).forEach((claim) => {
        notes[claim.id] = claim.notes || "";
      });
      setEditingNotes(notes);
    }

    if (coursesData.error) {
      console.error("Error fetching courses:", coursesData.error);
    } else {
      setCourses(coursesData.data || []);
      const amounts: { [key: string]: string } = {};
      (coursesData.data || []).forEach((course) => {
        amounts[course.id] = course.prize_amount?.toString() || "0";
      });
      setPrizeAmounts(amounts);
    }
  };

  const handleClaimAction = async (claimId: string, status: "approved" | "rejected" | "pending") => {
    const { error } = await supabase
      .from("prize_claims")
      .update({ status })
      .eq("id", claimId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Claim ${status} successfully`,
      });
      fetchData();
    }
  };

  const handleNotesUpdate = async (claimId: string) => {
    const notes = editingNotes[claimId];
    
    const { error } = await supabase
      .from("prize_claims")
      .update({ notes })
      .eq("id", claimId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Notes updated successfully",
      });
      fetchData();
    }
  };

  const handlePrizeAmountUpdate = async (courseId: string) => {
    const amount = parseFloat(prizeAmounts[courseId]);
    
    if (isNaN(amount) || amount < 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid prize amount",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("courses")
      .update({ prize_amount: amount })
      .eq("id", courseId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Prize amount updated successfully",
      });
      fetchData();
    }
  };

  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.name : "Unknown Course";
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
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
        </div>

        <Tabs defaultValue="claims" className="space-y-6">
          <TabsList>
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
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-accent" />
                          {getCourseName(claim.course_id)} - Hole {claim.hole_number}
                        </CardTitle>
                        <CardDescription>
                          Claimed by: {claim.profiles?.full_name || "Unknown User"} on {format(new Date(claim.claim_date), "PPP")}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(claim.status)}>
                        {claim.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {claim.prize_amount && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Prize Amount:</span>
                          <span className="font-semibold text-accent">£{claim.prize_amount.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <Select
                          value={claim.status}
                          onValueChange={(value) => handleClaimAction(claim.id, value as "approved" | "rejected" | "pending")}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Admin Notes</label>
                        <Textarea
                          value={editingNotes[claim.id] || ""}
                          onChange={(e) => setEditingNotes({ ...editingNotes, [claim.id]: e.target.value })}
                          placeholder="Add notes about this claim..."
                          className="min-h-[80px]"
                        />
                        <Button
                          onClick={() => handleNotesUpdate(claim.id)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          Update Notes
                        </Button>
                      </div>
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
                  <CardDescription>{course.location || "No location set"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={prizeAmounts[course.id] || ""}
                      onChange={(e) =>
                        setPrizeAmounts({ ...prizeAmounts, [course.id]: e.target.value })
                      }
                      placeholder="Enter prize amount"
                      className="flex-1"
                    />
                    <Button onClick={() => handlePrizeAmountUpdate(course.id)}>
                      Update
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Current: £{course.prize_amount?.toFixed(2) || "0.00"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
