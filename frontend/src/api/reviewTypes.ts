import client from './client';

export interface ReviewTypeQueryParams {
  include_inactive?: boolean;
  name?: string;
  project_category?: string;
  sub_category?: string;
  status?: string;
}

export const getReviewTypes = (params?: ReviewTypeQueryParams) =>
  client.get('/review-types', { params: params || { include_inactive: true } });

export const getReviewType = (id: number) => client.get(`/review-types/${id}`);

export const createReviewType = (data: Record<string, any>) =>
  client.post('/review-types', data);

export const updateReviewType = (id: number, data: Record<string, any>) =>
  client.put(`/review-types/${id}`, data);

export const deleteReviewType = (id: number) => client.delete(`/review-types/${id}`);

export const updateReviewTypeStatus = (id: number, status: string) =>
  client.put(`/review-types/${id}/status`, { status });

export const downloadReviewTypeTemplate = () =>
  client.get('/review-types/export/template', { responseType: 'blob' });

export const importReviewTypes = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return client.post('/review-types/import', formData);
};
