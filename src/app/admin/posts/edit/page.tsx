"use client";
import { useEffect,useState,useRef, RefObject } from "react";
import "@/styles/edit.scss";
import { useSearchParams } from "next/navigation";
import Messages, { MessagesRef } from "@/components/Messages";
import { BaseDialog,BaseDialogProps, EditPostDialog, EditPostDialogProps } from "@/components/Dialog";
import { useRouter } from "nextjs-toploader/app";
import { Button, Label } from "@fluentui/react-components";
import { 
  ArrowUploadRegular,
  ChevronLeftRegular,
  Edit16Regular,
  SaveFilled,
  SaveRegular,
} from "@fluentui/react-icons";
import { Post } from "@/interfaces/post";
import { addDraft, addPost, getDraftBySlug, getPostBySlug, removeDraft, updateDraftInfo, updateDraftMarkdown, updatePostInfo, updatePostMarkdown } from "@/utils/posts";
import { config } from "@/dashboardConfig";
import Vditor from "@/components/Vditor";
import moment from "moment";
import React from "react";

export default function Edit(){
  const searchParams=useSearchParams();
  const type=searchParams.get("type");
  const slug=searchParams.get("slug");
  const messageBarRef=useRef<MessagesRef>(null);
  const router=useRouter();
  const [dialogState,setDialogState]=useState<BaseDialogProps>({
    title:"",
    content:<></>,
    onConfirm:()=>{},
    onClose:()=>{},
    open:false,
  });
  const [editPostDialogState,setEditPostDialogState]=useState<EditPostDialogProps>({
    title:"",
    post:{},
    onConfirm:()=>{},
    onClose:()=>{},
    open:false,
  });
  const [updated,setUpdated]=useState(0);
  const [currentPostInfo,setCurrentPostInfo]=useState<Post>({});
  const [saving,setSaving]=useState(false);
  const [saveAsing,setSaveAsing]=useState(false);
  const saveButtonRef=useRef<HTMLButtonElement>(null);
  const vditorRef=useRef<{getMarkdown:()=>string}>(null);
  useEffect(()=>{
    let r:Post;
    if(type=="post")
      slug?getPostBySlug(slug!)
        .then(res=>{
          if(res){
            r=res;
            setCurrentPostInfo(res);
          }
        }):0;
    else
      slug?getDraftBySlug(slug!)
        .then(res=>{
          if(res){
            r=res;
            setCurrentPostInfo(res);
          }
        }):0;
    const saveHandler=(e:KeyboardEvent)=>{
      if(e.ctrlKey&&e.key=="s"){
        e.preventDefault();
        saveButtonRef.current?.click();
      }
    }
    const quitHandler=(e:BeforeUnloadEvent)=>{
      e.preventDefault();
      return "确实要退出吗？请确认是否已经保存到 Internet 内部微软边缘集线器，然后坐和放宽";
    }
    window.addEventListener("keydown",saveHandler);
    window.addEventListener("beforeunload",quitHandler);
    return ()=>{
      window.removeEventListener("keydown",saveHandler);
      window.removeEventListener("beforeunload",quitHandler);
    }
  },[type,slug,updated]);
  return (
    <>
      <h2>编辑文章</h2>
      <div id="editpost-topbar">
        <Button
          id="editpost-topbar-back"
          icon={<ChevronLeftRegular/>}
          onClick={()=>
            type=="post"?
              router.push("/admin/posts"):
              router.push("/admin/drafts")
          }
        >
          返回
        </Button>
        <div id="editpost-topbar-save">
          <Button
            icon={<SaveFilled/>}
            appearance="primary"
            ref={saveButtonRef}
            disabled={saving}
            onClick={async ()=>{
              setSaving(true);
              const failed=()=>{
                messageBarRef.current?.addMessage(
                  "提示","保存失败","error",
                );
              }
              const success=()=>{
                messageBarRef.current?.addMessage(
                  "提示","保存成功","success",
                );
              }
              console.log(vditorRef.current?.getMarkdown());
              if(type=="post"){
                if(await updatePostMarkdown(vditorRef.current?.getMarkdown()!,slug!)){
                  if(await updatePostInfo({...currentPostInfo,lastUpdatedTime:moment().unix()})){
                    success();
                    setUpdated(updated+1);
                  }
                  else failed();
                }
                else{
                  failed();
                }
              }
              else if(type=="draft"){
                if(await updateDraftMarkdown(vditorRef.current?.getMarkdown()!,slug!)){
                  if(await updateDraftInfo({...currentPostInfo,lastUpdatedTime:moment().unix()})){
                    success();
                  }
                  else failed();
                }
                else{
                  failed();
                }
              }
              setSaving(false);
            }}
          >
            {saving?"保存中...":"保存"}
          </Button>
            <Button
              icon={type=="post"?<SaveRegular/>:<ArrowUploadRegular/>}
              disabled={saveAsing}
              onClick={async ()=>{
                setSaveAsing(true);
                const failed=()=>{
                  messageBarRef.current?.addMessage(
                    "提示",type=="post"?"另存失败":"发布失败","error",
                  );
                }
                const success=()=>{
                  messageBarRef.current?.addMessage(
                    "提示",type=="post"?"另存成功":"发布成功","success",
                  );
                  setTimeout(()=>router.push(`/admin/posts/edit?slug=${slug}&type=${type=="post"?"draft":"post"}`),1000);
                }
                if(type=="post"){
                  if(await addDraft({...currentPostInfo,lastUpdatedTime:moment().unix()})){
                    if(await updateDraftMarkdown(vditorRef?.current?.getMarkdown()!,slug!)){
                      success();
                    }
                    else failed();
                  }
                  else{
                    const overwritePost=await getDraftBySlug(slug!);
                    if(overwritePost){
                      setDialogState({
                        open:true,
                        title:"提示",
                        content:<>存在相同编号的草稿文章，是否覆盖？<br/><strong>{overwritePost.title}</strong></>,
                        onConfirm:async ()=>{
                          setDialogState({
                            ...dialogState,
                            open:false
                          });
                          if(await updateDraftInfo({...currentPostInfo,lastUpdatedTime:moment().unix()})){
                            if(await updateDraftMarkdown(vditorRef?.current?.getMarkdown()!,slug!)){
                              success();
                            }
                            else failed();
                          }
                          else failed();
                        },
                        onClose:()=>{
                          setDialogState({
                            ...dialogState,
                            open:false
                          });
                        }
                      });
                    }
                    else failed();
                  }
                }
                else{
                  if(await addPost({...currentPostInfo,lastUpdatedTime:moment().unix()})){
                    if(await updatePostMarkdown(vditorRef?.current?.getMarkdown()!,slug!)){
                      success();
                    }
                    else failed();
                  }
                  else{
                    const overwritePost=await getPostBySlug(slug!);
                    if(overwritePost){
                      setDialogState({
                        open:true,
                        title:"提示",
                        content:<>存在相同编号的发布文章，是否覆盖？<br/><strong>{overwritePost.title}</strong></>,
                        onConfirm:async ()=>{
                          setDialogState({
                            ...dialogState,
                            open:false
                          });
                          if(await updatePostInfo({...currentPostInfo,lastUpdatedTime:moment().unix()})){
                            if(await updatePostMarkdown(vditorRef?.current?.getMarkdown()!,slug!)){
                              if(await removeDraft(slug!))
                                success();
                              else failed();
                            }
                            else failed();
                          }
                          else failed();
                        },
                        onClose:()=>{
                          setDialogState({
                            ...dialogState,
                            open:false
                          });
                        }
                      });
                    }
                    else failed();
                  }
                }
                setSaveAsing(false);
              }}
            >
              {type=="post"?(saveAsing?"另存中...":"另存为草稿"):(saveAsing?"发布中...":"发布文章")}
            </Button>
        </div>
      </div>
      <div id="editpost-main">
        {
          currentPostInfo.title?
          <>
            <div id="editpost-main-topline">
              <Label id="editpost-main-title">
                {currentPostInfo.title}
              </Label>
              <Label id="editpost-main-slug">
                {type=="post"?"*已发布 ":"*草稿 "} 
                {
                  type=="post"?
                  <a 
                    href={`${config.blogUrl}/posts/${currentPostInfo.slug}`} 
                    title="查看原站文章"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {currentPostInfo.slug}
                  </a>
                  :currentPostInfo.slug
                }
              </Label>
              <Button 
                id="editpost-main-editinfo"
                size="small"
                icon={<Edit16Regular/>}
                title={`编辑${type=="post"?"文章":"草稿"}信息`}
                onClick={()=>{
                  setEditPostDialogState({
                    open:true,
                    title:`修改${type=="post"?"文章":"草稿"}属性`,
                    post:currentPostInfo,
                    onClose:()=>{
                      setEditPostDialogState({
                        ...editPostDialogState,
                        open:false
                      });
                    },
                    onConfirm:(postn:Post)=>{
                      setEditPostDialogState({
                        ...editPostDialogState,
                        open:false
                      });
                      if(postn!=currentPostInfo)
                        if(type=="post")
                          updatePostInfo(postn).then((res)=>{
                            if(res){
                              messageBarRef.current?.addMessage("提示","修改成功","success");
                              setUpdated(updated+1);
                            }
                            else messageBarRef.current?.addMessage("提示","修改失败","error");
                          });
                        else
                          updateDraftInfo(postn).then((res)=>{
                            if(res){
                              messageBarRef.current?.addMessage("提示","修改成功","success");
                              setUpdated(updated+1);
                            }
                            else messageBarRef.current?.addMessage("提示","修改失败","error");
                          });
                    }
                  })
                }}
              />
              <Label id="editpost-main-lastsave">
                上次保存：
                {currentPostInfo.lastUpdatedTime?
                  moment.unix(currentPostInfo.lastUpdatedTime)
                    .format("MM-DD HH:mm:ss"):"未保存"
                }
              </Label>
            </div>

          </>
          :<>加载中...</>
        }
        <Vditor content={currentPostInfo.mdContent} ref={vditorRef}/>
      </div>
      <Messages ref={messageBarRef}/>
      <BaseDialog {...dialogState}/>
      <EditPostDialog {...editPostDialogState}/>
    </>
  );
}
