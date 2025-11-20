-- Create hospitals table for hospital notifications
CREATE TABLE IF NOT EXISTS public.hospitals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  address text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  contact_phone text NOT NULL,
  contact_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create alerts table for flash alerts and notifications
CREATE TABLE IF NOT EXISTS public.alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  ambulance_id uuid REFERENCES public.ambulances(id) ON DELETE CASCADE,
  alert_type text NOT NULL, -- 'proximity', 'hospital', 'traffic_clearance'
  recipient_type text NOT NULL, -- 'hospital', 'nearby_user', 'dispatcher'
  recipient_id text, -- phone number, email, or user id
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create messages table for dispatcher-driver communication
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_type text NOT NULL, -- 'driver', 'dispatcher'
  sender_id text NOT NULL,
  message_text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create nearby users table for flash alert recipients
CREATE TABLE IF NOT EXISTS public.nearby_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number text NOT NULL UNIQUE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  is_subscribed boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nearby_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hospitals (public read)
CREATE POLICY "Anyone can view hospitals"
  ON public.hospitals FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert hospitals"
  ON public.hospitals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update hospitals"
  ON public.hospitals FOR UPDATE
  USING (true);

-- RLS Policies for alerts
CREATE POLICY "Anyone can view alerts"
  ON public.alerts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update alerts"
  ON public.alerts FOR UPDATE
  USING (true);

-- RLS Policies for messages
CREATE POLICY "Anyone can view messages"
  ON public.messages FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (true);

-- RLS Policies for nearby_users
CREATE POLICY "Anyone can view nearby users"
  ON public.nearby_users FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert nearby users"
  ON public.nearby_users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update nearby users"
  ON public.nearby_users FOR UPDATE
  USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_hospitals_updated_at
  BEFORE UPDATE ON public.hospitals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nearby_users_updated_at
  BEFORE UPDATE ON public.nearby_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

-- Insert sample hospitals
INSERT INTO public.hospitals (name, address, latitude, longitude, contact_phone, contact_email) VALUES
  ('City General Hospital', '123 Hospital Ave, Downtown', 40.7128, -74.0060, '+1-555-0100', 'emergency@citygeneral.com'),
  ('North District Medical Center', '456 Medical Blvd, North', 40.7580, -73.9855, '+1-555-0200', 'er@northmedical.com'),
  ('East Side Emergency Hospital', '789 Emergency Lane, East', 40.7489, -73.9680, '+1-555-0300', 'contact@eastside.com');
