export const ROLES = {
  general_user: { label: '一般用户', color: 'blue' },
  template_admin: { label: '模板管理员', color: 'green' },
  template_reviewer: { label: '模板审核员', color: 'orange' },
  sys_admin: { label: '系统管理员', color: 'red' },
} as const;

export const TEMPLATE_STATUS = {
  draft: { label: '草稿', color: 'default' },
  active: { label: '已发布', color: 'green' },
  inactive: { label: '已停用', color: 'orange' },
  archived: { label: '已失效', color: 'default' },
} as const;

export const VERSION_STATUS = {
  draft: { label: '编辑中', color: 'blue' },
  reviewing: { label: '审核中', color: 'processing' },
  published: { label: '已发布', color: 'green' },
  rejected: { label: '已驳回', color: 'error' },
  archived: { label: '已失效', color: 'default' },
} as const;

export const ITEM_TYPES = {
  score: { label: '评分项', icon: 'StarOutlined' },
  text: { label: '文本输入', icon: 'EditOutlined' },
  textarea: { label: '文本域', icon: 'FileTextOutlined' },
  radio: { label: '单选题', icon: 'CheckCircleOutlined' },
  checkbox: { label: '多选题', icon: 'CheckSquareOutlined' },
  attachment: { label: '附件上传', icon: 'PaperClipOutlined' },
} as const;

export const APPROVAL_ACTIONS = {
  submit: { label: '提交审核', color: 'blue' },
  approve: { label: '审核通过', color: 'green' },
  reject: { label: '审核驳回', color: 'red' },
} as const;
