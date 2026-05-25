import client from './client';

export const getVersions = (templateId: number) =>
  client.get(`/templates/${templateId}/versions`);

export const getVersion = (templateId: number, versionId: number) =>
  client.get(`/templates/${templateId}/versions/${versionId}`);

export const createVersion = (templateId: number, data?: { change_summary?: string }) =>
  client.post(`/templates/${templateId}/versions`, data || {});

export const updateVersion = (templateId: number, versionId: number, data: Record<string, any>) =>
  client.put(`/templates/${templateId}/versions/${versionId}`, data);

export const rollbackVersion = (templateId: number, versionId: number) =>
  client.post(`/templates/${templateId}/versions/${versionId}/rollback`);

export const getVersionDiff = (templateId: number, versionId: number) =>
  client.get(`/templates/${templateId}/versions/${versionId}/diff`);

export const deleteVersion = (templateId: number, versionId: number) =>
  client.delete(`/templates/${templateId}/versions/${versionId}`);
