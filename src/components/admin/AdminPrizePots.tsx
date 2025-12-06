import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { DollarSign } from "lucide-react";

interface AdminPrizePotsProps {
  courses: any[];
  onDataChange: () => void;
}

export default function AdminPrizePots({ courses, onDataChange }: AdminPrizePotsProps) {
  const { toast } = useToast();
  const [prizeAmounts, setPrizeAmounts] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const amounts: { [key: string]: string } = {};
    courses.forEach((course) => {
      amounts[course.id] = course.prize_amount?.toString() || "0";
    });
    setPrizeAmounts(amounts);
  }, [courses]);

  const handlePrizeAmountUpdate = async (courseId: string) => {
    const amount = parseFloat(prizeAmounts[courseId]);
    
    if (isNaN(amount) || amount < 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid prize amount",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("courses")
      .update({ prize_amount: amount })
      .eq("id", courseId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Prize amount updated successfully",
      });
      onDataChange();
    }
  };

  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <Card key={course.id} className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-accent" />
              {course.name}
            </CardTitle>
            <CardDescription>{course.location || "No location set"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={prizeAmounts[course.id] || ""}
                onChange={(e) =>
                  setPrizeAmounts({ ...prizeAmounts, [course.id]: e.target.value })
                }
                placeholder="Enter prize amount"
                className="flex-1"
              />
              <Button onClick={() => handlePrizeAmountUpdate(course.id)}>
                Update
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Current: £{course.prize_amount?.toFixed(2) || "0.00"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
