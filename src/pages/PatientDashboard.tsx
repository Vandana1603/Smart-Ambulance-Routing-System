import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Ambulance, Clock, MapPin, Phone, Home, LogOut, AlertCircle, Plus } from "lucide-react";

interface Booking {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  emergency_type: string;
  status: string;
  created_at: string;
}

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  // Real-time updates for bookings
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('patient-bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          checkAuth();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);
      await loadBookings(session.user.email || "");
    } catch (error) {
      console.error("Error checking auth:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async (userEmail: string) => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("patient_contact", userEmail)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error loading bookings:", error);
      return;
    }

    if (data) {
      setBookings(data);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Ambulance className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Patient Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/")} variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button onClick={handleSignOut} variant="ghost" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Quick Actions */}
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Emergency Actions
            </CardTitle>
            <CardDescription>Quick access to emergency services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={() => navigate("/emergency/book")}
                className="h-20 text-lg bg-destructive hover:bg-destructive/90"
              >
                <Plus className="h-5 w-5 mr-2" />
                Book Emergency Ambulance
              </Button>
              <Button 
                variant="outline"
                className="h-20 text-lg"
                onClick={() => window.open("tel:911")}
              >
                <Phone className="h-5 w-5 mr-2" />
                Call Emergency Services
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Ambulance className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bookings.filter(b => ['pending', 'assigned', 'en_route'].includes(b.status)).length}
              </div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bookings.filter(b => b.status === 'completed').length}
              </div>
              <p className="text-xs text-muted-foreground">Successfully completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Booking History */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Your emergency ambulance booking history</CardDescription>
          </CardHeader>
          <CardContent>
            {bookings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Pickup Location</TableHead>
                    <TableHead>Emergency Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        {new Date(booking.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {booking.pickup_location}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{booking.emergency_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/emergency/track/${booking.id}`)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Ambulance className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You haven't made any emergency ambulance bookings
                </p>
                <Button onClick={() => navigate("/emergency/book")}>
                  Book Your First Ambulance
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
