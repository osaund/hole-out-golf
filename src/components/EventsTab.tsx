import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Trophy, Target, Ticket, CheckCircle, History } from "lucide-react";
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
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>("all");
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [registering, setRegistering] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);

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
      if (session?.user?.id) {
        const { data: regData, error: regError } = await supabase
          .from("event_registrations")
          .select("*, events(*)")
          .eq("user_id", session.user.id);

        if (regError) {
          console.error("Error fetching registrations:", regError);
        } else {
          setRegistrations(regData as EventRegistration[] || []);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // Get unique organizers
  const organizers = [...new Set(events.map(e => e.organizer))];

  // Filter events based on selection
  const filteredEvents = selectedOrganizer === "all" 
    ? events 
    : events.filter(e => e.organizer === selectedOrganizer);

  // Get registered event IDs
  const registeredEventIds = new Set(registrations.map(r => r.event_id));

  // Get past attended events
  const attendedEvents = registrations.filter(r => r.attended);

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

    const { error } = await supabase
      .from("event_registrations")
      .insert({
        event_id: event.id,
        user_id: userId,
      });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Already Registered",
          description: `You're already registered for ${event.round}.`,
        });
      } else {
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      // Refresh registrations
      const { data: regData } = await supabase
        .from("event_registrations")
        .select("*, events(*)")
        .eq("user_id", userId);

      setRegistrations(regData as EventRegistration[] || []);

      toast({
        title: "Registered!",
        description: `You're registered for ${event.round} - ${event.region}.`,
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
    <div className="space-y-6">
      {/* My Events History */}
      {attendedEvents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">My Event History</h3>
            <Badge variant="secondary">{attendedEvents.length} played</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {attendedEvents.map((reg) => (
              <Card key={reg.id} className="bg-muted/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Attended
                    </Badge>
                  </div>
                  <CardDescription className="font-medium text-foreground">
                    {reg.events.round} - {reg.events.region}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {reg.events.venue}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-4 h-4" />
                    {formatEventDate(reg.events.date)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="space-y-4">
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
                      <span>£5 Entry</span>
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
      </div>
    </div>
  );
};
