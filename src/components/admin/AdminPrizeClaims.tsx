import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Save } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AdminPrizeClaimsProps {
  claims: any[];
  courses: any[];
  onDataChange: () => void;
  onUserClick: (user: any) => void;
}

export default function AdminPrizeClaims({ claims, courses, onDataChange, onUserClick }: AdminPrizeClaimsProps) {
  const { toast } = useToast();
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>(() => {
    const notes: { [key: string]: string } = {};
    claims.forEach((claim) => {
      notes[claim.id] = claim.notes || "";
    });
    return notes;
  });

  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.name : "Unknown Course";
  };

  const handleClaimAction = async (claimId: string, status: "approved" | "rejected" | "pending") => {
    const { error } = await supabase
      .from("prize_claims")
      .update({ status })
      .eq("id", claimId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Claim ${status} successfully`,
      });
      onDataChange();
    }
  };

  const handleNotesUpdate = async (claimId: string) => {
    const notes = editingNotes[claimId];
    
    const { error } = await supabase
      .from("prize_claims")
      .update({ notes })
      .eq("id", claimId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Notes updated successfully",
      });
      onDataChange();
    }
  };

  if (claims.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No prize claims yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Claim Date</TableHead>
              <TableHead>Tee Time</TableHead>
              <TableHead>Time of Hole in One</TableHead>
              <TableHead>Shot Time Start</TableHead>
              <TableHead>Prize</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.map((claim) => (
              <TableRow key={claim.id}>
                <TableCell className="font-medium">
                  <button
                    onClick={() => onUserClick(claim.profiles)}
                    className="text-primary hover:underline cursor-pointer text-left"
                  >
                    {claim.profiles?.email || "Unknown User"}
                  </button>
                </TableCell>
                <TableCell>{getCourseName(claim.course_id)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(claim.claim_date), "PP")}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {claim.tee_time || "-"}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {claim.time_of_hole_in_one || "-"}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {claim.shots?.created_at 
                    ? format(new Date(claim.shots.created_at), "PPp")
                    : "-"}
                </TableCell>
                <TableCell>
                  {claim.prize_amount ? `£${claim.prize_amount.toFixed(2)}` : "-"}
                </TableCell>
                <TableCell>
                  <Select
                    value={claim.status}
                    onValueChange={(value) => handleClaimAction(claim.id, value as "approved" | "rejected" | "pending")}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="max-w-xs">
                  <Textarea
                    value={editingNotes[claim.id] || ""}
                    onChange={(e) => setEditingNotes({ ...editingNotes, [claim.id]: e.target.value })}
                    placeholder="Add notes..."
                    className="min-h-[60px] text-sm"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    onClick={() => handleNotesUpdate(claim.id)}
                    variant="outline"
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
