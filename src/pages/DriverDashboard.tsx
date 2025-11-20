import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, Phone, Clock, User, AlertCircle, Home, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChatInterface } from "@/components/communication/ChatInterface";

interface Assignment {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  emergency_type: string;
  patient_name: string;
  patient_contact: string;
  status: string;
  created_at: string;
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [locationWatcher, setLocationWatcher] = useState<number | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [ambulanceId, setAmbulanceId] = useState<string | null>(null);

  // Start location tracking
  const startLocationTracking = () => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          
          // Update location in database
          updateLocationInDatabase(latitude, longitude);
        },
        (error) => {
          console.error("Location error:", error);
          toast({
            title: "Location Error",
            description: "Could not access your location",
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
      
      setLocationWatcher(watchId);
    }
  };

  const stopLocationTracking = () => {
    if (locationWatcher !== null) {
      navigator.geolocation.clearWatch(locationWatcher);
      setLocationWatcher(null);
    }
  };

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setDriverId(user.id);

      // Get ambulance assigned to this driver
      const { data: ambulance } = await supabase
        .from('ambulances')
        .select('id')
        .eq('driver_name', user.email)
        .single();

      if (ambulance) {
        setAmbulanceId(ambulance.id);
        // Load current assignment if any
        loadCurrentAssignment(ambulance.id);
      }
    } catch (error) {
      console.error("Error loading driver data:", error);
    }
  };

  const loadCurrentAssignment = async (ambId: string) => {
    try {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('ambulance_id', ambId)
        .in('status', ['assigned', 'en_route'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setAssignment(data as Assignment);
      }
    } catch (error) {
      console.error("Error loading assignment:", error);
    }
  };

  const updateLocationInDatabase = async (latitude: number, longitude: number) => {
    if (!ambulanceId) return;
    
    try {
      const { error } = await supabase
        .from('ambulance_locations')
        .upsert({
          ambulance_id: ambulanceId,
          latitude,
          longitude,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error("Error updating location:", error);
    }
  };

  const toggleAvailability = async (available: boolean) => {
    setIsAvailable(available);
    
    if (available) {
      startLocationTracking();
      // Update ambulance status to available
      if (ambulanceId) {
        await supabase
          .from('ambulances')
          .update({ status: 'available' })
          .eq('id', ambulanceId);
      }
      toast({
        title: "You are now available",
        description: "Location tracking started",
      });
    } else {
      stopLocationTracking();
      // Update ambulance status to offline
      if (ambulanceId) {
        await supabase
          .from('ambulances')
          .update({ status: 'offline' })
          .eq('id', ambulanceId);
      }
      toast({
        title: "You are now offline",
        description: "Location tracking stopped",
      });
    }
  };

  // Listen for new assignments
  useEffect(() => {
    if (!isAvailable || !ambulanceId) return;

    const channel = supabase
      .channel('assignments')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `ambulance_id=eq.${ambulanceId}`,
        },
        (payload) => {
          const newBooking = payload.new as Assignment;
          if (newBooking.status === 'assigned') {
            setAssignment(newBooking);
            toast({
              title: "New Emergency Assignment",
              description: "You have been assigned to an emergency call",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAvailable, ambulanceId]);

  const acceptAssignment = async () => {
    if (!assignment) return;

    try {
      await supabase
        .from('bookings')
        .update({ status: 'en_route' })
        .eq('id', assignment.id);

      toast({
        title: "Assignment Accepted",
        description: "Navigate to pickup location",
      });
    } catch (error) {
      console.error("Error accepting assignment:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        {/* Header */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Driver Dashboard</CardTitle>
                <CardDescription>Manage your availability and assignments</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="availability">Available</Label>
                  <Switch
                    id="availability"
                    checked={isAvailable}
                    onCheckedChange={toggleAvailability}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/")}>
                  <Home className="h-4 w-4 mr-1" />
                  Home
                </Button>
                <Button variant="ghost" size="sm">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Current Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Current Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentLocation ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Latitude: {currentLocation.lat.toFixed(6)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Longitude: {currentLocation.lng.toFixed(6)}
                </p>
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                  Tracking Active
                </Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Enable availability to start location tracking
              </p>
            )}
          </CardContent>
        </Card>

        {/* Active Assignment */}
        {assignment && (
          <Card className="border-destructive/20 shadow-lg">
            <CardHeader className="bg-destructive/5">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <CardTitle className="text-xl">Active Emergency Assignment</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Pickup Location
                  </Label>
                  <p className="text-sm">{assignment.pickup_location}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Destination
                  </Label>
                  <p className="text-sm">{assignment.dropoff_location}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Patient Name
                  </Label>
                  <p className="text-sm">{assignment.patient_name}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact
                  </Label>
                  <p className="text-sm">{assignment.patient_contact}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Emergency Type
                  </Label>
                  <Badge variant="destructive">{assignment.emergency_type}</Badge>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time
                  </Label>
                  <p className="text-sm">
                    {new Date(assignment.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={acceptAssignment}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <Navigation className="mr-2 h-4 w-4" />
                  Navigate to Pickup
                </Button>
                <Button variant="outline" className="flex-1">
                  <Phone className="mr-2 h-4 w-4" />
                  Call Patient
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Assignment */}
        {!assignment && isAvailable && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Navigation className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Ready for Assignment</h3>
                <p className="text-sm text-muted-foreground">
                  Waiting for emergency calls in your area
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Communication Interface */}
        {assignment && driverId && (
          <ChatInterface 
            bookingId={assignment.id}
            senderType="driver"
            senderId={driverId}
          />
        )}
      </div>
    </div>
  );
}
