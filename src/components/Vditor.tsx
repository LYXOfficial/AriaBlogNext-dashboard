import{ forwardRef,useEffect,useImperativeHandle,useRef,useState } from "react";
import Vd from "vditor";
import "vditor/dist/index.css";
import "@/styles/vditor.scss";
import { uploadImage } from "@/utils/image";
import stringRandom from "string-random";
const Vditor=forwardRef(({ content, onChange }:{ content:string|undefined; onChange?:()=>void },ref)=>{
  const [vd,setVd]=useState<Vd>();
  const onChangeRef=useRef(onChange);
  // 程序化写入（载入文章）不应被当成用户编辑
  const silent=useRef(false);
  // 正文已经写进了哪个编辑器实例。同一个实例只写这一次——改 meta 会刷新父组件状态，
  // 旧逻辑在那时 setValue，未保存的正文被强制回滚（只剩撤回能救）。
  // 用实例而不是布尔值：开发模式 StrictMode 会重建实例，新建的编辑器必须重新拿到正文。
  const appliedFor=useRef<Vd|undefined>(undefined);
  const setValueSilently=(vditor:Vd,value:string)=>{
    silent.current=true;
    vditor.setValue(value);
    silent.current=false;
  };
  useEffect(()=>{
    onChangeRef.current=onChange;
  },[onChange]);
  useImperativeHandle(ref,()=>({
    getMarkdown:()=>vd?.getValue(),
  }));
  useEffect(()=>{
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    if(mediaQuery.matches) vd?.setTheme("dark","dark");
    else vd?.setTheme("classic","light");
    const handleChange=(e:MediaQueryListEvent)=>{
      if(e.matches) vd?.setTheme("dark","dark");
      else vd?.setTheme("classic","light");
    };
    mediaQuery.addEventListener("change",handleChange);
    return ()=>mediaQuery.removeEventListener("change",handleChange);
  },[vd]);
  useEffect(()=>{
    let vditor:Vd;
    const initVditor=()=>{
      vditor=new Vd("vditor",{
        input:()=>{
          if(!silent.current) onChangeRef.current?.();
        },
        after:()=>{
          // 挂载时正文已就绪（切换文章会整体重建编辑器）才直接写入，否则等它到达
          if(content!==undefined){
            setValueSilently(vditor,content);
            appliedFor.current=vditor;
          }
          setVd(vditor);
        },
        outline:{
          enable:true,
          position:"right",
        },
        upload:{
          max: 4.5*1024*1024,
          handler(files){
            const tmplist:string[]=[];
            for(let i=0;i<files.length;i++){
              tmplist.push(`![图片上传中${stringRandom()}]()`);
            }
            (async ()=>{
              let flag=true;
              (await Promise.all(
                files.map(async(file)=>await uploadImage(file))
              )).map((url,i)=>{
                if(!url.length) vditor.setValue(vditor.getValue().replace(tmplist[i]+"\n","")),flag=false;
                else vditor.setValue(vditor.getValue().replace(tmplist[i],`![](${url})`));
              });
              if(flag) vditor.tip("上传成功",1000);
              else vditor.tip("上传失败",1000);
            })();
            document.execCommand("insertHTML",false,tmplist.join("\n"));
            return "上传中...";
          }
        }
      });
    };
    initVditor();
    return ()=>{
      if(vditor){
        try{
          vditor.destroy();
        }
        catch(e){}
        setVd(undefined);
      }
    };
  },[]);

  useEffect(()=>{
    // 每个编辑器实例只写入一次正文。之后 prop 变化一律忽略：
    // 编辑器里可能正躺着尚未保存的改动，任何来自 props 的 setValue 都等于强制回滚。
    // 换文章由父组件用 key 重建编辑器，不靠这个 effect 刷新内容。
    if(vd&&appliedFor.current!==vd&&content!==undefined){
      setValueSilently(vd,content);
      appliedFor.current=vd;
    }
  },[content,vd]);

  return <div id="vditor" className="vditor" />;
});

export default Vditor;
