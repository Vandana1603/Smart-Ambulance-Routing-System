import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Clock, Navigation, Ambulance, User, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BookingDetails {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  emergency_type: string;
  patient_name: string;
  patient_contact: string;
  status: string;
  ambulance_id: string | null;
  created_at: string;
}

interface AmbulanceLocation {
  latitude: number;
  longitude: number;
  updated_at: string;
}

export default function EmergencyTracking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [ambulanceLocation, setAmbulanceLocation] = useState<AmbulanceLocation | null>(null);
  const [eta, setEta] = useState<string>("Calculating...");
  const [loading, setLoading] = useState(true);

  // Fetch booking details and subscribe to updates
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setBooking(data);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Could not load booking details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBooking();

      // Subscribe to booking updates
      const bookingChannel = supabase
        .channel('booking-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'bookings',
            filter: `id=eq.${id}`,
          },
          (payload) => {
            setBooking(payload.new as BookingDetails);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(bookingChannel);
      };
    }
  }, [id]);

  // Subscribe to ambulance location updates
  useEffect(() => {
    if (!booking?.ambulance_id) return;

    const fetchInitialLocation = async () => {
      const { data } = await supabase
        .from('ambulance_locations')
        .select('*')
        .eq('ambulance_id', booking.ambulance_id)
        .single();

      if (data) {
        setAmbulanceLocation(data);
      }
    };

    fetchInitialLocation();

    const channel = supabase
      .channel('ambulance-tracking')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ambulance_locations',
          filter: `ambulance_id=eq.${booking.ambulance_id}`,
        },
        (payload) => {
          setAmbulanceLocation(payload.new as AmbulanceLocation);
          // Recalculate ETA
          calculateEta(payload.new as AmbulanceLocation);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking?.ambulance_id]);

  const calculateEta = async (location: AmbulanceLocation) => {
    // Mock ETA calculation - in real app, call route calculation API
    const randomMinutes = Math.floor(Math.random() * 10) + 5;
    setEta(`${randomMinutes} minutes`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'assigned':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'en_route':
        return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
      case 'arrived':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'completed':
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Ambulance className="h-12 w-12 mx-auto mb-4 animate-pulse text-primary" />
          <p className="text-muted-foreground">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Booking not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Button
        variant="ghost"
        className="fixed top-4 left-4 gap-2 z-50"
        onClick={() => navigate("/")}
      >
        <Home className="h-4 w-4" />
        Back to Home
      </Button>
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        {/* Header */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Ambulance className="h-6 w-6" />
                  Live Ambulance Tracking
                </CardTitle>
                <CardDescription>Booking ID: {booking.id.slice(0, 8)}</CardDescription>
              </div>
              <Badge variant="outline" className={getStatusColor(booking.status)}>
                {booking.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* ETA Card */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Estimated Time of Arrival
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">{eta}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Ambulance is on the way to your location
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Map Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Live Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg h-[400px] flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Map integration with live ambulance tracking
                </p>
                {ambulanceLocation && (
                  <div className="mt-4 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Ambulance Location:
                    </p>
                    <p className="text-xs font-mono">
                      {ambulanceLocation.latitude.toFixed(6)}, {ambulanceLocation.longitude.toFixed(6)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last updated: {new Date(ambulanceLocation.updated_at).toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Emergency Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Pickup Location</p>
                <p className="text-sm text-muted-foreground">{booking.pickup_location}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Destination</p>
                <p className="text-sm text-muted-foreground">{booking.dropoff_location}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Patient Name</p>
                <p className="text-sm text-muted-foreground">{booking.patient_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Emergency Type</p>
                <Badge variant="destructive">{booking.emergency_type}</Badge>
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <Button variant="outline" className="flex-1">
                <Phone className="mr-2 h-4 w-4" />
                Call Driver
              </Button>
              <Button variant="outline" className="flex-1">
                <Phone className="mr-2 h-4 w-4" />
                Call Dispatch
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Status Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-medium">Booking Created</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(booking.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {booking.ambulance_id && (
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-medium">Ambulance Assigned</p>
                    <p className="text-xs text-muted-foreground">
                      ID: {booking.ambulance_id}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
