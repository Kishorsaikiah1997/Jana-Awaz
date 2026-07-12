export enum Urgency {
  CRITICAL = "Critical",
  HIGH = "High",
  MEDIUM = "Medium",
  LOW = "Low"
}

export interface PhotoAnalysis {
  what_is_shown: string;
  infrastructure_type: string;
  damage_visible: boolean;
  damage_description: string | null;
  severity_from_photo: string;
  severity_reasoning: string;
  safety_concern: boolean;
  safety_detail: string | null;
  category_confirmed: boolean;
  category_suggested: string | null;
  estimated_affected_area: string;
  flood_related: boolean;
  actionable_insight: string;
  confidence: number;
  analyzed_at: string;
  analysis_failed: boolean;
}

export interface Theme {
  theme_id: string;
  theme_name: string;
  theme_name_hindi: string;
  theme_name_assamese: string;
  category: string;
  complaint_ids: string[];
  complaint_count: number;
  districts_affected: string[];
  urgency_level: string;
  urgency_reasoning: string;
  peak_time: string;
  flood_related: boolean;
  safety_concerns: boolean;
  representative_complaint: string;
  common_keywords: string[];
  trend: string;
  trend_reasoning: string;
  mp_action_suggested: string;
  estimated_affected_population: number;
  data_confidence: string;
}

export interface ThemeAnalysis {
  themes: Theme[];
  analysis_summary: string;
  total_complaints_analyzed: number;
  total_themes_found: number;
  most_urgent_theme_id: string;
  generated_at: string;
}

export interface Submission {
  id?: string;
  text_original: string;
  text_english: string;
  language_detected: string;
  language_native?: string;
  language_script?: string;
  mixed_language?: boolean;
  state_id?: string;
  state_en?: string;
  state_hi?: string;
  district_id?: string;
  district_en?: string;
  district_hi?: string;
  lok_sabha_id?: string;
  lok_sabha_en?: string;
  lok_sabha_hi?: string;
  district: string;
  state: string;
  loksabha_constituency: string;
  assembly_constituency?: string;
  village_ward?: string;
  police_station?: string;
  gram_panchayat_municipality?: string;
  pincode?: string;
  phone_number?: string;
  category: string;
  category_original?: string;
  category_auto_corrected?: boolean;
  submission_type?: string;
  urgency: Urgency | string;
  urgency_source?: string;
  safety_flagged?: boolean;
  issue_summary: string;
  photo_url?: string;
  photo_analysis?: PhotoAnalysis;
  location?: { lat: number; lng: number; address?: string; timestamp?: string };
  photos?: Array<{url: string, location?: { lat: number; lng: number; address?: string; timestamp?: string }}>;
  timestamp: string;
  anonymous: boolean;
  name?: string;
  moderation_flag?: string | null;
  moderation_log?: {
    checked: boolean;
    text_passed: boolean;
    image_passed: boolean;
    sanitized: boolean;
    timestamp: string;
  };
  user_warning_message?: string;
  image_moderated_warning?: string;
  status?: string;
  mp_note?: string;
  theme_id?: string;
  theme_name?: string;
  theme_urgency?: string;
  published_to_public?: boolean;
  public_note?: string;
  upvotes?: number;
  upvoted_by?: string[];
}

export interface OfflineQueueItem {
  id: string; // client-generated temporary ID
  text: string;
  district: string;
  state: string;
  loksabha_constituency: string;
  assembly_constituency?: string;
  village_ward?: string;
  police_station?: string;
  gram_panchayat_municipality?: string;
  pincode?: string;
  phone_number?: string;
  category: string;
  name: string;
  anonymous: boolean;
  photo_url?: string;
  location?: { lat: number; lng: number; address?: string; timestamp?: string };
  photos?: Array<{url: string, location?: { lat: number; lng: number; address?: string; timestamp?: string }}>;
  timestamp: string;
}

export interface LocalComplaint {
  formatted_id: string;
  firestore_id: string;
  category: string;
  category_icon: string;
  district: string;
  state: string;
  constituency: string;
  urgency: string;
  issue_summary: string;
  submitted_at: string;
  status: string;
  has_photo: boolean;
  gps_tagged: boolean;
  language: string;
}

export interface LocalRequest extends LocalComplaint {}
