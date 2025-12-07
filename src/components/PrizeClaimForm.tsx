import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MapPin, Calendar as CalendarEventIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PrizeClaimFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: any[];
  userId: string;
  onSuccess: () => void;
}

export const PrizeClaimForm = ({ open, onOpenChange, courses, userId, onSuccess }: PrizeClaimFormProps) => {
  const [claimType, setClaimType] = useState<"course" | "event">("course");
  const [courseId, setCourseId] = useState("");
  const [eventId, setEventId] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedShotId, setSelectedShotId] = useState("");
  const [claimDate, setClaimDate] = useState<Date>();
  const [timeOfHoleInOne, setTimeOfHoleInOne] = useState("");
  const [teeTime, setTeeTime] = useState("");
  const [recentShots, setRecentShots] = useState<any[]>([]);
  const { toast } = useToast();
  const { subscribed } = useSubscription();

  useEffect(() => {
    if (open) {
      fetchEvents();
      if (subscribed) {
        fetchRecentShots();
      }
    }
  }, [open, subscribed]);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("enabled", true)
      .order("date", { ascending: false });
    
    setEvents(data || []);
  };

  const fetchRecentShots = async () => {
    const { data } = await supabase
      .from("shots")
      .select("*, courses(name, location)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);
    
    setRecentShots(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalCourseId = claimType === "course" ? courseId : null;
      let finalEventId = claimType === "event" ? eventId : null;
      let finalDate = claimDate;

      // If subscribed and a shot is selected, use that shot's details
      if (subscribed && selectedShotId && claimType === "course") {
        const selectedShot = recentShots.find(s => s.id === selectedShotId);
        if (selectedShot) {
          finalCourseId = selectedShot.course_id;
          finalDate = new Date(selectedShot.created_at);
        }
      }

      if (claimType === "course" && !finalCourseId) {
        throw new Error("Please select a course");
      }
      if (claimType === "event" && !finalEventId) {
        throw new Error("Please select an event");
      }
      if (!finalDate) {
        throw new Error("Please select a date");
      }

      // Check if user has already submitted a claim today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingClaims } = await supabase
        .from("prize_claims")
        .select("id")
        .eq("user_id", userId)
        .gte("claim_date", `${today}T00:00:00`)
        .lt("claim_date", `${today}T23:59:59`);

      if (existingClaims && existingClaims.length > 0) {
        toast({
          title: "Already Submitted Today",
          description: "You can only submit one prize claim per day. Try again tomorrow!",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Get prize amount based on type
      let prizeAmount = null;
      let locationName = "";
      if (claimType === "course" && finalCourseId) {
        const selectedCourse = courses.find(c => c.id === finalCourseId);
        prizeAmount = selectedCourse?.prize_amount || null;
        locationName = selectedCourse?.name || "";
      } else if (claimType === "event" && finalEventId) {
        const selectedEvent = events.find(e => e.id === finalEventId);
        prizeAmount = selectedEvent?.nearest_pin_prize || null;
        locationName = `${selectedEvent?.venue} - ${selectedEvent?.round}` || "";
      }

      // Get user profile for email
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("prize_claims").insert({
        user_id: userId,
        course_id: finalCourseId,
        event_id: finalEventId,
        notes,
        status: "pending",
        claim_date: finalDate.toISOString(),
        shot_id: subscribed && claimType === "course" ? selectedShotId : null,
        prize_amount: prizeAmount,
        time_of_hole_in_one: timeOfHoleInOne || null,
        tee_time: teeTime || null,
      });

      if (error) throw error;

      // Send email notification
      try {
        await supabase.functions.invoke('send-prize-claim-email', {
          body: {
            courseName: locationName,
            userEmail: user?.email,
            userName: profile?.full_name || user?.email,
            teeTime: timeOfHoleInOne,
            notes: notes,
            claimDate: finalDate.toISOString(),
          }
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }

      toast({
        title: "Claim Submitted!",
        description: "Your prize claim has been submitted for review.",
      });

      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (error: any) {
      const errorMessage = error.message.includes("unique_prize_claim_per_day")
        ? "You can only submit one prize claim per day. Try again tomorrow!"
        : error.message;
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setClaimType("course");
    setCourseId("");
    setEventId("");
    setNotes("");
    setSelectedShotId("");
    setClaimDate(undefined);
    setTimeOfHoleInOne("");
    setTeeTime("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit Prize Claim</DialogTitle>
          <DialogDescription>
            Fill in the details of your hole-in-one to claim your prize.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Claim Type</Label>
            <RadioGroup 
              value={claimType} 
              onValueChange={(value) => setClaimType(value as "course" | "event")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="course" id="course-type" />
                <Label htmlFor="course-type" className="flex items-center gap-1.5 cursor-pointer">
                  <MapPin className="h-4 w-4" />
                  Course
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="event" id="event-type" />
                <Label htmlFor="event-type" className="flex items-center gap-1.5 cursor-pointer">
                  <CalendarEventIcon className="h-4 w-4" />
                  Event
                </Label>
              </div>
            </RadioGroup>
          </div>

          {claimType === "course" && (
            <div className="space-y-2">
              <Label htmlFor="course">Golf Course</Label>
              <Select value={courseId} onValueChange={setCourseId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.filter(course => !course.coming_soon).map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name} - {course.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {claimType === "event" && (
            <div className="space-y-2">
              <Label htmlFor="event">Event</Label>
              <Select value={eventId} onValueChange={setEventId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.venue} - {event.round} ({format(new Date(event.date), "PP")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {subscribed && claimType === "course" && (
            <div className="space-y-2">
              <Label htmlFor="shot">Select Recent Shot (Optional)</Label>
              <Select value={selectedShotId} onValueChange={setSelectedShotId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a recent shot or enter details below" />
                </SelectTrigger>
                <SelectContent>
                  {recentShots.map((shot) => (
                    <SelectItem key={shot.id} value={shot.id}>
                      {shot.courses?.name} - {format(new Date(shot.created_at), "PPP")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!subscribed && (
            <div className="space-y-2">
              <Label>Date of Shot</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !claimDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {claimDate ? format(claimDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={claimDate}
                    onSelect={setClaimDate}
                    disabled={(date) => date > new Date() || date < new Date("2024-01-01")}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="teeTime">Tee Time</Label>
            <Input
              id="teeTime"
              type="time"
              value={teeTime}
              onChange={(e) => setTeeTime(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeOfHoleInOne">Time of Hole in One</Label>
            <Input
              id="timeOfHoleInOne"
              type="time"
              value={timeOfHoleInOne}
              onChange={(e) => setTimeOfHoleInOne(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details about your hole-in-one..."
              rows={4}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Submitting..." : "Submit Claim"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
