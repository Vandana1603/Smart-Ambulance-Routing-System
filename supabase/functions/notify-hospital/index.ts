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

    const { 
      bookingId, 
      ambulanceId, 
      dropoffLatitude, 
      dropoffLongitude, 
      estimatedDuration,
      patientInfo 
    } = await req.json();

    console.log(`Finding nearest hospital to dropoff location: ${dropoffLatitude}, ${dropoffLongitude}`);

    // Find all hospitals
    const { data: hospitals, error: hospitalsError } = await supabaseClient
      .from('hospitals')
      .select('*');

    if (hospitalsError) {
      console.error('Error fetching hospitals:', hospitalsError);
      throw hospitalsError;
    }

    // Find nearest hospital
    let nearestHospital: any = null;
    let minDistance = Infinity;

    hospitals?.forEach(hospital => {
      const distance = calculateDistance(
        dropoffLatitude, 
        dropoffLongitude, 
        hospital.latitude, 
        hospital.longitude
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestHospital = hospital;
      }
    });

    if (!nearestHospital) {
      throw new Error('No hospitals found');
    }

    console.log(`Nearest hospital: ${nearestHospital.name}, Distance: ${minDistance.toFixed(2)}km`);

    // Calculate ETA in minutes
    const etaMinutes = Math.ceil(estimatedDuration / 60);

    // Create hospital notification alert
    const { data: alert, error: alertError } = await supabaseClient
      .from('alerts')
      .insert({
        booking_id: bookingId,
        ambulance_id: ambulanceId,
        alert_type: 'hospital',
        recipient_type: 'hospital',
        recipient_id: nearestHospital.contact_email,
        message: `Incoming emergency patient. ETA: ${etaMinutes} minutes. Ambulance ID: ${ambulanceId}. Patient Info: ${patientInfo}`,
        status: 'pending'
      })
      .select()
      .single();

    if (alertError) {
      console.error('Error creating hospital alert:', alertError);
      throw alertError;
    }

    console.log(`Hospital notification created: ${alert.id}`);

    // Update booking with hospital destination
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({ 
        dropoff_location: nearestHospital.address,
        dropoff_latitude: nearestHospital.latitude,
        dropoff_longitude: nearestHospital.longitude
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        hospital: {
          id: nearestHospital.id,
          name: nearestHospital.name,
          address: nearestHospital.address,
          contact: nearestHospital.contact_phone,
          distance: minDistance.toFixed(2)
        },
        eta: etaMinutes,
        alertId: alert.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in notify-hospital:', error);
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
