import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[AICTE] Supabase credentials missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local. ' +
    'The app will show the login screen but auth will not work until credentials are provided.'
  );
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Database Types
export type UserRole =
  | 'system_administrator'
  | 'competent_authority'
  | 'rb_officer'
  | 'pgrc_officer'
  | 'bureau_officer'
  | 'regional_officer'
  | 'auditor';

export type CaseStatus =
  | 'received'
  | 'pending'
  | 'under_process'
  | 'transferred'
  | 'escalated'
  | 'disposed'
  | 'reopened';

export type CasePriority = 'low' | 'medium' | 'high' | 'urgent';

export type InstitutionType = 'university' | 'autonomous' | 'affiliated' | 'polytechnic' | 'other';

export type OverlapMatchType = 'exact_id' | 'institution_name' | 'subject_similarity' | 'semantic_match';

export type OverlapStatus = 'detected' | 'reviewed' | 'confirmed' | 'dismissed' | 'linked';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: UserRole;
          bureau_id: string | null;
          regional_office_id: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      bureaus: {
        Row: {
          id: string;
          code: string;
          name: string;
          short_name: string;
          description: string | null;
          email: string | null;
          phone: string | null;
          color: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      regional_offices: {
        Row: {
          id: string;
          name: string;
          code: string;
          region: string;
          state: string;
          city: string;
          address: string | null;
          email: string | null;
          phone: string | null;
          is_active: boolean;
          created_at: string;
        };
      };
      institutions: {
        Row: {
          id: string;
          aicte_permanent_id: string | null;
          name: string;
          type: InstitutionType;
          state: string;
          district: string | null;
          city: string | null;
          address: string | null;
          pincode: string | null;
          email: string | null;
          phone: string | null;
          website: string | null;
          regional_office_id: string | null;
          verified: boolean;
          aliases: string[] | null;
          created_at: string;
          updated_at: string;
        };
      };
      cases: {
        Row: {
          id: string;
          case_number: string;
          institution_id: string | null;
          institution_name: string;
          aicte_permanent_id: string | null;
          subject: string;
          description: string;
          category: string;
          complainant_name: string;
          complainant_email: string;
          complainant_phone: string | null;
          bureau_id: string | null;
          assigned_officer_id: string | null;
          regional_office_id: string | null;
          status: CaseStatus;
          priority: CasePriority;
          receipt_date: string;
          expected_disposal_date: string | null;
          actual_disposal_date: string | null;
          last_action_date: string;
          last_action_description: string | null;
          next_required_action: string | null;
          disposal_outcome: string | null;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['cases']['Row'],
          'id' | 'case_number' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['cases']['Insert']>;
      };
      case_actions: {
        Row: {
          id: string;
          case_id: string;
          action_type: string;
          performed_by_id: string | null;
          performed_by_name: string;
          performed_by_role: string;
          old_status: CaseStatus | null;
          new_status: CaseStatus | null;
          old_bureau_id: string | null;
          new_bureau_id: string | null;
          action_description: string;
          details: string | null;
          created_at: string;
        };
      };
      case_notes: {
        Row: {
          id: string;
          case_id: string;
          author_id: string | null;
          author_name: string;
          author_role: string;
          note_text: string;
          is_internal: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      case_documents: {
        Row: {
          id: string;
          case_id: string;
          file_name: string;
          file_type: string;
          file_size: number | null;
          storage_path: string;
          uploaded_by_id: string | null;
          is_sensitive: boolean;
          created_at: string;
        };
      };
      overlap_alerts: {
        Row: {
          id: string;
          case_id: string;
          related_case_id: string;
          institution_id: string | null;
          match_type: OverlapMatchType;
          match_confidence: number | null;
          match_reason: string;
          status: OverlapStatus;
          reviewed_by_id: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
          detected_at: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          case_id: string | null;
          title: string;
          message: string;
          notification_type: string;
          is_read: boolean;
          created_at: string;
        };
      };
    };
  };
}
