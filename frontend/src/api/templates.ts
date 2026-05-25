import client from './client';

export const getTemplates = (params?: Record<string, any>) =>
  client.get('/templates', { params });

export const getTemplate = (id: number) => client.get(`/templates/${id}`);

export const createTemplate = (data: Record<string, any>) =>
  client.post('/templates', data);

export const updateTemplate = (id: number, data: Record<string, any>) =>
  client.put(`/templates/${id}`, data);

export const deleteTemplate = (id: number) => client.delete(`/templates/${id}`);

export const setTemplateExpire = (id: number, expire_at: string | null) =>
  client.put(`/templates/${id}/expire`, null, { params: { expire_at } });

export const archiveTemplate = (id: number) =>
  client.post(`/templates/${id}/archive`);

export const exportTemplate = (id: number) =>
  client.get(`/templates/${id}/export`);
