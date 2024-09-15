"use client";
import { useEffect,useState,useRef } from "react";
import "@/styles/edit.scss";
import { useSearchParams } from "next/navigation";
import Messages from "@/components/Messages";
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
import { getDraftBySlug, getPostBySlug, updatePostInfo } from "@/utils/posts";
import { config } from "@/dashboardConfig";
import MilkdownEditor from "@/components/MilkdownEditor";
import { MilkdownProvider } from "@milkdown/react";
import { ProsemirrorAdapterProvider } from '@prosemirror-adapter/react';

export default function Edit(){
  const searchParams=useSearchParams();
  const type=searchParams.get("type");
  const slug=searchParams.get("slug");
  const messageBarRef=useRef<any>(null);
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
  
  useEffect(()=>{
    if(type=="post")
      slug?getPostBySlug(slug!)
        .then(res=>{
          setCurrentPostInfo(res);
        }):0;
    else
      slug?getDraftBySlug(slug!)
        .then(res=>{
          setCurrentPostInfo(res);
        }):0;
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
            onClick={()=>{
              //TODO: save post
              messageBarRef.current?.addMessage({
                message:"保存成功",
                type:"success",
              });
            }}
          >
            保存
          </Button>
          {
            type=="post"?
              <Button
                icon={<SaveRegular/>}
                onClick={()=>{
                  //TODO: save post
                  messageBarRef.current?.addMessage("另存成功","success");
                }}
              >
                另存为草稿
              </Button>:
              <Button
                icon={<ArrowUploadRegular/>}
                onClick={()=>{
                  //TODO: publish post
                  messageBarRef.current?.addMessage("发布成功","success");
                }}
              >
                发布文章
              </Button>
          }
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
                {type=="post"?"*发布文章 ":"*草稿 "} 
                {
                  type=="post"?
                  <a 
                    href={`${config.blogUrl}/posts/${currentPostInfo.slug}`} 
                    title="查看原站文章"
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
                title="编辑文章信息"
                onClick={()=>{
                  setEditPostDialogState({
                    open:true,
                    title:"修改文章属性",
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
                        updatePostInfo(postn).then((res)=>{
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
            </div>

          </>
          :<>加载中...</>
        }
        <MilkdownProvider>
          <ProsemirrorAdapterProvider>
            <MilkdownEditor/>
          </ProsemirrorAdapterProvider>
        </MilkdownProvider>
      </div>
      <Messages ref={messageBarRef}/>
      <BaseDialog {...dialogState}/>
      <EditPostDialog {...editPostDialogState}/>
    </>
  );
}
