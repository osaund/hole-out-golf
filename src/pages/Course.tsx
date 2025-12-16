import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, LogIn, Play } from "lucide-react";

// Import course images
import ampfieldGolf from "@/assets/ampfield-golf.jpg";
import biburyGolf from "@/assets/bibury-golf.jpg";
import gratelyGolf from "@/assets/grately-golf.jpg";
import salisburyGolf from "@/assets/salisbury-golf.jpg";

const courseImages: Record<string, string> = {
  'ampfield-golf.jpg': ampfieldGolf,
  'bibury-golf.jpg': biburyGolf,
  'grately-golf.jpg': gratelyGolf,
  'salisbury-golf.jpg': salisburyGolf,
};

const Course = () => {
  const { id } = useParams<{ id: string }>();

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    );
  }

  const imageUrl = course.image_url ? courseImages[course.image_url] : null;

  return (
    <div className="min-h-screen bg-background">
      {imageUrl && (
        <div className="relative h-64 md:h-96 w-full">
          <img
            src={imageUrl}
            alt={course.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8 -mt-20 relative z-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">{course.name}</CardTitle>
            {course.location && (
              <p className="text-muted-foreground">{course.location}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {course.prize_amount && (
              <div className="flex items-center justify-center gap-3 p-6 bg-primary/10 rounded-lg">
                <Trophy className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Hole in One Prize</p>
                  <p className="text-3xl font-bold text-primary">
                    £{course.prize_amount.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <Button asChild size="lg" className="w-full">
                <Link to="/auth">
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In
                </Link>
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                asChild
              >
                <a
                  href="https://buy.stripe.com/test_9B6aEXdT8bhhahE95xefC01"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Play as Guest
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Course;
