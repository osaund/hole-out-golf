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
import { Trophy, DollarSign, ArrowLeft, Save, Calendar, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserDetailsModal from "@/components/UserDetailsModal";

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminCheck();
  const { toast } = useToast();
  const [claims, setClaims] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [prizeAmounts, setPrizeAmounts] = useState<{ [key: string]: string }>({});
  const [entryFees, setEntryFees] = useState<{ [key: string]: string }>({});
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>({});
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

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

    if (eventsData.error) {
      console.error("Error fetching events:", eventsData.error);
    } else {
      setEvents(eventsData.data || []);
      const fees: { [key: string]: string } = {};
      (eventsData.data || []).forEach((event) => {
        fees[event.id] = event.entry_fee?.toString() || "0";
      });
      setEntryFees(fees);
      
      // Select first event by default
      if (eventsData.data && eventsData.data.length > 0 && !selectedEventId) {
        setSelectedEventId(eventsData.data[0].id);
      }
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      fetchEventRegistrations(selectedEventId);
    }
  }, [selectedEventId]);

  const fetchEventRegistrations = async (eventId: string) => {
    const { data, error } = await supabase
      .from("event_registrations")
      .select("*, profiles(id, first_name, last_name, full_name, email, phone_number)")
      .eq("event_id", eventId)
      .order("registered_at", { ascending: false });

    if (error) {
      console.error("Error fetching registrations:", error);
    } else {
      setEventRegistrations(data || []);
    }
  };

  const handleEntryFeeUpdate = async (eventId: string) => {
    const fee = parseFloat(entryFees[eventId]);
    
    if (isNaN(fee) || fee < 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid entry fee",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("events")
      .update({ entry_fee: fee })
      .eq("id", eventId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Entry fee updated successfully",
      });
      fetchData();
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
            <TabsTrigger value="events">Events</TabsTrigger>
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
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Claim Date</TableHead>
                        <TableHead>Tee Time</TableHead>
                        <TableHead>Time of Hole in One</TableHead>
                        <TableHead>Shot Time Start</TableHead>
                        <TableHead>Prize</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claims.map((claim) => (
                        <TableRow key={claim.id}>
                          <TableCell className="font-medium">
                            <button
                              onClick={() => {
                                setSelectedUser(claim.profiles);
                                setIsUserModalOpen(true);
                              }}
                              className="text-primary hover:underline cursor-pointer text-left"
                            >
                              {claim.profiles?.email || "Unknown User"}
                            </button>
                          </TableCell>
                          <TableCell>{getCourseName(claim.course_id)}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(claim.claim_date), "PP")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {claim.tee_time || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {claim.time_of_hole_in_one || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {claim.shots?.created_at 
                              ? format(new Date(claim.shots.created_at), "PPp")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {claim.prize_amount ? `£${claim.prize_amount.toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={claim.status}
                              onValueChange={(value) => handleClaimAction(claim.id, value as "approved" | "rejected" | "pending")}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <Textarea
                              value={editingNotes[claim.id] || ""}
                              onChange={(e) => setEditingNotes({ ...editingNotes, [claim.id]: e.target.value })}
                              placeholder="Add notes..."
                              className="min-h-[60px] text-sm"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() => handleNotesUpdate(claim.id)}
                              variant="outline"
                              size="sm"
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
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

          <TabsContent value="events" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Event List */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Events
                  </CardTitle>
                  <CardDescription>Select an event to view registrations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedEventId === event.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedEventId(event.id)}
                    >
                      <div className="font-medium">{event.round} - {event.region}</div>
                      <div className="text-sm text-muted-foreground">{event.venue}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(event.date), "PP")}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={entryFees[event.id] || ""}
                          onChange={(e) => {
                            e.stopPropagation();
                            setEntryFees({ ...entryFees, [event.id]: e.target.value });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Entry fee"
                          className="h-8 text-sm"
                        />
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEntryFeeUpdate(event.id);
                          }}
                        >
                          Save
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Entry fee: £{event.entry_fee?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Registrations Table */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Registrations
                    {selectedEventId && (
                      <Badge variant="secondary">{eventRegistrations.length}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {selectedEventId
                      ? `Showing registrations for ${events.find(e => e.id === selectedEventId)?.round || "selected event"}`
                      : "Select an event to view registrations"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedEventId ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select an event to view registrations</p>
                    </div>
                  ) : eventRegistrations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No registrations for this event yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Registered At</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {eventRegistrations.map((reg) => (
                          <TableRow key={reg.id}>
                            <TableCell className="font-medium">
                              <button
                                onClick={() => {
                                  setSelectedUser(reg.profiles);
                                  setIsUserModalOpen(true);
                                }}
                                className="text-primary hover:underline cursor-pointer text-left"
                              >
                                {reg.profiles?.first_name} {reg.profiles?.last_name}
                              </button>
                            </TableCell>
                            <TableCell>{reg.profiles?.email || "-"}</TableCell>
                            <TableCell>{reg.profiles?.phone_number || "-"}</TableCell>
                            <TableCell>
                              {format(new Date(reg.registered_at), "PPp")}
                            </TableCell>
                            <TableCell>
                              <Badge variant={reg.attended ? "default" : "secondary"}>
                                {reg.attended ? "Attended" : "Registered"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <UserDetailsModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        user={selectedUser}
      />
    </div>
  );
}
