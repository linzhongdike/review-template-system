import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Select, Space, Tag, Typography, Popconfirm, message, Switch, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getTemplates, deleteTemplate, archiveTemplate, exportTemplate } from '../../api/templates';
import { deleteVersion } from '../../api/versions';
import { getReviewTypes } from '../../api/reviewTypes';
import { TEMPLATE_STATUS, VERSION_STATUS } from '../../utils/constants';
import { formatDate, formatVersion } from '../../utils/formatters';
import { usePermission } from '../../hooks/usePermission';

const { Title } = Typography;

export default function TemplateListPage() {
  const navigate = useNavigate();
  const perm = usePermission();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [versionStatusFilter, setVersionStatusFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<number | undefined>();
  const [showInactiveTypes, setShowInactiveTypes] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [reviewTypes, setReviewTypes] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = { page, page_size: 20 };
      if (keyword) params.keyword = keyword;
      if (versionStatusFilter) params.version_status = versionStatusFilter;
      if (typeFilter) params.review_type_id = typeFilter;
      if (showInactiveTypes) params.include_inactive_types = true;
      params.exclude_archived = !showArchived;
      const res = await getTemplates(params);
      setTemplates(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, versionStatusFilter, typeFilter, showInactiveTypes, showArchived]);
  useEffect(() => { getReviewTypes().then(r => setReviewTypes(r.data.items || [])).catch(() => {}); }, []);

  const handleDelete = async (id: number) => {
    try { await deleteTemplate(id); message.success('已删除'); load(); } catch {}
  };

  const handleArchive = async (id: number) => {
    try { await archiveTemplate(id); message.success('已失效'); load(); } catch {}
  };

  const handleExport = async (id: number) => {
    try {
      const res = await exportTemplate(id);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `template_${id}.json`;
      a.click(); URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch {}
  };

  const handleDeleteVersion = async (templateId: number, versionId: number) => {
    try { await deleteVersion(templateId, versionId); message.success('版本已删除'); load(); } catch {}
  };

  // Expand templates into version-level rows - every row independent
  const expandedRows = useMemo(() => {
    const rows: any[] = [];
    for (const t of templates) {
      const hasEditing = t.current_version_status
        && t.current_version_status !== 'published'
        && t.latest_published_version_number
        && t.latest_published_version_number !== t.current_version_number;

      if (hasEditing) {
        // Row 1: published version (not editable)
        rows.push({
          _key: `${t.id}_pub`,
          template: t,
          _version_id: t.latest_published_version_id,
          _version_number: t.latest_published_version_number,
          _version_status: 'published',
          _isEditingRow: false,
        });
        // Row 2: editing version
        rows.push({
          _key: `${t.id}_draft`,
          template: t,
          _version_id: t.current_version_id,
          _version_number: t.current_version_number,
          _version_status: t.current_version_status,
          _isEditingRow: true,
        });
      } else {
        rows.push({
          _key: `${t.id}_single`,
          template: t,
          _version_id: t.current_version_id,
          _version_number: t.latest_published_version_number || t.current_version_number,
          _version_status: t.current_version_status || t.status,
          _isEditingRow: true,
        });
      }
    }
    // General users only see published versions
    if (perm.isGeneralUser && !perm.canCreateTemplate) {
      return rows.filter(r => r._version_status === 'published');
    }
    return rows;
  }, [templates, perm.isGeneralUser, perm.canCreateTemplate]);

  const vsTag = (status: string, rejectionReason?: string) => {
    const vs = VERSION_STATUS[status as keyof typeof VERSION_STATUS];
    const tag = vs ? <Tag color={vs.color}>{vs.label}</Tag> : <Tag>{status}</Tag>;
    if (status === 'rejected' && rejectionReason) {
      return <Tooltip title={rejectionReason}>{tag}</Tooltip>;
    }
    return tag;
  };

  const columns = [
    { title: '模板名称', key: 'name', render: (_: any, r: any) => <a onClick={() => navigate(`/templates/${r.template.id}`)}>{r.template.name}</a> },
    { title: '评审阶段', key: 'review_type', render: (_: any, r: any) => r.template.review_type_name },
    { title: '项目细类', key: 'review_type_category', render: (_: any, r: any) => {
      const v = r.template.review_type_category;
      const map: Record<string, string> = { product: '产品类', process: '工艺类', research: '研究类' };
      return map[v] || v || '-';
    }},
    { title: '二级分类', key: 'review_type_sub_category', render: (_: any, r: any) => r.template.review_type_sub_category || '-' },
    { title: '版本', key: 'version', render: (_: any, r: any) => formatVersion(r._version_number) },
    {
      title: '模板状态', key: 'status', render: (_: any, r: any) => {
        if (r.template.status === 'archived') {
          return <Tag color="default">已失效</Tag>;
        }
        if (r.template.review_type_status === 'inactive') {
          return <Tag color="orange">评审阶段停用</Tag>;
        }
        return vsTag(r._version_status, r.template.rejection_reason);
      },
    },
    { title: '标签', key: 'tags', render: (_: any, r: any) => r.template.tags?.map((t: string) => <Tag key={t}>{t}</Tag>) },
    { title: '发布时间', key: 'published_at', render: (_: any, r: any) => formatDate(r.template.published_at) },
    {
      title: '操作', key: 'actions', width: 380,
      render: (_: any, r: any) => {
        const t = r.template;
        const locked = t.status === 'archived' || t.review_type_status === 'inactive';
        const isReadOnly = perm.isGeneralUser && !perm.canCreateTemplate;
        return (
          <Space wrap>
            <Button size="small" onClick={() => navigate(`/templates/${t.id}`)}>查看</Button>
            {!locked && (r._version_status === 'draft' || r._version_status === 'rejected') && perm.canCreateTemplate && (
              <Button size="small" type="primary" onClick={() => navigate(`/templates/${t.id}/edit`)}>编辑</Button>
            )}
            {!locked && r._version_status === 'draft' && perm.canCreateTemplate && (
              <Popconfirm title="确定删除此编辑中版本？" onConfirm={() => handleDeleteVersion(t.id, r._version_id)}>
                <Button size="small" danger>删除版本</Button>
              </Popconfirm>
            )}
            <Button size="small" onClick={() => navigate(`/templates/${t.id}/versions`)}>版本管理</Button>
            {!isReadOnly && !locked && (t.status === 'active' || t.status === 'inactive') && (
              <Popconfirm title="确定使此模板失效？" onConfirm={() => handleArchive(t.id)}>
                <Button size="small">失效</Button>
              </Popconfirm>
            )}
            {!isReadOnly && (
              <Button size="small" onClick={() => handleExport(t.id)}>导出JSON</Button>
            )}
            {!isReadOnly && t.status === 'draft' && (
              <Popconfirm title="确定删除此模板？" onConfirm={() => handleDelete(t.id)}>
                <Button size="small" danger>删除模板</Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>模板管理</Title>
        {perm.canCreateTemplate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/templates/create')}>创建模板</Button>
        )}
      </div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Input.Search placeholder="搜索模板" value={keyword} onChange={e => setKeyword(e.target.value)}
          onSearch={() => { setPage(1); load(); }} style={{ width: 260 }} enterButton />
        <Select placeholder="评审阶段" allowClear style={{ width: 160 }} value={typeFilter}
          onChange={(v) => { setTypeFilter(v); setPage(1); }}>
          {reviewTypes.map((rt: any) => <Select.Option key={rt.id} value={rt.id}>{rt.name}</Select.Option>)}
        </Select>
        <Select placeholder="版本状态" allowClear style={{ width: 130 }} value={versionStatusFilter}
          onChange={(v) => { setVersionStatusFilter(v); setPage(1); }}>
          {Object.entries(VERSION_STATUS).map(([k, v]) => <Select.Option key={k} value={k}>{v.label}</Select.Option>)}
        </Select>
        <Space>
          <Switch checked={showInactiveTypes} onChange={(v) => { setShowInactiveTypes(v); setPage(1); }} size="small" />
          <span style={{ fontSize: 13, color: '#666' }}>评审阶段停用</span>
        </Space>
        <Space>
          <Switch checked={showArchived} onChange={(v) => { setShowArchived(v); setPage(1); }} size="small" />
          <span style={{ fontSize: 13, color: '#666' }}>模板已失效</span>
        </Space>
      </div>
      <Table rowKey="_key" columns={columns} dataSource={expandedRows} loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: setPage, showTotal: t => `共 ${t} 条` }} />
    </div>
  );
}
