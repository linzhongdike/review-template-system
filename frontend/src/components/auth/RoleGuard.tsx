import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '../../hooks/usePermission';

interface Props {
  roles: string[];
  children: React.ReactNode;
}

export default function RoleGuard({ roles, children }: Props) {
  const perm = usePermission();
  const navigate = useNavigate();

  if (!perm.hasRole(...roles)) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="您没有权限访问此页面"
        extra={<Button type="primary" onClick={() => navigate('/dashboard')}>返回首页</Button>}
      />
    );
  }

  return <>{children}</>;
}
