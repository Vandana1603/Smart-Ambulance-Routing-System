import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { ambulanceId, latitude, longitude, bookingId } = await req.json();

    console.log(`Checking for nearby users around lat: ${latitude}, lng: ${longitude}`);

    // Find nearby users within 1km radius
    // Using simple distance calculation (in real deployment, use PostGIS st_dwithin)
    const { data: nearbyUsers, error: usersError } = await supabaseClient
      .from('nearby_users')
      .select('*')
      .eq('is_subscribed', true);

    if (usersError) {
      console.error('Error fetching nearby users:', usersError);
      throw usersError;
    }

    // Filter users within 1km using Haversine formula
    const alertRecipients = nearbyUsers?.filter(user => {
      const distance = calculateDistance(latitude, longitude, user.latitude, user.longitude);
      return distance <= 1.0; // 1km radius
    }) || [];

    console.log(`Found ${alertRecipients.length} nearby users within 1km`);

    // Create alerts for each nearby user
    const alertPromises = alertRecipients.map(async (user) => {
      const { error: alertError } = await supabaseClient
        .from('alerts')
        .insert({
          booking_id: bookingId,
          ambulance_id: ambulanceId,
          alert_type: 'proximity',
          recipient_type: 'nearby_user',
          recipient_id: user.phone_number,
          message: `Emergency ambulance approaching your area. Please clear the way. Ambulance ID: ${ambulanceId}`,
          status: 'pending'
        });

      if (alertError) {
        console.error(`Error creating alert for user ${user.phone_number}:`, alertError);
      } else {
        console.log(`Alert created for user ${user.phone_number}`);
      }
    });

    await Promise.all(alertPromises);

    return new Response(
      JSON.stringify({
        success: true,
        alertsSent: alertRecipients.length,
        recipients: alertRecipients.map(u => u.phone_number)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in send-proximity-alerts:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Haversine formula to calculate distance between two coordinates in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
