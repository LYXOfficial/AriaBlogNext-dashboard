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
} from "@fluentui/react-icons";
import NoSSR from "@/components/NoSSR";
import "@/styles/admin.scss";

declare interface TabItem{
    name:string;
    link:string;
    icon:ReactElement;
}
const tabs:TabItem[]=[
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
    "posts":<></>,
    "speaks":<></>,
    "images":<></>,
    "flinks":<></>,
    "settings":<></>,
}

export default function Page({params}:{params:{subpage:string}}){
    const router=useRouter();
    const messageBarRef=useRef<any>(null);
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
                                <Tab onClick={()=>router.push(tab.link)} value={tab.link} icon={<span>{tab.icon}</span>}>
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
            </div>
        </NoSSR>
    )
}