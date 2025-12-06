import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Trophy, Target, Ticket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: string;
  round: string;
  region: string;
  date: string;
  venue: string;
  nearestPinPrize: number;
  organizer: string;
  enabled: boolean;
}

const events: Event[] = [
  {
    id: "1",
    round: "Round 1",
    region: "Hampshire",
    date: "4th April",
    venue: "Boundary Lakes GC",
    nearestPinPrize: 60,
    organizer: "Real Golf Tour",
    enabled: true,
  },
  {
    id: "2",
    round: "Round 2",
    region: "Somerset",
    date: "13th June",
    venue: "Orchardleigh GC",
    nearestPinPrize: 55,
    organizer: "Real Golf Tour",
    enabled: false,
  },
  {
    id: "3",
    round: "Round 3",
    region: "Surrey",
    date: "6th July",
    venue: "Camberley Heath GC",
    nearestPinPrize: 133,
    organizer: "Real Golf Tour",
    enabled: false,
  },
  {
    id: "4",
    round: "Round 4",
    region: "Wiltshire",
    date: "31st August",
    venue: "Cumberwell Park GC",
    nearestPinPrize: 70,
    organizer: "Real Golf Tour",
    enabled: false,
  },
  {
    id: "5",
    round: "Round 5",
    region: "Dorset",
    date: "24th October",
    venue: "Dorset Golf & Country Club",
    nearestPinPrize: 70,
    organizer: "Real Golf Tour",
    enabled: false,
  },
];

export const EventsTab = () => {
  const { toast } = useToast();

  const handleRegister = (event: Event) => {
    toast({
      title: "Registration Coming Soon",
      description: `Registration for ${event.round} - ${event.region} will be available soon.`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-muted-foreground text-sm">2026 Season</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <Card 
            key={event.id} 
            className={`shadow-soft hover:shadow-card transition-all ${!event.enabled ? "opacity-60" : ""}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge 
                  variant={event.enabled ? "default" : "secondary"}
                  className="mb-2"
                >
                  {event.region}
                </Badge>
                {!event.enabled && (
                  <Badge variant="outline" className="text-xs">
                    Coming Soon
                  </Badge>
                )}
              </div>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.venue}
              </CardDescription>
              <span className="text-xs text-muted-foreground">Hosted by {event.organizer}</span>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{event.date}</span>
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
                  <span>£{event.nearestPinPrize} Nearest to Pin</span>
                </div>
              </div>

              <Button
                onClick={() => handleRegister(event)}
                className="w-full"
                size="lg"
                disabled={!event.enabled}
                variant={event.enabled ? "default" : "outline"}
              >
                {event.enabled ? "Register to Play" : "Registration Opens Soon"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
