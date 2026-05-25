import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, Card, Space, Typography, message } from 'antd';
import { getReviewTypes } from '../../api/reviewTypes';
import { createTemplate } from '../../api/templates';

const { Title } = Typography;

const CATEGORY_OPTIONS = [
  { label: '产品类', value: 'product' },
  { label: '工艺类', value: 'process' },
  { label: '研究类', value: 'research' },
];

const SUB_CATEGORY_OPTIONS: Record<string, string[]> = {
  product: ['发动机', '新能源', '液压'],
  process: ['样式工艺', '批量工艺'],
  research: ['技术研究', '技术工程'],
};

export default function TemplateCreatePage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [allTypes, setAllTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string | undefined>();
  const [subCategory, setSubCategory] = useState<string | undefined>();

  useEffect(() => {
    getReviewTypes().then(r => {
      setAllTypes(r.data.items?.filter((t: any) => t.status === 'active') || []);
    }).catch(() => {});
  }, []);

  // 根据选中的项目细类和二级分类筛选评审阶段
  const filteredTypes = useMemo(() => {
    return allTypes.filter(t => {
      if (category && t.project_category !== category) return false;
      if (subCategory && t.sub_category !== subCategory) return false;
      return true;
    });
  }, [allTypes, category, subCategory]);

  const subOptions = category ? (SUB_CATEGORY_OPTIONS[category] || []).map(s => ({ label: s, value: s })) : [];

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await createTemplate({ name: values.name, review_type_id: values.review_type_id });
      message.success('模板创建成功，跳转到编辑页面');
      navigate(`/templates/${res.data.id}/edit`);
    } catch {} finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Title level={4}>创建模板</Title>
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="模板名称" rules={[{ required: true }]}><Input /></Form.Item>

          <Form.Item name="project_category" label="项目细类" rules={[{ required: true }]}>
            <Select
              placeholder="选择项目细类"
              options={CATEGORY_OPTIONS}
              onChange={(v) => {
                setCategory(v);
                setSubCategory(undefined);
                form.setFieldsValue({ sub_category: undefined, review_type_id: undefined });
              }}
            />
          </Form.Item>

          <Form.Item name="sub_category" label="二级分类" rules={[{ required: true }]}>
            <Select
              placeholder="选择二级分类"
              options={subOptions}
              disabled={!category}
              onChange={(v) => {
                setSubCategory(v);
                form.setFieldsValue({ review_type_id: undefined });
              }}
            />
          </Form.Item>

          <Form.Item name="review_type_id" label="评审阶段" rules={[{ required: true, message: '请选择评审阶段' }]}>
            <Select placeholder="选择评审阶段" disabled={!category && !subCategory}>
              {filteredTypes.map(t => <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>)}
            </Select>
          </Form.Item>

          <Form.Item name="description" label="描述"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入标签后回车" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>创建并编辑</Button>
              <Button onClick={() => navigate('/templates')}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
