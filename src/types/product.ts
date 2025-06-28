export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'published' | 'archived';
  images?: string[];
  documents?: string[];
  gpsr_category?: string;
  gpsr_compliance?: boolean;
  gpsr_notes?: string;
  moderation_status?: 'pending' | 'approved' | 'rejected';
  moderation_notes?: string;
  moderation_date?: string | null;
  moderation_by?: string | null;
}
