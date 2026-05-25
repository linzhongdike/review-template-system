import { useEffect } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { createUser, updateUser } from '../../api/users';
import { ROLES } from '../../utils/constants';

interface Props {
  visible: boolean;
  user: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserFormModal({ visible, user, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const isEdit = !!user;

  useEffect(() => {
    if (visible) {
      if (user) {
        form.setFieldsValue(user);
      } else {
        form.resetFields();
      }
    }
  }, [visible, user]);

  const onFinish = async (values: any) => {
    try {
      if (isEdit) {
        await updateUser(user.id, values);
      } else {
        await createUser(values);
      }
      onSuccess();
    } catch {}
  };

  return (
    <Modal title={isEdit ? '编辑用户' : '创建用户'} open={visible} onCancel={onClose} onOk={() => form.submit()} destroyOnClose>
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ role: 'template_admin' }}>
        <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
          <Input disabled={isEdit} />
        </Form.Item>
        {!isEdit && (
          <Form.Item name="password" label="密码" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
        )}
        <Form.Item name="display_name" label="显示名" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="email" label="邮箱"><Input /></Form.Item>
        <Form.Item name="role" label="角色" rules={[{ required: true }]}>
          <Select>
            {Object.entries(ROLES).map(([k, v]) => <Select.Option key={k} value={k}>{v.label}</Select.Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="department" label="部门"><Input /></Form.Item>
      </Form>
    </Modal>
  );
}
