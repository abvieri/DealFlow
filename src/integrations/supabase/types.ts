export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }

      proposal_items: {
        Row: {
          created_at: string
          id: string
          proposal_id: string
          service_plan_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          proposal_id: string
          service_plan_id: string
        }
        Update: {
          created_at?: string
          id?: string
          proposal_id?: string
          service_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_items_service_plan_id_fkey"
            columns: ["service_plan_id"]
            isOneToOne: false
            referencedRelation: "service_plans"
            referencedColumns: ["id"]
          },
        ]
      }

      proposal_templates: {
        Row: {
          created_at: string
          id: string
          template_items: Json
          template_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          template_items?: Json
          template_name: string
        }
        Update: {
          created_at?: string
          id?: string
          template_items?: Json
          template_name?: string
        }
        Relationships: []
      }

      proposals: {
        Row: {
          client_id: string | null
          created_at: string
          discount_value: number | null
          id: string
          status: string
          total_monthly: number
          total_setup: number
          updated_at: string
          user_id: string | null
          version: number | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          discount_value?: number | null
          id?: string
          status?: string
          total_monthly?: number
          total_setup?: number
          updated_at?: string
          user_id?: string | null
          version?: number | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          discount_value?: number | null
          id?: string
          status?: string
          total_monthly?: number
          total_setup?: number
          updated_at?: string
          user_id?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }

      service_plans: {
        Row: {
          created_at: string
          deliverables: string | null
          delivery_time_days: number | null
          id: string
          monthly_fee: number
          plan_name: string
          service_id: string
          setup_fee: number
        }
        Insert: {
          created_at?: string
          deliverables?: string | null
          delivery_time_days?: number | null
          id?: string
          monthly_fee?: number
          plan_name: string
          service_id: string
          setup_fee?: number
        }
        Update: {
          created_at?: string
          deliverables?: string | null
          delivery_time_days?: number | null
          id?: string
          monthly_fee?: number
          plan_name?: string
          service_id?: string
          setup_fee?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_plans_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      
      categories: {
        Row: {
          id: number
          name: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          created_at?: string
        }
        Relationships: []
      }

      services: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          category_id: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          category_id?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          category_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
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
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends { Row: infer R }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends { Row: infer R }
      ? R
      : never
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const