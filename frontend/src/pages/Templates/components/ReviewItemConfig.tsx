import { Input, Switch, Select, InputNumber, Button, Space, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { ITEM_TYPES } from '../../../utils/constants';

interface Props { value: any; onChange: (data: any) => void; }

export default function ReviewItemConfig({ value, onChange }: Props) {
  const config = value.config || {};

  const renderTypeConfig = () => {
    switch (value.item_type) {
      case 'score':
        return <Space><span>最小值:</span><InputNumber value={config.min_score ?? 0} onChange={v => onChange({...value, config:{...config, min_score:v}})} />
          <span>最大值:</span><InputNumber value={config.max_score ?? 100} onChange={v => onChange({...value, config:{...config, max_score:v}})} />
          <span>步长:</span><InputNumber value={config.step ?? 5} min={1} onChange={v => onChange({...value, config:{...config, step:v}})} /></Space>;

      case 'text':
      case 'textarea':
        return <Space direction="vertical" style={{width:'100%'}}>
          <Space><span>最大字数:</span><InputNumber value={config.max_length??500} min={1} onChange={v=>onChange({...value,config:{...config,max_length:v}})} /></Space>
          <Input placeholder="占位提示文字" value={config.placeholder||''} onChange={e=>onChange({...value,config:{...config,placeholder:e.target.value}})} />
        </Space>;

      case 'radio':
      case 'checkbox':
        const opts = config.options || [];
        return <div>
          <div style={{marginBottom:8,fontWeight:500}}>选项列表:</div>
          {opts.map((opt:any,i:number)=><Space key={i} style={{marginBottom:4}}>
            <Input size="small" value={opt.label} onChange={e=>{const no=[...opts];no[i]={...no[i],label:e.target.value,value:e.target.value};onChange({...value,config:{...config,options:no}})}} />
            <Button size="small" danger icon={<DeleteOutlined/>} onClick={()=>onChange({...value,config:{...config,options:opts.filter((_:any,j:number)=>j!==i)}})} />
          </Space>)}
          <Button size="small" icon={<PlusOutlined/>} onClick={()=>onChange({...value,config:{...config,options:[...opts,{label:`选项${opts.length+1}`,value:`${opts.length+1}`}]}})}>添加选项</Button>
          {value.item_type==='checkbox'&&<div style={{marginTop:8}}><Space><span>最少选择:</span><InputNumber size="small" min={0} value={config.min_select??1} onChange={v=>onChange({...value,config:{...config,min_select:v}})} /><span>最多选择:</span><InputNumber size="small" min={1} value={config.max_select??999} onChange={v=>onChange({...value,config:{...config,max_select:v}})} /></Space></div>}
        </div>;

      case 'attachment':
        return <Space direction="vertical" style={{width:'100%'}}>
          <Space><span>最大(MB):</span><InputNumber value={config.max_size_mb??10} min={1} onChange={v=>onChange({...value,config:{...config,max_size_mb:v}})} /></Space>
          <Select mode="multiple" style={{minWidth:300}} value={config.allowed_types||[]} onChange={v=>onChange({...value,config:{...config,allowed_types:v}})}
            options={[{label:'PDF',value:'pdf'},{label:'Word',value:'docx'},{label:'Excel',value:'xlsx'},{label:'图片',value:'jpg'},{label:'PNG',value:'png'},{label:'文本',value:'txt'}]} />
        </Space>;

      default: return null;
    }
  };

  return <Space direction="vertical" style={{width:'100%'}}>
    <Space><span>类型:</span><Select value={value.item_type} style={{width:160}} onChange={item_type=>{const d:Record<string,any>={score:{max_score:100,min_score:0,step:5},text:{max_length:200,placeholder:''},textarea:{max_length:1000,placeholder:''},radio:{options:[{label:'选项1',value:'1'}]},checkbox:{options:[{label:'选项1',value:'1'}],min_select:1,max_select:999},attachment:{max_size_mb:10,allowed_types:['pdf','docx','jpg','png']}};onChange({...value,item_type,config:d[item_type]||{}})}}>
      {Object.entries(ITEM_TYPES).map(([k,v])=><Select.Option key={k} value={k}>{v.label}</Select.Option>)}</Select></Space>
    <Input placeholder="评审项名称" value={value.name} onChange={e=>onChange({...value,name:e.target.value})} />
    <Input placeholder="描述（可选）" value={value.description||''} onChange={e=>onChange({...value,description:e.target.value})} />
    <Space><span>必填:</span><Switch checked={value.required} onChange={v=>onChange({...value,required:v})} /></Space>
    <Divider style={{margin:'8px 0'}} />
    {renderTypeConfig()}
  </Space>;
}
