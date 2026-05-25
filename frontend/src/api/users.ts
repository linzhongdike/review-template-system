import client from './client';

export const getUsers = (params?: Record<string, any>) =>
  client.get('/users', { params });

export const getUser = (id: number) => client.get(`/users/${id}`);

export const createUser = (data: Record<string, any>) =>
  client.post('/users', data);

export const updateUser = (id: number, data: Record<string, any>) =>
  client.put(`/users/${id}`, data);

export const deleteUser = (id: number) => client.delete(`/users/${id}`);

export const updateUserRole = (id: number, role: string) =>
  client.put(`/users/${id}/role`, { role });
