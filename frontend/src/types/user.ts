export interface User {
  id: number;
  username: string;
  display_name: string;
  email: string | null;
  role: string;
  department: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}
