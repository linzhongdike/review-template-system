export interface DocBlock {
  id?: number;
  sort_order: number;
  title?: string;
  content: string;
}

export interface ReviewItem {
  id?: number;
  sort_order: number;
  name: string;
  description?: string;
  item_type: string;
  required: boolean;
  config: Record<string, any>;
}

export interface Template {
  id: number;
  review_type_id: number;
  review_type_name?: string;
  name: string;
  description: string | null;
  status: string;
  tags: string[];
  current_version_id: number | null;
  current_version_number?: string;
  expire_at: string | null;
  created_by: number | null;
  creator_name?: string;
  created_at: string | null;
  updated_at: string | null;
  current_version?: any;
}
