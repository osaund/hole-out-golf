import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface PrizeClaimsTabProps {
  claims: any[];
  courses: any[];
}

export const PrizeClaimsTab = ({ claims, courses }: PrizeClaimsTabProps) => {
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

  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.name : "Unknown Course";
  };

  if (claims.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">No Prize Claims Yet</h3>
        <p className="text-muted-foreground">Submit your first hole-in-one claim above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {claims.map((claim) => (
        <Card key={claim.id} className="shadow-soft">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-accent" />
                  {getCourseName(claim.course_id)}
                </CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(claim.claim_date), "PPP")}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(claim.status)}>
                {claim.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {claim.prize_amount && (
                <div className="relative p-5 rounded-xl overflow-hidden group">
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-accent via-secondary to-accent opacity-80" />
                  
                  {/* Content */}
                  <div className="relative z-10 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent-foreground" />
                      <span className="text-sm font-bold text-accent-foreground uppercase tracking-wide">Prize Won</span>
                    </div>
                    <span className="text-3xl font-black text-accent-foreground">£{claim.prize_amount.toFixed(2)}</span>
                  </div>
                </div>
              )}
              {claim.notes && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground">{claim.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
