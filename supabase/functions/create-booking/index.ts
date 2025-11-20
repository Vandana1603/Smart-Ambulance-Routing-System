import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingRequest {
  pickup_location: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_location: string;
  dropoff_latitude: number;
  dropoff_longitude: number;
  emergency_type: string;
  patient_name: string;
  patient_age?: number;
  patient_contact: string;
  medical_notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const bookingData: BookingRequest = await req.json();

    console.log('Creating booking:', bookingData);

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        pickup_location: bookingData.pickup_location,
        pickup_latitude: bookingData.pickup_latitude,
        pickup_longitude: bookingData.pickup_longitude,
        dropoff_location: bookingData.dropoff_location,
        dropoff_latitude: bookingData.dropoff_latitude,
        dropoff_longitude: bookingData.dropoff_longitude,
        emergency_type: bookingData.emergency_type,
        patient_name: bookingData.patient_name,
        patient_age: bookingData.patient_age,
        patient_contact: bookingData.patient_contact,
        medical_notes: bookingData.medical_notes,
        status: 'pending',
      })
      .select()
      .single();

    if (bookingError) {
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    console.log('Booking created:', booking.id);

    // Trigger ambulance assignment
    try {
      const assignResponse = await supabase.functions.invoke('assign-ambulance', {
        body: {
          bookingId: booking.id,
          pickupLocation: {
            latitude: bookingData.pickup_latitude,
            longitude: bookingData.pickup_longitude,
          },
        },
      });

      if (assignResponse.error) {
        console.error('Failed to assign ambulance:', assignResponse.error);
      } else {
        console.log('Ambulance assigned successfully');
      }
    } catch (assignError) {
      console.error('Error calling assign-ambulance:', assignError);
      // Don't throw - booking is created, assignment can be retried
    }

    return new Response(
      JSON.stringify({ booking }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating booking:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
