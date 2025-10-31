import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar } from "lucide-react";
import { format } from "date-fns";

interface PrizeClaimsTabProps {
  claims: any[];
  courses: any[];
}

export const PrizeClaimsTab = ({ claims, courses }: PrizeClaimsTabProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500 text-white border-green-600";
      case "rejected":
        return "bg-red-500 text-white border-red-600";
      default:
        return "bg-amber-500 text-white border-amber-600";
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {claims.map((claim) => (
        <Card key={claim.id} className="shadow-card hover:shadow-soft transition-all border border-border/50 bg-card overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{getCourseName(claim.course_id)}</h3>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(claim.claim_date), "PPP")}
                </div>
              </div>
              <Badge className={`${getStatusColor(claim.status)} px-3 py-1 text-xs font-semibold uppercase tracking-wide border`}>
                {claim.status}
              </Badge>
            </div>
            
            {claim.prize_amount && (
              <div className="bg-gradient-prize rounded-lg p-4 mb-3">
                <p className="text-xs font-medium text-secondary-foreground/70 mb-1">Prize Amount</p>
                <p className="text-2xl font-bold text-secondary">£{claim.prize_amount.toFixed(2)}</p>
              </div>
            )}
            
            {claim.notes && (
              <div className="mt-3 p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-foreground/80">{claim.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
