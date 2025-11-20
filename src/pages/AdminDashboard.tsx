import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Ambulance, LogOut, Shield, Home } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const hasAdminRole = roles?.some((r) => r.role === "admin");
      
      if (!hasAdminRole) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadData();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    const [profilesRes, ambulancesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("ambulances").select("*"),
      supabase.from("user_roles").select("*, profiles(full_name, phone_number)"),
    ]);

    if (profilesRes.data) setUsers(profilesRes.data);
    if (ambulancesRes.data) setAmbulances(ambulancesRes.data);
    if (rolesRes.data) setUserRoles(rolesRes.data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
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

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users & Roles
            </TabsTrigger>
            <TabsTrigger value="fleet">
              <Ambulance className="h-4 w-4 mr-2" />
              Fleet Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage users and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const roles = userRoles.filter((r) => r.user_id === user.id);
                      return (
                        <TableRow key={user.id}>
                          <TableCell>{user.full_name || "N/A"}</TableCell>
                          <TableCell>{user.phone_number || "N/A"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {roles.length > 0 ? (
                                roles.map((r) => (
                                  <Badge key={r.id} variant="secondary">
                                    {r.role}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="outline">No roles</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fleet">
            <Card>
              <CardHeader>
                <CardTitle>Fleet Management</CardTitle>
                <CardDescription>Monitor and manage ambulance fleet</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle Number</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ambulances.map((ambulance) => (
                      <TableRow key={ambulance.id}>
                        <TableCell className="font-medium">
                          {ambulance.vehicle_number}
                        </TableCell>
                        <TableCell>{ambulance.driver_name || "Unassigned"}</TableCell>
                        <TableCell>{ambulance.driver_contact || "N/A"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              ambulance.status === "available"
                                ? "default"
                                : ambulance.status === "on_call"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {ambulance.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(ambulance.updated_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
