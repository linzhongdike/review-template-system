import { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Typography, Popconfirm, message, Row, Col, Input, Select, Card, Upload } from 'antd';
import { PlusOutlined, SearchOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { getReviewTypes, deleteReviewType, updateReviewTypeStatus, ReviewTypeQueryParams, downloadReviewTypeTemplate, importReviewTypes } from '../../api/reviewTypes';
import ReviewTypeFormModal from './ReviewTypeFormModal';

const { Title } = Typography;

const CATEGORY_OPTIONS = [
  { label: '产品类', value: 'product' },
  { label: '工艺类', value: 'process' },
  { label: '研究类', value: 'research' },
];

const STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
];

const SUB_CATEGORY_OPTIONS: Record<string, string[]> = {
  product: ['发动机', '新能源', '液压'],
  process: ['样式工艺', '批量工艺'],
  research: ['技术研究', '技术工程'],
};

export default function ReviewTypeListPage() {
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  // 查询条件
  const [searchName, setSearchName] = useState('');
  const [searchCategory, setSearchCategory] = useState<string | undefined>();
  const [searchSubCategory, setSearchSubCategory] = useState<string | undefined>();
  const [searchStatus, setSearchStatus] = useState<string | undefined>();

  const subCategoryOptions = searchCategory ? SUB_CATEGORY_OPTIONS[searchCategory] || [] : [];

  const loadTypes = async () => {
    setLoading(true);
    try {
      const params: ReviewTypeQueryParams = {};
      if (searchName) params.name = searchName;
      if (searchCategory) params.project_category = searchCategory;
      if (searchSubCategory) params.sub_category = searchSubCategory;
      if (searchStatus) params.status = searchStatus;
      const res = await getReviewTypes(params);
      setTypes(res.data.items || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadTypes(); }, []);

  const handleSearch = () => {
    loadTypes();
  };

  const handleReset = () => {
    setSearchName('');
    setSearchCategory(undefined);
    setSearchSubCategory(undefined);
    setSearchStatus(undefined);
  };

  useEffect(() => {
    // 项目细类变化时清空二级分类
    setSearchSubCategory(undefined);
  }, [searchCategory]);

  useEffect(() => {
    // 重置后重新查询
    if (!searchName && !searchCategory && !searchSubCategory && !searchStatus) {
      loadTypes();
    }
  }, [searchName, searchCategory, searchSubCategory, searchStatus]);

  const handleDelete = async (id: number) => {
    try {
      await deleteReviewType(id);
      message.success('已删除');
      loadTypes();
    } catch {}
  };

  const handleSetStatus = async (id: number, newStatus: string) => {
    try {
      await updateReviewTypeStatus(id, newStatus);
      message.success('状态已更新');
      loadTypes();
    } catch {}
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateReviewTypeStatus(id, newStatus);
      message.success('状态已更新');
      loadTypes();
    } catch {}
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await downloadReviewTypeTemplate();
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'review_type_template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      message.success('模板已下载');
    } catch {
      message.error('下载模板失败');
    }
  };

  const handleImport = async (file: File) => {
    try {
      const res = await importReviewTypes(file);
      const msg = res.data.message || `成功导入 ${res.data.created} 条`;
      message.success(msg);
      if (res.data.errors?.length > 0) {
        // 延迟显示错误详情
        setTimeout(() => {
          message.warning({ content: res.data.errors.join('; '), duration: 8 });
        }, 500);
      }
      loadTypes();
    } catch {
      message.error('导入失败，请检查文件格式');
    }
    return false; // 阻止 Upload 组件默认上传
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '项目细类', dataIndex: 'project_category', key: 'category', render: (v: string) => {
      const map: Record<string, string> = { product: '产品类', process: '工艺类', research: '研究类' };
      return map[v] || v || '-';
    }},
    { title: '二级分类', dataIndex: 'sub_category', key: 'sub', render: (v: string) => v || '-' },
    {
      title: '状态', key: 'status', width: 190,
      render: (_: any, record: any) => {
        const isActive = record.status === 'active';
        const activeStyle  = { backgroundColor: '#52c41a', color: '#fff', borderColor: '#52c41a' };
        const inactiveStyle = { backgroundColor: '#ff4d4f', color: '#fff', borderColor: '#ff4d4f' };
        const dimmedStyle = { color: '#bfbfbf', borderColor: '#d9d9d9' };

        return (
          <Space size={4}>
            <Button
              size="small"
              onClick={() => handleSetStatus(record.id, 'active')}
              style={isActive ? activeStyle : dimmedStyle}
            >启用</Button>
            <Button
              size="small"
              onClick={() => handleSetStatus(record.id, 'inactive')}
              style={!isActive ? inactiveStyle : dimmedStyle}
            >停用</Button>
          </Space>
        );
      }
    },
    { title: '有效模板数', dataIndex: 'active_template_count', key: 'active_template_count' },
    { title: '已失效模板数', dataIndex: 'expired_template_count', key: 'expired_template_count' },
    {
      title: '操作', key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" onClick={() => { setEditing(record); setModalVisible(true); }}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>评审阶段管理</Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>下载模板</Button>
          <Upload
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={(file) => { handleImport(file); return false; }}
          >
            <Button icon={<UploadOutlined />}>导入Excel</Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setModalVisible(true); }}>
            创建评审阶段
          </Button>
        </Space>
      </div>

      {/* 查询区域 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Input
              placeholder="名称"
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
              style={{ width: 160 }}
            />
          </Col>
          <Col>
            <Select
              placeholder="项目细类"
              value={searchCategory}
              onChange={v => setSearchCategory(v)}
              allowClear
              options={CATEGORY_OPTIONS}
              style={{ width: 140 }}
            />
          </Col>
          <Col>
            <Select
              placeholder="二级分类"
              value={searchSubCategory}
              onChange={v => setSearchSubCategory(v)}
              allowClear
              disabled={!searchCategory}
              options={subCategoryOptions.map(o => ({ label: o, value: o }))}
              style={{ width: 140 }}
            />
          </Col>
          <Col>
            <Select
              placeholder="状态"
              value={searchStatus}
              onChange={v => setSearchStatus(v)}
              allowClear
              options={STATUS_OPTIONS}
              style={{ width: 120 }}
            />
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Table rowKey="id" columns={columns} dataSource={types} loading={loading} pagination={false} />
      <ReviewTypeFormModal visible={modalVisible} type={editing}
        onClose={() => setModalVisible(false)} onSuccess={() => { setModalVisible(false); loadTypes(); }} />
    </div>
  );
}
