"use client";
import { Button,Label } from "@fluentui/react-components";
import Messages from "@/components/Messages"
import { useEffect,useRef } from "react";
import verifyToken from "@/utils/verifyToken";
import { useRouter } from "next/navigation";

export default function Page(){
    const messageBarRef=useRef<any>(null);
    const router=useRouter();
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
    return (
        <>
            <Messages ref={messageBarRef}/>
        </>
    );
}