import { Spin } from 'antd';

export default function Loading({ tip = '加载中...' }: { tip?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '100px 0' }}>
      <Spin size="large" tip={tip}>
        <div style={{ padding: 50 }} />
      </Spin>
    </div>
  );
}
