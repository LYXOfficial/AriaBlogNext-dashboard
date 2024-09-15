"use client";
import "@/styles/Messages.scss"
import { DismissRegular } from "@fluentui/react-icons";
import { 
  Button,
  MessageBar,
  MessageBarBody,
  MessageBarGroup,
  MessageBarTitle,
  MessageBarGroupProps,
  MessageBarActions,
  MessageBarIntent,
} from "@fluentui/react-components";
import "@/styles/login.scss";
import { 
  useRef,
  useState,
  forwardRef,
  useImperativeHandle 
} from "react";

export declare interface Message{
  title:string;
  content:string;
  intent:MessageBarIntent;
  id:number;
}

const Messages=forwardRef((props:any,ref:any)=>{
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
    setMessages((s)=>[newMessage,...s].slice(0,3));
    setTimeout(()=>{
      dismissMessage(newMessage.id);
    },3000);
  };
  useImperativeHandle(ref,()=>({
    addMessage,
  }));
  const dismissMessage=(messageId:number)=>
    setMessages((s)=>s.filter((entry)=>entry.id!==messageId));
  return (
    <MessageBarGroup animate={animate}>
      {messages.map((item:Message)=>(
      <MessageBar key={`${item.intent}-${item.id}`} intent={item.intent}>
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
          icon={<DismissRegular/>}
          />
        }
        />
      </MessageBar>
      ))}
    </MessageBarGroup>
  );
});

export default Messages;