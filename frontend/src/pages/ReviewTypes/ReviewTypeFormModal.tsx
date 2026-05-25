import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { createReviewType, updateReviewType } from '../../api/reviewTypes';

const SUB_CATEGORY_CONFIG: Record<string, { label: string; options: string[] }> = {
  product: { label: '业务领域', options: ['发动机', '新能源', '液压'] },
  process: { label: '开发类型', options: ['样式工艺', '批量工艺'] },
  research: { label: '技术类型', options: ['技术研究', '技术工程'] },
};

interface Props {
  visible: boolean;
  type: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewTypeFormModal({ visible, type, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const isEdit = !!type;
  const [category, setCategory] = useState<string | undefined>();

  useEffect(() => {
    if (visible) {
      const vals = type || { name: '' };
      form.setFieldsValue(vals);
      setCategory(type?.project_category || undefined);
    }
  }, [visible, type]);

  const onFinish = async (values: any) => {
    try {
      if (isEdit) {
        await updateReviewType(type.id, values);
      } else {
        await createReviewType(values);
      }
      onSuccess();
    } catch {}
  };

  const config = category ? SUB_CATEGORY_CONFIG[category] : null;

  return (
    <Modal title={isEdit ? '编辑评审阶段' : '创建评审阶段'} open={visible} onCancel={onClose}
      onOk={() => form.submit()} destroyOnClose width={480}>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="project_category" label="项目细类">
          <Select placeholder="请选择" allowClear onChange={v => { setCategory(v); form.setFieldValue('sub_category', undefined); }}>
            <Select.Option value="product">产品类</Select.Option>
            <Select.Option value="process">工艺类</Select.Option>
            <Select.Option value="research">研究类</Select.Option>
          </Select>
        </Form.Item>
        {config && (
          <Form.Item name="sub_category" label={config.label}>
            <Select placeholder={`请选择${config.label}`} allowClear>
              {config.options.map(o => <Select.Option key={o} value={o}>{o}</Select.Option>)}
            </Select>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
