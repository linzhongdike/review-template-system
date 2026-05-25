import client from './client';

export const getRolePermissions = () =>
  client.get('/admin/roles');

export const updateRolePermissions = (role: string, permissions: string[]) =>
  client.put(`/admin/roles/${role}`, { permissions });

export const getMyPermissions = () =>
  client.get('/admin/my-permissions');
