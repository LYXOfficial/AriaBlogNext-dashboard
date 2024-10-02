"use client";
import { 
  Button,
  Input,
  Label,
} from "@fluentui/react-components";
import "@/styles/login.scss";
import { useRef,useState,useEffect } from "react";
import { useRouter } from "nextjs-toploader/app";
import { config } from "@/dashboardConfig";
import verifyToken from "@/utils/access";
import Messages, { MessagesRef } from "@/components/Messages";
import NoSSR from "@/components/NoSSR";
import React from "react";

export default function Page(){
  const userRef=useRef<HTMLInputElement>(null);
  const pwdRef=useRef<HTMLInputElement>(null);
  const submitRef=useRef<HTMLButtonElement>(null);
  const messageBarRef=useRef<MessagesRef>(null);
  const [logining,setLogining]=useState(false);
  const router=useRouter();
  useEffect(()=>{(async ()=>{
    const keydownHandler=(e:KeyboardEvent)=>{
      if(e.key==="Enter")
        submitRef.current?.click();
    }
    document.addEventListener("keydown",keydownHandler);
    verifyToken(localStorage.getItem("token"))
      .then(res=>{
        if(res){
          messageBarRef.current?.addMessage(
            "提示","已登录，跳转中...","info"
          );
          setTimeout(()=>{
            router.push("/admin/overview");
          },1000);
        }
      })
    return ()=>document.removeEventListener("keydown",keydownHandler);
  })()},[]);
  return (
    <>
    <Messages ref={messageBarRef}/>
    <NoSSR>
      <div id="login-container">
        <Label size="large" id="login-title">登录<br/>AriaのBlog 管理</Label>
        <div id="login-form">
          <div className="login-form-line">
            <Label>用户名</Label>
            <Input placeholder="用户名" ref={userRef}/>
          </div>
          <div className="login-form-line">
            <Label>密码</Label>
            <Input placeholder="密码" ref={pwdRef} type="password"/>
          </div>
          <Button id="login-button" type="submit" appearance="primary" 
            ref={submitRef} disabled={logining}
            onClick={
              async ()=>{
                if(!userRef.current!.value.trim()||!pwdRef.current!.value.trim()){
                  messageBarRef.current?.addMessage("错误","用户名或密码不能为空！","error");
                }
                else{
                  setLogining(true);
                  const res=await fetch(`${config.backEndUrl}/access/user/login`,{
                    method:"POST",
                    headers:{
                      "Content-Type":"application/json"
                    },
                    body:JSON.stringify({
                      user:userRef.current!.value,
                      password:pwdRef.current!.value
                    }),
                  });
                  if(res.ok){
                    const data=await res.json();
                    if(data.message==="success"){
                      localStorage.setItem("token",data.jwt);
                      messageBarRef.current?.addMessage("消息","登录成功！跳转中...","success");
                      setTimeout(()=>router.push("/admin/overview"),2000);
                    }
                    else{
                      messageBarRef.current?.addMessage("错误","登录失败，用户名或密码错误","error");
                      setLogining(false);
                    }
                  }
                  else{
                    messageBarRef.current?.addMessage("内部错误","保持与您的 Internet 管理员联系，坐和放宽。\n这不是你的错，是我们的错。","error");
                    setLogining(false);
                  }
                }
              }
            }>{logining?"登录中...":"登录！"}</Button>
        </div>
      </div>
    </NoSSR>
    </>
  );
}