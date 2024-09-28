"use client";
import { addSpeaks, getSpeakCount, getSpeaks, removeSpeaks, updateSpeaks } from "@/utils/speaks";
import { Button, Label } from "@fluentui/react-components";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ReactElement, RefObject, useEffect, useRef, useState } from "react";
import "@/styles/speaks.scss";
import { AddRegular, CheckmarkRegular, CodeRegular, ComposeRegular, DeleteRegular, DismissRegular, ImageRegular, LinkRegular, TextBoldRegular, TextItalicRegular, TextStrikethroughRegular } from "@fluentui/react-icons";
import moment from "moment";
import Messages from "@/components/Messages";
import { BaseDialog, BaseDialogProps } from "@/components/Dialog";
import { BB } from "@/interfaces/bb";
import AceEditor from 'react-ace';
import mime from "mime";
import { uploadImage } from "@/utils/image";
import { lightTheme } from "@/utils/theme";
const imageTypes=["image/png","image/jpeg","image/gif","image/webp","image/bmp","image/x-icon"];
function BBItem({item,deleteHandler,saveHandler,pasteHandler,uploadWithTip,updated}:{item:BB,deleteHandler:()=>void,saveHandler:(content:string)=>void,pasteHandler:(editorRef:RefObject<AceEditor>,event:ClipboardEvent)=>void,uploadWithTip:(file:File)=>Promise<string>,updated:number}):ReactElement{
  const [editing,setEditing]=useState(false);
  const [saveEnable,setSaveEnable]=useState(false);
  const aceEditorRef=useRef<AceEditor>(null);
  const saveButtonRef=useRef<HTMLButtonElement>(null);
  const handlePaste=(e:ClipboardEvent)=>{pasteHandler(aceEditorRef,e)};
  const uploadImageInputRef=useRef<HTMLInputElement>(null);
  const [isLight,setIsLight]=useState(true);
  useEffect(()=>{
    const mediaQuery=window.matchMedia("(prefers-color-scheme:light)");
    const handleChange=(e:MediaQueryListEvent)=>{
      setIsLight(e.matches);
    };
    mediaQuery.addEventListener("change",handleChange);
    setIsLight(mediaQuery.matches);
    return ()=>{
      aceEditorRef.current?.editor?.container.removeEventListener("paste",handlePaste);
      mediaQuery.removeEventListener("change",handleChange);
    }
  },[]);
  useEffect(()=>{
    aceEditorRef.current?.editor.setValue(item.content);
    aceEditorRef.current?.editor.clearSelection();
  },[item,updated]);
  return (
    <div className="speaks-item">
      <div className="speaks-item-topbar">
        <div className="speaks-item-mainbar" style={{display:editing?"none":"block"}}>
          <Button
            icon={<ComposeRegular/>}
            className="speaks-item-mainbar-editbtn"
            size="small"
            onClick={()=>{setEditing(true);setTimeout(()=>aceEditorRef.current?.editor.focus(),10)}}
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
        <div className="speaks-item-editbar" style={{display:editing?"flex":"none"}}>
          <Button
            icon={<CheckmarkRegular/>}
            size="small"
            style={{color:"green"}}
            title="保存"
            disabled={!saveEnable}
            onClick={()=>{
              const content=aceEditorRef.current?.editor.getValue();
              setEditing(false);
              saveHandler(content!);
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
          <span className="speaks-item-editbar-separator"/>
          <input
            type="file"
            accept={imageTypes.join(",")}
            style={{display:"none"}}
            ref={uploadImageInputRef}
            onChange={async (e)=>{
              const file=e.target.files?.[0];
              if(!file) return;
              const ur=await uploadWithTip(file);
              if(!ur) return;
              aceEditorRef.current?.editor.focus();
              aceEditorRef.current?.editor.insert(`<img src="${ur}"></img>`);
            }}
          />
          <Button
            icon={<ImageRegular/>}
            size="small"
            onClick={()=>{
              uploadImageInputRef.current?.click();
            }}
            title="上传图片"
          />
          <Button
            icon={<LinkRegular/>}
            size="small"
            onClick={()=>{
              if(aceEditorRef.current){
                const editor=aceEditorRef.current?.editor;
                editor.insert(`<a href="${editor.getSelectedText()}">链接</a>`);
                editor.focus();
                const cursorPosition=editor.getCursorPosition();
                editor.selection.moveCursorTo(cursorPosition.row,cursorPosition.column-8);
              }
            }}
            title="链接"
          />
          <Button
            icon={<TextBoldRegular/>}
            size="small"
            onClick={()=>{
              if(aceEditorRef.current){
                const editor=aceEditorRef.current?.editor;
                editor.insert(`<strong>${editor.getSelectedText()}</strong>`);
                editor.focus();
                const cursorPosition=editor.getCursorPosition();
                editor.selection.moveCursorTo(cursorPosition.row,cursorPosition.column-9);
              }
            }}
            title="粗体"
          />
          <Button
            icon={<TextItalicRegular/>}
            size="small"
            onClick={()=>{
              if(aceEditorRef.current){
                const editor=aceEditorRef.current?.editor;
                editor.insert(`<em>${editor.getSelectedText()}</em>`);
                editor.focus();
                const cursorPosition=editor.getCursorPosition();
                editor.selection.moveCursorTo(cursorPosition.row,cursorPosition.column-5);
              }
            }}
            title="斜体"
          />
          <Button
            icon={<TextStrikethroughRegular/>}
            size="small"
            onClick={()=>{
              if(aceEditorRef.current){
                const editor=aceEditorRef.current?.editor;
                editor.insert(`<del>${editor.getSelectedText()}</del>`);
                editor.focus();
                const cursorPosition=editor.getCursorPosition();
                editor.selection.moveCursorTo(cursorPosition.row,cursorPosition.column-6);
              }
            }}
            title="删除线"
          />
          <Button
            icon={<CodeRegular/>}
            size="small"
            onClick={()=>{
              if(aceEditorRef.current){
                const editor=aceEditorRef.current?.editor;
                editor.insert(`<code class="normal-inlinecode">${editor.getSelectedText()}</code>`);
                editor.focus();
                const cursorPosition=editor.getCursorPosition();
                editor.selection.moveCursorTo(cursorPosition.row,cursorPosition.column-7);
              }
            }}
            title="代码块"
          />
        </div>
      </div>
      <AceEditor
        mode="html"
        theme={isLight?"xcode":"one_dark"}
        className="speaks-item-editor"
        style={{display:editing?"block":"none"}}
        wrapEnabled={true}
        ref={aceEditorRef}
        onChange={value=>{
          setSaveEnable(!(value==item.content&&value.trim()));
        }}
        onLoad={editor=>{
          editor.setOption("indentedSoftWrap",false);
          editor.setValue(item.content);
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
              editor.scrollToLine(editor.getCursorPosition().row+1,true,true,()=>{});
            },
          });
          editor.container.addEventListener("paste",handlePaste);
          editor.onPaste=(_,e)=>{e.preventDefault()};
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
function NewBBItem({item,saveHandler,pasteHandler,uploadWithTip}:{item:BB,saveHandler:(content:string)=>void,pasteHandler:(editorRef:RefObject<AceEditor>,event:ClipboardEvent)=>void,uploadWithTip:(file:File)=>Promise<string>}){
  const [editing,setEditing]=useState(true);
  const [saveEnable,setSaveEnable]=useState(false);
  const aceEditorRef=useRef<AceEditor>(null);
  const saveButtonRef=useRef<HTMLButtonElement>(null);
  const handlePaste=(e:ClipboardEvent)=>{pasteHandler(aceEditorRef,e)};
  const uploadImageInputRef=useRef<HTMLInputElement>(null);
  const [isLight,setIsLight]=useState(true);
  useEffect(()=>{
    setTimeout(()=>aceEditorRef.current?.editor?.focus(),10);
    const mediaQuery=window.matchMedia("(prefers-color-scheme:light)");
    const handleChange=(e:MediaQueryListEvent)=>{
      setIsLight(e.matches);
    };
    mediaQuery.addEventListener("change",handleChange);
    setIsLight(mediaQuery.matches);
    return ()=>{
      mediaQuery.removeEventListener("change",handleChange);
      aceEditorRef.current?.editor?.container.removeEventListener("paste",handlePaste);
    }
  },[]);
  return (editing?
    <div className="speaks-item">
      <div className="speaks-item-topbar">
        <div className="speaks-item-editbar">
          <Button
            icon={<CheckmarkRegular/>}
            size="small"
            title="保存"
            style={{color:"green"}}
            disabled={!saveEnable}
            onClick={()=>{
              const content=aceEditorRef.current?.editor.getValue();
              setEditing(false);
              saveHandler(content!);
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
          <span className="speaks-item-editbar-separator"/>
          <input
            type="file"
            accept={imageTypes.join(",")}
            style={{display:"none"}}
            ref={uploadImageInputRef}
            onChange={async (e)=>{
              const file=e.target.files?.[0];
              if(!file) return;
              const ur=await uploadWithTip(file);
              if(!ur) return;
              aceEditorRef.current?.editor.focus();
              aceEditorRef.current?.editor.insert(`<img src="${ur}"></img>`);
            }}
          />
          <Button
            icon={<ImageRegular/>}
            size="small"
            onClick={()=>{
              uploadImageInputRef.current?.click();
            }}
            title="上传图片"
          />
          <Button
            icon={<LinkRegular/>}
            size="small"
            onClick={()=>{
              if(aceEditorRef.current){
                const editor=aceEditorRef.current?.editor;
                editor.insert(`<a href="${editor.getSelectedText()}">链接</a>`);
                editor.focus();
                const cursorPosition=editor.getCursorPosition();
                editor.selection.moveCursorTo(cursorPosition.row,cursorPosition.column-8);
              }
            }}
            title="链接"
          />
          <Button
            icon={<TextBoldRegular/>}
            size="small"
            onClick={()=>{
              if(aceEditorRef.current){
                const editor=aceEditorRef.current?.editor;
                editor.insert(`<strong>${editor.getSelectedText()}</strong>`);
                editor.focus();
                const cursorPosition=editor.getCursorPosition();
                editor.selection.moveCursorTo(cursorPosition.row,cursorPosition.column-9);
              }
            }}
            title="粗体"
          />
          <Button
            icon={<TextItalicRegular/>}
            size="small"
            onClick={()=>{
              if(aceEditorRef.current){
                const editor=aceEditorRef.current?.editor;
                editor.insert(`<em>${editor.getSelectedText()}</em>`);
                editor.focus();
                const cursorPosition=editor.getCursorPosition();
                editor.selection.moveCursorTo(cursorPosition.row,cursorPosition.column-5);
              }
            }}
            title="斜体"
          />
          <Button
            icon={<TextStrikethroughRegular/>}
            size="small"
            onClick={()=>{
              if(aceEditorRef.current){
                const editor=aceEditorRef.current?.editor;
                editor.insert(`<del>${editor.getSelectedText()}</del>`);
                editor.focus();
                const cursorPosition=editor.getCursorPosition();
                editor.selection.moveCursorTo(cursorPosition.row,cursorPosition.column-6);
              }
            }}
            title="删除线"
          />
          <Button
            icon={<CodeRegular/>}
            size="small"
            onClick={()=>{
              if(aceEditorRef.current){
                const editor=aceEditorRef.current?.editor;
                editor.insert(`<code class="normal-inlinecode">${editor.getSelectedText()}</code>`);
                editor.focus();
                const cursorPosition=editor.getCursorPosition();
                editor.selection.moveCursorTo(cursorPosition.row,cursorPosition.column-7);
              }
            }}
            title="代码块"
          />
        </div>
      </div>
      <AceEditor
        mode="html"
        theme={isLight?"xcode":"one_dark"}
        className="speaks-item-editor"
        wrapEnabled={true}
        ref={aceEditorRef}
        onChange={value=>{
          setSaveEnable(!(value==item.content&&value.trim()));
        }}
        onLoad={editor=>{
          editor.setOption("indentedSoftWrap",false);
          editor.setValue(item.content);
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
              editor.scrollToLine(editor.getCursorPosition().row+1,true,true,()=>{});
            },
          });
          editor.container.addEventListener("paste",handlePaste);
          editor.onPaste=(_,e)=>{e.preventDefault()};
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
  const uploadWithTip=async (file:File)=>{
    messageBarRef.current?.addMessage("提示","图片上传中... 坐和放宽","info");
    const ur=await uploadImage(file);
    if(ur){
      messageBarRef.current?.addMessage("提示","上传成功","success");
      return ur;
    }
    else{
      messageBarRef.current?.addMessage("提示","上传失败","error");
    }
    return "";
  }
  const pasteHandler=async (editorRef:RefObject<AceEditor>,event:ClipboardEvent)=>{
    event.preventDefault();
    navigator.clipboard.read().then(async (res)=>{
      const currentType=imageTypes.find(type=>res[0].types.includes(type))
      console.log(res[0].types)
      if(currentType){
        const file=new File([await res[0].getType(currentType)],`file.${mime.getExtension(currentType)}`);
        const ur=await uploadWithTip(file);
        if(ur) editorRef.current?.editor.insert(`<img src="${ur}"></img>`);
      }
      else if(res[0].types.includes("text/plain")){
        const text=await (await res[0].getType("text/plain")).text();
        if(((text.startsWith("https://")||text.startsWith("http://"))&&!text.startsWith("https://bu.dusays.com"))){
          if((text.endsWith(".jpg")||text.endsWith(".png")||text.endsWith(".jpeg")||text.endsWith(".gif")||text.endsWith(".webp"))){
            const tr=await fetch(text);
            messageBarRef.current?.addMessage("提示","尝试读取图片...","info");
            if(tr.ok){
              const file=new File([await tr.blob()],`file.${text.split(".")[text.split(".").length-1]}`);
              messageBarRef.current?.addMessage("提示","图片上传中... 坐和放宽","info");
              const ur=await uploadImage(file);
              if(ur){
                editorRef.current?.editor.insert(`<img src="${ur}"></img>`);
                messageBarRef.current?.addMessage("提示","上传成功","success");
              }
              else{
                messageBarRef.current?.addMessage("提示","上传失败","error");
              }
            }
            else{
              editorRef.current?.editor.insert(`<a href="${text}">链接</a>`);
            }
          }
          else{
            editorRef.current?.editor.insert(`<a href="${text}">链接</a>`);
          }
        }
        else{
          editorRef.current?.editor.insert(text);
        }
      }
    });
  }
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
    import('ace-builds/src-noconflict/theme-one_dark');
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
        return <BBItem item={item} deleteHandler={deleteHandler} saveHandler={saveHandler} pasteHandler={pasteHandler} uploadWithTip={uploadWithTip} updated={updated}/>;
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
            setBBContent([<NewBBItem saveHandler={saveHandler} item={item} pasteHandler={pasteHandler} uploadWithTip={uploadWithTip}/>,...bbContent])
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