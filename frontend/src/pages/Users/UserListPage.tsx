import { useEffect, useState } from 'react';
import { Table, Button, Input, Select, Space, Tag, Typography, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getUsers, deleteUser } from '../../api/users';
import { ROLES } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';
import UserFormModal from './UserFormModal';

const { Title } = Typography;

export default function UserListPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params: any = { page, page_size: 20 };
      if (keyword) params.keyword = keyword;
      if (roleFilter) params.role = roleFilter;
      const res = await getUsers(params);
      setUsers(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, [page, roleFilter]);

  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id);
      message.success('用户已禁用');
      loadUsers();
    } catch {}
  };

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '显示名', dataIndex: 'display_name', key: 'display_name' },
    {
      title: '角色', dataIndex: 'role', key: 'role',
      render: (role: string) => {
        const r = ROLES[role as keyof typeof ROLES];
        return r ? <Tag color={r.color}>{r.label}</Tag> : role;
      }
    },
    { title: '部门', dataIndex: 'department', key: 'department' },
    { title: '状态', dataIndex: 'is_active', key: 'is_active', render: (v: boolean) => v ? <Tag color="green">正常</Tag> : <Tag color="red">禁用</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: formatDateTime },
    {
      title: '操作', key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" onClick={() => { setEditingUser(record); setModalVisible(true); }}>编辑</Button>
          <Popconfirm title="确定禁用该用户？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger disabled={!record.is_active}>禁用</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>用户管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingUser(null); setModalVisible(true); }}>
          创建用户
        </Button>
      </div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <Input.Search placeholder="搜索用户名/显示名" value={keyword} onChange={e => setKeyword(e.target.value)}
          onSearch={() => { setPage(1); loadUsers(); }} style={{ width: 300 }} enterButton />
        <Select placeholder="角色筛选" allowClear style={{ width: 160 }} value={roleFilter}
          onChange={(v) => { setRoleFilter(v); setPage(1); }}>
          {Object.entries(ROLES).map(([k, v]) => <Select.Option key={k} value={k}>{v.label}</Select.Option>)}
        </Select>
      </div>
      <Table rowKey="id" columns={columns} dataSource={users} loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: setPage, showTotal: t => `共 ${t} 条` }} />
      <UserFormModal visible={modalVisible} user={editingUser}
        onClose={() => setModalVisible(false)} onSuccess={() => { setModalVisible(false); loadUsers(); }} />
    </div>
  );
}
