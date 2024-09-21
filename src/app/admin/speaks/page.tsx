"use client";
import { addSpeaks, getSpeakCount, getSpeaks, removeSpeaks, updateSpeaks } from "@/utils/speaks";
import { Button, Label } from "@fluentui/react-components";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ReactElement, useEffect, useRef, useState } from "react";
import "@/styles/speaks.scss";
import { AddRegular, CheckmarkRegular, ComposeRegular, DeleteRegular, DismissRegular, EditRegular } from "@fluentui/react-icons";
import moment from "moment";
import Messages from "@/components/Messages";
import { BaseDialog, BaseDialogProps } from "@/components/Dialog";
import { BB } from "@/interfaces/bb";
import AceEditor from 'react-ace';
function BBItem({item,deleteHandler,saveHandler}:{item:BB,deleteHandler:()=>void,saveHandler:(content:string)=>void}){
  const [editing,setEditing]=useState(false);
  const [saveEnable,setSaveEnable]=useState(false);
  const aceEditorRef=useRef<any>(null);
  const saveButtonRef=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    aceEditorRef.current?.editor.setValue(item.content);
    aceEditorRef.current?.editor.clearSelection();
  },[item]);
  return (
    <div className="speaks-item">
      <div className="speaks-item-topbar">
        <div className="speaks-item-mainbar" style={{display:editing?"none":"block"}}>
          <Button
            icon={<ComposeRegular/>}
            className="speaks-item-mainbar-editbtn"
            size="small"
            onClick={()=>setEditing(true)}
            title="编辑"
          />
          <Button
            icon={<DeleteRegular/>}
            className="speaks-item-mainbar-delbtn"
            style={{color:"red"}}
            size="small"
            title="删除"
            onClick={deleteHandler}
          />
        </div>
        <div className="speaks-item-editbar" style={{display:editing?"block":"none"}}>
          <Button
            icon={<CheckmarkRegular/>}
            size="small"
            style={{color:"green"}}
            title="保存"
            disabled={!saveEnable}
            onClick={()=>{
              const content=aceEditorRef.current?.editor.getValue();
              setEditing(false);
              saveHandler(content);
            }}
            ref={saveButtonRef}
          />
          <Button
            icon={<DismissRegular/>}
            size="small"
            style={{color:"red"}}
            onClick={()=>{
              setEditing(false);
              aceEditorRef.current?.editor.setValue(item.content);
              aceEditorRef.current?.editor.clearSelection();
            }}
            title="取消"
          />
        </div>
      </div>
      <AceEditor
        mode="html"
        theme="xcode"
        className="speaks-item-editor"
        style={{display:editing?"block":"none"}}
        wrapEnabled={true}
        defaultValue={item.content}
        ref={aceEditorRef}
        onChange={value=>{
          setSaveEnable(!(value==item.content&&value.trim()));
        }}
        onLoad={editor=>{
          editor.setOption("indentedSoftWrap",false);
          editor.commands.addCommand({
            name: "save",
            bindKey: {win:"Ctrl-S",mac:"Cmd-S"},
            exec: ()=>{saveButtonRef.current?.click()},
          });
          editor.commands.addCommand({
            name: "insertBreak",
            bindKey: {win:"Enter",mac:"Enter"},
            exec: (editor)=>{
              const position=editor.getCursorPosition();
              editor.session.insert(position,"<br/>\n");
            },
          });
        }}
        setOptions={
          {
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: true,
            showLineNumbers: false,
            showGutter: false,
            useSoftTabs: false,
          }
        }
      />
      <div 
        className="speaks-item-content" 
        dangerouslySetInnerHTML={{__html:item.content}}
        style={{display:editing?"none":"block"}}
      />
      <div className="speaks-item-time">{moment.unix(item.time).format("YYYY-MM-DD HH:mm:ss")}</div>
    </div>
  );
}
function NewBBItem({item,saveHandler}:{item:BB,saveHandler:(content:string)=>void}){
  const [editing,setEditing]=useState(true);
  const [saveEnable,setSaveEnable]=useState(false);
  const aceEditorRef=useRef<any>(null);
  const saveButtonRef=useRef<HTMLButtonElement>(null);
  return (editing?
    <div className="speaks-item">
      <div className="speaks-item-topbar">
        <div className="speaks-item-editbar">
          <Button
            icon={<CheckmarkRegular/>}
            size="small"
            style={{color:"green"}}
            title="保存"
            disabled={!saveEnable}
            onClick={()=>{
              const content=aceEditorRef.current?.editor.getValue();
              setEditing(false);
              saveHandler(content);
            }}
            ref={saveButtonRef}
          />
          <Button
            icon={<DismissRegular/>}
            size="small"
            style={{color:"red"}}
            onClick={()=>{
              setEditing(false);
              aceEditorRef.current?.editor.setValue(item.content);
              aceEditorRef.current?.editor.clearSelection();
            }}
            title="取消"
          />
        </div>
      </div>
      <AceEditor
        mode="html"
        theme="xcode"
        className="speaks-item-editor"
        wrapEnabled={true}
        defaultValue={item.content}
        ref={aceEditorRef}
        onChange={value=>{
          setSaveEnable(!(value==item.content&&value.trim()));
        }}
        onLoad={editor=>{
          editor.setOption("indentedSoftWrap",false);
          editor.commands.addCommand({
            name: "save",
            bindKey: {win:"Ctrl-S",mac:"Cmd-S"},
            exec: ()=>{saveButtonRef.current?.click()},
          });
          editor.commands.addCommand({
            name: "insertBreak",
            bindKey: {win:"Enter",mac:"Enter"},
            exec: (editor)=>{
              const position=editor.getCursorPosition();
              editor.session.insert(position,"<br/>\n");
            },
          });
        }}
        setOptions={
          {
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: true,
            showLineNumbers: false,
            showGutter: false,
            useSoftTabs: false,
          }
        }
      />
      <div className="speaks-item-time">{moment.unix(item.time).format("YYYY-MM-DD HH:mm:ss")}</div>
    </div>
  :<></>);
}

export default function Page(){
  const [bbContent,setBBContent]=useState<ReactElement[]>([]);
  const [speakCount,setSpeakCount]=useState(-1);
  const [cols,setCols]=useState(1);
  const [updated,setUpdated]=useState(0);
  const messageBarRef=useRef<any>(null);
  const searchParams=useSearchParams();
  const page=searchParams.get("page")?parseInt(searchParams.get("page")!):1;
  const maxPage=Math.ceil(speakCount/30);
  const [dialogState,setDialogState]=useState<BaseDialogProps>({
    title:"",
    content:<></>,
    onConfirm:()=>{},
    onClose:()=>{},
    open:false,
  });
  useEffect(()=>{
    import('ace-builds/src-noconflict/mode-html');
    import('ace-builds/src-noconflict/theme-xcode');
    import('ace-builds/src-noconflict/ext-language_tools');
  },[]);
  useEffect(()=>{(async ()=>{
    setSpeakCount(await getSpeakCount());
    const speaks=await getSpeaks((page-1)*30,page*30);
    if(speaks){
      setBBContent(speaks.map(item=>{
        const deleteHandler=()=>{
          setDialogState({
            open:true,
            title:"删除说说",
            content:<>确定删除这条说说吗？<br/><strong>将会被永久删除！（真的很久！）</strong></>,
            onConfirm:async ()=>{
              setDialogState({
                ...dialogState,
                open:false,
              });
              if(await removeSpeaks(item.time)){
                messageBarRef.current?.addMessage("提示","删除成功","success");
                setUpdated(updated+1); 
              }
              else messageBarRef.current?.addMessage("错误","删除失败","error");
            },
            onClose:()=>{
              setDialogState({
                ...dialogState,
                open:false,
              });
            }
          });
        }
        const saveHandler=async (content:string)=>{
          if(await updateSpeaks({...item,content:content})){
            messageBarRef.current?.addMessage("提示","保存成功","success");
            setUpdated(updated+1);
          }
          else{
            messageBarRef.current?.addMessage("提示","保存失败","error");
          }
        }
        return <BBItem item={item} deleteHandler={deleteHandler} saveHandler={saveHandler}/>;
      }));
    }
    const resizeHandler=()=>{
      const width=document.documentElement.clientWidth;
      if(width<600) setCols(1);
      else if(width<900) setCols(2);
      else setCols(3);
    }
    window.addEventListener("resize",resizeHandler);
    import("wc-waterfall");
    resizeHandler();
    return ()=>{
      window.removeEventListener("resize",resizeHandler);
    }
  })()},[page,updated]);
  return (
    <>
      <h2>说说</h2>
      <div id="speaks-topbar">
        <Button
          icon={<AddRegular/>}
          id="speaks-addbtn"
          appearance="primary"
          onClick={()=>{
            const item={time:moment().unix(),content:"",plainContent:""}
            const saveHandler=async (content:string)=>{
              if(await addSpeaks({...item,content:content})){
                messageBarRef.current?.addMessage("提示","保存成功","success");
                setUpdated(updated+1);
              }
              else{
                messageBarRef.current?.addMessage("提示","保存失败","error");
              }
            }
            setBBContent([<NewBBItem saveHandler={saveHandler} item={item}/>,...bbContent])
          }}
        >
          新说说
        </Button>
      </div>
      <div id="speaks-list">
        <wc-waterfall id="speaks-waterfall" gap={10} cols={cols}>
          {bbContent}
        </wc-waterfall>
      </div>
      <div id="speaks-pagination">
        {page-2>0?<Link className="speaks-pagination-pgbtn" href={`/admin/speaks?page=1`}>
          <Button appearance="secondary" shape="circular">1</Button>
        </Link>:<></>}
        {page-3>0?<Label className="speaks-pagination-spec">...</Label>:<></>}
        {page-1>0?<Link className="speaks-pagination-pgbtn" href={`/admin/speaks?page=${page-1}`}>
          <Button appearance="secondary" shape="circular">{page-1}</Button>
        </Link>:<></>}
        <Link className="speaks-pagination-pgbtn current" href={`/admin/speaks?page=${page}`}>
          <Button appearance="primary" shape="circular">{page}</Button>
        </Link>
        {page+1<=maxPage?<Link className="speaks-pagination-pgbtn" href={`/admin/speaks?page=${page+1}`}>
          <Button appearance="secondary" shape="circular">{page+1}</Button>
        </Link>:<></>}
        {page+3<=maxPage?<Label className="speaks-pagination-spec">...</Label>:<></>}
        {page+2<=maxPage?<Link className="speaks-pagination-pgbtn" href={`/admin/speaks?page=${maxPage}`}>
          <Button appearance="secondary" shape="circular">{maxPage}</Button>
        </Link>:<></>}
        <Label id="speaks-pagination-text">{`20 条/页 共 ${speakCount} 条`}</Label>
      </div>
      <Messages ref={messageBarRef}/>
      <BaseDialog {...dialogState}/>
    </>
  );
}