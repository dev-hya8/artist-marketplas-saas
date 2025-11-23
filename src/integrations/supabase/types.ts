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
      artist_settings: {
        Row: {
          avatar_url: string | null
          bio_image_url: string | null
          bio_text: string | null
          contact_email: string | null
          created_at: string | null
          currency_region: string | null
          cv_awards: string | null
          cv_education: string | null
          cv_exhibitions: string | null
          display_name: string
          email_alerts_enabled: boolean | null
          facebook_handle: string | null
          id: string
          instagram_handle: string | null
          measurement_unit: string | null
          phone_number: string | null
          primary_contact_method: string | null
          public_profile_enabled: boolean | null
          tiktok_handle: string | null
          twitter_handle: string | null
          upcoming_events: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio_image_url?: string | null
          bio_text?: string | null
          contact_email?: string | null
          created_at?: string | null
          currency_region?: string | null
          cv_awards?: string | null
          cv_education?: string | null
          cv_exhibitions?: string | null
          display_name?: string
          email_alerts_enabled?: boolean | null
          facebook_handle?: string | null
          id?: string
          instagram_handle?: string | null
          measurement_unit?: string | null
          phone_number?: string | null
          primary_contact_method?: string | null
          public_profile_enabled?: boolean | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          upcoming_events?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio_image_url?: string | null
          bio_text?: string | null
          contact_email?: string | null
          created_at?: string | null
          currency_region?: string | null
          cv_awards?: string | null
          cv_education?: string | null
          cv_exhibitions?: string | null
          display_name?: string
          email_alerts_enabled?: boolean | null
          facebook_handle?: string | null
          id?: string
          instagram_handle?: string | null
          measurement_unit?: string | null
          phone_number?: string | null
          primary_contact_method?: string | null
          public_profile_enabled?: boolean | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          upcoming_events?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      artwork_gallery: {
        Row: {
          artwork_id: string
          created_at: string | null
          id: string
          image_url: string
        }
        Insert: {
          artwork_id: string
          created_at?: string | null
          id?: string
          image_url: string
        }
        Update: {
          artwork_id?: string
          created_at?: string | null
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "artwork_gallery_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
        ]
      }
      artworks: {
        Row: {
          auction_end_time: string | null
          base_currency: string | null
          bid_history: Json | null
          buyer_email: string | null
          created_at: string | null
          current_bid: number | null
          depth: number | null
          dimension_unit: string | null
          dimensions: string | null
          id: string
          image_url: string | null
          location: string | null
          medium: string | null
          min_bid_increment: number | null
          price: number | null
          provenance_log: string | null
          sale_type: string | null
          status: Database["public"]["Enums"]["artwork_status"]
          title: string
          updated_at: string | null
          winner_name: string | null
        }
        Insert: {
          auction_end_time?: string | null
          base_currency?: string | null
          bid_history?: Json | null
          buyer_email?: string | null
          created_at?: string | null
          current_bid?: number | null
          depth?: number | null
          dimension_unit?: string | null
          dimensions?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          medium?: string | null
          min_bid_increment?: number | null
          price?: number | null
          provenance_log?: string | null
          sale_type?: string | null
          status?: Database["public"]["Enums"]["artwork_status"]
          title: string
          updated_at?: string | null
          winner_name?: string | null
        }
        Update: {
          auction_end_time?: string | null
          base_currency?: string | null
          bid_history?: Json | null
          buyer_email?: string | null
          created_at?: string | null
          current_bid?: number | null
          depth?: number | null
          dimension_unit?: string | null
          dimensions?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          medium?: string | null
          min_bid_increment?: number | null
          price?: number | null
          provenance_log?: string | null
          sale_type?: string | null
          status?: Database["public"]["Enums"]["artwork_status"]
          title?: string
          updated_at?: string | null
          winner_name?: string | null
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          artwork_id: string | null
          created_at: string | null
          email: string
          id: string
          is_favorite: boolean
          is_read: boolean
          message: string
          name: string
          status: string
        }
        Insert: {
          artwork_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_favorite?: boolean
          is_read?: boolean
          message: string
          name: string
          status?: string
        }
        Update: {
          artwork_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_favorite?: boolean
          is_read?: boolean
          message?: string
          name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          facebook: string | null
          full_name: string | null
          id: string
          instagram: string | null
          phone: string | null
          twitter: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          facebook?: string | null
          full_name?: string | null
          id: string
          instagram?: string | null
          phone?: string | null
          twitter?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          facebook?: string | null
          full_name?: string | null
          id?: string
          instagram?: string | null
          phone?: string | null
          twitter?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      Profiles: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
      app_role: "admin" | "user"
      artwork_status: "Available" | "Sold" | "On Loan" | "Reserved"
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
      app_role: ["admin", "user"],
      artwork_status: ["Available", "Sold", "On Loan", "Reserved"],
    },
  },
} as const
