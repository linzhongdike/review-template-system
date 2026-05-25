import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Timeline, Tag, Typography, Breadcrumb, Spin, Card } from 'antd';
import { getApprovalHistory } from '../../api/approvals';
import { APPROVAL_ACTIONS } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';

const { Title } = Typography;

export default function ApprovalHistoryPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getApprovalHistory(Number(templateId)).then(res => setRecords(res.data.items||[])).finally(()=>setLoading(false));
  }, [templateId]);

  if (loading) return <Spin style={{display:'block',margin:'100px auto'}}/>;

  return <div>
    <Breadcrumb items={[{title:<a onClick={()=>navigate('/templates')}>模板管理</a>},{title:<a onClick={()=>navigate(`/templates/${templateId}`)}>模板详情</a>},{title:'审批历史'}]} style={{marginBottom:16}}/>
    <Title level={4}>审批历史</Title>
    <Card>
      <Timeline items={records.map((r:any)=>{
        const actionInfo = APPROVAL_ACTIONS[r.action as keyof typeof APPROVAL_ACTIONS];
        return {color:actionInfo?.color||'blue', children:<div>
          <Tag color={actionInfo?.color}>{actionInfo?.label||r.action}</Tag>
          <span style={{marginLeft:8}}>{r.operator_name||r.operator_id}</span>
          <span style={{color:'#999',marginLeft:8}}>{formatDateTime(r.operated_at)}</span>
          {r.comment && <div style={{marginTop:4,color:'#666'}}>原因: {r.comment}</div>}
        </div>};
      })}/>
    </Card>
  </div>;
}
