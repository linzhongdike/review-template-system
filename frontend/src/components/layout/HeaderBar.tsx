import { useNavigate } from 'react-router-dom';
import { Layout, Dropdown, Space, Tag } from 'antd';
import { UserOutlined, LogoutOutlined, KeyOutlined, SwapOutlined } from '@ant-design/icons';
import { useAuth } from '../../store/authStore';
import { ROLES } from '../../utils/constants';

const { Header } = Layout;

const ROLE_LIST = Object.entries(ROLES).map(([k, v]) => ({ value: k, label: v.label, color: v.color }));

export default function HeaderBar() {
  const { user, logout, effectiveRole, simulatedRole, setSimulatedRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const isAdmin = user?.role === 'sys_admin';
  const displayRole = simulatedRole || user?.role;
  const roleInfo = ROLES[displayRole as keyof typeof ROLES];

  const items = [
    { key: 'role', label: `角色: ${roleInfo?.label || displayRole}`, disabled: true },
    ...(isAdmin ? [{
      key: 'simulate', icon: <SwapOutlined />, label: '切换模拟角色',
      children: ROLE_LIST.map(r => ({
        key: `sim_${r.value}`,
        label: <span>{simulatedRole === r.value ? '✓ ' : ''}{r.label}</span>,
        onClick: () => setSimulatedRole(simulatedRole === r.value ? null : r.value),
      })),
    }] : []),
    ...(simulatedRole ? [{ key: 'exit_sim', label: '退出模拟', onClick: () => setSimulatedRole(null) }] : []),
    { type: 'divider' as const },
    { key: 'password', icon: <KeyOutlined />, label: '修改密码' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  return (
    <Header style={{
      background: '#fff', padding: '0 24px', display: 'flex',
      justifyContent: 'flex-end', alignItems: 'center', borderBottom: '1px solid #f0f0f0'
    }}>
      <Space size={16}>
        {simulatedRole && (
          <Tag color="orange" style={{ margin: 0 }}>
            🔄 模拟: {ROLES[simulatedRole as keyof typeof ROLES]?.label}
          </Tag>
        )}
        <Dropdown menu={{ items, onClick: ({ key }) => { if (key === 'logout') handleLogout(); } }}>
          <Space style={{ cursor: 'pointer' }}>
            <UserOutlined />
            <span>{user?.display_name || user?.username}</span>
            {roleInfo && <Tag color={roleInfo.color}>{roleInfo.label}</Tag>}
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
}
