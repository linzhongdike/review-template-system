import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Tag, Space, Spin, Typography, Button, Divider,
  Input, Rate, Radio, Checkbox, Upload, Breadcrumb, Descriptions
} from 'antd';
import {
  ArrowLeftOutlined, PrinterOutlined, UploadOutlined
} from '@ant-design/icons';
import { getTemplate } from '../../api/templates';
import { TEMPLATE_STATUS, VERSION_STATUS } from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/formatters';

const { Title, Text } = Typography;

export default function TemplatePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await getTemplate(Number(id));
      setTemplate(res.data);
    } catch (e: any) {
      setError('模板加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  // Print
  const handlePrint = () => window.print();

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Spin size="large" />
    </div>
  );

  if (error || !template) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <Text type="secondary" style={{ fontSize: 16 }}>{error || '模板不存在'}</Text>
      <br />
      <Button type="link" onClick={() => navigate('/templates')}>返回模板列表</Button>
    </div>
  );

  const cv = template.current_version;
  const statusInfo = TEMPLATE_STATUS[template.status as keyof typeof TEMPLATE_STATUS];
  const vStatusInfo = cv ? VERSION_STATUS[cv.status as keyof typeof VERSION_STATUS] : null;
  const docBlocks = cv?.doc_blocks || [];
  const reviewItems = cv?.review_items || [];

  const renderReviewItem = (item: any, index: number) => {
    const label = `${index + 1}. ${item.name}${item.required ? ' *' : ''}`;
    switch (item.item_type) {
      case 'score':
        return (
          <div key={index} className="preview-item">
            <div className="preview-item-label">{label}</div>
            <div className="preview-item-meta">
              评分范围: {item.config?.min_score || 0} - {item.config?.max_score || 100}
              （步长: {item.config?.step || 5}）
            </div>
            <Rate
              count={Math.ceil((item.config?.max_score || 100) / (item.config?.step || 5))}
              disabled
            />
          </div>
        );
      case 'text':
        return (
          <div key={index} className="preview-item">
            <div className="preview-item-label">{label}</div>
            <Input
              placeholder={item.config?.placeholder || '请输入...'}
              maxLength={item.config?.max_length}
              disabled
            />
          </div>
        );
      case 'textarea':
        return (
          <div key={index} className="preview-item">
            <div className="preview-item-label">{label}</div>
            <Input.TextArea
              rows={3}
              placeholder={item.config?.placeholder || '请输入...'}
              maxLength={item.config?.max_length}
              disabled
            />
          </div>
        );
      case 'radio':
        return (
          <div key={index} className="preview-item">
            <div className="preview-item-label">{label}</div>
            <Radio.Group disabled>
              {(item.config?.options || []).map((o: any, i: number) => (
                <Radio key={i} value={o.value}>{o.label}</Radio>
              ))}
            </Radio.Group>
          </div>
        );
      case 'checkbox':
        return (
          <div key={index} className="preview-item">
            <div className="preview-item-label">{label}</div>
            <Checkbox.Group
              disabled
              options={(item.config?.options || []).map((o: any) => ({
                label: o.label,
                value: o.value,
              }))}
            />
          </div>
        );
      case 'attachment':
        return (
          <div key={index} className="preview-item">
            <div className="preview-item-label">{label}</div>
            <Upload disabled>
              <Button icon={<UploadOutlined />} disabled>上传文件</Button>
            </Upload>
          </div>
        );
      default:
        return (
          <div key={index} className="preview-item">
            <div className="preview-item-label">{label}</div>
          </div>
        );
    }
  };

  return (
    <div className="template-preview-page">
      {/* Print toolbar - hidden when printing */}
      <div className="preview-toolbar">
        <Breadcrumb
          items={[
            { title: <a onClick={() => navigate('/templates')}>模板管理</a> },
            { title: <a onClick={() => navigate(`/templates/${template.id}`)}>{template.name}</a> },
            { title: '全屏预览' },
          ]}
        />
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/templates/${template.id}`)}>
            返回详情
          </Button>
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            打印
          </Button>
        </Space>
      </div>

      {/* Document preview area */}
      <div className="preview-document">
        {/* Document header */}
        <div className="preview-header">
          <Title level={3} style={{ margin: 0 }}>{template.name}</Title>
          <Space style={{ marginTop: 8 }}>
            {statusInfo && <Tag color={statusInfo.color}>{statusInfo.label}</Tag>}
            {vStatusInfo && <Tag color={vStatusInfo.color}>版本状态: {vStatusInfo.label}</Tag>}
          </Space>
          <Descriptions
            style={{ marginTop: 16 }}
            column={2}
            size="small"
            colon={false}
          >
            <Descriptions.Item label="评审阶段">
              {template.review_type_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="当前版本">
              V{template.current_version_number || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建人">
              {template.creator_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="到期时间">
              {formatDate(template.expire_at)}
            </Descriptions.Item>
            <Descriptions.Item label="标签">
              {template.tags?.map((t: string) => (
                <Tag key={t}>{t}</Tag>
              )) || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {formatDateTime(template.updated_at)}
            </Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>
              {template.description || '-'}
            </Descriptions.Item>
          </Descriptions>
          <Divider style={{ margin: '20px 0 16px' }} />
        </div>

        {/* Document blocks */}
        {docBlocks.map((block: any, i: number) => (
          <div key={i} className="preview-doc-block">
            {block.title && (
              <Title level={5} style={{ margin: '0 0 8px 0' }}>{block.title}</Title>
            )}
            <div dangerouslySetInnerHTML={{ __html: block.content }} />
          </div>
        ))}

        {/* Divider between blocks and review items */}
        {docBlocks.length > 0 && reviewItems.length > 0 && (
          <Divider style={{ margin: '24px 0' }} />
        )}

        {/* Review items section */}
        {reviewItems.length > 0 && (
          <div className="preview-review-section">
            <Title level={5} style={{ marginBottom: 16 }}>评审项</Title>
            {reviewItems.map((item: any, i: number) => renderReviewItem(item, i))}
          </div>
        )}

        {reviewItems.length === 0 && (
          <div className="preview-empty">
            <Text type="secondary">暂无评审项</Text>
          </div>
        )}

        {/* Footer */}
        <Divider style={{ margin: '24px 0 12px' }} />
        <div className="preview-footer">
          <Text type="secondary" style={{ fontSize: 12 }}>
            版本: V{template.current_version_number || '-'} | 生成时间: {new Date().toLocaleString('zh-CN')}
          </Text>
        </div>
      </div>

      <style>{`
        .template-preview-page {
          min-height: calc(100vh - 48px);
          background: #f0f2f5;
          padding: 16px;
        }
        .preview-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #fff;
          border-radius: 8px;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .preview-document {
          max-width: 900px;
          margin: 0 auto;
          background: #fff;
          border-radius: 8px;
          padding: 40px 48px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          min-height: 600px;
        }
        .preview-header {
          margin-bottom: 8px;
        }
        .preview-doc-block {
          margin-bottom: 16px;
        }
        .preview-doc-block:last-child {
          margin-bottom: 0;
        }
        .preview-review-section {
          margin-bottom: 16px;
        }
        .preview-item {
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px dashed #f0f0f0;
        }
        .preview-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        .preview-item-label {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 8px;
          color: #1a1a2e;
        }
        .preview-item-meta {
          font-size: 12px;
          color: #999;
          margin-bottom: 8px;
        }
        .preview-empty {
          text-align: center;
          padding: 48px;
        }
        .preview-footer {
          text-align: center;
          padding-bottom: 4px;
        }

        /* Print styles */
        @media print {
          body {
            background: #fff !important;
          }
          .preview-toolbar,
          .ant-layout-sider,
          .ant-layout-header,
          .workbuddy-tabs {
            display: none !important;
          }
          .template-preview-page {
            background: #fff !important;
            padding: 0 !important;
            min-height: auto !important;
          }
          .preview-document {
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            padding: 20px 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
