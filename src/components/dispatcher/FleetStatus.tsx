import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ambulance, MapPin, User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface FleetStatusProps {
  compact?: boolean;
}

interface AmbulanceWithLocation {
  id: string;
  vehicle_number: string;
  driver_name: string | null;
  driver_contact: string | null;
  status: string;
  updated_at: string;
  location?: {
    latitude: number;
    longitude: number;
    updated_at: string;
  };
}

export const FleetStatus = ({ compact = false }: FleetStatusProps) => {
  const [fleet, setFleet] = useState<AmbulanceWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFleet();

    // Subscribe to ambulance changes
    const ambulanceChannel = supabase
      .channel('fleet-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ambulances'
        },
        () => {
          loadFleet();
        }
      )
      .subscribe();

    // Subscribe to location updates
    const locationChannel = supabase
      .channel('fleet-location-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ambulance_locations'
        },
        () => {
          loadFleet();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ambulanceChannel);
      supabase.removeChannel(locationChannel);
    };
  }, []);

  const loadFleet = async () => {
    try {
      const { data: ambulancesData, error: ambulancesError } = await supabase
        .from('ambulances')
        .select('*')
        .order('vehicle_number', { ascending: true });

      if (ambulancesError) throw ambulancesError;

      // Get latest locations for each ambulance
      const fleetWithLocations = await Promise.all(
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
              longitude: locationData.longitude,
              updated_at: locationData.updated_at
            } : undefined
          };
        })
      );

      setFleet(fleetWithLocations);
    } catch (error: any) {
      toast({
        title: "Error loading fleet",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case "available":
        return "default";
      case "en_route":
        return "secondary";
      case "on_scene":
        return "outline";
      case "returning":
        return "secondary";
      default:
        return "outline";
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
            <CardTitle>Fleet Status</CardTitle>
            <CardDescription>Real-time vehicle availability</CardDescription>
          </div>
          <Ambulance className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading fleet data...
          </div>
        ) : fleet.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No ambulances in the system
          </div>
        ) : compact ? (
          <div className="space-y-3">
            {fleet.slice(0, 4).map((vehicle) => (
              <div key={vehicle.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Ambulance className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{vehicle.vehicle_number}</p>
                    <p className="text-xs text-muted-foreground">{vehicle.driver_name || 'No driver assigned'}</p>
                  </div>
                </div>
                <Badge variant={getStatusVariant(vehicle.status)}>
                  {getStatusLabel(vehicle.status)}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fleet.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{vehicle.vehicle_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {vehicle.location 
                          ? `${vehicle.location.latitude.toFixed(4)}, ${vehicle.location.longitude.toFixed(4)}`
                          : 'No location data'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {vehicle.driver_name || 'Not assigned'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(vehicle.status)}>
                      {getStatusLabel(vehicle.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {vehicle.location 
                      ? formatDistanceToNow(new Date(vehicle.location.updated_at), { addSuffix: true })
                      : formatDistanceToNow(new Date(vehicle.updated_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost">
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
