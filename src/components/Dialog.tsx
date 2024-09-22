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
import { ChangeEvent, ReactElement, useEffect, useState } from "react";
import { getCategories, getTags } from "@/utils/posts";
import { Dismiss12Regular } from "@fluentui/react-icons";
import { uploadImage } from "@/utils/image";
import mime from "mime";

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
  {title,post,open,onConfirm,onClose,updated}:
  EditPostDialogProps
)=>{
  const [currentPostInfo,setCurrentPostInfo]=useState(post);
  const [categories,setCategories]=useState<ReactElement[]>([]);
  const [tags,setTags]=useState<ReactElement[]>([]);
  const [tagInputValue,setTagInputValue]=useState("");
  useEffect(()=>{
    setCurrentPostInfo(post);
  },[post]);
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
        <form onSubmit={(e)=>{e.preventDefault();onConfirm(currentPostInfo)}}>
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
              <Label>头图</Label>
              <Input
                value={currentPostInfo.bannerImg??""} 
                onKeyDown={
                  (e)=>{
                    if(e.ctrlKey&&e.key==='v'){
                      navigator.clipboard.read().then(async (res)=>{
                        const imageTypes=['image/png','image/jpeg',"image/webp","image/gif"];
                        const currentType=imageTypes.find(type=>res[0].types.includes(type))
                        if(currentType){
                          e.preventDefault();
                          const file=new File([await res[0].getType(currentType)],`file.${mime.getExtension(res[0].types[0])}`);
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
                          if(((text.startsWith("https://")||text.startsWith("http://"))&&!text.startsWith("https://bu.dusays.com"))
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
                }
                onChange={
                  (e)=>setCurrentPostInfo({
                    ...currentPostInfo,
                    bannerImg:e.target.value
                  })
                }
              />
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
                selectedOptions={categories.map(item=>(item as any).key).includes(currentPostInfo.category)?[currentPostInfo.category!]:[]}
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