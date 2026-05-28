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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          client_id: string | null
          completed: boolean
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          opportunity_id: string | null
          organization_id: string
          owner_id: string | null
          project_id: string | null
          title: string
          type: Database["public"]["Enums"]["activity_type"]
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          completed?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          opportunity_id?: string | null
          organization_id: string
          owner_id?: string | null
          project_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          completed?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          opportunity_id?: string | null
          organization_id?: string
          owner_id?: string | null
          project_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          description: string | null
          entity_id: string | null
          entity_table: string | null
          id: string
          link: string | null
          metadata: Json
          organization_id: string
          project_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          source: Database["public"]["Enums"]["event_source"]
          status: Database["public"]["Enums"]["alert_status"]
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_table?: string | null
          id?: string
          link?: string | null
          metadata?: Json
          organization_id: string
          project_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          source: Database["public"]["Enums"]["event_source"]
          status?: Database["public"]["Enums"]["alert_status"]
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_table?: string | null
          id?: string
          link?: string | null
          metadata?: Json
          organization_id?: string
          project_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          source?: Database["public"]["Enums"]["event_source"]
          status?: Database["public"]["Enums"]["alert_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      approvals: {
        Row: {
          amount: number | null
          approver_role: Database["public"]["Enums"]["app_role"] | null
          assigned_to: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_notes: string | null
          description: string | null
          entity_id: string
          entity_table: string
          id: string
          kind: Database["public"]["Enums"]["approval_kind"]
          organization_id: string
          project_id: string | null
          requested_by: string | null
          status: Database["public"]["Enums"]["approval_status"]
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          approver_role?: Database["public"]["Enums"]["app_role"] | null
          assigned_to?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          description?: string | null
          entity_id: string
          entity_table: string
          id?: string
          kind: Database["public"]["Enums"]["approval_kind"]
          organization_id: string
          project_id?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          approver_role?: Database["public"]["Enums"]["app_role"] | null
          assigned_to?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          description?: string | null
          entity_id?: string
          entity_table?: string
          id?: string
          kind?: Database["public"]["Enums"]["approval_kind"]
          organization_id?: string
          project_id?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          employee_id: string
          hours: number
          id: string
          notes: string | null
          organization_id: string
          project_id: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
          validated_by: string | null
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          employee_id: string
          hours?: number
          id?: string
          notes?: string | null
          organization_id: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          validated_by?: string | null
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          hours?: number
          id?: string
          notes?: string | null
          organization_id?: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          validated_by?: string | null
        }
        Relationships: []
      }
      billing_invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          due_at: string | null
          folio: string | null
          id: string
          issued_at: string
          metadata: Json
          organization_id: string
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          status: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          due_at?: string | null
          folio?: string | null
          id?: string
          issued_at?: string
          metadata?: Json
          organization_id: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          due_at?: string | null
          folio?: string | null
          id?: string
          issued_at?: string
          metadata?: Json
          organization_id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
        }
        Relationships: []
      }
      bot_sessions: {
        Row: {
          candidate_id: string | null
          context: Json
          created_at: string
          id: string
          last_message_at: string
          phone: string
          profile: Json
          state: string
          turn_count: number
          updated_at: string
        }
        Insert: {
          candidate_id?: string | null
          context?: Json
          created_at?: string
          id?: string
          last_message_at?: string
          phone: string
          profile?: Json
          state?: string
          turn_count?: number
          updated_at?: string
        }
        Update: {
          candidate_id?: string | null
          context?: Json
          created_at?: string
          id?: string
          last_message_at?: string
          phone?: string
          profile?: Json
          state?: string
          turn_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_sessions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_lines: {
        Row: {
          budget_id: string
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          description: string
          id: string
          order_idx: number
          planned_amount: number
        }
        Insert: {
          budget_id: string
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description: string
          id?: string
          order_idx?: number
          planned_amount?: number
        }
        Update: {
          budget_id?: string
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description?: string
          id?: string
          order_idx?: number
          planned_amount?: number
        }
        Relationships: []
      }
      budgets: {
        Row: {
          approved: boolean
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          currency: string
          id: string
          notes: string | null
          organization_id: string
          project_id: string
          total_amount: number
          updated_at: string
          version: string
        }
        Insert: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          notes?: string | null
          organization_id: string
          project_id: string
          total_amount?: number
          updated_at?: string
          version?: string
        }
        Update: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          notes?: string | null
          organization_id?: string
          project_id?: string
          total_amount?: number
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      candidate_blacklist: {
        Row: {
          added_by: string | null
          created_at: string
          full_name: string | null
          id: string
          organization_id: string
          phone: string
          reason: string
          severity: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          organization_id?: string
          phone: string
          reason: string
          severity?: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          organization_id?: string
          phone?: string
          reason?: string
          severity?: string
        }
        Relationships: []
      }
      candidate_documents: {
        Row: {
          candidate_id: string
          created_at: string
          doc_type: string | null
          extracted: Json
          id: string
          mime_type: string | null
          name: string
          ocr_text: string | null
          organization_id: string
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
          validation_notes: string | null
          validation_status: Database["public"]["Enums"]["doc_validation_status"]
        }
        Insert: {
          candidate_id: string
          created_at?: string
          doc_type?: string | null
          extracted?: Json
          id?: string
          mime_type?: string | null
          name: string
          ocr_text?: string | null
          organization_id?: string
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
          validation_notes?: string | null
          validation_status?: Database["public"]["Enums"]["doc_validation_status"]
        }
        Update: {
          candidate_id?: string
          created_at?: string
          doc_type?: string | null
          extracted?: Json
          id?: string
          mime_type?: string | null
          name?: string
          ocr_text?: string | null
          organization_id?: string
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
          validation_notes?: string | null
          validation_status?: Database["public"]["Enums"]["doc_validation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "candidate_documents_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_messages: {
        Row: {
          body: string | null
          candidate_id: string
          channel: string
          created_at: string
          direction: Database["public"]["Enums"]["candidate_msg_direction"]
          id: string
          media_url: string | null
          metadata: Json
          organization_id: string
          provider_message_id: string | null
        }
        Insert: {
          body?: string | null
          candidate_id: string
          channel?: string
          created_at?: string
          direction: Database["public"]["Enums"]["candidate_msg_direction"]
          id?: string
          media_url?: string | null
          metadata?: Json
          organization_id?: string
          provider_message_id?: string | null
        }
        Update: {
          body?: string | null
          candidate_id?: string
          channel?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["candidate_msg_direction"]
          id?: string
          media_url?: string | null
          metadata?: Json
          organization_id?: string
          provider_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_messages_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_timeline: {
        Row: {
          actor_id: string | null
          candidate_id: string
          created_at: string
          description: string | null
          event_type: string
          id: string
          metadata: Json
          organization_id: string
          title: string
        }
        Insert: {
          actor_id?: string | null
          candidate_id: string
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json
          organization_id?: string
          title: string
        }
        Update: {
          actor_id?: string | null
          candidate_id?: string
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          organization_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_timeline_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          age: number | null
          ai_score: number | null
          ai_summary: string | null
          ai_tags: string[] | null
          assigned_to: string | null
          availability: string | null
          category: string | null
          city: string | null
          created_at: string
          documents_complete: boolean
          email: string | null
          experience_years: number | null
          full_name: string | null
          hired_at: string | null
          id: string
          last_contact_at: string | null
          metadata: Json
          notes: string | null
          organization_id: string
          phone: string | null
          position: string | null
          recruiter_id: string | null
          risk_score: number | null
          seniority: string | null
          source: Database["public"]["Enums"]["candidate_source"]
          specialty: string | null
          status: Database["public"]["Enums"]["candidate_status"]
          updated_at: string
          urgency: string | null
        }
        Insert: {
          age?: number | null
          ai_score?: number | null
          ai_summary?: string | null
          ai_tags?: string[] | null
          assigned_to?: string | null
          availability?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          documents_complete?: boolean
          email?: string | null
          experience_years?: number | null
          full_name?: string | null
          hired_at?: string | null
          id?: string
          last_contact_at?: string | null
          metadata?: Json
          notes?: string | null
          organization_id?: string
          phone?: string | null
          position?: string | null
          recruiter_id?: string | null
          risk_score?: number | null
          seniority?: string | null
          source?: Database["public"]["Enums"]["candidate_source"]
          specialty?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          age?: number | null
          ai_score?: number | null
          ai_summary?: string | null
          ai_tags?: string[] | null
          assigned_to?: string | null
          availability?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          documents_complete?: boolean
          email?: string | null
          experience_years?: number | null
          full_name?: string | null
          hired_at?: string | null
          id?: string
          last_contact_at?: string | null
          metadata?: Json
          notes?: string | null
          organization_id?: string
          phone?: string | null
          position?: string | null
          recruiter_id?: string | null
          risk_score?: number | null
          seniority?: string | null
          source?: Database["public"]["Enums"]["candidate_source"]
          specialty?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
          updated_at?: string
          urgency?: string | null
        }
        Relationships: []
      }
      cash_movements: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          movement_date: string
          movement_type: Database["public"]["Enums"]["cash_movement_type"]
          organization_id: string
          project_id: string | null
          reference: string | null
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          movement_date?: string
          movement_type: Database["public"]["Enums"]["cash_movement_type"]
          organization_id: string
          project_id?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          movement_date?: string
          movement_type?: Database["public"]["Enums"]["cash_movement_type"]
          organization_id?: string
          project_id?: string | null
          reference?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          code: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          created_by: string | null
          id: string
          industry: string | null
          legal_name: string | null
          name: string
          notes: string | null
          organization_id: string
          rfc: string | null
          state: string | null
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          industry?: string | null
          legal_name?: string | null
          name: string
          notes?: string | null
          organization_id: string
          rfc?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          industry?: string | null
          legal_name?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          rfc?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      corrective_actions: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string
          due_date: string | null
          id: string
          non_conformity_id: string
          responsible_id: string | null
          status: Database["public"]["Enums"]["action_status"]
          updated_at: string
          verification_notes: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          due_date?: string | null
          id?: string
          non_conformity_id: string
          responsible_id?: string | null
          status?: Database["public"]["Enums"]["action_status"]
          updated_at?: string
          verification_notes?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          non_conformity_id?: string
          responsible_id?: string | null
          status?: Database["public"]["Enums"]["action_status"]
          updated_at?: string
          verification_notes?: string | null
        }
        Relationships: []
      }
      department_members: {
        Row: {
          created_at: string
          department: Database["public"]["Enums"]["department"]
          id: string
          is_lead: boolean
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department: Database["public"]["Enums"]["department"]
          id?: string
          is_lead?: boolean
          organization_id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: Database["public"]["Enums"]["department"]
          id?: string
          is_lead?: boolean
          organization_id?: string
          user_id?: string
        }
        Relationships: []
      }
      email_events: {
        Row: {
          actor_id: string | null
          created_at: string
          email_id: string
          event_type: string
          id: string
          metadata: Json | null
          organization_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          email_id: string
          event_type: string
          id?: string
          metadata?: Json | null
          organization_id?: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          email_id?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_events_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "email_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      email_messages: {
        Row: {
          assigned_department: Database["public"]["Enums"]["department"] | null
          assigned_to: string | null
          body_html: string | null
          body_text: string | null
          cc_emails: string[] | null
          created_at: string
          detected_department: Database["public"]["Enums"]["department"] | null
          detected_keywords: string[] | null
          direction: Database["public"]["Enums"]["email_direction"]
          external_message_id: string | null
          from_email: string
          from_name: string | null
          has_attachments: boolean | null
          id: string
          module_link: string | null
          organization_id: string
          project_id: string | null
          received_at: string
          routing_confidence: number | null
          routing_rule_id: string | null
          status: Database["public"]["Enums"]["email_status"]
          subject: string
          tags: string[] | null
          thread_id: string | null
          to_emails: string[]
          updated_at: string
        }
        Insert: {
          assigned_department?: Database["public"]["Enums"]["department"] | null
          assigned_to?: string | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[] | null
          created_at?: string
          detected_department?: Database["public"]["Enums"]["department"] | null
          detected_keywords?: string[] | null
          direction?: Database["public"]["Enums"]["email_direction"]
          external_message_id?: string | null
          from_email: string
          from_name?: string | null
          has_attachments?: boolean | null
          id?: string
          module_link?: string | null
          organization_id?: string
          project_id?: string | null
          received_at?: string
          routing_confidence?: number | null
          routing_rule_id?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject: string
          tags?: string[] | null
          thread_id?: string | null
          to_emails?: string[]
          updated_at?: string
        }
        Update: {
          assigned_department?: Database["public"]["Enums"]["department"] | null
          assigned_to?: string | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[] | null
          created_at?: string
          detected_department?: Database["public"]["Enums"]["department"] | null
          detected_keywords?: string[] | null
          direction?: Database["public"]["Enums"]["email_direction"]
          external_message_id?: string | null
          from_email?: string
          from_name?: string | null
          has_attachments?: boolean | null
          id?: string
          module_link?: string | null
          organization_id?: string
          project_id?: string | null
          received_at?: string
          routing_confidence?: number | null
          routing_rule_id?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject?: string
          tags?: string[] | null
          thread_id?: string | null
          to_emails?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      email_routing_rules: {
        Row: {
          active: boolean
          auto_assign_user: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          match_type: string
          name: string
          notify: boolean
          organization_id: string
          pattern: string
          priority: number
          target_department: Database["public"]["Enums"]["department"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          auto_assign_user?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          match_type?: string
          name: string
          notify?: boolean
          organization_id?: string
          pattern: string
          priority?: number
          target_department: Database["public"]["Enums"]["department"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          auto_assign_user?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          match_type?: string
          name?: string
          notify?: boolean
          organization_id?: string
          pattern?: string
          priority?: number
          target_department?: Database["public"]["Enums"]["department"]
          updated_at?: string
        }
        Relationships: []
      }
      employee_assignments: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          employee_id: string
          end_date: string | null
          id: string
          organization_id: string
          project_id: string
          role_label: string | null
          start_date: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          employee_id: string
          end_date?: string | null
          id?: string
          organization_id: string
          project_id: string
          role_label?: string | null
          start_date?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          employee_id?: string
          end_date?: string | null
          id?: string
          organization_id?: string
          project_id?: string
          role_label?: string | null
          start_date?: string | null
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          created_at: string
          employee_id: string
          expires_at: string | null
          file_path: string | null
          file_url: string | null
          id: string
          kind: Database["public"]["Enums"]["document_kind"]
          name: string
          notes: string | null
          organization_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          employee_id: string
          expires_at?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["document_kind"]
          name: string
          notes?: string | null
          organization_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          employee_id?: string
          expires_at?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["document_kind"]
          name?: string
          notes?: string | null
          organization_id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          created_by: string | null
          curp: string | null
          department: string | null
          email: string | null
          employee_code: string | null
          full_name: string
          hire_date: string | null
          id: string
          notes: string | null
          nss: string | null
          organization_id: string
          phone: string | null
          position: string | null
          rfc: string | null
          status: Database["public"]["Enums"]["employee_status"]
          termination_date: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          curp?: string | null
          department?: string | null
          email?: string | null
          employee_code?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          notes?: string | null
          nss?: string | null
          organization_id: string
          phone?: string | null
          position?: string | null
          rfc?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          termination_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          curp?: string | null
          department?: string | null
          email?: string | null
          employee_code?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          notes?: string | null
          nss?: string | null
          organization_id?: string
          phone?: string | null
          position?: string | null
          rfc?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          termination_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      evidences: {
        Row: {
          created_at: string
          description: string | null
          file_path: string | null
          file_url: string
          id: string
          kind: Database["public"]["Enums"]["evidence_kind"]
          mime_type: string | null
          organization_id: string
          progress_entry_id: string | null
          project_id: string
          title: string | null
          uploaded_by: string | null
          work_front_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_path?: string | null
          file_url: string
          id?: string
          kind?: Database["public"]["Enums"]["evidence_kind"]
          mime_type?: string | null
          organization_id: string
          progress_entry_id?: string | null
          project_id: string
          title?: string | null
          uploaded_by?: string | null
          work_front_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_path?: string | null
          file_url?: string
          id?: string
          kind?: Database["public"]["Enums"]["evidence_kind"]
          mime_type?: string | null
          organization_id?: string
          progress_entry_id?: string | null
          project_id?: string
          title?: string | null
          uploaded_by?: string | null
          work_front_id?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          approved_by: string | null
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string | null
          description: string
          expense_date: string
          id: string
          invoice_number: string | null
          notes: string | null
          organization_id: string
          project_id: string | null
          purchase_order_id: string | null
          status: Database["public"]["Enums"]["expense_status"]
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount?: number
          approved_by?: string | null
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          description: string
          expense_date?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          organization_id: string
          project_id?: string | null
          purchase_order_id?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          approved_by?: string | null
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          organization_id?: string
          project_id?: string | null
          purchase_order_id?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          updated_at?: string
          vendor?: string | null
        }
        Relationships: []
      }
      hr_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          entity_id: string | null
          entity_table: string | null
          id: string
          ip_address: string | null
          organization_id: string
          payload: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string | null
          id?: string
          ip_address?: string | null
          organization_id?: string
          payload?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string | null
          id?: string
          ip_address?: string | null
          organization_id?: string
          payload?: Json
        }
        Relationships: []
      }
      incidents: {
        Row: {
          actions_taken: string | null
          closed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          folio: string | null
          id: string
          injured_person: string | null
          location: string | null
          occurred_at: string
          organization_id: string
          project_id: string | null
          reported_by: string | null
          responsible_id: string | null
          root_cause: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          status: Database["public"]["Enums"]["incident_status"]
          title: string
          updated_at: string
          work_front_id: string | null
        }
        Insert: {
          actions_taken?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          folio?: string | null
          id?: string
          injured_person?: string | null
          location?: string | null
          occurred_at?: string
          organization_id: string
          project_id?: string | null
          reported_by?: string | null
          responsible_id?: string | null
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          title: string
          updated_at?: string
          work_front_id?: string | null
        }
        Update: {
          actions_taken?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          folio?: string | null
          id?: string
          injured_person?: string | null
          location?: string | null
          occurred_at?: string
          organization_id?: string
          project_id?: string | null
          reported_by?: string | null
          responsible_id?: string | null
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          title?: string
          updated_at?: string
          work_front_id?: string | null
        }
        Relationships: []
      }
      inspection_items: {
        Row: {
          created_at: string
          description: string
          id: string
          inspection_id: string
          observation: string | null
          order_idx: number
          passed: boolean | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          inspection_id: string
          observation?: string | null
          order_idx?: number
          passed?: boolean | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          inspection_id?: string
          observation?: string | null
          order_idx?: number
          passed?: boolean | null
        }
        Relationships: []
      }
      inspections: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          folio: string | null
          id: string
          inspection_type: string | null
          inspector_id: string | null
          organization_id: string
          performed_date: string | null
          project_id: string | null
          result_notes: string | null
          scheduled_date: string | null
          score: number | null
          status: Database["public"]["Enums"]["inspection_status"]
          title: string
          updated_at: string
          work_front_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          folio?: string | null
          id?: string
          inspection_type?: string | null
          inspector_id?: string | null
          organization_id: string
          performed_date?: string | null
          project_id?: string | null
          result_notes?: string | null
          scheduled_date?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["inspection_status"]
          title: string
          updated_at?: string
          work_front_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          folio?: string | null
          id?: string
          inspection_type?: string | null
          inspector_id?: string | null
          organization_id?: string
          performed_date?: string | null
          project_id?: string | null
          result_notes?: string | null
          scheduled_date?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["inspection_status"]
          title?: string
          updated_at?: string
          work_front_id?: string | null
        }
        Relationships: []
      }
      interviews: {
        Row: {
          candidate_id: string
          confirmation_sent_at: string | null
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          duration_min: number
          id: string
          interviewer_id: string | null
          interviewer_name: string | null
          location: string | null
          mode: Database["public"]["Enums"]["interview_mode"]
          notes: string | null
          organization_id: string
          reminder_sent_at: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["interview_status"]
          updated_at: string
        }
        Insert: {
          candidate_id: string
          confirmation_sent_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_min?: number
          id?: string
          interviewer_id?: string | null
          interviewer_name?: string | null
          location?: string | null
          mode?: Database["public"]["Enums"]["interview_mode"]
          notes?: string | null
          organization_id?: string
          reminder_sent_at?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["interview_status"]
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          confirmation_sent_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_min?: number
          id?: string
          interviewer_id?: string | null
          interviewer_name?: string | null
          location?: string | null
          mode?: Database["public"]["Enums"]["interview_mode"]
          notes?: string | null
          organization_id?: string
          reminder_sent_at?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["interview_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      login_sessions: {
        Row: {
          device_label: string | null
          id: string
          ip_address: string | null
          last_active_at: string
          organization_id: string
          revoked: boolean
          revoked_at: string | null
          started_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          device_label?: string | null
          id?: string
          ip_address?: string | null
          last_active_at?: string
          organization_id: string
          revoked?: boolean
          revoked_at?: string | null
          started_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          device_label?: string | null
          id?: string
          ip_address?: string | null
          last_active_at?: string
          organization_id?: string
          revoked?: boolean
          revoked_at?: string | null
          started_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          category: string | null
          code: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          min_stock: number
          name: string
          organization_id: string
          stock: number
          unit: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          min_stock?: number
          name: string
          organization_id: string
          stock?: number
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          min_stock?: number
          name?: string
          organization_id?: string
          stock?: number
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      non_conformities: {
        Row: {
          closed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          detected_at: string
          detected_by: string | null
          folio: string | null
          id: string
          inspection_id: string | null
          organization_id: string
          project_id: string | null
          responsible_id: string | null
          root_cause: string | null
          severity: Database["public"]["Enums"]["nc_severity"]
          status: Database["public"]["Enums"]["nc_status"]
          title: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          detected_at?: string
          detected_by?: string | null
          folio?: string | null
          id?: string
          inspection_id?: string | null
          organization_id: string
          project_id?: string | null
          responsible_id?: string | null
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["nc_severity"]
          status?: Database["public"]["Enums"]["nc_status"]
          title: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          detected_at?: string
          detected_by?: string | null
          folio?: string | null
          id?: string
          inspection_id?: string | null
          organization_id?: string
          project_id?: string | null
          responsible_id?: string | null
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["nc_severity"]
          status?: Database["public"]["Enums"]["nc_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          category: string | null
          created_at: string
          id: string
          link: string | null
          message: string | null
          metadata: Json
          organization_id: string
          read: boolean
          read_at: string | null
          role_target: Database["public"]["Enums"]["app_role"] | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          metadata?: Json
          organization_id: string
          read?: boolean
          read_at?: string | null
          role_target?: Database["public"]["Enums"]["app_role"] | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          metadata?: Json
          organization_id?: string
          read?: boolean
          read_at?: string | null
          role_target?: Database["public"]["Enums"]["app_role"] | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          expected_close_date: string | null
          id: string
          notes: string | null
          organization_id: string
          owner_id: string | null
          probability: number
          project_id: string | null
          stage: Database["public"]["Enums"]["opportunity_stage"]
          title: string
          updated_at: string
          value: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          owner_id?: string | null
          probability?: number
          project_id?: string | null
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          title: string
          updated_at?: string
          value?: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          owner_id?: string | null
          probability?: number
          project_id?: string | null
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          title?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      organization_settings: {
        Row: {
          organization_id: string
          settings: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          organization_id: string
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          organization_id?: string
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      organization_subscriptions: {
        Row: {
          billing_cycle: string
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          id: string
          organization_id: string
          plan_code: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          organization_id: string
          plan_code: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          organization_id?: string
          plan_code?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          accent_color: string | null
          commercial_name: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          current_plan_code: string | null
          dark_mode: boolean
          domain: string | null
          id: string
          legal_name: string | null
          logo_url: string | null
          max_projects: number | null
          max_storage_gb: number | null
          max_users: number | null
          name: string
          primary_color: string | null
          rfc: string | null
          slug: string
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          commercial_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          current_plan_code?: string | null
          dark_mode?: boolean
          domain?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          max_projects?: number | null
          max_storage_gb?: number | null
          max_users?: number | null
          name: string
          primary_color?: string | null
          rfc?: string | null
          slug: string
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          commercial_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          current_plan_code?: string | null
          dark_mode?: boolean
          domain?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          max_projects?: number | null
          max_storage_gb?: number | null
          max_users?: number | null
          name?: string
          primary_color?: string | null
          rfc?: string | null
          slug?: string
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          job_title: string | null
          organization_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          job_title?: string | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_entries: {
        Row: {
          created_at: string
          description: string | null
          hours: number
          id: string
          organization_id: string
          personnel_count: number
          progress_pct: number
          project_id: string
          reported_at: string
          reported_by: string | null
          status: Database["public"]["Enums"]["progress_status"]
          title: string
          updated_at: string
          work_front_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          hours?: number
          id?: string
          organization_id: string
          personnel_count?: number
          progress_pct?: number
          project_id: string
          reported_at?: string
          reported_by?: string | null
          status?: Database["public"]["Enums"]["progress_status"]
          title: string
          updated_at?: string
          work_front_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          hours?: number
          id?: string
          organization_id?: string
          personnel_count?: number
          progress_pct?: number
          project_id?: string
          reported_at?: string
          reported_by?: string | null
          status?: Database["public"]["Enums"]["progress_status"]
          title?: string
          updated_at?: string
          work_front_id?: string | null
        }
        Relationships: []
      }
      project_documents: {
        Row: {
          category: string | null
          created_at: string
          file_url: string | null
          id: string
          name: string
          project_id: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          name: string
          project_id: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          name?: string
          project_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          name: string
          order_idx: number
          project_id: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          order_idx?: number
          project_id: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          order_idx?: number
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_team: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role_label: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role_label?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role_label?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_team_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          client_id: string | null
          code: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          location: string | null
          name: string
          organization_id: string
          progress_pct: number
          project_manager_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          budget?: number | null
          client_id?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name: string
          organization_id: string
          progress_pct?: number
          project_manager_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          budget?: number | null
          client_id?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name?: string
          organization_id?: string
          progress_pct?: number
          project_manager_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          description: string
          id: string
          material_id: string | null
          order_idx: number
          purchase_order_id: string
          quantity: number
          received_qty: number
          total: number
          unit: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          material_id?: string | null
          order_idx?: number
          purchase_order_id: string
          quantity?: number
          received_qty?: number
          total?: number
          unit?: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          material_id?: string | null
          order_idx?: number
          purchase_order_id?: string
          quantity?: number
          received_qty?: number
          total?: number
          unit?: string
          unit_price?: number
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          expected_date: string | null
          folio: string
          id: string
          notes: string | null
          organization_id: string
          project_id: string | null
          requisition_id: string | null
          status: Database["public"]["Enums"]["purchase_order_status"]
          subtotal: number
          supplier_id: string | null
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          expected_date?: string | null
          folio: string
          id?: string
          notes?: string | null
          organization_id: string
          project_id?: string | null
          requisition_id?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          subtotal?: number
          supplier_id?: string | null
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          expected_date?: string | null
          folio?: string
          id?: string
          notes?: string | null
          organization_id?: string
          project_id?: string | null
          requisition_id?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          subtotal?: number
          supplier_id?: string | null
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      quality_documents: {
        Row: {
          approved: boolean
          approved_at: string | null
          approved_by: string | null
          category: string | null
          created_at: string
          file_path: string | null
          file_url: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          project_id: string | null
          updated_at: string
          uploaded_by: string | null
          version: string | null
        }
        Insert: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string
          file_path?: string | null
          file_url?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          project_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
          version?: string | null
        }
        Update: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string
          file_path?: string | null
          file_url?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          project_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
          version?: string | null
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          created_at: string
          description: string
          id: string
          order_idx: number
          quantity: number
          quote_id: string
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          order_idx?: number
          quantity?: number
          quote_id: string
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          order_idx?: number
          quantity?: number
          quote_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          folio: string
          id: string
          notes: string | null
          opportunity_id: string | null
          organization_id: string
          status: Database["public"]["Enums"]["quote_status"]
          subtotal: number
          tax: number
          title: string | null
          total: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          folio: string
          id?: string
          notes?: string | null
          opportunity_id?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal?: number
          tax?: number
          title?: string | null
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          folio?: string
          id?: string
          notes?: string | null
          opportunity_id?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal?: number
          tax?: number
          title?: string | null
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      requisition_items: {
        Row: {
          created_at: string
          description: string
          id: string
          material_id: string | null
          order_idx: number
          quantity: number
          requisition_id: string
          total: number
          unit: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          material_id?: string | null
          order_idx?: number
          quantity?: number
          requisition_id: string
          total?: number
          unit?: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          material_id?: string | null
          order_idx?: number
          quantity?: number
          requisition_id?: string
          total?: number
          unit?: string
          unit_price?: number
        }
        Relationships: []
      }
      requisitions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          folio: string
          id: string
          needed_by: string | null
          notes: string | null
          organization_id: string
          project_id: string | null
          requested_by: string | null
          status: Database["public"]["Enums"]["requisition_status"]
          title: string
          total: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          folio: string
          id?: string
          needed_by?: string | null
          notes?: string | null
          organization_id: string
          project_id?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["requisition_status"]
          title: string
          total?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          folio?: string
          id?: string
          needed_by?: string | null
          notes?: string | null
          organization_id?: string
          project_id?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["requisition_status"]
          title?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      safety_validations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          organization_id: string
          progress_entry_id: string | null
          project_id: string | null
          title: string
          updated_at: string
          validated: boolean
          validated_at: string | null
          validated_by: string | null
          work_front_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          progress_entry_id?: string | null
          project_id?: string | null
          title: string
          updated_at?: string
          validated?: boolean
          validated_at?: string | null
          validated_by?: string | null
          work_front_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          progress_entry_id?: string | null
          project_id?: string | null
          title?: string
          updated_at?: string
          validated?: boolean
          validated_at?: string | null
          validated_by?: string | null
          work_front_id?: string | null
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json
          organization_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          organization_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          organization_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          code: string
          created_at: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          max_projects: number
          max_storage_gb: number
          max_users: number
          monthly_price: number
          name: string
          order_idx: number
          yearly_price: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_projects?: number
          max_storage_gb?: number
          max_users?: number
          monthly_price?: number
          name: string
          order_idx?: number
          yearly_price?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_projects?: number
          max_storage_gb?: number
          max_users?: number
          monthly_price?: number
          name?: string
          order_idx?: number
          yearly_price?: number
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          category: string | null
          code: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          id: string
          legal_name: string | null
          name: string
          notes: string | null
          organization_id: string
          payment_terms: string | null
          rfc: string | null
          status: Database["public"]["Enums"]["supplier_status"]
          updated_at: string
        }
        Insert: {
          category?: string | null
          code?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          legal_name?: string | null
          name: string
          notes?: string | null
          organization_id: string
          payment_terms?: string | null
          rfc?: string | null
          status?: Database["public"]["Enums"]["supplier_status"]
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          legal_name?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          payment_terms?: string | null
          rfc?: string | null
          status?: Database["public"]["Enums"]["supplier_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_events: {
        Row: {
          actor_id: string | null
          created_at: string
          description: string | null
          entity_id: string | null
          entity_table: string | null
          event_type: string
          id: string
          metadata: Json
          organization_id: string
          project_id: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          source: Database["public"]["Enums"]["event_source"]
          title: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_table?: string | null
          event_type: string
          id?: string
          metadata?: Json
          organization_id: string
          project_id?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          source: Database["public"]["Enums"]["event_source"]
          title: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_table?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          organization_id?: string
          project_id?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          source?: Database["public"]["Enums"]["event_source"]
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vacation_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          days: number
          employee_id: string
          end_date: string
          id: string
          organization_id: string
          reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["vacation_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          days?: number
          employee_id: string
          end_date: string
          id?: string
          organization_id: string
          reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["vacation_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          days?: number
          employee_id?: string
          end_date?: string
          id?: string
          organization_id?: string
          reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["vacation_status"]
          updated_at?: string
        }
        Relationships: []
      }
      warehouse_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          material_id: string
          movement_type: Database["public"]["Enums"]["warehouse_movement_type"]
          notes: string | null
          organization_id: string
          project_id: string | null
          purchase_order_id: string | null
          quantity: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          material_id: string
          movement_type: Database["public"]["Enums"]["warehouse_movement_type"]
          notes?: string | null
          organization_id: string
          project_id?: string | null
          purchase_order_id?: string | null
          quantity: number
          unit_cost?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          material_id?: string
          movement_type?: Database["public"]["Enums"]["warehouse_movement_type"]
          notes?: string | null
          organization_id?: string
          project_id?: string | null
          purchase_order_id?: string | null
          quantity?: number
          unit_cost?: number
        }
        Relationships: []
      }
      whatsapp_logs: {
        Row: {
          created_at: string
          id: string
          level: Database["public"]["Enums"]["whatsapp_log_level"]
          message: string
          organization_id: string
          payload: Json
          session_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["whatsapp_log_level"]
          message: string
          organization_id?: string
          payload?: Json
          session_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["whatsapp_log_level"]
          message?: string
          organization_id?: string
          payload?: Json
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_queue: {
        Row: {
          attempts: number
          body: string | null
          candidate_id: string | null
          created_at: string
          direction: Database["public"]["Enums"]["whatsapp_queue_direction"]
          id: string
          last_error: string | null
          media_kind: string | null
          media_mime: string | null
          media_url: string | null
          metadata: Json
          organization_id: string
          phone_number: string
          provider_message_id: string | null
          session_id: string | null
          status: Database["public"]["Enums"]["whatsapp_queue_status"]
          updated_at: string
        }
        Insert: {
          attempts?: number
          body?: string | null
          candidate_id?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["whatsapp_queue_direction"]
          id?: string
          last_error?: string | null
          media_kind?: string | null
          media_mime?: string | null
          media_url?: string | null
          metadata?: Json
          organization_id?: string
          phone_number: string
          provider_message_id?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["whatsapp_queue_status"]
          updated_at?: string
        }
        Update: {
          attempts?: number
          body?: string | null
          candidate_id?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["whatsapp_queue_direction"]
          id?: string
          last_error?: string | null
          media_kind?: string | null
          media_mime?: string | null
          media_url?: string | null
          metadata?: Json
          organization_id?: string
          phone_number?: string
          provider_message_id?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["whatsapp_queue_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_queue_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_queue_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_rate_limits: {
        Row: {
          blocked_until: string | null
          count: number
          phone_number: string
          window_start: string
        }
        Insert: {
          blocked_until?: string | null
          count?: number
          phone_number: string
          window_start?: string
        }
        Update: {
          blocked_until?: string | null
          count?: number
          phone_number?: string
          window_start?: string
        }
        Relationships: []
      }
      whatsapp_sessions: {
        Row: {
          created_at: string
          id: string
          instance_name: string
          last_error: string | null
          last_seen_at: string | null
          metadata: Json
          organization_id: string
          phone_number: string | null
          provider: string
          qr_base64: string | null
          qr_expires_at: string | null
          status: Database["public"]["Enums"]["whatsapp_session_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instance_name: string
          last_error?: string | null
          last_seen_at?: string | null
          metadata?: Json
          organization_id?: string
          phone_number?: string | null
          provider?: string
          qr_base64?: string | null
          qr_expires_at?: string | null
          status?: Database["public"]["Enums"]["whatsapp_session_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instance_name?: string
          last_error?: string | null
          last_seen_at?: string | null
          metadata?: Json
          organization_id?: string
          phone_number?: string | null
          provider?: string
          qr_base64?: string | null
          qr_expires_at?: string | null
          status?: Database["public"]["Enums"]["whatsapp_session_status"]
          updated_at?: string
        }
        Relationships: []
      }
      work_fronts: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          organization_id: string
          progress_pct: number
          project_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["work_front_status"]
          supervisor_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          organization_id: string
          progress_pct?: number
          project_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["work_front_status"]
          supervisor_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          organization_id?: string
          progress_pct?: number
          project_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["work_front_status"]
          supervisor_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      work_permits: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          closed_at: string | null
          controls: string | null
          created_at: string
          created_by: string | null
          description: string | null
          folio: string | null
          hazards: string | null
          id: string
          location: string | null
          organization_id: string
          permit_type: Database["public"]["Enums"]["permit_type"]
          ppe: string | null
          project_id: string | null
          requested_by: string | null
          status: Database["public"]["Enums"]["permit_status"]
          title: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
          work_front_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          closed_at?: string | null
          controls?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          folio?: string | null
          hazards?: string | null
          id?: string
          location?: string | null
          organization_id: string
          permit_type?: Database["public"]["Enums"]["permit_type"]
          ppe?: string | null
          project_id?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["permit_status"]
          title: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          work_front_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          closed_at?: string | null
          controls?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          folio?: string | null
          hazards?: string | null
          id?: string
          location?: string | null
          organization_id?: string
          permit_type?: Database["public"]["Enums"]["permit_type"]
          ppe?: string | null
          project_id?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["permit_status"]
          title?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          work_front_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_org_id: { Args: never; Returns: string }
      emit_alert: {
        Args: {
          _desc: string
          _entity_id: string
          _entity_table: string
          _link: string
          _org: string
          _project: string
          _severity: Database["public"]["Enums"]["alert_severity"]
          _source: Database["public"]["Enums"]["event_source"]
          _title: string
        }
        Returns: string
      }
      emit_event: {
        Args: {
          _desc: string
          _entity_id: string
          _entity_table: string
          _metadata: Json
          _org: string
          _project: string
          _severity: Database["public"]["Enums"]["alert_severity"]
          _source: Database["public"]["Enums"]["event_source"]
          _title: string
          _type: string
        }
        Returns: string
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: { Args: { _org_id: string }; Returns: boolean }
    }
    Enums: {
      action_status: "pendiente" | "en_curso" | "completada" | "verificada"
      activity_type: "llamada" | "correo" | "reunion" | "nota" | "tarea"
      alert_severity: "info" | "warning" | "critical"
      alert_status: "activa" | "reconocida" | "resuelta"
      app_role:
        | "direccion"
        | "admin"
        | "produccion"
        | "calidad"
        | "seguridad"
        | "finanzas"
        | "rh"
        | "compras"
        | "supervisor"
        | "cliente"
        | "proveedor"
      approval_kind:
        | "compra"
        | "permiso"
        | "inspeccion"
        | "vacacion"
        | "gasto"
        | "otro"
      approval_status: "pendiente" | "aprobado" | "rechazado" | "observado"
      attendance_status:
        | "presente"
        | "retardo"
        | "falta"
        | "incapacidad"
        | "vacaciones"
      candidate_msg_direction: "in" | "out"
      candidate_source: "web" | "whatsapp" | "referido" | "manual"
      candidate_status:
        | "nuevo"
        | "en_revision"
        | "entrevista"
        | "aceptado"
        | "rechazado"
        | "contratado"
        | "descartado"
      cash_movement_type: "ingreso" | "egreso"
      client_status: "activo" | "prospecto" | "inactivo"
      department:
        | "direccion"
        | "asesoria"
        | "subgerencia"
        | "operaciones"
        | "produccion"
        | "calidad"
        | "seguridad"
        | "finanzas"
        | "comercial"
        | "rh"
        | "compras"
        | "general"
      doc_validation_status: "pendiente" | "valido" | "incompleto" | "rechazado"
      document_kind:
        | "ine"
        | "contrato"
        | "dc3"
        | "certificacion"
        | "curp_doc"
        | "rfc_doc"
        | "nss_doc"
        | "poliza"
        | "otro"
      email_direction: "inbound" | "outbound" | "internal"
      email_status:
        | "nuevo"
        | "asignado"
        | "en_proceso"
        | "respondido"
        | "cerrado"
        | "archivado"
      employee_status: "activo" | "baja" | "suspendido" | "candidato"
      event_source:
        | "crm"
        | "projects"
        | "supply"
        | "production"
        | "quality"
        | "safety"
        | "finance"
        | "hr"
        | "system"
      evidence_kind: "foto" | "video" | "documento"
      expense_category:
        | "materiales"
        | "mano_obra"
        | "equipo"
        | "subcontrato"
        | "servicios"
        | "transporte"
        | "administrativo"
        | "seguridad"
        | "calidad"
        | "otros"
      expense_status: "borrador" | "aprobado" | "pagado" | "cancelado"
      incident_severity:
        | "casi_accidente"
        | "leve"
        | "moderado"
        | "grave"
        | "fatal"
      incident_status: "reportado" | "investigacion" | "accion" | "cerrado"
      inspection_status: "pendiente" | "en_proceso" | "liberada" | "rechazada"
      interview_mode: "presencial" | "telefonica" | "videollamada"
      interview_status:
        | "programada"
        | "confirmada"
        | "reprogramada"
        | "completada"
        | "no_show"
        | "cancelada"
      nc_severity: "menor" | "mayor" | "critica"
      nc_status: "abierta" | "en_accion" | "verificacion" | "cerrada"
      notification_type: "info" | "success" | "warning" | "critical"
      opportunity_stage:
        | "prospecto"
        | "contactado"
        | "cotizacion"
        | "negociacion"
        | "aprobado"
        | "perdido"
      permit_status:
        | "borrador"
        | "en_revision"
        | "aprobado"
        | "rechazado"
        | "cerrado"
      permit_type:
        | "altura"
        | "caliente"
        | "electrico"
        | "excavacion"
        | "espacio_confinado"
        | "izaje"
        | "quimicos"
        | "general"
      progress_status: "en_curso" | "pausado" | "completado"
      project_status:
        | "planeacion"
        | "en_curso"
        | "pausado"
        | "completado"
        | "cancelado"
      purchase_order_status:
        | "borrador"
        | "enviada"
        | "confirmada"
        | "parcial"
        | "recibida"
        | "cancelada"
        | "cerrada"
      quote_status:
        | "borrador"
        | "enviada"
        | "aprobada"
        | "rechazada"
        | "vencida"
      requisition_status:
        | "borrador"
        | "en_revision"
        | "aprobada"
        | "rechazada"
        | "comprada"
        | "recibida"
        | "cerrada"
      supplier_status: "activo" | "en_evaluacion" | "inactivo"
      vacation_status: "solicitada" | "aprobada" | "rechazada" | "disfrutada"
      warehouse_movement_type: "entrada" | "salida" | "ajuste" | "transferencia"
      whatsapp_log_level: "info" | "warning" | "error" | "debug"
      whatsapp_queue_direction: "inbound" | "outbound"
      whatsapp_queue_status:
        | "pending"
        | "processing"
        | "sent"
        | "delivered"
        | "failed"
        | "blocked"
      whatsapp_session_status:
        | "disconnected"
        | "qr_pending"
        | "connecting"
        | "connected"
        | "error"
        | "expired"
      work_front_status: "planeado" | "activo" | "pausado" | "completado"
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
      action_status: ["pendiente", "en_curso", "completada", "verificada"],
      activity_type: ["llamada", "correo", "reunion", "nota", "tarea"],
      alert_severity: ["info", "warning", "critical"],
      alert_status: ["activa", "reconocida", "resuelta"],
      app_role: [
        "direccion",
        "admin",
        "produccion",
        "calidad",
        "seguridad",
        "finanzas",
        "rh",
        "compras",
        "supervisor",
        "cliente",
        "proveedor",
      ],
      approval_kind: [
        "compra",
        "permiso",
        "inspeccion",
        "vacacion",
        "gasto",
        "otro",
      ],
      approval_status: ["pendiente", "aprobado", "rechazado", "observado"],
      attendance_status: [
        "presente",
        "retardo",
        "falta",
        "incapacidad",
        "vacaciones",
      ],
      candidate_msg_direction: ["in", "out"],
      candidate_source: ["web", "whatsapp", "referido", "manual"],
      candidate_status: [
        "nuevo",
        "en_revision",
        "entrevista",
        "aceptado",
        "rechazado",
        "contratado",
        "descartado",
      ],
      cash_movement_type: ["ingreso", "egreso"],
      client_status: ["activo", "prospecto", "inactivo"],
      department: [
        "direccion",
        "asesoria",
        "subgerencia",
        "operaciones",
        "produccion",
        "calidad",
        "seguridad",
        "finanzas",
        "comercial",
        "rh",
        "compras",
        "general",
      ],
      doc_validation_status: ["pendiente", "valido", "incompleto", "rechazado"],
      document_kind: [
        "ine",
        "contrato",
        "dc3",
        "certificacion",
        "curp_doc",
        "rfc_doc",
        "nss_doc",
        "poliza",
        "otro",
      ],
      email_direction: ["inbound", "outbound", "internal"],
      email_status: [
        "nuevo",
        "asignado",
        "en_proceso",
        "respondido",
        "cerrado",
        "archivado",
      ],
      employee_status: ["activo", "baja", "suspendido", "candidato"],
      event_source: [
        "crm",
        "projects",
        "supply",
        "production",
        "quality",
        "safety",
        "finance",
        "hr",
        "system",
      ],
      evidence_kind: ["foto", "video", "documento"],
      expense_category: [
        "materiales",
        "mano_obra",
        "equipo",
        "subcontrato",
        "servicios",
        "transporte",
        "administrativo",
        "seguridad",
        "calidad",
        "otros",
      ],
      expense_status: ["borrador", "aprobado", "pagado", "cancelado"],
      incident_severity: [
        "casi_accidente",
        "leve",
        "moderado",
        "grave",
        "fatal",
      ],
      incident_status: ["reportado", "investigacion", "accion", "cerrado"],
      inspection_status: ["pendiente", "en_proceso", "liberada", "rechazada"],
      interview_mode: ["presencial", "telefonica", "videollamada"],
      interview_status: [
        "programada",
        "confirmada",
        "reprogramada",
        "completada",
        "no_show",
        "cancelada",
      ],
      nc_severity: ["menor", "mayor", "critica"],
      nc_status: ["abierta", "en_accion", "verificacion", "cerrada"],
      notification_type: ["info", "success", "warning", "critical"],
      opportunity_stage: [
        "prospecto",
        "contactado",
        "cotizacion",
        "negociacion",
        "aprobado",
        "perdido",
      ],
      permit_status: [
        "borrador",
        "en_revision",
        "aprobado",
        "rechazado",
        "cerrado",
      ],
      permit_type: [
        "altura",
        "caliente",
        "electrico",
        "excavacion",
        "espacio_confinado",
        "izaje",
        "quimicos",
        "general",
      ],
      progress_status: ["en_curso", "pausado", "completado"],
      project_status: [
        "planeacion",
        "en_curso",
        "pausado",
        "completado",
        "cancelado",
      ],
      purchase_order_status: [
        "borrador",
        "enviada",
        "confirmada",
        "parcial",
        "recibida",
        "cancelada",
        "cerrada",
      ],
      quote_status: ["borrador", "enviada", "aprobada", "rechazada", "vencida"],
      requisition_status: [
        "borrador",
        "en_revision",
        "aprobada",
        "rechazada",
        "comprada",
        "recibida",
        "cerrada",
      ],
      supplier_status: ["activo", "en_evaluacion", "inactivo"],
      vacation_status: ["solicitada", "aprobada", "rechazada", "disfrutada"],
      warehouse_movement_type: ["entrada", "salida", "ajuste", "transferencia"],
      whatsapp_log_level: ["info", "warning", "error", "debug"],
      whatsapp_queue_direction: ["inbound", "outbound"],
      whatsapp_queue_status: [
        "pending",
        "processing",
        "sent",
        "delivered",
        "failed",
        "blocked",
      ],
      whatsapp_session_status: [
        "disconnected",
        "qr_pending",
        "connecting",
        "connected",
        "error",
        "expired",
      ],
      work_front_status: ["planeado", "activo", "pausado", "completado"],
    },
  },
} as const
