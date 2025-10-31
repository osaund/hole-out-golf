import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Target, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const sortedCourses = sortCourses(courses);

  const handlePlayNow = (courseName: string) => {
    toast({
      title: "Starting Game",
      description: `Preparing to play at ${courseName}...`,
    });
  };

  return (
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
                onClick={() => handlePlayNow(course.name)}
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
  );
};
