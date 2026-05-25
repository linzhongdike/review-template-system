import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  UserOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { usePermission } from '../../hooks/usePermission';

const { Sider } = Layout;

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const perm = usePermission();

  const menuItems = [
    { key: '/dashboard', icon: <HomeOutlined />, label: '首页' },
    ...(perm.canApprove ? [{ key: '/approvals/pending', icon: <CheckCircleOutlined />, label: '待办流程' }] : []),
    { key: '/templates', icon: <FileTextOutlined />, label: '模板管理' },
    ...(perm.canManageReviewTypes ? [{ key: '/review-types', icon: <AppstoreOutlined />, label: '评审阶段' }] : []),
    ...(perm.canManageUsers ? [{ key: '/users', icon: <UserOutlined />, label: '用户管理' }] : []),
    ...(perm.isAdmin ? [{ key: '/admin/roles', icon: <SettingOutlined />, label: '权限配置' }] : []),
  ];

  const selectedKey = '/' + location.pathname.split('/').slice(1, 3).join('/');

  return (
    <Sider width={220} theme="dark">
      <div style={{
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 18, fontWeight: 'bold', borderBottom: '1px solid #303030'
      }}>
        📋 评审模板管理系统
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  );
}
