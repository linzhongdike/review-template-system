import client from './client';

export const submitForReview = (templateId: number, change_summary: string) =>
  client.post(`/templates/${templateId}/approvals/submit`, { change_summary });

export const approveTemplate = (templateId: number) =>
  client.post(`/templates/${templateId}/approvals/approve`);

export const rejectTemplate = (templateId: number, comment: string) =>
  client.post(`/templates/${templateId}/approvals/reject`, { comment });

export const getApprovalHistory = (templateId: number) =>
  client.get(`/templates/${templateId}/approvals`);

export const getPendingApprovals = () =>
  client.get('/approvals/pending');
