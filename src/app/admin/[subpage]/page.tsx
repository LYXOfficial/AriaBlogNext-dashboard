"use client";
import { ReactElement,useEffect,useRef,useState } from "react";
import { useRouter } from "next/navigation";
import Messages from "@/components/Messages";
import verifyToken from "@/utils/verifyToken";
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
        icon: <ArchiveRegular/>
    },
    {
        name: "博文",
        link: "/admin/posts",
        icon: <DocumentRegular/>
    },
    {
        name: "说说",
        link: "/admin/speaks",
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

const pages={
    "overview":<>
            <h1>总览·Ariasakaの小窝</h1>
        </>,
    "posts":<>
            <h1>文章</h1>
        </>,
    "speaks":<>
            <h1>说说</h1>
        </>,
    "images":<>
            <h1>图片管理</h1>
        </>,
    "flinks":<>
            <h1>友链</h1>
        </>,
    "settings":<>
            <h1>设置</h1>
        </>,
}

export default function Page({params}:{params:{subpage:string}}){
    const router=useRouter();
    const messageBarRef=useRef<any>(null);
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
        else if(!verifyToken(localStorage.getItem("token"))){
            messageBarRef.current?.addMessage(
                "错误","登录失效，请重新登录","error"
            );
            setTimeout(()=>{
                router.push("/login");
            },1000);
        }
    },[]);
    const [selectedTabLink,setSelectedTabLink]=useState<string>(`/admin/${params.subpage}`);
    const onTabSelect=(tabLink:string) => {
        setSelectedTabLink(tabLink);
    };
    return (
        <NoSSR>
            <div id="admin">
                <div id="admin-leftbar">
                    <TabList
                        vertical
                        selectedValue={selectedTabLink}
                        onTabSelect={(_,d)=>onTabSelect(d.value as string)}
                        appearance="subtle"
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
                                                        setSelectedTabLink(`/admin/${subpage}`);
                                                        window.localStorage.removeItem("token");
                                                        messageBar.current?.addMessage("提示","已注销","info");
                                                        setTimeout(()=>router.push("/login"),1000);
                                                    },
                                                    onClose:()=>{
                                                        setDialogState({
                                                            ...dialogState,
                                                            open:false
                                                        });
                                                        setSelectedTabLink(`/admin/${subpage}`);
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
                    {pages[params.subpage as keyof typeof pages]}
                </div>
                <Messages ref={messageBarRef}/>
                <BaseDialog 
                    content={dialogState.content} 
                    open={dialogState.open} 
                    title={dialogState.title} 
                    onConfirm={dialogState.onConfirm}
                    onClose={dialogState.onClose}
                />
            </div>
        </NoSSR>
    )
}