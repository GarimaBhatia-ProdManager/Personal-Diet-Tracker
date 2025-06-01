export interface FeedbackData {
  id?: string;
  user_id?: string;
  rating: number;
  category: string;
  message: string;
  email?: string;
  user_email?: string;
  feedback_type: 'general' | 'bug' | 'feature' | 'other';
  metadata?: {
    browser: string;
    device: string;
    path: string;
  };
  created_at?: string;
  ist_date?: string;
  ist_timestamp?: string;
}

export const FEEDBACK_CATEGORIES = [
  'General',
  'User Interface',
  'Performance',
  'Features',
  'Bug Report',
  'Other'
] as const;

export type FeedbackCategory = typeof FEEDBACK_CATEGORIES[number]; 