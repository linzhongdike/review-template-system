import { useEffect, useState } from 'react';
import { Table, Button, Checkbox, Typography, message, Card, Space, Tag } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { getRolePermissions, updateRolePermissions } from '../../api/admin';
import { ROLES } from '../../utils/constants';
import { usePermission } from '../../hooks/usePermission';

const { Title } = Typography;

const ALL_PERMISSIONS = [
  { key: 'templates.view', label: '查看模板', group: '模板' },
  { key: 'templates.create', label: '创建模板', group: '模板' },
  { key: 'templates.edit', label: '编辑模板', group: '模板' },
  { key: 'templates.delete', label: '删除模板', group: '模板' },
  { key: 'templates.archive', label: '失效模板', group: '模板' },
  { key: 'templates.export', label: '导出模板', group: '模板' },
  { key: 'versions.view', label: '查看版本', group: '版本' },
  { key: 'versions.create', label: '创建版本', group: '版本' },
  { key: 'versions.delete', label: '删除版本', group: '版本' },
  { key: 'versions.rollback', label: '回滚版本', group: '版本' },
  { key: 'approvals.submit', label: '提交审批', group: '审批' },
  { key: 'approvals.approve', label: '审批通过', group: '审批' },
  { key: 'approvals.reject', label: '驳回', group: '审批' },
  { key: 'users.manage', label: '用户管理', group: '系统' },
  { key: 'review_types.manage', label: '评审阶段管理', group: '系统' },
  { key: 'admin.roles', label: '权限配置', group: '系统' },
];

export default function RolePermissionsPage() {
  const perm = usePermission();
  const [data, setData] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getRolePermissions();
      const map: Record<string, string[]> = {};
      for (const item of res.data) {
        map[item.role] = item.permissions;
      }
      setData(map);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const togglePermission = (role: string, permKey: string) => {
    setData(prev => {
      const current = prev[role] || [];
      const next = current.includes(permKey)
        ? current.filter(p => p !== permKey)
        : [...current, permKey];
      return { ...prev, [role]: next };
    });
  };

  const handleSave = async (role: string) => {
    setSaving(role);
    try {
      await updateRolePermissions(role, data[role] || []);
      message.success(`角色「${ROLES[role as keyof typeof ROLES]?.label || role}」权限已保存`);
    } catch { message.error('保存失败'); }
    finally { setSaving(null); }
  };

  if (!perm.isAdmin) return <div>无权限访问</div>;

  const groups = [...new Set(ALL_PERMISSIONS.map(p => p.group))];

  return (
    <div>
      <Title level={4}>角色权限配置</Title>
      <p style={{ color: '#666', marginBottom: 16 }}>勾选权限后点击"保存"生效，无需重启服务。</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {Object.entries(data).map(([role, perms]) => (
          <Card
            key={role}
            title={<Space>{ROLES[role as keyof typeof ROLES]?.label || role}<Tag color={ROLES[role as keyof typeof ROLES]?.color}>{role}</Tag></Space>}
            extra={<Button type="primary" icon={<SaveOutlined />} loading={saving === role} onClick={() => handleSave(role)}>保存</Button>}
            style={{ width: 360 }}
          >
            {groups.map(group => (
              <div key={group} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#999', marginBottom: 4 }}>{group}</div>
                {ALL_PERMISSIONS.filter(p => p.group === group).map(p => (
                  <Checkbox
                    key={p.key}
                    checked={perms.includes(p.key)}
                    onChange={() => togglePermission(role, p.key)}
                  >
                    {p.label}
                  </Checkbox>
                ))}
              </div>
            ))}
          </Card>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={load}>重置修改</Button>
      </div>
    </div>
  );
}
