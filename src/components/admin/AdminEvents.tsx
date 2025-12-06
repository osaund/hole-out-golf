import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

interface AdminEventsProps {
  events: any[];
  onDataChange: () => void;
  onUserClick: (user: any) => void;
}

export default function AdminEvents({ events, onDataChange, onUserClick }: AdminEventsProps) {
  const { toast } = useToast();
  const [eventRegistrations, setEventRegistrations] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [entryFees, setEntryFees] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fees: { [key: string]: string } = {};
    events.forEach((event) => {
      fees[event.id] = event.entry_fee?.toString() || "0";
    });
    setEntryFees(fees);
    
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events]);

  useEffect(() => {
    if (selectedEventId) {
      fetchEventRegistrations(selectedEventId);
    }
  }, [selectedEventId]);

  const fetchEventRegistrations = async (eventId: string) => {
    const { data, error } = await supabase
      .from("event_registrations")
      .select("*, profiles(id, first_name, last_name, full_name, email, phone_number)")
      .eq("event_id", eventId)
      .order("registered_at", { ascending: false });

    if (error) {
      console.error("Error fetching registrations:", error);
    } else {
      setEventRegistrations(data || []);
    }
  };

  const handleEntryFeeUpdate = async (eventId: string) => {
    const fee = parseFloat(entryFees[eventId]);
    
    if (isNaN(fee) || fee < 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid entry fee",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("events")
      .update({ entry_fee: fee })
      .eq("id", eventId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Entry fee updated successfully",
      });
      onDataChange();
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Events
          </CardTitle>
          <CardDescription>Select an event to view registrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedEventId === event.id
                  ? "bg-primary/10 border-primary"
                  : "hover:bg-muted"
              }`}
              onClick={() => setSelectedEventId(event.id)}
            >
              <div className="font-medium">{event.round} - {event.region}</div>
              <div className="text-sm text-muted-foreground">{event.venue}</div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(event.date), "PP")}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={entryFees[event.id] || ""}
                  onChange={(e) => {
                    e.stopPropagation();
                    setEntryFees({ ...entryFees, [event.id]: e.target.value });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Entry fee"
                  className="h-8 text-sm"
                />
                <Button 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEntryFeeUpdate(event.id);
                  }}
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Entry fee: £{event.entry_fee?.toFixed(2) || "0.00"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Registrations
            {selectedEventId && (
              <Badge variant="secondary">{eventRegistrations.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {selectedEventId
              ? `Showing registrations for ${events.find(e => e.id === selectedEventId)?.round || "selected event"}`
              : "Select an event to view registrations"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedEventId ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select an event to view registrations</p>
            </div>
          ) : eventRegistrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No registrations for this event yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Registered At</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventRegistrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">
                      <button
                        onClick={() => onUserClick(reg.profiles)}
                        className="text-primary hover:underline cursor-pointer text-left"
                      >
                        {reg.profiles?.first_name} {reg.profiles?.last_name}
                      </button>
                    </TableCell>
                    <TableCell>{reg.profiles?.email || "-"}</TableCell>
                    <TableCell>{reg.profiles?.phone_number || "-"}</TableCell>
                    <TableCell>
                      {format(new Date(reg.registered_at), "PPp")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={reg.attended ? "default" : "secondary"}>
                        {reg.attended ? "Attended" : "Registered"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
