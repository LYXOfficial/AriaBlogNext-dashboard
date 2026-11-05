import{ forwardRef,useEffect,useImperativeHandle,useRef,useState } from "react";
import Vd from "vditor";
import "vditor/dist/index.css";
import "@/styles/vditor.scss";
import { uploadImage } from "@/utils/image";
import stringRandom from "string-random";
// 前端 markdown-to-jsx 能解析的外挂标签。Vditor 底层 Lute 要求开标签的首个属性
// 必须与标签名同行：`<Link\n  link="...">`（标签名后直接换行）会被解析成 md 链接
// `[Link...](Link%0A...)` 再也回不来，单行或首属性同行则正常。这里只列常用标签，
// 改动只影响编辑器载入与保存的文本形态，前端对属性间换行不敏感，渲染结果不变。
const CUSTOM_TAG_NAMES = [
  "Folding",
  "Note",
  "Tabs",
  "Tab",
  "Chat",
  "CheckBox",
  "FriendLinks",
  "FlinkApply",
  "ColorText",
  "InlineImage",
  "Prompt",
  "Link",
];

// 按围栏代码块切分：``` 示例里的标签写法必须原样保留，不能动
function splitFenced(md: string): { text: string; fenced: boolean }[] {
  const lines = md.split("\n");
  const chunks: { text: string; fenced: boolean }[] = [];
  let cur: string[] = [];
  let curFenced = false;
  let fence: { char: string; len: number } | null = null;
  const push = () => {
    if (cur.length) chunks.push({ text: cur.join("\n"), fenced: curFenced });
    cur = [];
  };
  for (const line of lines) {
    const m = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (m) {
      const marker = m[1];
      if (!fence) {
        push();
        curFenced = true;
        fence = { char: marker[0], len: marker.length };
        cur.push(line);
      } else if (
        marker[0] === fence.char &&
        marker.length >= fence.len &&
        !m[2].trim()
      ) {
        cur.push(line);
        push();
        curFenced = false;
        fence = null;
      } else {
        cur.push(line);
      }
    } else {
      cur.push(line);
    }
  }
  push();
  return chunks;
}

// `<Tag\n  attr` → `<Tag attr`：只并回标签名后的换行，后续属性的换行保留
function normalizeTagOpen(text: string): string {
  return text.replace(
    new RegExp(`<((?:${CUSTOM_TAG_NAMES.join("|")}))\\b[ \\t]*\\n\\s*`, "g"),
    "<$1 "
  );
}

// 把 Lute 已经破坏的 `[Tag\n...](Tag%0A...)` 还原回 `<Tag\n...>`。
// 判定很严格：href 解码后必须与文本完全一致、且是已知标签开头的多行属性，
// 普通手写链接（文本短、href 是正常 URL）不会命中。
function repairMangledTag(text: string): string {
  return text.replace(/\[([\s\S]*?)\]\(([^)\s]+)\)/g, (m, inner: string, dest: string) => {
    let decoded: string;
    try {
      decoded = decodeURIComponent(dest);
    } catch {
      return m;
    }
    if (decoded !== inner) return m;
    const tm = inner.match(/^([A-Za-z][A-Za-z0-9-]*)\b[\s\S]*\/?$/);
    if (!tm || !CUSTOM_TAG_NAMES.includes(tm[1])) return m;
    if (!inner.includes("\n") || !inner.includes("=")) return m;
    return `<${inner}>`;
  });
}

// 载入与保存统一走这里：先复活已破坏的内容，再把开标签并成 Lute 能接受的形态
function protectCustomTags(md: string): string {
  return splitFenced(md)
    .map((c) => (c.fenced ? c.text : normalizeTagOpen(repairMangledTag(c.text))))
    .join("\n");
}

const Vditor=forwardRef(({ content, onChange }:{ content:string|undefined|null; onChange?:()=>void },ref)=>{
  const [vd,setVd]=useState<Vd>();
  const onChangeRef=useRef(onChange);
  // 程序化写入（载入文章）不应被当成用户编辑
  const silent=useRef(false);
  // 正文已经写进了哪个编辑器实例。同一个实例只写这一次——改 meta 会刷新父组件状态，
  // 旧逻辑在那时 setValue，未保存的正文被强制回滚（只剩撤回能救）。
  // 用实例而不是布尔值：开发模式 StrictMode 会重建实例，新建的编辑器必须重新拿到正文。
  const appliedFor=useRef<Vd|undefined>(undefined);
  const setValueSilently=(vditor:Vd,value:string|null|undefined)=>{
    silent.current=true;
    // 后端新建的草稿没有正文，详情接口回 null；直接 setValue(null) 会写出字面量 "null"。
    // 这里统一按空文本处理，undefined（还没取到数）由调用处的判断拦下，不会走到这里。
    vditor.setValue(protectCustomTags(value ?? ""));
    silent.current=false;
  };
  useEffect(()=>{
    onChangeRef.current=onChange;
  },[onChange]);
  useImperativeHandle(ref,()=>({
    getMarkdown:()=>protectCustomTags(vd?.getValue() ?? ""),
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
