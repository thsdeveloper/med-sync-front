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
      attachment_audit_log: {
        Row: {
          attachment_id: string | null
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          new_status: string | null
          old_status: string | null
          operation: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          attachment_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          operation: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          attachment_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          operation?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachment_audit_log_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "chat_attachments"
            referencedColumns: ["id"]
          },
        ]
      }
      attachment_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          attachment_id: string | null
          conversation_id: string | null
          created_at: string
          error_message: string | null
          id: string
          ip_address: unknown
          message_id: string | null
          metadata: Json | null
          organization_id: string
          success: boolean
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          attachment_id?: string | null
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          message_id?: string | null
          metadata?: Json | null
          organization_id: string
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          attachment_id?: string | null
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          message_id?: string | null
          metadata?: Json | null
          organization_id?: string
          success?: boolean
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachment_audit_logs_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "chat_attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachment_audit_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachment_audit_logs_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachment_audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      attachment_upload_rate_limits: {
        Row: {
          conversation_id: string | null
          created_at: string
          file_name: string
          file_size: number
          id: string
          organization_id: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          file_name: string
          file_size: number
          id?: string
          organization_id: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          file_name?: string
          file_size?: number
          id?: string
          organization_id?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachment_upload_rate_limits_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachment_upload_rate_limits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachment_upload_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "medical_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      brazilian_holidays: {
        Row: {
          created_at: string | null
          date: string
          id: string
          name: string
          state_code: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          name: string
          state_code?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          name?: string
          state_code?: string | null
          type?: string
        }
        Relationships: []
      }
      chat_admin_participants: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_admin_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_attachments: {
        Row: {
          conversation_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          message_id: string | null
          rejected_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sender_id: string
          status: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          message_id?: string | null
          rejected_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_id: string
          status?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          message_id?: string | null
          rejected_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_attachments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_attachments_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "medical_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          conversation_type: string | null
          created_at: string | null
          id: string
          name: string | null
          organization_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          conversation_type?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          organization_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          conversation_type?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          organization_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          admin_sender_id: string | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          sender_id: string | null
        }
        Insert: {
          admin_sender_id?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          sender_id?: string | null
        }
        Update: {
          admin_sender_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "medical_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string | null
          last_read_at: string | null
          staff_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          staff_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "medical_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      conselhos_profissionais: {
        Row: {
          created_at: string | null
          id: string
          nome_completo: string
          regex_validacao: string
          requer_categoria: boolean
          sigla: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome_completo: string
          regex_validacao?: string
          requer_categoria?: boolean
          sigla: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome_completo?: string
          regex_validacao?: string
          requer_categoria?: boolean
          sigla?: string
        }
        Relationships: []
      }
      especialidades: {
        Row: {
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      facilities: {
        Row: {
          active: boolean
          cnpj: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          phone: string | null
          type: string
        }
        Insert: {
          active?: boolean
          cnpj?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          phone?: string | null
          type: string
        }
        Update: {
          active?: boolean
          cnpj?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          phone?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "facilities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_addresses: {
        Row: {
          city: string
          complement: string | null
          country: string
          created_at: string
          facility_id: string
          id: string
          latitude: number | null
          longitude: number | null
          neighborhood: string
          number: string
          postal_code: string
          state: string
          street: string
          updated_at: string
        }
        Insert: {
          city: string
          complement?: string | null
          country?: string
          created_at?: string
          facility_id: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood: string
          number: string
          postal_code: string
          state: string
          street: string
          updated_at?: string
        }
        Update: {
          city?: string
          complement?: string | null
          country?: string
          created_at?: string
          facility_id?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string
          number?: string
          postal_code?: string
          state?: string
          street?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_addresses_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: true
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_payment_config: {
        Row: {
          active: boolean | null
          created_at: string | null
          facility_id: string
          holiday_bonus_percent: number | null
          hourly_rate: number | null
          id: string
          night_shift_bonus_percent: number | null
          night_shift_end_hour: number | null
          night_shift_start_hour: number | null
          payment_type: string
          updated_at: string | null
          weekend_bonus_percent: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          facility_id: string
          holiday_bonus_percent?: number | null
          hourly_rate?: number | null
          id?: string
          night_shift_bonus_percent?: number | null
          night_shift_end_hour?: number | null
          night_shift_start_hour?: number | null
          payment_type: string
          updated_at?: string | null
          weekend_bonus_percent?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          facility_id?: string
          holiday_bonus_percent?: number | null
          hourly_rate?: number | null
          id?: string
          night_shift_bonus_percent?: number | null
          night_shift_end_hour?: number | null
          night_shift_start_hour?: number | null
          payment_type?: string
          updated_at?: string | null
          weekend_bonus_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "facility_payment_config_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: true
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_schedules: {
        Row: {
          active: boolean | null
          created_at: string | null
          duration_type: string
          end_date: string | null
          facility_id: string
          id: string
          organization_id: string
          sector_id: string | null
          shift_type: string
          staff_id: string
          start_date: string
          updated_at: string | null
          weekdays: number[]
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          duration_type: string
          end_date?: string | null
          facility_id: string
          id?: string
          organization_id: string
          sector_id?: string | null
          shift_type: string
          staff_id: string
          start_date: string
          updated_at?: string | null
          weekdays: number[]
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          duration_type?: string
          end_date?: string | null
          facility_id?: string
          id?: string
          organization_id?: string
          sector_id?: string | null
          shift_type?: string
          staff_id?: string
          start_date?: string
          updated_at?: string | null
          weekdays?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "fixed_schedules_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_schedules_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "medical_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_staff: {
        Row: {
          active: boolean | null
          auth_email: string | null
          avatar_url: string | null
          color: string | null
          cpf: string | null
          created_at: string | null
          crm: string | null
          email: string | null
          especialidade_id: string | null
          expo_push_token: string | null
          id: string
          name: string
          organization_id: string | null
          phone: string | null
          profissao_id: string | null
          registro_categoria: string | null
          registro_numero: string | null
          registro_uf: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          auth_email?: string | null
          avatar_url?: string | null
          color?: string | null
          cpf?: string | null
          created_at?: string | null
          crm?: string | null
          email?: string | null
          especialidade_id?: string | null
          expo_push_token?: string | null
          id?: string
          name: string
          organization_id?: string | null
          phone?: string | null
          profissao_id?: string | null
          registro_categoria?: string | null
          registro_numero?: string | null
          registro_uf?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          auth_email?: string | null
          avatar_url?: string | null
          color?: string | null
          cpf?: string | null
          created_at?: string | null
          crm?: string | null
          email?: string | null
          especialidade_id?: string | null
          expo_push_token?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          phone?: string | null
          profissao_id?: string | null
          registro_categoria?: string | null
          registro_numero?: string | null
          registro_uf?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_staff_especialidade_id_fkey"
            columns: ["especialidade_id"]
            isOneToOne: false
            referencedRelation: "especialidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_staff_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_staff_profissao_id_fkey"
            columns: ["profissao_id"]
            isOneToOne: false
            referencedRelation: "profissoes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          id: string
          organization_id: string
          read: boolean | null
          read_at: string | null
          staff_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          id?: string
          organization_id: string
          read?: boolean | null
          read_at?: string | null
          staff_id?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          organization_id?: string
          read?: boolean | null
          read_at?: string | null
          staff_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "medical_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          cnpj: string
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          cnpj: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
        }
        Relationships: []
      }
      payment_records: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          base_amount: number
          base_rate: number
          calculation_metadata: Json | null
          created_at: string | null
          facility_id: string
          holiday_bonus: number | null
          id: string
          is_holiday: boolean | null
          is_night_shift: boolean | null
          is_weekend: boolean | null
          night_shift_bonus: number | null
          notes: string | null
          organization_id: string
          overtime_amount: number | null
          overtime_minutes: number | null
          paid_at: string | null
          payment_type: string
          scheduled_minutes: number
          shift_end_time: string
          shift_id: string
          shift_start_time: string
          staff_id: string
          status: string | null
          total_amount: number
          updated_at: string | null
          weekend_bonus: number | null
          worked_minutes: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          base_amount: number
          base_rate: number
          calculation_metadata?: Json | null
          created_at?: string | null
          facility_id: string
          holiday_bonus?: number | null
          id?: string
          is_holiday?: boolean | null
          is_night_shift?: boolean | null
          is_weekend?: boolean | null
          night_shift_bonus?: number | null
          notes?: string | null
          organization_id: string
          overtime_amount?: number | null
          overtime_minutes?: number | null
          paid_at?: string | null
          payment_type: string
          scheduled_minutes: number
          shift_end_time: string
          shift_id: string
          shift_start_time: string
          staff_id: string
          status?: string | null
          total_amount: number
          updated_at?: string | null
          weekend_bonus?: number | null
          worked_minutes: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          base_amount?: number
          base_rate?: number
          calculation_metadata?: Json | null
          created_at?: string | null
          facility_id?: string
          holiday_bonus?: number | null
          id?: string
          is_holiday?: boolean | null
          is_night_shift?: boolean | null
          is_weekend?: boolean | null
          night_shift_bonus?: number | null
          notes?: string | null
          organization_id?: string
          overtime_amount?: number | null
          overtime_minutes?: number | null
          paid_at?: string | null
          payment_type?: string
          scheduled_minutes?: number
          shift_end_time?: string
          shift_id?: string
          shift_start_time?: string
          staff_id?: string
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          weekend_bonus?: number | null
          worked_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: true
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "medical_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      profissoes: {
        Row: {
          categorias_disponiveis: string[] | null
          conselho_id: string
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          categorias_disponiveis?: string[] | null
          conselho_id: string
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          categorias_disponiveis?: string[] | null
          conselho_id?: string
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "profissoes_conselho_id_fkey"
            columns: ["conselho_id"]
            isOneToOne: false
            referencedRelation: "conselhos_profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sectors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_attendance: {
        Row: {
          check_in_at: string | null
          check_out_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          shift_id: string
          staff_id: string
          updated_at: string | null
          worked_minutes: number | null
        }
        Insert: {
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          shift_id: string
          staff_id: string
          updated_at?: string | null
          worked_minutes?: number | null
        }
        Update: {
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          shift_id?: string
          staff_id?: string
          updated_at?: string | null
          worked_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_attendance_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "medical_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_duration_rates: {
        Row: {
          created_at: string | null
          duration_hours: number
          facility_payment_config_id: string
          fixed_rate: number
          id: string
        }
        Insert: {
          created_at?: string | null
          duration_hours: number
          facility_payment_config_id: string
          fixed_rate: number
          id?: string
        }
        Update: {
          created_at?: string | null
          duration_hours?: number
          facility_payment_config_id?: string
          fixed_rate?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_duration_rates_facility_payment_config_id_fkey"
            columns: ["facility_payment_config_id"]
            isOneToOne: false
            referencedRelation: "facility_payment_config"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_responses: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          responded_at: string | null
          response: string
          shift_id: string
          staff_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          responded_at?: string | null
          response: string
          shift_id: string
          staff_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          responded_at?: string | null
          response?: string
          shift_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_responses_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_responses_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "medical_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_swap_requests: {
        Row: {
          admin_id: string | null
          admin_notes: string | null
          admin_responded_at: string | null
          admin_status: string | null
          created_at: string | null
          id: string
          organization_id: string | null
          original_shift_id: string
          requester_id: string
          requester_notes: string | null
          responded_at: string | null
          responder_notes: string | null
          status: string | null
          target_shift_id: string | null
          target_staff_id: string | null
        }
        Insert: {
          admin_id?: string | null
          admin_notes?: string | null
          admin_responded_at?: string | null
          admin_status?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          original_shift_id: string
          requester_id: string
          requester_notes?: string | null
          responded_at?: string | null
          responder_notes?: string | null
          status?: string | null
          target_shift_id?: string | null
          target_staff_id?: string | null
        }
        Update: {
          admin_id?: string | null
          admin_notes?: string | null
          admin_responded_at?: string | null
          admin_status?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          original_shift_id?: string
          requester_id?: string
          requester_notes?: string | null
          responded_at?: string | null
          responder_notes?: string | null
          status?: string | null
          target_shift_id?: string | null
          target_staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_swap_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_original_shift_id_fkey"
            columns: ["original_shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "medical_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_target_shift_id_fkey"
            columns: ["target_shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_target_staff_id_fkey"
            columns: ["target_staff_id"]
            isOneToOne: false
            referencedRelation: "medical_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string | null
          end_time: string
          facility_id: string | null
          fixed_schedule_id: string | null
          id: string
          notes: string | null
          organization_id: string
          sector_id: string | null
          staff_id: string | null
          start_time: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          end_time: string
          facility_id?: string | null
          fixed_schedule_id?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          sector_id?: string | null
          staff_id?: string | null
          start_time: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string
          facility_id?: string | null
          fixed_schedule_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          sector_id?: string | null
          staff_id?: string | null
          start_time?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_fixed_schedule_id_fkey"
            columns: ["fixed_schedule_id"]
            isOneToOne: false
            referencedRelation: "fixed_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "medical_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_contracts: {
        Row: {
          contract_path: string
          id: string
          mime_type: string
          staff_id: string
          uploaded_at: string
        }
        Insert: {
          contract_path: string
          id?: string
          mime_type?: string
          staff_id: string
          uploaded_at?: string
        }
        Update: {
          contract_path?: string
          id?: string
          mime_type?: string
          staff_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_contracts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "medical_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_facilities: {
        Row: {
          created_at: string
          facility_id: string
          id: string
          staff_id: string
        }
        Insert: {
          created_at?: string
          facility_id: string
          id?: string
          staff_id: string
        }
        Update: {
          created_at?: string
          facility_id?: string
          id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_facilities_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_facilities_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "medical_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_organizations: {
        Row: {
          active: boolean
          created_at: string
          id: string
          organization_id: string
          staff_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          organization_id: string
          staff_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          organization_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_organizations_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "medical_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      todos: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_organizations: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_shift_payment: { Args: { p_shift_id: string }; Returns: string }
      check_fixed_schedule_conflict: {
        Args: {
          p_end_date: string
          p_exclude_id?: string
          p_shift_type: string
          p_staff_id: string
          p_start_date: string
          p_weekdays: number[]
        }
        Returns: {
          conflicting_id: string
          conflicting_weekdays: number[]
          facility_name: string
        }[]
      }
      check_upload_rate_limit:
        | { Args: { p_user_id: string }; Returns: Json }
        | {
            Args: { p_organization_id: string; p_user_id: string }
            Returns: boolean
          }
      cleanup_old_audit_logs: {
        Args: { p_retention_days?: number }
        Returns: {
          deleted_count: number
          oldest_remaining: string
        }[]
      }
      cleanup_orphaned_attachments:
        | { Args: { p_age_hours?: number }; Returns: Json }
        | {
            Args: {
              p_dry_run?: boolean
              p_grace_period_days?: number
              p_organization_id: string
            }
            Returns: {
              age_days: number
              attachment_id: string
              created_at: string
              file_name: string
              file_path: string
              file_size: number
            }[]
          }
      create_support_conversation: {
        Args: {
          p_organization_id: string
          p_staff_id: string
          p_staff_name: string
        }
        Returns: string
      }
      delete_attachment: {
        Args: {
          p_attachment_id: string
          p_organization_id: string
          p_reason?: string
        }
        Returns: Json
      }
      delete_chat_attachment: {
        Args: { p_attachment_id: string }
        Returns: Json
      }
      delete_future_shifts_from_fixed_schedule: {
        Args: { p_fixed_schedule_id: string }
        Returns: number
      }
      generate_shifts_for_organization: {
        Args: {
          p_end_date: string
          p_organization_id: string
          p_start_date: string
        }
        Returns: number
      }
      generate_shifts_from_fixed_schedule: {
        Args: {
          p_end_date: string
          p_fixed_schedule_id: string
          p_start_date: string
        }
        Returns: number
      }
      get_admin_support_conversation_ids: { Args: never; Returns: string[] }
      get_all_user_organization_ids: { Args: never; Returns: string[] }
      get_attachment_audit_trail: {
        Args: { p_attachment_id: string; p_organization_id: string }
        Returns: {
          action: string
          actor_name: string
          actor_role: string
          created_at: string
          error_message: string
          id: string
          metadata: Json
          success: boolean
        }[]
      }
      get_calendar_shifts: {
        Args: {
          p_end_date: string
          p_facility_id?: string
          p_organization_id: string
          p_specialty?: string
          p_start_date: string
        }
        Returns: Json
      }
      get_current_staff_id: { Args: never; Returns: string }
      get_org_staff_ids: { Args: never; Returns: string[] }
      get_organization_audit_report: {
        Args: {
          p_action_filter?: string
          p_end_date?: string
          p_organization_id: string
          p_start_date?: string
        }
        Returns: {
          action: string
          failed_operations: number
          successful_operations: number
          total_operations: number
          unique_actors: number
          unique_attachments: number
        }[]
      }
      get_orphaned_attachment_report: {
        Args: { p_min_age_days?: number; p_organization_id: string }
        Returns: {
          eligible_for_cleanup: number
          oldest_orphan_age_days: number
          orphaned_by_type: Json
          total_orphaned: number
          total_size_bytes: number
        }[]
      }
      get_payment_records: {
        Args: {
          p_end_date?: string
          p_facility_id?: string
          p_limit?: number
          p_offset?: number
          p_organization_id: string
          p_staff_id?: string
          p_start_date?: string
          p_status?: string
        }
        Returns: {
          base_amount: number
          calculation_metadata: Json
          created_at: string
          facility_id: string
          facility_name: string
          holiday_bonus: number
          id: string
          is_holiday: boolean
          is_night_shift: boolean
          is_weekend: boolean
          night_shift_bonus: number
          overtime_amount: number
          overtime_minutes: number
          shift_end_time: string
          shift_id: string
          shift_start_time: string
          staff_crm: string
          staff_id: string
          staff_name: string
          staff_specialty: string
          status: string
          total_amount: number
          weekend_bonus: number
          worked_minutes: number
        }[]
      }
      get_staff_conversation_ids: { Args: never; Returns: string[] }
      get_staff_organization_ids: { Args: never; Returns: string[] }
      get_user_organization_ids: { Args: never; Returns: string[] }
      get_user_upload_stats: {
        Args: { p_organization_id: string; p_user_id: string }
        Returns: {
          limit_resets_at: string
          rate_limit: number
          remaining_uploads: number
          uploads_in_last_hour: number
        }[]
      }
      insert_organization: {
        Args: {
          p_address?: string
          p_cnpj: string
          p_name: string
          p_owner_id?: string
          p_phone?: string
        }
        Returns: string
      }
      log_attachment_operation: {
        Args: {
          p_action: string
          p_actor_id: string
          p_actor_role: string
          p_attachment_id: string
          p_conversation_id?: string
          p_error_message?: string
          p_ip_address?: unknown
          p_message_id?: string
          p_metadata?: Json
          p_organization_id: string
          p_success?: boolean
          p_user_agent?: string
        }
        Returns: string
      }
      payment_reports_by_clinic: {
        Args: {
          p_end_date: string
          p_organization_id: string
          p_start_date: string
        }
        Returns: {
          average_per_shift: number
          facility_id: string
          facility_name: string
          facility_type: string
          hourly_rate: number
          payment_type: string
          total_base_amount: number
          total_bonuses: number
          total_hours: number
          total_overtime_amount: number
          total_payment_amount: number
          total_shifts: number
          total_staff_count: number
        }[]
      }
      payment_reports_by_doctor: {
        Args: {
          p_end_date: string
          p_organization_id: string
          p_staff_id?: string
          p_start_date: string
        }
        Returns: {
          shifts_with_holiday_bonus: number
          shifts_with_night_bonus: number
          shifts_with_overtime: number
          shifts_with_weekend_bonus: number
          staff_crm: string
          staff_id: string
          staff_name: string
          staff_specialty: string
          total_base_amount: number
          total_holiday_bonus: number
          total_hours: number
          total_night_bonus: number
          total_overtime_amount: number
          total_payment_amount: number
          total_shifts: number
          total_weekend_bonus: number
        }[]
      }
      payment_reports_by_period: {
        Args: {
          p_end_date: string
          p_group_by?: string
          p_organization_id: string
          p_start_date: string
        }
        Returns: {
          average_per_staff: number
          period_end: string
          period_label: string
          period_start: string
          total_base_amount: number
          total_holiday_bonus: number
          total_hours: number
          total_night_bonus: number
          total_overtime_amount: number
          total_payment_amount: number
          total_shifts_count: number
          total_staff_count: number
          total_weekend_bonus: number
        }[]
      }
      record_upload_attempt: {
        Args: {
          p_conversation_id: string
          p_file_name: string
          p_file_size: number
          p_organization_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      reports_dashboard_metrics:
        | {
            Args: {
              p_organization_id: string
              p_period?: string
              p_specialty?: string
              p_unit?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_organization_id?: string
              p_period?: string
              p_specialty?: string
              p_unit?: string
            }
            Returns: Json
          }
      update_attachment_status: {
        Args: {
          p_attachment_id: string
          p_rejected_reason?: string
          p_status: string
        }
        Returns: Json
      }
      upload_chat_attachment: {
        Args: {
          p_conversation_id: string
          p_file_name: string
          p_file_path: string
          p_file_size: number
          p_file_type: string
          p_message_id: string
        }
        Returns: Json
      }
      user_has_org_admin_access: { Args: { org_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
