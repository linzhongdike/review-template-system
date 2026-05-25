import { useEffect, useState, useCallback, useRef } from 'react';
import { Outlet, useNavigate, useLocation, useOutlet } from 'react-router-dom';
import { Layout, Tabs } from 'antd';
import { AppProvider } from '../../store/appStore';
import Sidebar from './Sidebar';
import HeaderBar from './HeaderBar';

const { Content } = Layout;

// 路由 → 标签名称映射
const TAB_TITLES: Record<string, string> = {
  '/dashboard': '首页',
  '/templates': '模板管理',
  '/review-types': '评审阶段',
  '/users': '用户管理',
  '/admin/roles': '权限配置',
  '/approvals/pending': '待办流程',
};

function getTabTitle(pathname: string): string {
  if (TAB_TITLES[pathname]) return TAB_TITLES[pathname];
  if (pathname.match(/^\/templates\/\d+\/edit$/)) return '编辑模板';
  if (pathname.match(/^\/templates\/\d+\/versions$/)) return '版本历史';
  if (pathname.match(/^\/templates\/\d+\/versions\/\d+$/)) return '版本详情';
  if (pathname.match(/^\/templates\/\d+\/versions\/\d+\/diff$/)) return '版本对比';
  if (pathname.match(/^\/templates\/\d+$/)) return '模板详情';
  if (pathname.match(/^\/templates\/create$/)) return '创建模板';
  if (pathname.match(/^\/approvals\/\d+$/)) return '审批历史';
  return pathname;
}

interface Tab {
  key: string;
  label: string;
}

/** 缓存已渲染的页面，切换标签时不销毁 */
function KeepAliveOutlet() {
  const outlet = useOutlet();
  const location = useLocation();
  const cacheRef = useRef<Map<string, React.ReactNode>>(new Map());

  // 缓存当前页面
  if (outlet) {
    cacheRef.current.set(location.pathname, outlet);
  }

  return (
    <>
      {Array.from(cacheRef.current.entries()).map(([path, node]) => (
        <div key={path} style={{ display: path === location.pathname ? 'block' : 'none' }}>
          {node}
        </div>
      ))}
    </>
  );
}

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeKey, setActiveKey] = useState('');

  useEffect(() => {
    const path = location.pathname;
    const title = getTabTitle(path);
    if (path === '/dashboard') {
      setActiveKey('');
      return;
    }

    setTabs(prev => {
      const exists = prev.find(t => t.key === path);
      if (exists) return prev;
      return [...prev, { key: path, label: title }];
    });
    setActiveKey(path);
  }, [location.pathname]);

  const handleTabChange = useCallback((key: string) => {
    setActiveKey(key);
    navigate(key);
  }, [navigate]);

  const handleTabEdit = useCallback((targetKey: any, action: 'add' | 'remove') => {
    if (action === 'remove') {
      const target = targetKey as string;
      setTabs(prev => {
        const idx = prev.findIndex(t => t.key === target);
        const next = prev.filter(t => t.key !== target);
        if (idx === -1) return next;

        if (target === activeKey) {
          const newKey = next[idx]?.key || next[idx - 1]?.key || '/dashboard';
          setActiveKey(newKey);
          navigate(newKey);
        }
        return next;
      });
    }
  }, [activeKey, navigate]);

  const isDashboard = location.pathname === '/dashboard';

  return (
    <AppProvider>
      <Layout style={{ minHeight: '100vh' }}>
        <Sidebar />
        <Layout>
          <HeaderBar />
          {tabs.length > 0 && (
            <Tabs
              className="workbuddy-tabs"
              type="editable-card"
              hideAdd
              activeKey={activeKey}
              onChange={handleTabChange}
              onEdit={handleTabEdit}
              items={tabs}
              size="small"
              style={{ margin: '0 16px', background: '#fff' }}
            />
          )}
          <Content style={{ margin: isDashboard ? 16 : '0 16px 16px', padding: 24, background: '#fff', borderRadius: isDashboard ? 8 : '0 0 8px 8px', minHeight: 360 }}>
            <KeepAliveOutlet />
          </Content>
        </Layout>
      </Layout>
    </AppProvider>
  );
}
