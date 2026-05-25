import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Breadcrumb, Spin, Typography } from 'antd';
import { getVersion } from '../../api/versions';
import { VERSION_STATUS } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';
import TemplatePreview from '../Templates/components/TemplatePreview';

const { Title } = Typography;

export default function VersionDetailPage() {
  const { tid, vid } = useParams<{ tid: string; vid: string }>();
  const navigate = useNavigate();
  const [version, setVersion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVersion(Number(tid), Number(vid)).then(res => setVersion(res.data)).finally(() => setLoading(false));
  }, [tid, vid]);

  if (loading) return <Spin style={{display:'block',margin:'100px auto'}}/>;

  const statusInfo = VERSION_STATUS[version?.status as keyof typeof VERSION_STATUS];

  return <div>
    <Breadcrumb items={[{title:<a onClick={()=>navigate(`/templates/${tid}`)}>模板详情</a>},{title:<a onClick={()=>navigate(`/templates/${tid}/versions`)}>版本历史</a>},{title:`V${version?.version_number}`}]} style={{marginBottom:16}}/>
    <Title level={4}>版本详情 - V{version?.version_number}</Title>
    <Card style={{marginBottom:16}}>
      <Descriptions column={2} size="small">
        <Descriptions.Item label="版本号">V{version?.version_number}</Descriptions.Item>
        <Descriptions.Item label="状态">{statusInfo && <Tag color={statusInfo.color}>{statusInfo.label}</Tag>}</Descriptions.Item>
        <Descriptions.Item label="变更说明">{version?.change_summary||'-'}</Descriptions.Item>
        <Descriptions.Item label="创建人">{version?.creator_name||'-'}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{formatDateTime(version?.created_at)}</Descriptions.Item>
      </Descriptions>
    </Card>
    <Card title="模板内容"><TemplatePreview docBlocks={version?.doc_blocks||[]} reviewItems={version?.review_items||[]}/></Card>
  </div>;
}
