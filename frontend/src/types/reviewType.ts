export interface ReviewType {
  id: number;
  name: string;
  status: string;
  project_category: string | null;
  sub_category: string | null;
  created_by: number | null;
  created_at: string | null;
  updated_at: string | null;
  template_count?: number;
  active_template_count?: number;
  expired_template_count?: number;
}
