import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ambulance, Phone, Clock, MapPin, Activity, Home, LogOut } from "lucide-react";
import { LiveMap } from "@/components/dispatcher/LiveMap";
import { CallQueue } from "@/components/dispatcher/CallQueue";
import { FleetStatus } from "@/components/dispatcher/FleetStatus";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DispatcherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<"overview" | "map" | "calls">("overview");
  const [stats, setStats] = useState({
    availableAmbulances: 0,
    totalAmbulances: 0,
    activeEmergencies: 0,
    pendingCalls: 0,
  });

  useEffect(() => {
    loadStats();

    // Subscribe to real-time updates
    const bookingsChannel = supabase
      .channel('stats-bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => loadStats()
      )
      .subscribe();

    const ambulancesChannel = supabase
      .channel('stats-ambulances')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ambulances'
        },
        () => loadStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(ambulancesChannel);
    };
  }, []);

  const loadStats = async () => {
    try {
      // Get ambulance stats
      const { data: ambulances, error: ambulancesError } = await supabase
        .from('ambulances')
        .select('status');

      if (ambulancesError) throw ambulancesError;

      const availableCount = ambulances?.filter(a => a.status === 'available').length || 0;
      const totalCount = ambulances?.length || 0;

      // Get booking stats
      const { data: activeBookings, error: activeError } = await supabase
        .from('bookings')
        .select('status')
        .in('status', ['assigned', 'en_route', 'on_scene']);

      if (activeError) throw activeError;

      const { data: pendingBookings, error: pendingError } = await supabase
        .from('bookings')
        .select('status')
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      setStats({
        availableAmbulances: availableCount,
        totalAmbulances: totalCount,
        activeEmergencies: activeBookings?.length || 0,
        pendingCalls: pendingBookings?.length || 0,
      });
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Ambulance className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Dispatcher Control Center</h1>
                <p className="text-sm text-muted-foreground">Real-time Emergency Coordination</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Activity className="h-3 w-3" />
                System Active
              </Badge>
              <Button variant="outline" size="sm" onClick={() => navigate("/")}>
                <Home className="h-4 w-4 mr-1" />
                Home
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate("/auth");
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Available Ambulances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{stats.availableAmbulances}</span>
                <Ambulance className="h-8 w-8 text-primary" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">of {stats.totalAmbulances} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Emergencies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{stats.activeEmergencies}</span>
                <Phone className="h-8 w-8 text-destructive" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{stats.pendingCalls}</span>
                <Clock className="h-8 w-8 text-warning" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">awaiting dispatch</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">Live</span>
                <MapPin className="h-8 w-8 text-accent" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">real-time updates</p>
            </CardContent>
          </Card>
        </div>

        {/* View Toggle */}
        <div className="mb-4 flex gap-2">
          <Button
            variant={activeView === "overview" ? "default" : "outline"}
            onClick={() => setActiveView("overview")}
          >
            Overview
          </Button>
          <Button
            variant={activeView === "map" ? "default" : "outline"}
            onClick={() => setActiveView("map")}
          >
            Map View
          </Button>
          <Button
            variant={activeView === "calls" ? "default" : "outline"}
            onClick={() => setActiveView("calls")}
          >
            Call Queue
          </Button>
        </div>

        {/* Dynamic Content Based on View */}
        {activeView === "overview" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <LiveMap />
            </div>
            <div className="space-y-6">
              <CallQueue compact />
              <FleetStatus compact />
            </div>
          </div>
        )}

        {activeView === "map" && <LiveMap />}

        {activeView === "calls" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <CallQueue />
            <FleetStatus />
          </div>
        )}
      </main>
    </div>
  );
};

export default DispatcherDashboard;
