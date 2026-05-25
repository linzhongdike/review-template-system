import { Modal } from 'antd';

export function confirmAction(title: string, content: string, onOk: () => void) {
  Modal.confirm({ title, content, onOk, okText: '确认', cancelText: '取消' });
}
