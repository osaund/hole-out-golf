import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Trophy, Target, Ticket, CheckCircle, History, Clock } from "lucide-react";
import realGolfTourLogo from "@/assets/real-golf-tour-logo.png";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface Event {
  id: string;
  round: string;
  region: string;
  date: string;
  venue: string;
  nearest_pin_prize: number;
  organizer: string;
  enabled: boolean;
  entry_fee: number | null;
}

interface EventRegistration {
  id: string;
  event_id: string;
  attended: boolean;
  registered_at: string;
  events: Event;
}

export const EventsTab = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>("all");
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [registering, setRegistering] = useState<string | null>(null);

  const refreshRegistrations = async (currentUserId: string) => {
    const { data: regData } = await supabase
      .from("event_registrations")
      .select("*, events(*)")
      .eq("user_id", currentUserId);
    setRegistrations(regData as EventRegistration[] || []);
  };

  useEffect(() => {
    const fetchData = async () => {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || null;
      setUserId(currentUserId);

      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true });

      if (eventsError) {
        console.error("Error fetching events:", eventsError);
      } else {
        setEvents(eventsData || []);
      }

      // Fetch user's registrations if logged in
      if (currentUserId) {
        await refreshRegistrations(currentUserId);
      }

      setLoading(false);

      // Check for successful event payment
      const eventSuccess = searchParams.get("event_success");
      if (eventSuccess && session?.access_token) {
        setSearchParams({});
        try {
          const { data, error } = await supabase.functions.invoke("verify-event-payment", {
            body: { eventId: eventSuccess },
            headers: { Authorization: `Bearer ${session.access_token}` },
          });

          if (error) throw error;

          if (data?.success) {
            toast({
              title: "Registration Complete!",
              description: "You're now registered for this event.",
            });
            await refreshRegistrations(currentUserId!);
          }
        } catch (err: any) {
          toast({
            title: "Registration Issue",
            description: err.message || "Failed to verify payment",
            variant: "destructive",
          });
        }
      }
    };

    fetchData();
  }, [searchParams, setSearchParams, toast]);

  // Get unique organizers
  const organizers = [...new Set(events.map(e => e.organizer))];

  // Filter events based on selection
  const filteredEvents = selectedOrganizer === "all" 
    ? events 
    : events.filter(e => e.organizer === selectedOrganizer);

  // Get registered event IDs
  const registeredEventIds = new Set(registrations.map(r => r.event_id));

  // Get all registered events for history (sorted by date descending)
  const registeredEvents = [...registrations].sort(
    (a, b) => new Date(b.events.date).getTime() - new Date(a.events.date).getTime()
  );

  // Helper to check if event date has passed
  const isEventPast = (dateStr: string) => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today;
  };

  const handleRegister = async (event: Event) => {
    if (!userId) {
      toast({
        title: "Login Required",
        description: "Please log in to register for events.",
        variant: "destructive",
      });
      return;
    }

    setRegistering(event.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Session Expired",
          description: "Please log in again.",
          variant: "destructive",
        });
        setRegistering(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-event-checkout", {
        body: { eventId: event.id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      // If free event, just refresh registrations
      if (data?.free) {
        await refreshRegistrations(userId);
        toast({
          title: "Registered!",
          description: `You're registered for ${event.round} - ${event.region}.`,
        });
      } else if (data?.url) {
        // Redirect to Stripe checkout in same tab
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    }

    setRegistering(null);
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "do MMMM");
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading events...</div>;
  }

  return (
    <Tabs defaultValue="upcoming" className="space-y-6">
      <TabsList>
        <TabsTrigger value="upcoming" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Upcoming Events
        </TabsTrigger>
        {userId && (
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            My History
            {registeredEvents.length > 0 && (
              <Badge variant="secondary" className="ml-1">{registeredEvents.length}</Badge>
            )}
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="upcoming" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground text-sm">2026 Season · {filteredEvents.length} events</span>
          <Select value={selectedOrganizer} onValueChange={setSelectedOrganizer}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by host" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hosts</SelectItem>
              {organizers.map((org) => (
                <SelectItem key={org} value={org}>{org}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const isRegistered = registeredEventIds.has(event.id);
            
            return (
              <Card 
                key={event.id} 
                className={`shadow-soft hover:shadow-card transition-all ${!event.enabled ? "opacity-60" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant={event.enabled ? "default" : "secondary"}
                      >
                        {event.region}
                      </Badge>
                      {event.organizer === "Real Golf Tour" && (
                        <img src={realGolfTourLogo} alt="Real Golf Tour" className="w-5 h-5 rounded-full object-cover" />
                      )}
                    </div>
                    {!event.enabled && (
                      <Badge variant="outline" className="text-xs">
                        Coming Soon
                      </Badge>
                    )}
                    {isRegistered && event.enabled && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Registered
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {event.venue}
                  </CardDescription>
                  <span className="text-xs text-muted-foreground pl-5">Hosted by {event.organizer}</span>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{formatEventDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Ticket className="w-4 h-4 text-primary" />
                      <span>£{event.entry_fee || 0} Entry</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span>£1,000 Hole-in-One</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Target className="w-4 h-4 text-primary" />
                      <span>£{event.nearest_pin_prize} Nearest to Pin</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleRegister(event)}
                    className="w-full"
                    size="lg"
                    disabled={!event.enabled || isRegistered || registering === event.id}
                    variant={event.enabled && !isRegistered ? "default" : "outline"}
                  >
                    {registering === event.id 
                      ? "Registering..." 
                      : isRegistered 
                        ? "Already Registered" 
                        : event.enabled 
                          ? "Register to Play" 
                          : "Registration Opens Soon"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="history">
        {registeredEvents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No events registered yet.</p>
            <p className="text-sm">Register for an event and start playing!</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Organizer</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registeredEvents.map((reg) => {
                  const isPast = isEventPast(reg.events.date);
                  return (
                    <TableRow key={reg.id}>
                      <TableCell className="font-medium">
                        {reg.events.round} - {reg.events.region}
                      </TableCell>
                      <TableCell>{reg.events.venue}</TableCell>
                      <TableCell>{formatEventDate(reg.events.date)}</TableCell>
                      <TableCell>{reg.events.organizer}</TableCell>
                      <TableCell className="text-right">
                        {isPast ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Attended
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            <Clock className="w-3 h-3 mr-1" />
                            Attending
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};