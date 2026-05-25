export interface ApprovalRecord {
  id: number;
  template_id: number;
  version_id: number;
  action: string;
  comment: string | null;
  operator_id: number;
  operator_name?: string;
  operated_at: string | null;
}

export interface PendingApproval {
  template_id: number;
  template_name: string;
  version_id: number;
  version_number: string;
  submitter_name: string;
  submitted_at: string | null;
}
