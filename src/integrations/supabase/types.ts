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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      archive_settings: {
        Row: {
          archive_converted: string | null
          archive_converted_custom_day: number | null
          archive_inactive_days: number | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archive_converted?: string | null
          archive_converted_custom_day?: number | null
          archive_inactive_days?: number | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          archive_converted?: string | null
          archive_converted_custom_day?: number | null
          archive_inactive_days?: number | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audiences: {
        Row: {
          created_at: string
          criteria: string[] | null
          description: string | null
          id: string
          name: string
          segment: string | null
          size: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          criteria?: string[] | null
          description?: string | null
          id?: string
          name: string
          segment?: string | null
          size?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          criteria?: string[] | null
          description?: string | null
          id?: string
          name?: string
          segment?: string | null
          size?: number | null
          user_id?: string
        }
        Relationships: []
      }
      campaign_field_definitions: {
        Row: {
          campaign_id: string
          created_at: string
          field_name: string
          field_order: number
          field_type: string
          id: string
          options: Json | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          field_name: string
          field_order?: number
          field_type?: string
          id?: string
          options?: Json | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          field_name?: string
          field_order?: number
          field_type?: string
          id?: string
          options?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_field_definitions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_lead_notes: {
        Row: {
          campaign_id: string
          content: string
          created_at: string
          id: string
          lead_id: string
        }
        Insert: {
          campaign_id: string
          content: string
          created_at?: string
          id?: string
          lead_id: string
        }
        Update: {
          campaign_id?: string
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_lead_notes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_leads: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          campaign_id: string
          close_probability: number | null
          converted_at: string | null
          created_at: string
          current_step_id: string | null
          deal_value: number
          has_upcoming_event: boolean
          id: string
          last_event_datetime: string | null
          lead_id: string
          next_event_datetime: string | null
          pinned_note: string | null
          priority: string
          reminder_at: string | null
          status: string
          step_index: number
          updated_at: string | null
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          campaign_id: string
          close_probability?: number | null
          converted_at?: string | null
          created_at?: string
          current_step_id?: string | null
          deal_value?: number
          has_upcoming_event?: boolean
          id?: string
          last_event_datetime?: string | null
          lead_id: string
          next_event_datetime?: string | null
          pinned_note?: string | null
          priority?: string
          reminder_at?: string | null
          status?: string
          step_index?: number
          updated_at?: string | null
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          campaign_id?: string
          close_probability?: number | null
          converted_at?: string | null
          created_at?: string
          current_step_id?: string | null
          deal_value?: number
          has_upcoming_event?: boolean
          id?: string
          last_event_datetime?: string | null
          lead_id?: string
          next_event_datetime?: string | null
          pinned_note?: string | null
          priority?: string
          reminder_at?: string | null
          status?: string
          step_index?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_leads_current_step_id_fkey"
            columns: ["current_step_id"]
            isOneToOne: false
            referencedRelation: "message_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_leads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_template_steps: {
        Row: {
          created_at: string
          id: string
          is_conversion: boolean
          step_name: string
          step_order: number
          template_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_conversion?: boolean
          step_name?: string
          step_order?: number
          template_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_conversion?: boolean
          step_name?: string
          step_order?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_template_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "campaign_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_templates: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          audience_id: string | null
          campaign_template_id: string | null
          created_at: string
          default_lead_template_id: string | null
          id: string
          investment: number
          name: string
          prospecting_status: string
          script_set_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          audience_id?: string | null
          campaign_template_id?: string | null
          created_at?: string
          default_lead_template_id?: string | null
          id?: string
          investment?: number
          name: string
          prospecting_status?: string
          script_set_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          audience_id?: string | null
          campaign_template_id?: string | null
          created_at?: string
          default_lead_template_id?: string | null
          id?: string
          investment?: number
          name?: string
          prospecting_status?: string
          script_set_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_audience_id_fkey"
            columns: ["audience_id"]
            isOneToOne: false
            referencedRelation: "audiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_campaign_template_id_fkey"
            columns: ["campaign_template_id"]
            isOneToOne: false
            referencedRelation: "campaign_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_default_lead_template_id_fkey"
            columns: ["default_lead_template_id"]
            isOneToOne: false
            referencedRelation: "lead_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_script_set_id_fkey"
            columns: ["script_set_id"]
            isOneToOne: false
            referencedRelation: "script_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          applies_to_plans: string[] | null
          code: string
          created_at: string
          discount_amount: number
          discount_percent: number
          discount_type: string
          expires_at: string | null
          id: string
          max_uses: number | null
          used_count: number
        }
        Insert: {
          active?: boolean
          applies_to_plans?: string[] | null
          code: string
          created_at?: string
          discount_amount?: number
          discount_percent?: number
          discount_type?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          used_count?: number
        }
        Update: {
          active?: boolean
          applies_to_plans?: string[] | null
          code?: string
          created_at?: string
          discount_amount?: number
          discount_percent?: number
          discount_type?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          used_count?: number
        }
        Relationships: []
      }
      interactions: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          outcome: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          outcome: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          outcome?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_calendar_events: {
        Row: {
          auto_generated: boolean
          campaign_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          end_datetime: string | null
          google_event_id: string | null
          id: string
          is_overdue: boolean
          lead_id: string
          location: string | null
          priority: string
          source: string
          start_datetime: string
          status: string
          sync_status: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          auto_generated?: boolean
          campaign_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          end_datetime?: string | null
          google_event_id?: string | null
          id?: string
          is_overdue?: boolean
          lead_id: string
          location?: string | null
          priority?: string
          source?: string
          start_datetime: string
          status?: string
          sync_status?: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          auto_generated?: boolean
          campaign_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          end_datetime?: string | null
          google_event_id?: string | null
          id?: string
          is_overdue?: boolean
          lead_id?: string
          location?: string | null
          priority?: string
          source?: string
          start_datetime?: string
          status?: string
          sync_status?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_calendar_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_calendar_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_field_values: {
        Row: {
          campaign_id: string
          created_at: string
          field_id: string
          id: string
          lead_id: string
          value: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          field_id: string
          id?: string
          lead_id: string
          value?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          field_id?: string
          id?: string
          lead_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_field_values_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "campaign_field_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_field_values_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_templates: {
        Row: {
          created_at: string
          fields: Json
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fields?: Json
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          fields?: Json
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          company: string | null
          contact: string | null
          created_at: string
          custom_data: Json
          email: string | null
          id: string
          lead_model_id: string | null
          name: string
          phone: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          company?: string | null
          contact?: string | null
          created_at?: string
          custom_data?: Json
          email?: string | null
          id?: string
          lead_model_id?: string | null
          name: string
          phone?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          company?: string | null
          contact?: string | null
          created_at?: string
          custom_data?: Json
          email?: string | null
          id?: string
          lead_model_id?: string | null
          name?: string
          phone?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_lead_model_id_fkey"
            columns: ["lead_model_id"]
            isOneToOne: false
            referencedRelation: "lead_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      message_steps: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          is_conversion: boolean
          step_name: string
          step_order: number
          variation_a: string | null
          variation_b: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          is_conversion?: boolean
          step_name?: string
          step_order?: number
          variation_a?: string | null
          variation_b?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          is_conversion?: boolean
          step_name?: string
          step_order?: number
          variation_a?: string | null
          variation_b?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_steps_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      objections: {
        Row: {
          category: string | null
          created_at: string
          frequency: number | null
          id: string
          response: string | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          frequency?: number | null
          id?: string
          response?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          frequency?: number | null
          id?: string
          response?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      pending_purchases: {
        Row: {
          amount: number
          billing_period: string
          coupon_code: string | null
          coupon_redeemed: boolean
          created_at: string
          email: string
          id: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          plan: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          billing_period?: string
          coupon_code?: string | null
          coupon_redeemed?: boolean
          created_at?: string
          email: string
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          plan: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_period?: string
          coupon_code?: string | null
          coupon_redeemed?: boolean
          created_at?: string
          email?: string
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          plan?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      plan_limits: {
        Row: {
          features: Json
          max_active_campaigns: number
          max_audiences: number
          max_users: number
          plan: string
        }
        Insert: {
          features?: Json
          max_active_campaigns?: number
          max_audiences?: number
          max_users?: number
          plan: string
        }
        Update: {
          features?: Json
          max_active_campaigns?: number
          max_audiences?: number
          max_users?: number
          plan?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          average_ticket: string | null
          contact_channel: string | null
          created_at: string
          differential: string | null
          first_name: string | null
          id: string
          last_name: string | null
          last_used_lead_template_id: string | null
          main_pain: string | null
          maturity_level: string | null
          offer_type: string | null
          onboarding_completed: boolean
          orion_tour_step: number
          orion_welcomed: boolean
          personal_profile_completed: boolean
          positioning: string | null
          preferred_name: string | null
          proof_results: string | null
          strategic_notes: string | null
          target_audience_description: string | null
          treatment_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          average_ticket?: string | null
          contact_channel?: string | null
          created_at?: string
          differential?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          last_used_lead_template_id?: string | null
          main_pain?: string | null
          maturity_level?: string | null
          offer_type?: string | null
          onboarding_completed?: boolean
          orion_tour_step?: number
          orion_welcomed?: boolean
          personal_profile_completed?: boolean
          positioning?: string | null
          preferred_name?: string | null
          proof_results?: string | null
          strategic_notes?: string | null
          target_audience_description?: string | null
          treatment_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          average_ticket?: string | null
          contact_channel?: string | null
          created_at?: string
          differential?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          last_used_lead_template_id?: string | null
          main_pain?: string | null
          maturity_level?: string | null
          offer_type?: string | null
          onboarding_completed?: boolean
          orion_tour_step?: number
          orion_welcomed?: boolean
          personal_profile_completed?: boolean
          positioning?: string | null
          preferred_name?: string | null
          proof_results?: string | null
          strategic_notes?: string | null
          target_audience_description?: string | null
          treatment_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_last_used_lead_template_id_fkey"
            columns: ["last_used_lead_template_id"]
            isOneToOne: false
            referencedRelation: "lead_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      prospecting_goals: {
        Row: {
          campaign_id: string | null
          color: string | null
          created_at: string | null
          custom_days: number[] | null
          deadline: string | null
          description: string | null
          funnel_stage_id: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          metric: string
          name: string
          recurrence: string
          target: number
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          color?: string | null
          created_at?: string | null
          custom_days?: number[] | null
          deadline?: string | null
          description?: string | null
          funnel_stage_id?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          metric?: string
          name: string
          recurrence?: string
          target: number
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          color?: string | null
          created_at?: string | null
          custom_days?: number[] | null
          deadline?: string | null
          description?: string | null
          funnel_stage_id?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          metric?: string
          name?: string
          recurrence?: string
          target?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospecting_goals_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospecting_goals_funnel_stage_id_fkey"
            columns: ["funnel_stage_id"]
            isOneToOne: false
            referencedRelation: "message_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      prospecting_progress: {
        Row: {
          created_at: string | null
          current_value: number | null
          date: string
          goal_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          date?: string
          goal_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          date?: string
          goal_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospecting_progress_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "prospecting_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      script_set_items: {
        Row: {
          content: string
          created_at: string
          id: string
          set_id: string
          step_order: number
          title: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          set_id: string
          step_order?: number
          title?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          set_id?: string
          step_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_set_items_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "script_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      script_sets: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      scripts: {
        Row: {
          audience_id: string | null
          content: string | null
          created_at: string
          id: string
          name: string
          objective: string | null
          tags: string[] | null
          type: string
          user_id: string
        }
        Insert: {
          audience_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          name: string
          objective?: string | null
          tags?: string[] | null
          type?: string
          user_id: string
        }
        Update: {
          audience_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          name?: string
          objective?: string | null
          tags?: string[] | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_period: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          mp_payer_email: string | null
          mp_payment_id: string | null
          payment_method: string | null
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_period?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          mp_payer_email?: string | null
          mp_payment_id?: string | null
          payment_method?: string | null
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_period?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          mp_payer_email?: string | null
          mp_payment_id?: string | null
          payment_method?: string | null
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_calendar_connections: {
        Row: {
          access_token: string
          calendar_id: string
          connected_at: string
          expiry_date: string
          id: string
          provider: string
          refresh_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_id?: string
          connected_at?: string
          expiry_date: string
          id?: string
          provider?: string
          refresh_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_id?: string
          connected_at?: string
          expiry_date?: string
          id?: string
          provider?: string
          refresh_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_calendar_status: {
        Row: {
          calendar_id: string | null
          connected_at: string | null
          expiry_date: string | null
          id: string | null
          provider: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          calendar_id?: string | null
          connected_at?: string | null
          expiry_date?: string | null
          id?: string | null
          provider?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          calendar_id?: string | null
          connected_at?: string | null
          expiry_date?: string | null
          id?: string | null
          provider?: string | null
          updated_at?: string | null
          user_id?: string | null
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
      is_owner_of_campaign: { Args: { _campaign_id: string }; Returns: boolean }
      is_owner_of_campaign_template: {
        Args: { _template_id: string }
        Returns: boolean
      }
      is_owner_of_lead: { Args: { _lead_id: string }; Returns: boolean }
      is_owner_of_script_set: { Args: { _set_id: string }; Returns: boolean }
      is_owner_or_admin: { Args: { _user_id: string }; Returns: boolean }
      mark_overdue_events: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "owner" | "admin" | "member"
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
      app_role: ["owner", "admin", "member"],
    },
  },
} as const
