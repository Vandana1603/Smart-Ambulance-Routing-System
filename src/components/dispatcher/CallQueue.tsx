import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Clock, MapPin, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface CallQueueProps {
  compact?: boolean;
}

interface Booking {
  id: string;
  emergency_type: string;
  pickup_location: string;
  status: string;
  created_at: string;
  patient_name: string;
  patient_age: number | null;
  patient_contact: string;
}

export const CallQueue = ({ compact = false }: CallQueueProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBookings();

    // Subscribe to booking changes
    const channel = supabase
      .channel('booking-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          loadBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .in('status', ['pending', 'assigned'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading bookings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (emergencyType: string) => {
    switch (emergencyType) {
      case "cardiac":
      case "stroke":
        return "destructive";
      case "trauma":
      case "respiratory":
        return "default";
      default:
        return "secondary";
    }
  };

  const getEmergencyTypeLabel = (type: string) => {
    return type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Emergency Call Queue</CardTitle>
            <CardDescription>Pending emergency requests</CardDescription>
          </div>
          <Phone className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading bookings...
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No pending emergency calls
            </div>
          ) : (
            bookings.slice(0, compact ? 3 : undefined).map((booking) => (
              <div
                key={booking.id}
                className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{booking.id.slice(0, 8).toUpperCase()}</h4>
                      <Badge variant={getPriorityColor(booking.emergency_type)}>
                        {booking.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">
                      {getEmergencyTypeLabel(booking.emergency_type)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
                  </div>
                </div>

                <div className="mb-3 space-y-1">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <span>{booking.pickup_location}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="mt-0.5 h-4 w-4" />
                    <span>
                      {booking.patient_name}
                      {booking.patient_age ? `, ${booking.patient_age} years` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      toast({
                        title: "Assignment feature coming soon",
                        description: "Manual ambulance assignment will be available in the next update.",
                      });
                    }}
                  >
                    {booking.status === 'assigned' ? 'Reassign' : 'Assign Ambulance'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      window.location.href = `/emergency/track/${booking.id}`;
                    }}
                  >
                    Details
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
