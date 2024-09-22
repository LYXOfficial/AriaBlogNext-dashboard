"use client";
import { 
  ReactElement,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import Messages from "@/components/Messages";
import verifyToken, { exitLogin } from "@/utils/access";
import {
  TabList,
  OverflowItem,
  Tab
} from "@fluentui/react-components"
import { 
  ArchiveRegular,
  LinkRegular,
  DocumentRegular,
  ImageRegular,
  SettingsRegular,
  CommentRegular,
  ArrowExitRegular,
  ChartMultipleRegular,
  ChatRegular,
} from "@fluentui/react-icons";
import NoSSR from "@/components/NoSSR";
import "@/styles/admin.scss";
import { BaseDialog,BaseDialogProps } from "@/components/Dialog";

declare interface TabItem{
  name:string;
  link:string;
  icon:ReactElement;
}
const tabs:TabItem[]=[
  {
    name: "登出",
    link: "logout",
    icon: <ArrowExitRegular/>
  },
  {
    name: "总览",
    link: "/admin/overview",
    icon: <ChartMultipleRegular/>
  },
  {
    name: "博文",
    link: "/admin/posts",
    icon: <DocumentRegular/>
  },
  {
    name: "草稿",
    link: "/admin/drafts",
    icon: <ArchiveRegular/>
  },
  {
    name: "说说",
    link: "/admin/speaks",
    icon: <ChatRegular/>
  },
  {
    name: "评论",
    link: "/admin/comments",
    icon: <CommentRegular/>
  },
  {
    name: "图床",
    link: "/admin/images",
    icon: <ImageRegular/>
  },
  {
    name: "友链",
    link: "/admin/flinks",
    icon: <LinkRegular/>
  },
  {
    name: "设置",
    link: "/admin/settings",
    icon: <SettingsRegular/>
  }
]
export default function Page({
  children,
}: Readonly<{
  children: ReactNode;
}>){
  const router=useRouter();
  const path=usePathname();
  const messageBarRef=useRef<any>(null);
  const [selectedTabLink,setSelectedTabLink]=useState<string>(`/admin/${path.split("/")[2]}`);
  const [dialogState,setDialogState]=useState<BaseDialogProps>({
    title:"",
    content:<></>,
    onConfirm:()=>{},
    onClose:()=>{},
    open:false,
  });
  useEffect(()=>{
    if(!localStorage.getItem("token")){
      messageBarRef.current?.addMessage(
        "错误","请先登录","error"
      );
      setTimeout(()=>{
        router.push("/login");
      },1000);
    }
    else{
      verifyToken(localStorage.getItem("token"))
        .then(async res=>{
          if(!res){
            messageBarRef.current?.addMessage(
              "错误","登录失效，请重新登录","error"
            );
            setTimeout(()=>{
              router.push("/login");
            },1000);
          }
        })
    }
  },[]);
  useEffect(()=>{
    setSelectedTabLink(`/admin/${path.split("/")[2]}`);
  },[path]);
  const onTabSelect=(tabLink:string)=>{
    setSelectedTabLink(tabLink);
  };
  return (
    <>
      <Messages ref={messageBarRef}/>
      <NoSSR>
        <div id="admin">
          <div id="admin-leftbar">
            <TabList
              vertical
              selectedValue={selectedTabLink}
              onTabSelect={(_,d)=>onTabSelect(d.value as string)}
              appearance="subtle"
              size="large"
            >
            {tabs.map((tab) => {
              return (
                <OverflowItem
                  key={tab.name}
                  id={tab.name}
                  priority={tab.link===selectedTabLink?2:1}
                >
                  <Tab onClick={
                      ()=>{
                        if(tab.link=="logout"){
                          setDialogState({
                            title:"注销",
                            content:<>确定要退出登录吗？</>,
                            open:true,
                            onConfirm:()=>{
                              setDialogState({
                                ...dialogState,
                                open:false
                              });
                              setSelectedTabLink(`/admin/${path.split("/")[2]}`);
                              exitLogin();
                              messageBarRef.current?.addMessage("提示","已注销","info");
                              setTimeout(()=>router.push("/login"),1000);
                            },
                            onClose:()=>{
                              setDialogState({
                                ...dialogState,
                                open:false
                              });
                              setSelectedTabLink(`/admin/${path.split("/")[2]}`);
                            }
                          });
                        }
                        else
                          setTimeout(()=>router.push(tab.link),100);
                      }
                    } 
                    value={tab.link} 
                    icon={<span>{tab.icon}</span>}
                  >
                    {tab.name}
                  </Tab>
                </OverflowItem>
              );
            })}
            </TabList>
          </div>
          <div id="admin-container">
            {children}
          </div>
          <BaseDialog 
            content={dialogState.content} 
            open={dialogState.open} 
            title={dialogState.title} 
            onConfirm={dialogState.onConfirm}
            onClose={dialogState.onClose}
          />
        </div>
      </NoSSR>
    </>
  )
}
