import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Ambulance {
  id: string;
  vehicle_number: string;
  driver_name: string | null;
  status: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export const LiveMap = () => {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAmbulances();

    // Subscribe to ambulance changes
    const ambulanceChannel = supabase
      .channel('ambulance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ambulances'
        },
        () => {
          loadAmbulances();
        }
      )
      .subscribe();

    // Subscribe to location updates
    const locationChannel = supabase
      .channel('location-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ambulance_locations'
        },
        () => {
          loadAmbulances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ambulanceChannel);
      supabase.removeChannel(locationChannel);
    };
  }, []);

  const loadAmbulances = async () => {
    try {
      const { data: ambulancesData, error: ambulancesError } = await supabase
        .from('ambulances')
        .select('*')
        .order('created_at', { ascending: true });

      if (ambulancesError) throw ambulancesError;

      // Get latest locations for each ambulance
      const ambulancesWithLocations = await Promise.all(
        (ambulancesData || []).map(async (ambulance) => {
          const { data: locationData } = await supabase
            .from('ambulance_locations')
            .select('*')
            .eq('ambulance_id', ambulance.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...ambulance,
            location: locationData ? {
              latitude: locationData.latitude,
              longitude: locationData.longitude
            } : undefined
          };
        })
      );

      setAmbulances(ambulancesWithLocations);
    } catch (error: any) {
      toast({
        title: "Error loading ambulances",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "en_route":
        return "bg-blue-500";
      case "on_scene":
        return "bg-yellow-500";
      case "returning":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Live Fleet Map</CardTitle>
            <CardDescription>Real-time ambulance locations and routes</CardDescription>
          </div>
          <Navigation className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {/* Map Placeholder - Will integrate Leaflet in next iteration */}
        <div className="relative h-[500px] rounded-lg border bg-muted/20">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Map integration coming soon</p>
              <p className="text-xs text-muted-foreground">Showing real-time ambulance data</p>
            </div>
          </div>

          {/* Ambulance Status Overlay */}
          <div className="absolute bottom-4 left-4 right-4 space-y-2">
            <div className="rounded-lg border bg-card p-3 shadow-sm">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Active Ambulances {loading ? "(Loading...)" : `(${ambulances.length})`}
              </p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {ambulances.length === 0 && !loading ? (
                  <p className="text-sm text-muted-foreground">No ambulances available</p>
                ) : (
                  ambulances.map((ambulance) => (
                    <div key={ambulance.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${getStatusColor(ambulance.status)}`} />
                        <span className="font-medium">{ambulance.vehicle_number}</span>
                        {ambulance.driver_name && (
                          <span className="text-muted-foreground">• {ambulance.driver_name}</span>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getStatusLabel(ambulance.status)}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
