"use client";
import { DismissRegular } from "@fluentui/react-icons";
import { 
    Button,
    Input,
    Label,
    MessageBar,
    MessageBarBody,
    MessageBarGroup,
    MessageBarTitle,
    MessageBarGroupProps,
    MessageBarActions,
    MessageBarIntent,
} from "@fluentui/react-components";
import "@/styles/login.scss";
import { useRef, useState } from "react"

declare interface Message{
    title:string;
    content:string;
    intent:MessageBarIntent;
    id:number;
}

export default function Page(){
    const userRef=useRef<HTMLInputElement>(null);
    const pwdRef=useRef<HTMLInputElement>(null);
    const counterRef=useRef(0);
    const [animate,setAnimate]=useState<MessageBarGroupProps["animate"]>("both");
    const [messages,setMessages]=useState<Message[]>([]);
    const addMessage=(title:string,content:string,intent:MessageBarIntent)=>{
        const newMessage:Message={
            title:title,
            content:content,
            intent:intent,
            id:counterRef.current++
        };
        setMessages((s)=>[newMessage,...s]);
        setTimeout(()=>{
            dismissMessage(newMessage.id);
        },3000);
    };
    const dismissMessage=(messageId:number)=>
        setMessages((s)=>s.filter((entry)=>entry.id!==messageId));
    return (
        <>
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
                <Button id="login-button" type="submit" appearance="primary" onClick={
                    ()=>{
                        if(!userRef.current!.value.trim()||!pwdRef.current!.value.trim()){
                            addMessage("错误","用户名或密码不能为空！","error");
                        }
                    }
                }>登录！</Button>
            </div>
        </div>
        <MessageBarGroup animate={animate}>
        {messages.map((item:Message)=>(
          <MessageBar className="login-message" key={`${item.intent}-${item.id}`} intent={item.intent}>
            <MessageBarBody>
              <MessageBarTitle>{item.title}</MessageBarTitle>
              {item.content}
            </MessageBarBody>
            <MessageBarActions
              containerAction={
                <Button
                  onClick={()=>dismissMessage(item.id)}
                  aria-label="dismiss"
                  appearance="transparent"
                  icon={<DismissRegular />}
                />
              }
            />
          </MessageBar>
        ))}
      </MessageBarGroup>
        </>
    );
}