import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography } from 'antd';
import { FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, WarningOutlined, BellOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getPendingApprovals } from '../../api/approvals';
import { formatDate, formatVersion } from '../../utils/formatters';
import { usePermission } from '../../hooks/usePermission';
import client from '../../api/client';

const { Title } = Typography;

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, active: 0, draft: 0, expired: 0 });
  const [recentChanges, setRecentChanges] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loadingChanges, setLoadingChanges] = useState(false);
  const navigate = useNavigate();
  const perm = usePermission();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingChanges(true);
    // Load stats from backend
    try {
      const statsRes = await client.get('/dashboard/stats');
      const s = statsRes.data;
      setStats({
        total: s.total || 0,
        active: s.published || 0,
        draft: s.draft || 0,
        expired: s.expired || 0,
      });
    } catch {}

    // Load recent changes
    try {
      const changeRes = await client.get('/dashboard/recent-changes', { params: { days: 15 } });
      setRecentChanges(changeRes.data.items || []);
    } catch {}

    // Load pending approvals
    if (perm.canApprove) {
      try {
        const pRes = await getPendingApprovals();
        setPendingCount(pRes.data.items?.length || 0);
      } catch {}
    }
    setLoadingChanges(false);
  };

  const changeTypeTag = (t: string) => {
    const map: Record<string, { color: string; label: string }> = {
      '新建': { color: '#52c41a', label: '新建' },
      '升版': { color: '#1677ff', label: '升版' },
      '失效': { color: '#999', label: '失效' },
      '评审停用': { color: '#cf1322', label: '评审停用' },
    };
    const v = map[t];
    return v ? <Tag color={v.color}>{v.label}</Tag> : <Tag>{t}</Tag>;
  };

  const changeColumns = [
    { title: '变更类型', dataIndex: 'change_type', key: 'change_type', render: changeTypeTag, width: 100 },
    { title: '模板名称', dataIndex: 'template_name', key: 'name',
      render: (t: string, r: any) => <a onClick={() => navigate(`/templates/${r.template_id}`)}>{t}</a> },
    { title: '评审阶段', dataIndex: 'review_type_name', key: 'type', width: 160 },
    { title: '版本', dataIndex: 'version_number', key: 'version', render: (_: any, r: any) => r.version_number ? formatVersion(r.version_number) : '-', width: 80 },
    { title: '变更说明', dataIndex: 'change_summary', key: 'summary', ellipsis: true },
    { title: '变更日期', dataIndex: 'change_time', key: 'time', render: formatDate, width: 120 },
  ];

  return (
    <div>
      <Title level={4}>首页</Title>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col flex="1">
          <Card>
            <Statistic title="模板总数" value={stats.total} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col flex="1">
          <Card>
            <Statistic title="已发布" value={stats.active} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col flex="1">
          <Card>
            <Statistic title="编辑中" value={stats.draft} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col flex="1">
          <Card>
            <Statistic title="已失效" value={stats.expired} prefix={<StopOutlined />} valueStyle={{ color: '#999' }} />
          </Card>
        </Col>
        <Col flex="1">
          <Card>
            <Statistic title="待审批" value={pendingCount} prefix={<WarningOutlined />} valueStyle={{ color: pendingCount > 0 ? '#cf1322' : '#999' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title={<span><BellOutlined /> 近15天版本变更通知</span>}
        extra={perm.canApprove && pendingCount > 0 && <a onClick={() => navigate('/approvals/pending')}>待审批 ({pendingCount}) →</a>}
      >
        <Table
          rowKey="version_id"
          columns={changeColumns}
          dataSource={recentChanges}
          loading={loadingChanges}
          pagination={false}
          size="small"
          locale={{ emptyText: '近15天内无版本变更' }}
        />
      </Card>
    </div>
  );
}
