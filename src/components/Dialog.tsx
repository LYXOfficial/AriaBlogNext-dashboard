"use client";
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Label,
  Input,
  Combobox,
  Option,
  Textarea,
} from "@fluentui/react-components";
import { Post } from "@/interfaces/post";
import { ChangeEvent, FC, ReactElement, useEffect, useRef, useState } from "react";
import { getCategories, getTags, getCachedPostSummary, regeneratePostSummary } from "@/utils/posts";
import { ArrowUploadRegular, Dismiss12Regular, ArrowSyncRegular } from "@fluentui/react-icons";
import { uploadImage } from "@/utils/image";
import mime from "mime";
import moment from "moment";

export declare interface BaseDialogProps{
  title:string,
  content:React.ReactNode,
  onConfirm:()=>void,
  onClose:()=>void,
  open:boolean,
}
export declare interface EditPostDialogProps{
  title:string,
  post:Post,
  onConfirm:(post:Post)=>void,
  onClose:()=>void,
  open:boolean,
  updated?:number,
  /** 草稿没有摘要，传 false 隐藏整个摘要区块 */
  allowSummary?:boolean,
}

export const BaseDialog=(
  {title,content,open,onConfirm,onClose}:
  BaseDialogProps
)=>{
  return (
    <Dialog open={open} onOpenChange={(_,data)=>data.open&&onClose()}>
      <DialogSurface id="dialog-base">
        <form onSubmit={(e)=>{e.preventDefault();onConfirm()}}>
          <DialogBody>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
              {content}
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary" onClick={onClose}>取消</Button>
              </DialogTrigger>
              <Button appearance="primary" type="submit">确定</Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  );
};
export const EditPostDialog=(
  {title,post,open,onConfirm,onClose,updated,allowSummary=true}:
  EditPostDialogProps
)=>{
  const [currentPostInfo,setCurrentPostInfo]=useState(post);
  const [categories,setCategories]=useState<ReactElement[]>([]);
  const [tags,setTags]=useState<ReactElement[]>([]);
  const [tagInputValue,setTagInputValue]=useState("");
  const [summaryText,setSummaryText]=useState("");
  const [currentSummary,setCurrentSummary]=useState<string|null>(null);
  const [summaryBusy,setSummaryBusy]=useState(false);
  const [summaryHint,setSummaryHint]=useState("");
  const [summaryError,setSummaryError]=useState(false);
  // 时间用 datetime-local 的本地时间字符串保存，提交时再转 unix 秒
  const [publishTimeText,setPublishTimeText]=useState("");
  const [lastUpdatedTimeText,setLastUpdatedTimeText]=useState("");
  const imageTypes=["image/png","image/jpeg","image/gif","image/webp","image/bmp","image/x-icon"];
  const uploadImageRef=useRef<HTMLInputElement>(null);
  // 留空 = 保持原值：不能用 0 顶掉后端已有时间；格式不对也按未填处理
  const parseTimeInput=(text:string)=>{
    if(!text) return undefined;
    const time=moment(text,"YYYY-MM-DDTHH:mm",true);
    return time.isValid()?time.unix():undefined;
  };
  useEffect(()=>{
    setCurrentPostInfo(post);
    setPublishTimeText(post.publishTime?moment.unix(post.publishTime).format("YYYY-MM-DDTHH:mm"):"");
    setLastUpdatedTimeText(post.lastUpdatedTime?moment.unix(post.lastUpdatedTime).format("YYYY-MM-DDTHH:mm"):"");
    setSummaryText("");
    setSummaryHint("");
    setSummaryError(false);
    setCurrentSummary(null);
    if(!allowSummary||!open) return;
    let alive=true;
    (async ()=>{
      try{
        const res=await getCachedPostSummary(post.slug ?? "");
        if(!res.ok) return;
        if(alive&&typeof res.data?.summary==="string") setCurrentSummary(res.data.summary);
      }catch{}
    })();
    return ()=>{alive=false;};
  },[post,open,allowSummary]);

  const regenerateSummary=async ()=>{
    if(summaryBusy) return;
    setSummaryBusy(true);
    setSummaryError(false);
    setSummaryHint("正在重新生成，长文章可能要 1–3 分钟，请勿关闭弹窗…");
    try{
      const res=await regeneratePostSummary(currentPostInfo.slug ?? "");
      if(res.ok&&typeof res.data?.summary==="string"){
        setSummaryText(res.data.summary);
        setCurrentSummary(res.data.summary);
        setSummaryHint("已重新生成并写入缓存，博客端下次打开文章即可看到。");
      }else{
        setSummaryError(true);
        setSummaryHint(
          res.ok? "生成失败，请稍后再试。"
          : res.status===401? "登录状态已失效，请重新登录后再试。"
          : res.status===404? "找不到这篇文章（slug 可能已变更）。"
          : (res.message||"生成失败，请稍后再试。")
        );
      }
    }catch{
      setSummaryError(true);
      setSummaryHint("网络错误，生成失败。");
    }finally{
      setSummaryBusy(false);
    }
  };
  useEffect(()=>{(async ()=>{
    getCategories().then(cts=>
      setCategories(cts.map(ct=>
        <Option key={ct.name} value={ct.name}>{ct.name}</Option>
      ))
    );
    getTags().then(tgs=>
      setTags(tgs.map(tg=>
        <Option key={tg.name} value={tg.name}>{tg.name}</Option>
      ))
    )
  })()},[updated]);
  return (
    <Dialog open={open} onOpenChange={(_,data)=>data.open&&onClose()}>
      <DialogSurface id="dialog-editpost">
        <form onSubmit={(e)=>{
          e.preventDefault();
          // datetime-local 只有分钟精度：没动过的时间原样跳过，
          // 否则每次改 meta 都会把原来的秒数抹成 :00
          const next:Post={...currentPostInfo};
          const originalPublish=post.publishTime?moment.unix(post.publishTime).format("YYYY-MM-DDTHH:mm"):"";
          if(publishTimeText!==originalPublish){
            const publishTime=parseTimeInput(publishTimeText);
            if(publishTime!==undefined) next.publishTime=publishTime;
          }
          const originalUpdated=post.lastUpdatedTime?moment.unix(post.lastUpdatedTime).format("YYYY-MM-DDTHH:mm"):"";
          if(lastUpdatedTimeText!==originalUpdated){
            const lastUpdatedTime=parseTimeInput(lastUpdatedTimeText);
            if(lastUpdatedTime!==undefined) next.lastUpdatedTime=lastUpdatedTime;
          }
          onConfirm(next);
        }}>
          <DialogBody>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
              <Label required>标题</Label>
              <Input 
                required 
                value={currentPostInfo.title??""} 
                onChange={
                  (e)=>setCurrentPostInfo({
                    ...currentPostInfo,
                    title:e.target.value
                  })
                }
              />
              {allowSummary && (
                <>
                  <Label>文章摘要</Label>
                  <div className="dialog-summary">
                    <div className="dialog-summary-head">
                      <span className="dialog-summary-tip">
                        {currentSummary||summaryText
                          ? "访客首次打开文章时自动生成；正文改动后可重新生成"
                          : "暂未生成过摘要，可点击按钮生成"}
                      </span>
                      <Button
                        size="small"
                        icon={<ArrowSyncRegular/>}
                        disabled={summaryBusy}
                        onClick={(e)=>{e.preventDefault();regenerateSummary();}}
                      >
                        {summaryBusy?"生成中…":(currentSummary||summaryText)?"重新生成":"生成摘要"}
                      </Button>
                    </div>
                    {summaryHint && (
                      <span className={`dialog-summary-hint${summaryError?" error":""}`}>{summaryHint}</span>
                    )}
                    {(summaryText||currentSummary) && (
                      <Textarea
                        readOnly
                        value={summaryText||currentSummary||""}
                        textarea={{style:{minHeight:"72px"}}}
                      />
                    )}
                  </div>
                </>
              )}
              <Label>头图</Label>
              <div className="dialog-formgroup">
                <Input
                  value={currentPostInfo.bannerImg??""} 
                  onDragEnter={(e)=>e.preventDefault()}
                  onDragOver={(e)=>e.preventDefault()}
                  placeholder="拖放或粘贴链接和文件至此处..."
                  onDrop={async (e)=>{
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect="link";
                    var file=Array.from(e.dataTransfer.files)[0];
                    console.log(file);
                    if(imageTypes.includes(file.type)){
                      setCurrentPostInfo({
                        ...currentPostInfo,
                        bannerImg:"上传中..."
                      });
                      const ur=await uploadImage(file);
                      if(ur){
                        setCurrentPostInfo({
                          ...currentPostInfo,
                          bannerImg:ur
                        });
                      }
                      else{
                        setCurrentPostInfo({
                          ...currentPostInfo,
                          bannerImg:"上传失败"
                        });
                      }
                    }
                  }}
                  onPaste={
                    (e)=>{
                      navigator.clipboard.read().then(async (res)=>{
                        const currentType=imageTypes.find(type=>res[0].types.includes(type))
                        console.log(res[0].types)
                        if(currentType){
                          e.preventDefault();
                          const file=new File([await res[0].getType(currentType)],`file.${mime.getExtension(currentType)}`);
                          setCurrentPostInfo({
                            ...currentPostInfo,
                            bannerImg:"上传中..."
                          });
                          const ur=await uploadImage(file);
                          if(ur){
                            setCurrentPostInfo({
                              ...currentPostInfo,
                              bannerImg:ur
                            });
                          }
                          else{
                            setCurrentPostInfo({
                              ...currentPostInfo,
                              bannerImg:"上传失败"
                            });
                          }
                        }
                        else if(res[0].types.includes("text/plain")){
                          const text=await (await res[0].getType("text/plain")).text();
                          if(((text.startsWith("https://")||text.startsWith("http://"))&&!text.startsWith("https://img.0v0.my"))
                            &&(text.endsWith(".jpg")||text.endsWith(".png")||text.endsWith(".jpeg")||text.endsWith(".gif")||text.endsWith(".webp"))){
                              const tr=await fetch(text);
                              if(tr.ok){
                                e.preventDefault();
                                const file=new File([await tr.blob()],`file.${text.split(".")[text.split(".").length-1]}`);
                                setCurrentPostInfo({
                                  ...currentPostInfo,
                                  bannerImg:"上传中..."
                                });
                                const ur=await uploadImage(file);
                                if(ur){
                                  setCurrentPostInfo({
                                    ...currentPostInfo,
                                    bannerImg:ur
                                  });
                                }
                                else{
                                  setCurrentPostInfo({
                                    ...currentPostInfo,
                                    bannerImg:text
                                  });
                                }
                              }
                          }
                        }
                      });
                    }
                  }
                  onChange={
                    (e)=>setCurrentPostInfo({
                      ...currentPostInfo,
                      bannerImg:e.target.value
                    })
                  }
                />
                <Button
                  icon={<ArrowUploadRegular/>}
                  onClick={()=>uploadImageRef.current?.click()}
                  title="上传图片"
                />
                <input 
                  type="file" 
                  accept={imageTypes.join(",")}
                  disabled={currentPostInfo.bannerImg=="上传中..."}
                  style={{display:"none"}}
                  ref={uploadImageRef}
                  onChange={(e)=>{
                    const file=e.target.files?.[0]
                    if(file&&imageTypes.includes(file.type)){
                      setCurrentPostInfo({
                        ...currentPostInfo,
                        bannerImg:"上传中..."
                      });
                      uploadImage(file).then((url)=>{
                        if(url){
                          setCurrentPostInfo({
                            ...currentPostInfo,
                            bannerImg:url
                          });
                        }
                        else{
                          setCurrentPostInfo({
                            ...currentPostInfo,
                            bannerImg:"上传失败"
                          });
                        }
                      });
                    }
                  }}
                />
              </div>
              <Label required>标签</Label>
              <Combobox 
                selectedOptions={currentPostInfo.tags??[]}
                multiselect={true}
                placeholder="输入或选择标签..."
                freeform
                value={tagInputValue}
                onOptionSelect={(ev,data)=>{
                  setCurrentPostInfo({
                    ...currentPostInfo,
                    tags:data.selectedOptions
                  });
                }}
                onInput={(e:ChangeEvent<HTMLInputElement>)=>setTagInputValue(e.target.value)}
                onKeyDown={(ev)=>{
                  if(ev.key==="Enter"){
                    ev.preventDefault();
                    ev.stopPropagation();
                    if(!tagInputValue.trim()) return;
                    setCurrentPostInfo({
                      ...currentPostInfo,
                      tags:[...currentPostInfo.tags??[],tagInputValue.trim()]
                    });
                    setTagInputValue("");
                  }
                }}
              >
                {tags}
              </Combobox>
              {(currentPostInfo.tags??[]).length?(
                <ul className="combobox-taglist">
                {currentPostInfo.tags!.map((option, i) => (
                  <li key={option} className="combobox-tag">
                    <Button
                      size="small"
                      shape="circular"
                      appearance="primary"
                      icon={<Dismiss12Regular/>}
                      iconPosition="after"
                      onClick={()=>
                        setCurrentPostInfo({
                          ...currentPostInfo,
                          tags:currentPostInfo.tags!.filter((_,index)=>index!==i)
                        })
                      }
                    >
                      {option}
                    </Button>
                  </li>
                ))}
                </ul>
              ):null}
              <Label required>分类</Label>
              <Combobox 
                required
                value={currentPostInfo.category??""}
                selectedOptions={categories.map(item=>(item as ReactElement<{key:string}>).key).includes(currentPostInfo.category!)?[currentPostInfo.category!]:[]}
                freeform
                onInput={(e:ChangeEvent<HTMLInputElement>)=>{
                  setCurrentPostInfo({
                    ...currentPostInfo,
                    category:e.target.value
                  });
                }}
                onOptionSelect={(ev,data)=>{
                  setCurrentPostInfo({
                    ...currentPostInfo,
                    category:data.optionText
                  });
                }}
              >
                {categories}
              </Combobox>
              <Label>封面位置</Label>
              <Input
                placeholder="（选填）CSS参数..."
                value={currentPostInfo.coverFit??""}
                onChange={(e:ChangeEvent<HTMLInputElement>)=>{
                  setCurrentPostInfo({
                    ...currentPostInfo,
                    coverFit:e.target.value
                  });
                }}
              />
              <Label>描述</Label>
              <Textarea
                placeholder="（选填）描述..."
                value={currentPostInfo.description??""}
                onChange={(e:ChangeEvent<HTMLTextAreaElement>)=>{
                  setCurrentPostInfo({
                    ...currentPostInfo,
                    description:e.target.value
                  });
                }}
              />
              <Label>发布时间</Label>
              <Input
                type="datetime-local"
                value={publishTimeText}
                onChange={(e)=>setPublishTimeText(e.target.value)}
              />
              <Label>更新时间</Label>
              <Input
                type="datetime-local"
                value={lastUpdatedTimeText}
                onChange={(e)=>setLastUpdatedTimeText(e.target.value)}
              />
              <span className="dialog-time-hint">
                本地时间，留空表示保持原值；保存正文时更新时间会自动改成当前时间。
              </span>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary" onClick={onClose}>取消</Button>
              </DialogTrigger>
              <Button appearance="primary" type="submit">保存</Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  );
};