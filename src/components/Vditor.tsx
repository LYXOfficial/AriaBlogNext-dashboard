import{ forwardRef,useEffect,useImperativeHandle,useState } from "react";
import Vd from "vditor";
import "vditor/dist/index.css";
import "@/styles/vditor.scss";
import { uploadImage } from "@/utils/image";
import stringRandom from "string-random";
const Vditor=forwardRef(({ content }:{ content:string|undefined },ref)=>{
  const [vd,setVd]=useState<Vd>();
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
        after:()=>{
          vditor.setValue(content??"");
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
      vd.setValue(content??"");
    }
  },[content,vd]);

  return <div id="vditor" className="vditor" />;
});

export default Vditor;
