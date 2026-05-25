import { useEffect, useState } from 'react';
import { useAuth } from '../store/authStore';
import { getRolePermissions } from '../api/admin';

export function usePermission() {
  const { effectiveRole, user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getRolePermissions()
        .then(res => {
          const roles = res.data || [];
          const rp = roles.find((r: any) => r.role === effectiveRole);
          setPermissions(rp?.permissions || []);
        })
        .catch(() => setPermissions([]));
    }
  }, [effectiveRole]);

  const hasPerm = (perm: string) => permissions.includes(perm);
  const hasAnyPerm = (...perms: string[]) => perms.some(p => permissions.includes(p));
  const hasRole = (...roles: string[]) => roles.includes(effectiveRole);

  return {
    isAdmin: hasPerm('admin.roles'),
    isTemplateAdmin: hasPerm('templates.create'),
    isGeneralUser: !hasPerm('templates.create') && !hasPerm('approvals.approve') && !hasPerm('admin.roles'),
    canManageUsers: hasPerm('users.manage'),
    canManageReviewTypes: hasPerm('review_types.manage'),
    canCreateTemplate: hasPerm('templates.create'),
    canApprove: hasPerm('approvals.approve'),
    hasPerm,
    hasAnyPerm,
    hasRole,
  };
}
