import client from './client';

export const login = (username: string, password: string) =>
  client.post('/auth/login', { username, password });

export const register = (username: string, password: string, display_name: string) =>
  client.post('/auth/register', { username, password, display_name });

export const getMe = () => client.get('/auth/me');

export const changePassword = (old_password: string, new_password: string) =>
  client.put('/auth/change-password', { old_password, new_password });
