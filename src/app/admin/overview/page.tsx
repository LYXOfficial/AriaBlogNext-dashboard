"use client";
import { config } from "@/dashboardConfig";
import { useEffect, useState } from "react";
import "@/styles/overview.scss";
import { 
    Document24Regular, 
    Folder24Regular,
    Tag24Regular,
    Comment24Regular,
    CommentMultiple24Regular,
    Link24Regular,
} from "@fluentui/react-icons";

export default function Overview(){
    const [postCount,setPostCount]=useState<number>(-1);
    const [categoryCount,setCategoryCount]=useState<number>(-1);
    const [tagCount,setTagCount]=useState<number>(-1);
    const [speaksCount,setSpeaksCount]=useState<number>(-1);
    const [flinkCount,setFlinkCount]=useState<number>(-1);
    const [commentCount,setCommentCount]=useState<number>(-1);
    useEffect(()=>{(async ()=>{
        fetch(`${config.backEndUrl}/get/post/postCount`,{cache:"no-store"})
            .then(async res=>{
                if(res.ok){
                    setPostCount((await res.json()).count);
                }
            });
        fetch(`${config.backEndUrl}/get/category/categoryCount`,{cache:"no-store"})
            .then(async res=>{
                if(res.ok){
                    setCategoryCount((await res.json()).count);
                }
            })
        fetch(`${config.backEndUrl}/get/tag/tagCount`,{cache:"no-store"})
            .then(async res=>{
                if(res.ok){
                    setTagCount((await res.json()).count);
                }
            })
        fetch(`${config.backEndUrl}/get/speaks/speaksCount`,{cache:"no-store"})
            .then(async res=>{
                if(res.ok){
                    setSpeaksCount((await res.json()).count);
                }
            })
        fetch(`${config.backEndUrl}/get/flink/flinkCount`,{cache:"no-store"})
            .then(async res=>{
                if(res.ok){
                    setFlinkCount((await res.json()).count);
                }
            })
    })()},[]);
    return (
        <>
            <h1>总览·Ariasakaの小窝</h1>
            <div id="overview-counts">
                <div className="overview-count posts">
                    <Document24Regular className="overview-count-icon"/>
                    <span className="overview-count-title">文章</span>
                    <span className="overview-count-value">{postCount==-1?"...":postCount}</span>
                </div>
                <div className="overview-count categories">
                    <Folder24Regular className="overview-count-icon"/>
                    <span className="overview-count-title">分类</span>
                    <span className="overview-count-value">{categoryCount==-1?"...":categoryCount}</span>
                </div>
                <div className="overview-count tags">
                    <Tag24Regular className="overview-count-icon"/>
                    <span className="overview-count-title">标签</span>
                    <span className="overview-count-value">{tagCount==-1?"...":tagCount}</span>
                </div>
                <div className="overview-count speaks">
                    <Comment24Regular className="overview-count-icon"/>
                    <span className="overview-count-title">哔哔</span>
                    <span className="overview-count-value">{speaksCount==-1?"...":speaksCount}</span>
                </div>
                <div className="overview-count comments">
                    <CommentMultiple24Regular className="overview-count-icon"/>
                    <span className="overview-count-title">评论</span>
                    <span className="overview-count-value">{commentCount==-1?"...":commentCount}</span>
                </div>
                <div className="overview-count flinks">
                    <Link24Regular className="overview-count-icon"/>
                    <span className="overview-count-title">友链</span>
                    <span className="overview-count-value">{flinkCount==-1?"...":flinkCount}</span>
                </div>
            </div>
        </>
    );
}