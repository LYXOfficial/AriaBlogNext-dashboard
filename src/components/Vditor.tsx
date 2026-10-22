import{ forwardRef,useEffect,useImperativeHandle,useRef,useState } from "react";
import Vd from "vditor";
import "vditor/dist/index.css";
import "@/styles/vditor.scss";
import { uploadImage } from "@/utils/image";
import stringRandom from "string-random";
const Vditor=forwardRef(({ content, onChange }:{ content:string|undefined; onChange?:()=>void },ref)=>{
  const [vd,setVd]=useState<Vd>();
  const onChangeRef=useRef(onChange);
  // 程序化写入（载入文章、保存后刷新）不应被当成用户编辑
  const silent=useRef(false);
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
          setValueSilently(vditor,content??"");
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
    if(vd){
      setValueSilently(vd,content??"");
    }
  },[content,vd]);

  return <div id="vditor" className="vditor" />;
});

export default Vditor;
