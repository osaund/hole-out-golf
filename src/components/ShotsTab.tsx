import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Calendar } from "lucide-react";
import { format } from "date-fns";

interface ShotsTabProps {
  shots: any[];
  courses: any[];
}

export const ShotsTab = ({ shots, courses }: ShotsTabProps) => {
  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.name : "Unknown Course";
  };

  if (shots.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">No Shots Recorded</h3>
        <p className="text-muted-foreground">Your shot history will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {shots.map((shot) => (
        <Card key={shot.id} className="shadow-soft">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{getCourseName(shot.course_id)}</CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(shot.created_at), "PPP")}
                </CardDescription>
              </div>
              {shot.is_hole_in_one && (
                <Badge className="bg-success text-success-foreground">
                  Hole in One!
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Hole #{shot.hole_number}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
