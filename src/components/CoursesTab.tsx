import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Target, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SubscribeDialog } from "@/components/SubscribeDialog";
import { supabase } from "@/integrations/supabase/client";
import salisburyGolf from "@/assets/salisbury-golf.jpg";
import biburyGolf from "@/assets/bibury-golf.jpg";
import gratelyGolf from "@/assets/grately-golf.jpg";

interface CoursesTabProps {
  courses: any[];
}

const sortCourses = (courses: any[]) => {
  return [...courses].sort((a, b) => {
    // Coming soon courses go last
    if (a.coming_soon && !b.coming_soon) return 1;
    if (!a.coming_soon && b.coming_soon) return -1;
    return 0;
  });
};

const courseImages: Record<string, string> = {
  "salisbury-golf.jpg": salisburyGolf,
  "bibury-golf.jpg": biburyGolf,
  "grately-golf.jpg": gratelyGolf,
};

export const CoursesTab = ({ courses }: CoursesTabProps) => {
  const { toast } = useToast();
  const { subscribed, user } = useSubscription();
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);
  const sortedCourses = sortCourses(courses);

  const handlePlayNow = async (course: any) => {
    if (!subscribed) {
      setSubscribeDialogOpen(true);
      return;
    }

    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please log in to play",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if user already has a shot for this course today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingShots } = await supabase
        .from("shots")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", course.id)
        .gte("created_at", `${today}T00:00:00`)
        .lt("created_at", `${today}T23:59:59`);

      if (existingShots && existingShots.length > 0) {
        toast({
          title: "Already Played Today",
          description: `You've already logged a shot at ${course.name} today. Come back tomorrow!`,
          variant: "destructive",
        });
        return;
      }

      // Log the shot
      const { error } = await supabase.from("shots").insert({
        user_id: user.id,
        course_id: course.id,
        hole_number: 1, // Default to hole 1 for now
        is_hole_in_one: false,
      });

      if (error) throw error;

      toast({
        title: "Shot Logged!",
        description: `Your shot at ${course.name} has been recorded.`,
      });
    } catch (error: any) {
      const errorMessage = error.message.includes("unique_shot_per_course_per_day")
        ? `You've already played at ${course.name} today. Try again tomorrow!`
        : error.message;
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {sortedCourses.map((course) => (
        <Card key={course.id} className="shadow-soft hover:shadow-card transition-all overflow-hidden">
          {course.image_url && (
            <div className="relative h-48 overflow-hidden">
              <img
                src={courseImages[course.image_url]}
                alt={course.name}
                className="w-full h-full object-cover"
              />
              {course.coming_soon && (
                <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground shadow-lg">
                  Coming Soon
                </Badge>
              )}
            </div>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              {course.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {course.location}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!course.coming_soon && course.prize_amount && (
              <div className="p-4 bg-gradient-prize rounded-lg text-center">
                <p className="text-sm font-medium text-secondary-foreground/80 mb-1">Prize Pool</p>
                <p className="text-3xl font-bold text-secondary-foreground">£{course.prize_amount.toLocaleString()}</p>
              </div>
            )}
            {!course.coming_soon && (
              <Button
                onClick={() => handlePlayNow(course)}
                className="w-full"
                size="lg"
              >
                <Play className="w-4 h-4 mr-2" />
                Play Now
              </Button>
            )}
            {course.coming_soon && (
              <Button
                disabled
                className="w-full"
                size="lg"
                variant="outline"
              >
                Coming Soon
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
      </div>
      <SubscribeDialog open={subscribeDialogOpen} onOpenChange={setSubscribeDialogOpen} />
    </>
  );
};
