-- Fix security definer views by recreating them as regular views
DROP VIEW IF EXISTS public.booking_analytics CASCADE;
DROP VIEW IF EXISTS public.ambulance_utilization CASCADE;

-- Create analytics views without SECURITY DEFINER
CREATE VIEW public.booking_analytics 
WITH (security_invoker=true) AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
  AVG(estimated_duration) FILTER (WHERE estimated_duration IS NOT NULL) as avg_duration,
  AVG(estimated_distance) FILTER (WHERE estimated_distance IS NOT NULL) as avg_distance
FROM public.bookings
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

CREATE VIEW public.ambulance_utilization
WITH (security_invoker=true) AS
SELECT
  a.id,
  a.vehicle_number,
  a.driver_name,
  a.status,
  COUNT(b.id) as total_trips,
  COUNT(b.id) FILTER (WHERE b.status = 'completed') as completed_trips,
  AVG(b.estimated_duration) FILTER (WHERE b.estimated_duration IS NOT NULL) as avg_trip_duration
FROM public.ambulances a
LEFT JOIN public.bookings b ON b.ambulance_id = a.id
GROUP BY a.id, a.vehicle_number, a.driver_name, a.status;