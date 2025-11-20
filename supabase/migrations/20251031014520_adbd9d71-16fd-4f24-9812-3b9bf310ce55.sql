-- Create ambulances table
CREATE TABLE public.ambulances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_number TEXT NOT NULL UNIQUE,
  driver_name TEXT,
  driver_contact TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'offline')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ambulance_locations table for real-time tracking
CREATE TABLE public.ambulance_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ambulance_id UUID NOT NULL REFERENCES public.ambulances(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pickup_location TEXT NOT NULL,
  pickup_latitude DOUBLE PRECISION,
  pickup_longitude DOUBLE PRECISION,
  dropoff_location TEXT NOT NULL,
  dropoff_latitude DOUBLE PRECISION,
  dropoff_longitude DOUBLE PRECISION,
  emergency_type TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_age INTEGER,
  patient_contact TEXT NOT NULL,
  medical_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'en_route', 'arrived', 'completed', 'cancelled')),
  ambulance_id UUID REFERENCES public.ambulances(id),
  estimated_duration INTEGER,
  estimated_distance INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ambulances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulance_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ambulances (public read, authenticated write)
CREATE POLICY "Anyone can view ambulances"
ON public.ambulances FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can update ambulances"
ON public.ambulances FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can insert ambulances"
ON public.ambulances FOR INSERT
WITH CHECK (true);

-- RLS Policies for ambulance_locations (public read, authenticated write)
CREATE POLICY "Anyone can view ambulance locations"
ON public.ambulance_locations FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can update locations"
ON public.ambulance_locations FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can insert locations"
ON public.ambulance_locations FOR INSERT
WITH CHECK (true);

-- RLS Policies for bookings (public read/write for MVP)
CREATE POLICY "Anyone can view bookings"
ON public.bookings FOR SELECT
USING (true);

CREATE POLICY "Anyone can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update bookings"
ON public.bookings FOR UPDATE
USING (true);

-- Create indexes for performance
CREATE INDEX idx_ambulances_status ON public.ambulances(status);
CREATE INDEX idx_ambulance_locations_ambulance_id ON public.ambulance_locations(ambulance_id);
CREATE INDEX idx_ambulance_locations_updated_at ON public.ambulance_locations(updated_at DESC);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_ambulance_id ON public.bookings(ambulance_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_ambulances_updated_at
BEFORE UPDATE ON public.ambulances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.ambulance_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- Insert sample ambulances for testing
INSERT INTO public.ambulances (id, vehicle_number, driver_name, driver_contact, status) VALUES
('d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a', 'AMB-001', 'John Doe', '+1234567890', 'available'),
('e2f3a4b5-c6d7-8e9f-0a1b-2c3d4e5f6a7b', 'AMB-002', 'Jane Smith', '+1234567891', 'available'),
('f3a4b5c6-d7e8-9f0a-1b2c-3d4e5f6a7b8c', 'AMB-003', 'Mike Johnson', '+1234567892', 'available');