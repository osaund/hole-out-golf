import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Target } from "lucide-react";

interface CoursesTabProps {
  courses: any[];
}

export const CoursesTab = ({ courses }: CoursesTabProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {courses.map((course) => (
        <Card key={course.id} className="shadow-soft hover:shadow-card transition-shadow">
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
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Par 3 Holes</span>
              <span className="text-lg font-semibold text-primary">{course.par_3_count}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
