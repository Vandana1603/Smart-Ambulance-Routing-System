import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssignmentRequest {
  bookingId: string;
  pickupLocation: { lat: number; lng: number };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId, pickupLocation }: AssignmentRequest = await req.json();

    console.log('Finding ambulance for booking:', bookingId);

    // Get all available ambulances with their latest location
    const { data: ambulances, error: ambulanceError } = await supabase
      .from('ambulances')
      .select(`
        id,
        vehicle_number,
        driver_id
      `)
      .eq('status', 'available');

    if (ambulanceError) {
      throw new Error(`Failed to fetch ambulances: ${ambulanceError.message}`);
    }

    if (!ambulances || ambulances.length === 0) {
      throw new Error('No available ambulances found');
    }

    console.log(`Found ${ambulances.length} available ambulances`);

    // Get driver locations for available ambulances
    const driverIds = ambulances.map(a => a.driver_id).filter(Boolean);
    
    const { data: locations, error: locationError } = await supabase
      .from('location_tracking')
      .select('driver_id, latitude, longitude, timestamp')
      .in('driver_id', driverIds)
      .order('timestamp', { ascending: false });

    if (locationError) {
      console.error('Error fetching locations:', locationError);
    }

    // Get latest location for each driver
    const latestLocations = new Map();
    locations?.forEach(loc => {
      if (!latestLocations.has(loc.driver_id)) {
        latestLocations.set(loc.driver_id, loc);
      }
    });

    // Calculate routes for each ambulance
    const routePromises = ambulances.map(async (ambulance) => {
      const driverLocation = latestLocations.get(ambulance.driver_id);
      
      if (!driverLocation) {
        return { ambulance, route: null };
      }

      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${driverLocation.longitude},${driverLocation.latitude};${pickupLocation.lng},${pickupLocation.lat}?overview=false`;
        const response = await fetch(osrmUrl);
        const data = await response.json();

        if (data.code === 'Ok' && data.routes?.[0]) {
          return {
            ambulance,
            route: {
              distance: data.routes[0].distance,
              duration: data.routes[0].duration,
            },
          };
        }
      } catch (error) {
        console.error(`Error calculating route for ambulance ${ambulance.id}:`, error);
      }

      return { ambulance, route: null };
    });

    const results = await Promise.all(routePromises);
    
    // Filter out ambulances without valid routes and find the closest one
    const validResults = results.filter(r => r.route !== null);
    
    if (validResults.length === 0) {
      throw new Error('Could not calculate routes to any ambulances');
    }

    const closest = validResults.reduce((min, current) => 
      current.route!.duration < min.route!.duration ? current : min
    );

    console.log(`Assigning ambulance ${closest.ambulance.id} with ETA ${Math.round(closest.route!.duration / 60)} minutes`);

    // Update booking with assigned ambulance
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        ambulance_id: closest.ambulance.id,
        status: 'assigned',
        estimated_arrival: new Date(Date.now() + closest.route!.duration * 1000).toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      throw new Error(`Failed to update booking: ${updateError.message}`);
    }

    // Update ambulance status
    const { error: statusError } = await supabase
      .from('ambulances')
      .update({ status: 'en_route' })
      .eq('id', closest.ambulance.id);

    if (statusError) {
      console.error('Failed to update ambulance status:', statusError);
    }

    return new Response(
      JSON.stringify({
        ambulanceId: closest.ambulance.id,
        eta: closest.route!.duration,
        distance: closest.route!.distance,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error assigning ambulance:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
