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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface PrizeClaimFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: any[];
  userId: string;
  onSuccess: () => void;
}

export const PrizeClaimForm = ({ open, onOpenChange, courses, userId, onSuccess }: PrizeClaimFormProps) => {
  const [courseId, setCourseId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedShotId, setSelectedShotId] = useState("");
  const [claimDate, setClaimDate] = useState<Date>();
  const [timeOfHoleInOne, setTimeOfHoleInOne] = useState("");
  const [recentShots, setRecentShots] = useState<any[]>([]);
  const { toast } = useToast();
  const { subscribed } = useSubscription();

  useEffect(() => {
    if (open && subscribed) {
      fetchRecentShots();
    }
  }, [open, subscribed]);

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
      let finalCourseId = courseId;
      let finalDate = claimDate;

      // If subscribed and a shot is selected, use that shot's details
      if (subscribed && selectedShotId) {
        const selectedShot = recentShots.find(s => s.id === selectedShotId);
        if (selectedShot) {
          finalCourseId = selectedShot.course_id;
          finalDate = new Date(selectedShot.created_at);
        }
      }

      if (!finalCourseId || !finalDate) {
        throw new Error("Please select all required fields");
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

      // Get the selected course to get prize amount
      const selectedCourse = courses.find(c => c.id === finalCourseId);
      const prizeAmount = selectedCourse?.prize_amount || null;

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
        notes,
        status: "pending",
        claim_date: finalDate.toISOString(),
        shot_id: subscribed ? selectedShotId : null,
        prize_amount: prizeAmount,
        time_of_hole_in_one: timeOfHoleInOne || null,
      });

      if (error) throw error;

      // Send email notification
      try {
        await supabase.functions.invoke('send-prize-claim-email', {
          body: {
            courseName: selectedCourse?.name,
            userEmail: user?.email,
            userName: profile?.full_name || user?.email,
            teeTime: timeOfHoleInOne,
            notes: notes,
            claimDate: finalDate.toISOString(),
          }
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        // Don't fail the claim submission if email fails
      }

      toast({
        title: "Claim Submitted!",
        description: "Your prize claim has been submitted for review.",
      });

      onOpenChange(false);
      setCourseId("");
      setNotes("");
      setSelectedShotId("");
      setClaimDate(undefined);
      setTimeOfHoleInOne("");
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

          {subscribed && (
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
