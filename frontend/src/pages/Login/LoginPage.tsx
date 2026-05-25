import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../store/authStore';
import { login, register } from '../../api/auth';

const { Title } = Typography;

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      if (isRegister) {
        await register(values.username, values.password, values.display_name);
        message.success('注册成功，请登录');
        setIsRegister(false);
      } else {
        const res = await login(values.username, values.password);
        auth.login(res.data.access_token, res.data.user);
        message.success('登录成功');
        navigate('/dashboard');
      }
    } catch (err: any) {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', justifyContent: 'center',
      alignItems: 'center', background: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)'
    }}>
      <Card style={{ width: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
          {isRegister ? '注册账号' : '评审材料模板管理系统'}
        </Title>
        <Form onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          {isRegister && (
            <Form.Item name="display_name" rules={[{ required: true, message: '请输入显示名称' }]}>
              <Input placeholder="显示名称" />
            </Form.Item>
          )}
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {isRegister ? '注册' : '登录'}
            </Button>
          </Form.Item>
          <Form.Item style={{ textAlign: 'center', marginBottom: 0 }}>
            <Button type="link" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
