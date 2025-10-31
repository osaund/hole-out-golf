import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PrizeClaimFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: any[];
  userId: string;
  onSuccess: () => void;
}

export const PrizeClaimForm = ({ open, onOpenChange, courses, userId, onSuccess }: PrizeClaimFormProps) => {
  const [courseId, setCourseId] = useState("");
  const [holeNumber, setHoleNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("prize_claims").insert({
        user_id: userId,
        course_id: courseId,
        hole_number: parseInt(holeNumber),
        notes,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Claim Submitted!",
        description: "Your prize claim has been submitted for review.",
      });

      onOpenChange(false);
      setCourseId("");
      setHoleNumber("");
      setNotes("");
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name} - {course.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hole">Hole Number</Label>
            <Input
              id="hole"
              type="number"
              min="1"
              max="18"
              value={holeNumber}
              onChange={(e) => setHoleNumber(e.target.value)}
              required
              placeholder="1-18"
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
