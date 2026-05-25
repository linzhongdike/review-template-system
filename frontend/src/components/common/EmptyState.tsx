import { Empty, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

interface Props {
  description?: string;
  actionText?: string;
  actionPath?: string;
}

export default function EmptyState({ description = '暂无数据', actionText, actionPath }: Props) {
  const navigate = useNavigate();
  return (
    <Empty description={description}>
      {actionText && actionPath && (
        <Button type="primary" onClick={() => navigate(actionPath)}>{actionText}</Button>
      )}
    </Empty>
  );
}
