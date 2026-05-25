import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Space, Spin, Breadcrumb, Typography } from 'antd';
import { EditOutlined, HistoryOutlined, EyeOutlined } from '@ant-design/icons';
import { getTemplate, archiveTemplate } from '../../api/templates';
import { TEMPLATE_STATUS, VERSION_STATUS } from '../../utils/constants';
import { formatDateTime, formatDate } from '../../utils/formatters';
import TemplatePreview from './components/TemplatePreview';
import { usePermission } from '../../hooks/usePermission';

const { Title } = Typography;

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const perm = usePermission();
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await getTemplate(Number(id));
      setTemplate(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;
  if (!template) return <div>模板不存在</div>;

  const cv = template.current_version;
  const canEdit = cv?.status === 'draft' && perm.canCreateTemplate;
  const canSubmit = cv?.status === 'draft' && perm.canCreateTemplate;
  const statusInfo = TEMPLATE_STATUS[template.status as keyof typeof TEMPLATE_STATUS];
  const vStatusInfo = cv ? VERSION_STATUS[cv.status as keyof typeof VERSION_STATUS] : null;

  return (
    <div>
      <Breadcrumb items={[
        { title: <a onClick={() => navigate('/templates')}>模板管理</a> },
        { title: template.name },
      ]} style={{ marginBottom: 16 }} />

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>{template.name}</Title>
            <Space style={{ marginTop: 8 }}>
              {statusInfo && <Tag color={statusInfo.color}>{statusInfo.label}</Tag>}
              {vStatusInfo && <Tag color={vStatusInfo.color}>版本状态: {vStatusInfo.label}</Tag>}
            </Space>
          </div>
          <Space>
            {canEdit && <Button icon={<EditOutlined />} onClick={() => navigate(`/templates/${template.id}/edit`)}>编辑设计</Button>}
            <Button icon={<EyeOutlined />} onClick={() => navigate(`/templates/${template.id}/preview`)}>全屏预览</Button>
            <Button icon={<HistoryOutlined />} onClick={() => navigate(`/templates/${template.id}/versions`)}>版本历史</Button>
          </Space>
        </div>
        <Descriptions style={{ marginTop: 16 }} column={2} size="small">
          <Descriptions.Item label="评审阶段">{template.review_type_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="当前版本">V{template.current_version_number || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建人">{template.creator_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="到期时间">{formatDate(template.expire_at)}</Descriptions.Item>
          <Descriptions.Item label="标签">
            {template.tags?.map((t: string) => <Tag key={t}>{t}</Tag>) || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">{formatDateTime(template.updated_at)}</Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>{template.description || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {cv && (
        <Card title="模板内容预览" style={{ marginBottom: 16 }}>
          <TemplatePreview docBlocks={cv.doc_blocks || []} reviewItems={cv.review_items || []} />
        </Card>
      )}
    </div>
  );
}
