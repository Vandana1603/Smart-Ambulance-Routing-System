import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, User, FileText, AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import LocationPickerMap from "@/components/emergency/LocationPickerMap";

export default function EmergencyBooking() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    pickup_location: "",
    pickup_latitude: 0,
    pickup_longitude: 0,
    dropoff_location: "",
    dropoff_latitude: 0,
    dropoff_longitude: 0,
    emergency_type: "",
    patient_name: "",
    patient_age: "",
    patient_contact: "",
    medical_notes: "",
  });

  const handlePickupLocationSelect = (location: {
    address: string;
    latitude: number;
    longitude: number;
  }) => {
    setFormData(prev => ({
      ...prev,
      pickup_location: location.address,
      pickup_latitude: location.latitude,
      pickup_longitude: location.longitude,
    }));
  };

  const handleDropoffLocationSelect = (location: {
    address: string;
    latitude: number;
    longitude: number;
  }) => {
    setFormData(prev => ({
      ...prev,
      dropoff_location: location.address,
      dropoff_latitude: location.latitude,
      dropoff_longitude: location.longitude,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-booking', {
        body: {
          ...formData,
          patient_age: formData.patient_age ? parseInt(formData.patient_age) : undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Emergency booking created",
        description: "Finding nearest ambulance...",
      });

      // Navigate to tracking page
      if (data?.booking?.id) {
        navigate(`/emergency/track/${data.booking.id}`);
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "Booking failed",
        description: error.message || "Failed to create emergency booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
      <div className="max-w-2xl mx-auto py-8">
        <Card className="border-destructive/20 shadow-xl">
          <CardHeader className="space-y-1 bg-destructive/5">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle className="text-2xl">Emergency Ambulance Booking</CardTitle>
            </div>
            <CardDescription>
              Please provide accurate information for faster response
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pickup Location Map */}
              <LocationPickerMap
                label="Pickup Location *"
                onLocationSelect={handlePickupLocationSelect}
                initialLocation={
                  formData.pickup_latitude && formData.pickup_longitude
                    ? {
                        latitude: formData.pickup_latitude,
                        longitude: formData.pickup_longitude,
                      }
                    : undefined
                }
                currentAddress={formData.pickup_location}
              />

              {/* Dropoff Location Map */}
              <LocationPickerMap
                label="Hospital/Destination *"
                onLocationSelect={handleDropoffLocationSelect}
                initialLocation={
                  formData.dropoff_latitude && formData.dropoff_longitude
                    ? {
                        latitude: formData.dropoff_latitude,
                        longitude: formData.dropoff_longitude,
                      }
                    : undefined
                }
                currentAddress={formData.dropoff_location}
              />

              {/* Emergency Type */}
              <div className="space-y-2">
                <Label htmlFor="emergency_type">Emergency Type *</Label>
                <Select
                  value={formData.emergency_type}
                  onValueChange={(value) => setFormData({ ...formData, emergency_type: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select emergency type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cardiac">Cardiac Emergency</SelectItem>
                    <SelectItem value="respiratory">Respiratory Emergency</SelectItem>
                    <SelectItem value="trauma">Trauma/Accident</SelectItem>
                    <SelectItem value="stroke">Stroke</SelectItem>
                    <SelectItem value="obstetric">Obstetric Emergency</SelectItem>
                    <SelectItem value="other">Other Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Patient Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient_name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Patient Name *
                  </Label>
                  <Input
                    id="patient_name"
                    placeholder="Full name"
                    value={formData.patient_name}
                    onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patient_age">Patient Age</Label>
                  <Input
                    id="patient_age"
                    type="number"
                    placeholder="Age"
                    value={formData.patient_age}
                    onChange={(e) => setFormData({ ...formData, patient_age: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="patient_contact" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact Number *
                </Label>
                <Input
                  id="patient_contact"
                  type="tel"
                  placeholder="Phone number"
                  value={formData.patient_contact}
                  onChange={(e) => setFormData({ ...formData, patient_contact: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medical_notes" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Medical Notes (Optional)
                </Label>
                <Textarea
                  id="medical_notes"
                  placeholder="Any relevant medical information, allergies, current medications..."
                  value={formData.medical_notes}
                  onChange={(e) => setFormData({ ...formData, medical_notes: e.target.value })}
                  rows={4}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                size="lg"
                disabled={loading}
              >
                {loading ? "Booking Ambulance..." : "Book Emergency Ambulance"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
