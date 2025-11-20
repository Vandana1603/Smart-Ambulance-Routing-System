import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Clock, MapPin, Activity, LogOut, Home } from "lucide-react";

export default function Analytics() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<any[]>([]);
  const [utilizationData, setUtilizationData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    avgDuration: 0,
    avgDistance: 0,
    completionRate: 0,
  });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      await loadAnalytics();
    } catch (error) {
      console.error("Error checking access:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*");

    const { data: utilization } = await supabase
      .from("ambulance_utilization")
      .select("*");

    if (bookings) {
      const total = bookings.length;
      const completed = bookings.filter((b) => b.status === "completed").length;
      const avgDur = bookings.reduce((acc, b) => acc + (b.estimated_duration || 0), 0) / total;
      const avgDist = bookings.reduce((acc, b) => acc + (b.estimated_distance || 0), 0) / total;

      setStats({
        totalBookings: total,
        avgDuration: Math.round(avgDur),
        avgDistance: Math.round(avgDist),
        completionRate: Math.round((completed / total) * 100),
      });

      // Group by status for chart
      const statusCounts = bookings.reduce((acc: any, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      }, {});

      setBookingData(
        Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count,
        }))
      );
    }

    if (utilization) {
      setUtilizationData(utilization.slice(0, 10));
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading analytics...</div>
      </div>
    );
  }

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--warning))'];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Analytics & Reports</h1>
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

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgDuration} min</div>
              <p className="text-xs text-muted-foreground">Per trip</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Distance</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgDistance} km</div>
              <p className="text-xs text-muted-foreground">Per trip</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completionRate}%</div>
              <p className="text-xs text-muted-foreground">Success rate</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Booking Status Distribution</CardTitle>
              <CardDescription>Overview of all bookings by status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={bookingData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {bookingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ambulance Utilization</CardTitle>
              <CardDescription>Top 10 ambulances by trip count</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={utilizationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="vehicle_number" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_trips" fill="hsl(var(--primary))" name="Total Trips" />
                  <Bar dataKey="completed_trips" fill="hsl(var(--secondary))" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
