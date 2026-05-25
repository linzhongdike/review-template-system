import { useEffect, useState, useReducer } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Space, Typography, Card, message, Spin, Tabs, Breadcrumb, Input, Row, Col, Modal } from 'antd';
import { SaveOutlined, SendOutlined, PlusOutlined } from '@ant-design/icons';
import { getTemplate, updateTemplate } from '../../api/templates';
import { updateVersion, createVersion } from '../../api/versions';
import { submitForReview } from '../../api/approvals';
import TemplateDesigner from './components/TemplateDesigner';
import TemplatePreview from './components/TemplatePreview';

const { Title } = Typography;

interface DesignerState {
  docBlocks: any[];
  reviewItems: any[];
  isDirty: boolean;
}

type Action =
  | { type: 'LOAD'; blocks: any[]; items: any[] }
  | { type: 'SET_BLOCKS'; blocks: any[] }
  | { type: 'SET_ITEMS'; items: any[] }
  | { type: 'MARK_CLEAN' };

function reducer(state: DesignerState, action: Action): DesignerState {
  switch (action.type) {
    case 'LOAD': return { docBlocks: action.blocks, reviewItems: action.items, isDirty: false };
    case 'SET_BLOCKS': return { ...state, docBlocks: action.blocks, isDirty: true };
    case 'SET_ITEMS': return { ...state, reviewItems: action.items, isDirty: true };
    case 'MARK_CLEAN': return { ...state, isDirty: false };
    default: return state;
  }
}

export default function TemplateEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [template, setTemplate] = useState<any>(null);
  const [state, dispatch] = useReducer(reducer, { docBlocks: [], reviewItems: [], isDirty: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('design');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitSummary, setSubmitSummary] = useState('');
  // 从已发布版本点击"创建新版本以编辑"进入的编辑态，尚未落库
  const [isCreatingNewVersion, setIsCreatingNewVersion] = useState(false);

  useEffect(() => { loadTemplate(); }, [id]);

  // 如果从版本历史页点击"创建新版本"跳转过来，自动进入新建编辑态
  useEffect(() => {
    if (searchParams.get('new') === 'true' && template && !loading) {
      const draftVersion = template.current_version;
      const isLocked = draftVersion?.status !== 'draft' && draftVersion?.status !== 'rejected';
      if (isLocked) {
        setIsCreatingNewVersion(true);
      }
    }
  }, [searchParams, template, loading]);

  const loadTemplate = async () => {
    try {
      const res = await getTemplate(Number(id));
      setTemplate(res.data);
      setEditName(res.data.name || '');
      setEditDesc(res.data.description || '');
      const cv = res.data.current_version;
      if (cv) {
        dispatch({ type: 'LOAD', blocks: cv.doc_blocks || [], items: cv.review_items || [] });
      }
    } catch {} finally { setLoading(false); }
  };

  const handleCreateNewVersion = () => {
    // 不调用后端，只在本地标记开始新版本编辑
    setIsCreatingNewVersion(true);
    message.info('正在编辑新版本，完成后请点击保存');
  };

  const handleSave = async () => {
    if (!template) return;
    setSaving(true);
    try {
      let versionId = template.current_version_id;

      // 如果是新建版本，先创建
      if (isCreatingNewVersion) {
        const newVer = await createVersion(template.id);
        versionId = newVer.data.id;
        setIsCreatingNewVersion(false);
      }

      if (!versionId) return;

      // 保存模板基本信息
      if (editName !== template.name || editDesc !== template.description) {
        await updateTemplate(template.id, { name: editName, description: editDesc });
      }
      // 保存版本内容
      await updateVersion(template.id, versionId, {
        doc_blocks: state.docBlocks.map((b, i) => ({ ...b, sort_order: i, content: b.content || '' })),
        review_items: state.reviewItems.map((item, i) => ({ ...item, sort_order: i })),
      });
      dispatch({ type: 'MARK_CLEAN' });
      message.success('保存成功');
      loadTemplate();
    } catch {} finally { setSaving(false); }
  };

  const handleSubmitReview = () => {
    if (state.isDirty) { message.warning('请先保存修改'); return; }
    setSubmitSummary(template?.current_version?.change_summary || '');
    setShowSubmitModal(true);
  };

  const doSubmitReview = async () => {
    if (!submitSummary.trim()) { message.warning('请输入变更说明'); return; }
    try {
      await submitForReview(template.id, submitSummary);
      setShowSubmitModal(false);
      message.success('已提交审核');
      navigate(`/templates/${template.id}`);
    } catch (e: any) {
      const msg = e?.response?.data?.detail || '提交失败';
      message.error(msg);
    }
  };

  if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

  const draftVersion = template?.current_version;
  const isLocked = draftVersion?.status !== 'draft' && draftVersion?.status !== 'rejected';
  // 可编辑 = 已有草稿/已驳回版本，或者是正在创建新版本
  const canEdit = !isLocked || isCreatingNewVersion;

  return (
    <div>
      <Breadcrumb items={[
        { title: <a onClick={() => navigate('/templates')}>模板管理</a> },
        { title: template?.name },
        { title: '编辑设计' },
      ]} style={{ marginBottom: 16 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{template?.name} - 设计器</Title>
        <Space>
          {canEdit && (
            <>
              <Button icon={<SaveOutlined />} onClick={handleSave} loading={saving} type={state.isDirty ? 'primary' : 'default'}>
                保存 {state.isDirty && '(有修改)'}
              </Button>
              <Button icon={<SendOutlined />} onClick={handleSubmitReview} type="primary">提交审核</Button>
            </>
          )}
        </Space>
      </div>

      {canEdit && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: 4, fontSize: 13, color: '#666' }}>模板名称</div>
              <Input value={editName} onChange={e => { setEditName(e.target.value); }} placeholder="模板名称" />
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 4, fontSize: 13, color: '#666' }}>描述</div>
              <Input.TextArea rows={1} value={editDesc} onChange={e => { setEditDesc(e.target.value); }} placeholder="模板描述（可选）" />
            </Col>
          </Row>
        </Card>
      )}

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        {
          key: 'design', label: '设计',
          children: canEdit ? (
            <TemplateDesigner
              docBlocks={state.docBlocks} reviewItems={state.reviewItems}
              onBlocksChange={(blocks) => dispatch({ type: 'SET_BLOCKS', blocks })}
              onItemsChange={(items) => dispatch({ type: 'SET_ITEMS', items })}
            />
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ fontSize: 16, color: '#666', marginBottom: 16 }}>
                  当前版本状态为「{draftVersion?.status === 'published' ? '已发布' : draftVersion?.status === 'reviewing' ? '审核中' : draftVersion?.status}」，内容已锁定不可直接修改。
                </p>
                <p style={{ color: '#999', marginBottom: 24 }}>需要基于当前版本创建一个新的草稿版本才能编辑。</p>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateNewVersion} size="large">创建新版本以编辑</Button>
              </div>
            </Card>
          )
        },
        {
          key: 'preview', label: '预览',
          children: <TemplatePreview docBlocks={state.docBlocks} reviewItems={state.reviewItems} />
        }
      ]} />

      <Modal
        title="提交审核 — 变更说明"
        open={showSubmitModal}
        onOk={doSubmitReview}
        okText="提交"
        onCancel={() => setShowSubmitModal(false)}
        cancelText="取消"
      >
        <div style={{ marginBottom: 8, color: '#666' }}>请输入本次版本变更说明（必填）：</div>
        <Input.TextArea
          rows={3}
          value={submitSummary}
          onChange={e => setSubmitSummary(e.target.value)}
          placeholder="描述本次版本变更内容..."
        />
      </Modal>
    </div>
  );
}
