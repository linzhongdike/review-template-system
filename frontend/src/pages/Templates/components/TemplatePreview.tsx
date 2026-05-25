import { Card, Input, Rate, Radio, Checkbox, Upload, Button, Divider } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

interface Props { docBlocks: any[]; reviewItems: any[]; }

export default function TemplatePreview({ docBlocks, reviewItems }: Props) {
  const renderItem = (item: any, index: number) => {
    const label = `${index + 1}. ${item.name}${item.required ? ' *' : ''}`;
    switch (item.item_type) {
      case 'score': return <div key={index}><div style={{marginBottom:4,fontWeight:500}}>{label}</div>
        <div>范围: {item.config?.min_score||0}-{item.config?.max_score||100} (步长:{item.config?.step||5})</div>
        <Rate count={Math.ceil((item.config?.max_score||100)/(item.config?.step||5))} disabled style={{marginTop:4}} /></div>;
      case 'text': return <div key={index} style={{marginBottom:16}}><div style={{marginBottom:4,fontWeight:500}}>{label}</div>
        <Input placeholder={item.config?.placeholder||'请输入...'} maxLength={item.config?.max_length} disabled /></div>;
      case 'textarea': return <div key={index} style={{marginBottom:16}}><div style={{marginBottom:4,fontWeight:500}}>{label}</div>
        <Input.TextArea rows={3} placeholder={item.config?.placeholder||'请输入...'} maxLength={item.config?.max_length} disabled /></div>;
      case 'radio': return <div key={index} style={{marginBottom:16}}><div style={{marginBottom:4,fontWeight:500}}>{label}</div>
        <Radio.Group disabled>{(item.config?.options||[]).map((o:any,i:number)=><Radio key={i} value={o.value}>{o.label}</Radio>)}</Radio.Group></div>;
      case 'checkbox': return <div key={index} style={{marginBottom:16}}><div style={{marginBottom:4,fontWeight:500}}>{label}</div>
        <Checkbox.Group disabled options={(item.config?.options||[]).map((o:any)=>({label:o.label,value:o.value}))} /></div>;
      case 'attachment': return <div key={index} style={{marginBottom:16}}><div style={{marginBottom:4,fontWeight:500}}>{label}</div>
        <Upload disabled><Button icon={<UploadOutlined/>} disabled>上传文件</Button></Upload></div>;
      default: return <div key={index}>{label}</div>;
    }
  };

  return <Card>{docBlocks.map((block,i)=><div key={i} style={{marginBottom:16}}>{block.title&&<h3>{block.title}</h3>}<div dangerouslySetInnerHTML={{__html:block.content}}/></div>)}
    {docBlocks.length>0&&reviewItems.length>0&&<Divider/>}
    {reviewItems.length===0&&<div style={{color:'#999',textAlign:'center',padding:32}}>暂无评审项</div>}
    {reviewItems.map((item,i)=>renderItem(item,i))}</Card>;
}
