export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          alert_type: string
          ambulance_id: string | null
          booking_id: string | null
          created_at: string
          delivered_at: string | null
          id: string
          message: string
          recipient_id: string | null
          recipient_type: string
          sent_at: string | null
          status: string
        }
        Insert: {
          alert_type: string
          ambulance_id?: string | null
          booking_id?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          message: string
          recipient_id?: string | null
          recipient_type: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          alert_type?: string
          ambulance_id?: string | null
          booking_id?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          message?: string
          recipient_id?: string | null
          recipient_type?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_ambulance_id_fkey"
            columns: ["ambulance_id"]
            isOneToOne: false
            referencedRelation: "ambulance_utilization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_ambulance_id_fkey"
            columns: ["ambulance_id"]
            isOneToOne: false
            referencedRelation: "ambulances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      ambulance_locations: {
        Row: {
          ambulance_id: string
          id: string
          latitude: number
          longitude: number
          updated_at: string
        }
        Insert: {
          ambulance_id: string
          id?: string
          latitude: number
          longitude: number
          updated_at?: string
        }
        Update: {
          ambulance_id?: string
          id?: string
          latitude?: number
          longitude?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambulance_locations_ambulance_id_fkey"
            columns: ["ambulance_id"]
            isOneToOne: false
            referencedRelation: "ambulance_utilization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambulance_locations_ambulance_id_fkey"
            columns: ["ambulance_id"]
            isOneToOne: false
            referencedRelation: "ambulances"
            referencedColumns: ["id"]
          },
        ]
      }
      ambulances: {
        Row: {
          created_at: string
          driver_contact: string | null
          driver_name: string | null
          id: string
          status: string
          updated_at: string
          vehicle_number: string
        }
        Insert: {
          created_at?: string
          driver_contact?: string | null
          driver_name?: string | null
          id?: string
          status?: string
          updated_at?: string
          vehicle_number: string
        }
        Update: {
          created_at?: string
          driver_contact?: string | null
          driver_name?: string | null
          id?: string
          status?: string
          updated_at?: string
          vehicle_number?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          ambulance_id: string | null
          created_at: string
          dropoff_latitude: number | null
          dropoff_location: string
          dropoff_longitude: number | null
          emergency_type: string
          estimated_distance: number | null
          estimated_duration: number | null
          id: string
          medical_notes: string | null
          patient_age: number | null
          patient_contact: string
          patient_name: string
          pickup_latitude: number | null
          pickup_location: string
          pickup_longitude: number | null
          status: string
          updated_at: string
        }
        Insert: {
          ambulance_id?: string | null
          created_at?: string
          dropoff_latitude?: number | null
          dropoff_location: string
          dropoff_longitude?: number | null
          emergency_type: string
          estimated_distance?: number | null
          estimated_duration?: number | null
          id?: string
          medical_notes?: string | null
          patient_age?: number | null
          patient_contact: string
          patient_name: string
          pickup_latitude?: number | null
          pickup_location: string
          pickup_longitude?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          ambulance_id?: string | null
          created_at?: string
          dropoff_latitude?: number | null
          dropoff_location?: string
          dropoff_longitude?: number | null
          emergency_type?: string
          estimated_distance?: number | null
          estimated_duration?: number | null
          id?: string
          medical_notes?: string | null
          patient_age?: number | null
          patient_contact?: string
          patient_name?: string
          pickup_latitude?: number | null
          pickup_location?: string
          pickup_longitude?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_ambulance_id_fkey"
            columns: ["ambulance_id"]
            isOneToOne: false
            referencedRelation: "ambulance_utilization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_ambulance_id_fkey"
            columns: ["ambulance_id"]
            isOneToOne: false
            referencedRelation: "ambulances"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          address: string
          contact_email: string | null
          contact_phone: string
          created_at: string
          id: string
          latitude: number
          longitude: number
          name: string
          updated_at: string
        }
        Insert: {
          address: string
          contact_email?: string | null
          contact_phone: string
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          name: string
          updated_at?: string
        }
        Update: {
          address?: string
          contact_email?: string | null
          contact_phone?: string
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          message_text: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          message_text: string
          sender_id: string
          sender_type: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          message_text?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      nearby_users: {
        Row: {
          created_at: string
          id: string
          is_subscribed: boolean
          latitude: number
          longitude: number
          phone_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_subscribed?: boolean
          latitude: number
          longitude: number
          phone_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_subscribed?: boolean
          latitude?: number
          longitude?: number
          phone_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      ambulance_utilization: {
        Row: {
          avg_trip_duration: number | null
          completed_trips: number | null
          driver_name: string | null
          id: string | null
          status: string | null
          total_trips: number | null
          vehicle_number: string | null
        }
        Relationships: []
      }
      booking_analytics: {
        Row: {
          avg_distance: number | null
          avg_duration: number | null
          cancelled_bookings: number | null
          completed_bookings: number | null
          date: string | null
          total_bookings: number | null
        }
        Relationships: []
      }
      system_overview: {
        Row: {
          active_trips: number | null
          assigned_bookings: number | null
          available_ambulances: number | null
          busy_ambulances: number | null
          completed_bookings: number | null
          pending_bookings: number | null
          total_ambulances: number | null
          total_bookings: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "dispatcher" | "driver" | "patient"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "dispatcher", "driver", "patient"],
    },
  },
} as const
