import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, Target, Play, Info, X, Camera, CreditCard, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SubscribeDialog } from "@/components/SubscribeDialog";
import { supabase } from "@/integrations/supabase/client";
import salisburyGolf from "@/assets/salisbury-golf.jpg";
import biburyGolf from "@/assets/bibury-golf.jpg";
import gratelyGolf from "@/assets/grately-golf.jpg";
import ampfieldGolf from "@/assets/ampfield-golf.jpg";

interface CoursesTabProps {
  courses: any[];
}

const sortCourses = (courses: any[]) => {
  return [...courses].sort((a, b) => {
    // Coming soon courses go last
    if (a.coming_soon && !b.coming_soon) return 1;
    if (!a.coming_soon && b.coming_soon) return -1;
    // Sort by priority (higher priority first)
    return (b.priority || 0) - (a.priority || 0);
  });
};

const courseImages: Record<string, string> = {
  "salisbury-golf.jpg": salisburyGolf,
  "bibury-golf.jpg": biburyGolf,
  "grately-golf.jpg": gratelyGolf,
  "ampfield-golf.jpg": ampfieldGolf,
};

export const CoursesTab = ({ courses }: CoursesTabProps) => {
  const { toast } = useToast();
  const { subscribed, user, hasSinglePlayCredit, useSinglePlayCredit, checkSinglePlayCredits } = useSubscription();
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);
  const [playedToday, setPlayedToday] = useState<Set<string>>(new Set());
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [singlePlayUsedToday, setSinglePlayUsedToday] = useState(false);
  const [loadingPlayedStatus, setLoadingPlayedStatus] = useState(true);
  const sortedCourses = sortCourses(courses);

  useEffect(() => {
    const checkPlayedCourses = async () => {
      if (!user) {
        setLoadingPlayedStatus(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: todaysShots } = await supabase
        .from("shots")
        .select("course_id")
        .eq("user_id", user.id)
        .gte("created_at", `${today}T00:00:00`)
        .lt("created_at", `${today}T23:59:59`);

      if (todaysShots) {
        setPlayedToday(new Set(todaysShots.map(shot => shot.course_id)));
      }

      // Check if user has used a single play credit today
      const { data: usedCredits } = await supabase
        .from("single_play_credits")
        .select("id")
        .eq("user_id", user.id)
        .gte("used_at", `${today}T00:00:00`)
        .lt("used_at", `${today}T23:59:59`);

      setSinglePlayUsedToday((usedCredits?.length || 0) > 0);
      setLoadingPlayedStatus(false);
    };

    checkPlayedCourses();
  }, [user]);

  const handlePlayNow = async (course: any) => {
    // Capture the exact timestamp when button is pressed
    const playedAt = new Date().toISOString();
    
    // Check if user has subscription OR unused single play credit
    const canPlay = subscribed || hasSinglePlayCredit;
    
    if (!canPlay) {
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

    // If using single play credit, check if already used today
    if (!subscribed && hasSinglePlayCredit && singlePlayUsedToday) {
      toast({
        title: "Already Played Today",
        description: "You've already used your single play credit today. Subscribe for unlimited daily plays!",
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

      // If not subscribed, use single play credit
      if (!subscribed && hasSinglePlayCredit) {
        const creditUsed = await useSinglePlayCredit(course.id);
        if (!creditUsed) {
          toast({
            title: "Error",
            description: "Failed to use single play credit. Please try again.",
            variant: "destructive",
          });
          return;
        }
        setSinglePlayUsedToday(true);
      }

      // Log the shot with the captured timestamp
      const { error } = await supabase.from("shots").insert({
        user_id: user.id,
        course_id: course.id,
        hole_number: 1, // Default to hole 1 for now
        is_hole_in_one: false,
        played_at: playedAt,
      });

      if (error) throw error;

      // Update the played today set
      setPlayedToday(prev => new Set([...prev, course.id]));

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
      <div className="mb-6 p-4 rounded-lg bg-card border border-border shadow-soft">
        <div className="flex items-start gap-3">
          <Camera className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-muted-foreground">
              Our courses are equipped with permanent camera fixtures to capture your shots.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4 text-primary" />
                <span>Pay per play</span>
              </div>
              <span className="text-sm text-muted-foreground">or</span>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Subscribe for daily access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!alertDismissed && (
        <Alert className="mb-4 py-2 pl-3 pr-8 border-l-4 border-l-primary border-y-0 border-r-0 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-5 w-5 hover:bg-primary/10"
            onClick={() => setAlertDismissed(true)}
          >
            <X className="h-3 w-3" />
          </Button>
          <AlertDescription className="text-foreground text-xs leading-tight">
            <span className="font-semibold text-primary">Important:</span> Register your play before taking your shot to be eligible for the prize.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {sortedCourses.map((course) => {
          const imageSrc = course.image_url?.startsWith("http")
            ? course.image_url
            : (course.image_url ? courseImages[course.image_url] : undefined);

          return (
            <Card key={course.id} className="shadow-soft hover:shadow-card transition-all overflow-hidden">
              {imageSrc && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={imageSrc}
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
            <CardTitle>
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
                <p className="text-3xl font-bold text-secondary">£{course.prize_amount.toLocaleString()}</p>
              </div>
            )}
            {!course.coming_soon && (
              <Button
                onClick={() => handlePlayNow(course)}
                className="w-full"
                size="lg"
                disabled={loadingPlayedStatus || playedToday.has(course.id) || (!subscribed && singlePlayUsedToday && hasSinglePlayCredit)}
              >
                <Play className="w-4 h-4 mr-2" />
                {loadingPlayedStatus 
                  ? "Loading..."
                  : (playedToday.has(course.id) || (!subscribed && singlePlayUsedToday && hasSinglePlayCredit))
                    ? "Already Played Today"
                    : "Play Now"}
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
          );
        })}
      </div>
      <SubscribeDialog open={subscribeDialogOpen} onOpenChange={setSubscribeDialogOpen} />
    </>
  );
};
