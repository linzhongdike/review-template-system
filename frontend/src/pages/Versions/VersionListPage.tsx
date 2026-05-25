import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Breadcrumb, Typography, message, Popconfirm, Space, Tooltip } from 'antd';
import { getVersions, rollbackVersion, deleteVersion } from '../../api/versions';
import { VERSION_STATUS } from '../../utils/constants';
import { formatDateTime, formatVersion } from '../../utils/formatters';
import { usePermission } from '../../hooks/usePermission';

const { Title } = Typography;

export default function VersionListPage() {
  const { tid } = useParams<{ tid: string }>();
  const navigate = useNavigate();
  const perm = usePermission();
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const res = await getVersions(Number(tid)); setVersions(res.data.items || []); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tid]);

  const handleCreate = () => {
    // 不再立即创建版本，跳转到编辑页面，首次保存时才创建
    navigate(`/templates/${tid}/edit?new=true`);
  };

  const handleRollback = async (versionId: number) => {
    try { await rollbackVersion(Number(tid), versionId); message.success('回滚版本已创建'); load(); } catch {}
  };


  const handleDelete = async (versionId: number) => {
    try { await deleteVersion(Number(tid), versionId); message.success("版本已删除"); load(); } catch {}
  };
  const hasActiveVersion = versions.some((v: any) => v.status === 'draft' || v.status === 'reviewing');
  const activeVersion = versions.find((v: any) => v.status === 'draft' || v.status === 'reviewing');

  const columns = [
    { title: '版本号', dataIndex: 'version_number', key: 'version', render: formatVersion },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string, r: any) => {
      const info = VERSION_STATUS[s as keyof typeof VERSION_STATUS];
      const tag = <Tag color={info?.color || 'default'}>{info?.label || s}</Tag>;
      if (s === 'rejected' && r.rejection_reason) {
        return <Tooltip title={r.rejection_reason}>{tag}</Tooltip>;
      }
      return tag;
    }},
    { title: '变更说明', dataIndex: 'change_summary', key: 'summary' },
    { title: '创建人', dataIndex: 'creator_name', key: 'creator' },
    { title: '发布时间', key: 'published_at', render: (_: any, r: any) => formatDateTime(r.published_at || r.created_at) },
    { title: '操作', key: 'actions', render: (_: any, r: any) => <Space>
      <Button size="small" onClick={() => navigate(`/templates/${tid}/versions/${r.id}`)}>详情</Button>
      {versions.length > 1 && <Button size="small" onClick={() => navigate(`/templates/${tid}/versions/${r.id}/diff`)}>对比</Button>}
      {r.status === 'draft' && <Popconfirm title="确定删除此版本？" onConfirm={() => handleDelete(r.id)}><Button size="small" danger>删除</Button></Popconfirm>}
      {r.status === 'published' && r.id !== versions[0]?.id && <Popconfirm title="回滚将基于此版本创建新版本，确定？" onConfirm={() => handleRollback(r.id)}><Button size="small">回滚</Button></Popconfirm>}
    </Space> }
  ];

  return <div>
    <Breadcrumb items={[{title:<a onClick={()=>navigate('/templates')}>模板管理</a>},{title:<a onClick={()=>navigate(`/templates/${tid}`)}>模板详情</a>},{title:'版本历史'}]} style={{marginBottom:16}}/>
    <Title level={4}>版本历史</Title>
    {perm.canCreateTemplate && (hasActiveVersion ? (
      <div style={{ marginBottom: 16, padding: '8px 12px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 6, fontSize: 13, color: '#ad6800' }}>
        版本 v{activeVersion.version_number} 当前处于「{activeVersion.status === 'draft' ? '编辑中' : '审核中'}」状态，请先完成该版本后再创建新版本。
      </div>
    ) : (
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleCreate}>创建新版本</Button>
      </div>
    ))}
    <Table rowKey="id" columns={columns} dataSource={versions} loading={loading} pagination={false}/>
  </div>;
}
