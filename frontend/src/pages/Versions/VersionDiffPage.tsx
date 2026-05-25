import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tag, Breadcrumb, Spin, Typography, Empty, Space } from 'antd';
import { PlusOutlined, MinusOutlined, EditOutlined } from '@ant-design/icons';
import { getVersionDiff } from '../../api/versions';

const { Title, Text } = Typography;

export default function VersionDiffPage() {
  const { tid, vid } = useParams<{ tid: string; vid: string }>();
  const navigate = useNavigate();
  const [diff, setDiff] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVersionDiff(Number(tid), Number(vid)).then(res => setDiff(res.data)).finally(() => setLoading(false));
  }, [tid, vid]);

  if (loading) return <Spin style={{display:'block',margin:'100px auto'}}/>;

  const diffTag = (type: string) => {
    const c: Record<string,{color:string;icon:any;label:string}> = {
      added:{color:'green',icon:<PlusOutlined/>,label:'新增'},
      removed:{color:'red',icon:<MinusOutlined/>,label:'删除'},
      modified:{color:'orange',icon:<EditOutlined/>,label:'修改'},
    };
    const i = c[type];
    return i ? <Tag color={i.color} icon={i.icon}>{i.label}</Tag> : null;
  };

  return <div>
    <Breadcrumb items={[{title:<a onClick={()=>navigate(`/templates/${tid}`)}>模板详情</a>},{title:<a onClick={()=>navigate(`/templates/${tid}/versions`)}>版本历史</a>},{title:'版本对比'}]} style={{marginBottom:16}}/>
    <Title level={4}>版本对比</Title>
    {!diff?.version_a ? <Empty description="这是第一个版本，无对比数据"/> : <div>
      <div style={{marginBottom:16}}>对比: V{diff.version_a?.version_number} → V{diff.version_b?.version_number}</div>
      <Card title="文档区块差异" style={{marginBottom:16}}>
        {diff.block_diffs?.length===0 ? <Text type="secondary">无变更</Text> :
          diff.block_diffs?.map((d:any,i:number)=><Card key={i} size="small" style={{marginBottom:8}}>
            <Space>{diffTag(d.type)} 区块 {d.sort_order+1}</Space>
            {d.a && <div style={{color:'#ff4d4f',marginTop:4}}><del>{d.a.title||'(无标题)'}</del></div>}
            {d.b && <div style={{color:'#52c41a',marginTop:4}}>{d.b.title||'(无标题)'}</div>}
          </Card>)}
      </Card>
      <Card title="评审项差异">
        {diff.item_diffs?.length===0 ? <Text type="secondary">无变更</Text> :
          diff.item_diffs?.map((d:any,i:number)=><Card key={i} size="small" style={{marginBottom:8}}>
            <Space>{diffTag(d.type)} 评审项 {d.sort_order+1}</Space>
            {d.a && <div style={{color:'#ff4d4f',marginTop:4}}><del>{d.a.name}</del></div>}
            {d.b && <div style={{color:'#52c41a',marginTop:4}}>{d.b.name}</div>}
          </Card>)}
      </Card>
    </div>}
  </div>;
}
