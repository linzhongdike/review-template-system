import { useState } from 'react';
import { Button, Card, Space, Empty, Popconfirm, Input, Select, Divider, Switch, InputNumber } from 'antd';
import { PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import DocBlockEditor from './DocBlockEditor';
import ReviewItemConfig from './ReviewItemConfig';
import { ITEM_TYPES } from '../../../utils/constants';

interface Props {
  docBlocks: any[];
  reviewItems: any[];
  onBlocksChange: (blocks: any[]) => void;
  onItemsChange: (items: any[]) => void;
}

export default function TemplateDesigner({ docBlocks, reviewItems, onBlocksChange, onItemsChange }: Props) {
  const [activeTab, setActiveTab] = useState<'blocks' | 'items'>('blocks');

  const addBlock = () => {
    onBlocksChange([...docBlocks, { sort_order: docBlocks.length, title: '', content: '' }]);
  };
  const updateBlock = (index: number, data: any) => {
    const newBlocks = [...docBlocks];
    newBlocks[index] = { ...newBlocks[index], ...data };
    onBlocksChange(newBlocks);
  };
  const removeBlock = (index: number) => onBlocksChange(docBlocks.filter((_, i) => i !== index));
  const moveBlock = (index: number, dir: 'up' | 'down') => {
    const newIdx = dir === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= docBlocks.length) return;
    const newBlocks = [...docBlocks];
    [newBlocks[index], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[index]];
    onBlocksChange(newBlocks.map((b, i) => ({ ...b, sort_order: i })));
  };

  const addItem = (type: string) => {
    const defaults: Record<string, any> = {
      score: { max_score: 100, min_score: 0, step: 5 },
      text: { max_length: 200, placeholder: '' },
      textarea: { max_length: 1000, placeholder: '' },
      radio: { options: [{ label: '选项1', value: '1' }] },
      checkbox: { options: [{ label: '选项1', value: '1' }], min_select: 1, max_select: 999 },
      attachment: { max_size_mb: 10, allowed_types: ['pdf', 'docx', 'jpg', 'png'] },
    };
    onItemsChange([...reviewItems, {
      sort_order: reviewItems.length, name: '', description: '', item_type: type, required: false, config: defaults[type] || {}
    }]);
  };
  const updateItem = (index: number, data: any) => {
    const newItems = [...reviewItems];
    newItems[index] = { ...newItems[index], ...data };
    onItemsChange(newItems);
  };
  const removeItem = (index: number) => onItemsChange(reviewItems.filter((_, i) => i !== index));
  const moveItem = (index: number, dir: 'up' | 'down') => {
    const newIdx = dir === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= reviewItems.length) return;
    const newItems = [...reviewItems];
    [newItems[index], newItems[newIdx]] = [newItems[newIdx], newItems[index]];
    onItemsChange(newItems.map((it, i) => ({ ...it, sort_order: i })));
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Space>
          <Button type={activeTab === 'blocks' ? 'primary' : 'default'} onClick={() => setActiveTab('blocks')}>
            文档区块 ({docBlocks.length})
          </Button>
          <Button type={activeTab === 'items' ? 'primary' : 'default'} onClick={() => setActiveTab('items')}>
            评审项 ({reviewItems.length})
          </Button>
        </Space>
      </div>

      {activeTab === 'blocks' && (
        <div>
          {docBlocks.length === 0 ? <Empty description="暂无文档区块" /> : docBlocks.map((block, i) => (
            <Card key={i} size="small" style={{ marginBottom: 12 }}
              extra={<Space>
                <Button size="small" icon={<ArrowUpOutlined />} disabled={i === 0} onClick={() => moveBlock(i, 'up')} />
                <Button size="small" icon={<ArrowDownOutlined />} disabled={i === docBlocks.length - 1} onClick={() => moveBlock(i, 'down')} />
                <Popconfirm title="确定删除？" onConfirm={() => removeBlock(i)}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>}
              title={block.title || `区块 ${i + 1}`}>
              <DocBlockEditor value={block} onChange={(data) => updateBlock(i, data)} />
            </Card>
          ))}
          <Button type="dashed" icon={<PlusOutlined />} block onClick={addBlock}>添加文档区块</Button>
        </div>
      )}

      {activeTab === 'items' && (
        <div>
          {reviewItems.length === 0 ? <Empty description="暂无评审项" /> : reviewItems.map((item, i) => (
            <Card key={i} size="small" style={{ marginBottom: 12 }}
              title={`${i + 1}. ${item.name || '未命名'} [${(ITEM_TYPES as any)[item.item_type]?.label || item.item_type}]`}
              extra={<Space>
                <Button size="small" icon={<ArrowUpOutlined />} disabled={i === 0} onClick={() => moveItem(i, 'up')} />
                <Button size="small" icon={<ArrowDownOutlined />} disabled={i === reviewItems.length - 1} onClick={() => moveItem(i, 'down')} />
                <Popconfirm title="确定删除？" onConfirm={() => removeItem(i)}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>}>
              <ReviewItemConfig value={item} onChange={(data) => updateItem(i, data)} />
            </Card>
          ))}
          <Select placeholder="添加评审项..." style={{ width: '100%' }} value={undefined} onChange={addItem}>
            {Object.entries(ITEM_TYPES).map(([k, v]) => (
              <Select.Option key={k} value={k}>{v.label}</Select.Option>
            ))}
          </Select>
        </div>
      )}
    </div>
  );
}
