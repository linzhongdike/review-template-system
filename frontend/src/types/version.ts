export interface TemplateVersion {
  id: number;
  template_id: number;
  version_number: string;
  status: string;
  change_summary: string | null;
  created_by: number | null;
  creator_name?: string;
  created_at: string | null;
  template_name?: string;
  doc_blocks?: any[];
  review_items?: any[];
}

export interface VersionDiff {
  version_a: any;
  version_b: any;
  block_diffs: DiffItem[];
  item_diffs: DiffItem[];
}

export interface DiffItem {
  sort_order: number;
  type: 'added' | 'removed' | 'modified';
  a?: any;
  b?: any;
}
