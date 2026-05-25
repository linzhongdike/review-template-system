import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Typography, Input, Modal, message, Space } from 'antd';
import { getPendingApprovals, approveTemplate, rejectTemplate } from '../../api/approvals';
import { formatDateTime, formatVersion } from '../../utils/formatters';
import { CheckOutlined, CloseOutlined, DiffOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { TextArea } = Input;

export default function PendingApprovalsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectTemplateId, setRejectTemplateId] = useState<number | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  const load = async () => {
    setLoading(true);
    try { const res = await getPendingApprovals(); setItems(res.data.items || []); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleApprove = async (templateId: number) => {
    try { await approveTemplate(templateId); message.success('审核通过'); load(); } catch (e: any) {
      const msg = e?.response?.data?.detail || '审核失败';
      message.error(msg);
    }
  };

  const handleReject = async () => {
    if (!rejectTemplateId || !rejectComment.trim()) { message.warning('请输入驳回理由'); return; }
    try { await rejectTemplate(rejectTemplateId, rejectComment); message.success('已驳回'); setRejectVisible(false); setRejectComment(''); load(); } catch {}
  };


  const columns = [
    { title: '模板名称', dataIndex: 'template_name', key: 'name' },
    { title: '版本', dataIndex: 'version_number', key: 'version', render: formatVersion },
    { title: '提交人', dataIndex: 'submitter_name', key: 'submitter' },
    { title: '提交时间', dataIndex: 'submitted_at', key: 'time', render: formatDateTime },
    { title: '操作', key: 'actions', render: (_: any, r: any) => <Space>
      <Button size="small" onClick={() => navigate(`/templates/${r.template_id}`)}>查看</Button>
      <Button size="small" icon={<DiffOutlined/>} onClick={() => navigate(`/templates/${r.template_id}/versions/${r.version_id}/diff`)}>差异</Button>
      <Button size="small" type="primary" icon={<CheckOutlined/>} onClick={() => handleApprove(r.template_id)}>通过</Button>
      <Button size="small" danger icon={<CloseOutlined/>} onClick={() => { setRejectTemplateId(r.template_id); setRejectVisible(true); }}>驳回</Button>
    </Space> }
  ];

  return <div>
    <Title level={4}>待审批模板</Title>
    <Table rowKey="version_id" columns={columns} dataSource={items} loading={loading} pagination={false}/>
    <Modal title="驳回模板" open={rejectVisible} onOk={handleReject} onCancel={() => setRejectVisible(false)}>
      <TextArea rows={4} placeholder="请输入驳回理由..." value={rejectComment} onChange={e => setRejectComment(e.target.value)}/>
    </Modal>
  </div>;
}
