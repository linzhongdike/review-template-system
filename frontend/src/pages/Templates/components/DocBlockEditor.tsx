import { Input } from 'antd';

interface Props {
  value: any;
  onChange: (data: any) => void;
}

export default function DocBlockEditor({ value, onChange }: Props) {
  return (
    <div>
      <Input placeholder="区块标题（可选）" value={value.title || ''}
        onChange={(e) => onChange({ ...value, title: e.target.value })} style={{ marginBottom: 8 }} />
      <Input.TextArea rows={6} placeholder="输入内容（支持HTML格式）" value={value.content || ''}
        onChange={(e) => onChange({ ...value, content: e.target.value })} />
      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
        支持HTML: &lt;h2&gt;标题&lt;/h2&gt;, &lt;p&gt;段落&lt;/p&gt;, &lt;ul&gt;&lt;li&gt;列表&lt;/li&gt;&lt;/ul&gt;
      </div>
    </div>
  );
}
