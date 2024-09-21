"use client";
import { config } from "@/dashboardConfig";
import { useEffect,useState,useRef } from "react";
import "@/styles/posts.scss";
import { useSearchParams } from "next/navigation";
import {
  Add16Filled,
  Archive16Filled,
  ArrowSync16Filled,
  Calendar16Filled,
  Compose16Filled,
  Document20Filled,
  Markdown20Filled,
  Settings16Filled,
  MarkdownRegular,
  DeleteRegular,
  ComposeRegular,
  DocumentRegular,
} from "@fluentui/react-icons";
import {
  Button,
  Label,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  useTableFeatures,
  TableColumnDefinition,
  useTableSort,
  TableColumnId,
  createTableColumn,
  SearchBox,
} from "@fluentui/react-components";
import Messages from "@/components/Messages";
import Link from "next/link";
import { Post } from "@/interfaces/post";
import moment from "moment";
import { BaseDialog,BaseDialogProps, EditPostDialog, EditPostDialogProps } from "@/components/Dialog";
import { addDraft, addPost, getDraftBySlug, getPostBySlug, removeDraft, removePost, updateDraftInfo, updateDraftMarkdown, updatePostInfo, updatePostMarkdown } from "@/utils/posts";
import { useRouter } from "nextjs-toploader/app";
import stringRandom from "string-random";

const columns:TableColumnDefinition<Post>[]=[
  createTableColumn<Post>({
    columnId:'title',
    compare:(a,b)=>a.title!.localeCompare(b.title!),
  }),
  createTableColumn<Post>({
    columnId:'lastUpdatedTime',
    compare:(a,b)=>a.lastUpdatedTime!-b.lastUpdatedTime!,
  }),
  createTableColumn<Post>({
    columnId:'publishTime',
    compare:(a,b)=>a.publishTime!-b.publishTime!,
  }),
  createTableColumn<Post>({
    columnId:'category',
    compare:(a,b)=>a.category!.localeCompare(b.category!),
  }),
];

export default function Drafts(){
  const [postCount,setPostCount]=useState<number>(-1);
  const [posts,setPosts]=useState<Post[]>([]);
  const [updated,setUpdated]=useState<number>(0);
  const searchParams=useSearchParams();
  const page=searchParams.get("page")?parseInt(searchParams.get("page")!):1;
  const query=searchParams.get("query")??"";
  const maxPage=Math.ceil(postCount/20);
  const messageBarRef=useRef<any>(null);
  const router=useRouter();
  const [dialogState,setDialogState]=useState<BaseDialogProps>({
    title:"",
    content:<></>,
    onConfirm:()=>{},
    onClose:()=>{},
    open:false,
  });
  const [editPostDialogState,setEditPostDialogState]=useState<EditPostDialogProps>({
    title:"",
    post:{},
    onConfirm:()=>{},
    onClose:()=>{},
    open:false,
  });
  const {getRows,sort:{getSortDirection,toggleColumnSort,sort}}=useTableFeatures(
    {columns,items:posts},
    [useTableSort({defaultSortState:{sortColumn:'publishTime',sortDirection:'descending'}})]
  );
  const headerSortProps=(columnId:TableColumnId)=>({
    onClick:(e:React.MouseEvent)=>toggleColumnSort(e,columnId),
    sortDirection:getSortDirection(columnId),
  });
  const rows=sort(getRows());
  useEffect(()=>{
    (async ()=>{
      const postCountRes=await fetch(`${config.backEndUrl}/get/draft/searchDraftsByTitleCount?title=${query}`,{headers:{"Authorization":`Bearer ${localStorage.getItem('token')}`}});
      if(postCountRes.ok) setPostCount((await postCountRes.json()).count);
      const startl=(page-1)*20,endl=page*20;
      const postsRes=await fetch(`${config.backEndUrl}/get/draft/searchDraftsByTitle?startl=${startl}&endl=${endl}&title=${query}`,{headers:{"Authorization":`Bearer ${localStorage.getItem('token')}`}});
      if(postsRes.ok) setPosts((await postsRes.json()).data);
    })();
  },[page,updated,query]);
  return (
    <>
      <h2>草稿箱</h2>
      <SearchBox placeholder="搜索..." onKeyDown={
        (e)=>{
          if(e.key=="Enter"){
            e.preventDefault();
            if(e.currentTarget.value.trim()!=query)
              router.push(`/admin/drafts/?query=${e.currentTarget.value.trim()}&page=1`);
          }
        }
      }/>
      <div id="posts-topbar">
        <div id="posts-topbar-count">
          <Document20Filled/>
          <Label size="large">{postCount==-1?"...":postCount} 篇草稿</Label>
        </div>
        <div id="posts-topbar-actions">
          <Button appearance="secondary" icon={<ArrowSync16Filled/>} onClick={()=>{setPosts([]);setUpdated(updated+1);}}>刷新列表</Button>
          <Button 
            appearance="primary" 
            icon={<Add16Filled/>}
            onClick={()=>{
              setEditPostDialogState({
                open:true,
                title:"新建文章",
                post:{
                  title:"新文章",
                  mdContent:"",
                  slug:stringRandom(8,{letters:"abcdef"}),
                  tags:[],
                  category:"",
                  bannerImg:"",
                  publishTime:moment().unix(),
                  lastUpdatedTime:moment().unix(),
                  description:"",
                  coverFit:""
                },
                onClose:()=>{
                  setEditPostDialogState({
                    ...editPostDialogState,
                    open:false,
                  });
                },
                onConfirm:async (res)=>{
                  setEditPostDialogState({
                    ...editPostDialogState,
                    open:false,
                  });
                  const success=()=>{
                    messageBarRef.current?.addMessage(
                      "提示","新建成功","success"
                    );
                    setTimeout(()=>router.push(`/admin/posts/edit?slug=${res.slug}&type=draft`),1000)
                  }
                  const failed=()=>{
                    messageBarRef.current?.addMessage(
                      "提示","新建失败","error"
                    );
                  }
                  if(await addDraft(res)){
                    success();
                  }
                  else failed();
                }
              })
            }}
          >
            新建文章
          </Button>
        </div>
      </div>
      <div id="posts-list">
        <Table sortable aria-label="草稿列表">
          <TableHeader>
            <TableRow>
              <TableHeaderCell {...headerSortProps('title')}><Markdown20Filled/>标题</TableHeaderCell>
              <TableHeaderCell {...headerSortProps('lastUpdatedTime')}><Compose16Filled/>上次更新</TableHeaderCell>
              <TableHeaderCell {...headerSortProps('publishTime')}><Calendar16Filled/>创建日期</TableHeaderCell>
              <TableHeaderCell {...headerSortProps('category')}><Archive16Filled/>分类</TableHeaderCell>
              <TableHeaderCell><Settings16Filled/>操作</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({item:post})=>(
              <TableRow key={post.slug}>
                <TableCell>
                  <TableCellLayout>
                    <Link 
                      href={`/admin/posts/edit?slug=${post.slug}&type=draft`} 
                      className="posts-list-item-title"
                      dangerouslySetInnerHTML={{
                          __html: post.title!.replace(eval(`/${query}/gi`),
                            (q)=>`<span style="font-weight:900;background:linear-gradient(rgba(255, 51, 184, 0.3), rgba(255, 51, 184, 0.3)) no-repeat bottom / 100% 30%;">${q}</span>`)
                        }
                      }
                    />
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    {moment.unix(post.lastUpdatedTime!).format('YYYY-MM-DD')}
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    {moment.unix(post.publishTime!).format('YYYY-MM-DD')}
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>{post.category}</TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    <Button 
                      size="small" 
                      icon={<MarkdownRegular/>} 
                      title="进入编辑页"
                      onClick={
                        ()=>{
                          router.push(`/admin/posts/edit/?slug=${post.slug}&type=draft`)
                        }
                      }
                    />
                    <Button 
                      size="small" 
                      icon={<ComposeRegular/>} 
                      title="修改草稿属性"
                      onClick={
                        ()=>{
                          setEditPostDialogState({
                            open:true,
                            title:"修改草稿属性",
                            post:post,
                            onClose:()=>{
                              setEditPostDialogState({
                                ...editPostDialogState,
                                open:false
                              });
                            },
                            onConfirm:(postn:Post)=>{
                              setEditPostDialogState({
                                ...editPostDialogState,
                                open:false
                              });
                              if(postn!=post)
                                updateDraftInfo(postn).then((res)=>{
                                  if(res){
                                    messageBarRef.current?.addMessage("提示","修改成功","success");
                                    setUpdated(updated+1);
                                  }
                                  else messageBarRef.current?.addMessage("提示","修改失败","error");
                                });
                            }
                          })
                        }
                      }
                    />
                    <Button 
                      size="small"
                      icon={<DocumentRegular/>}
                      title="正式发布"
                      style={{color:"orange"}}
                      onClick={()=>{
                        setDialogState({
                          title:"提示",
                          content:"确定将此文章发布吗？",
                          open:true,
                          onConfirm:async ()=>{
                            setDialogState({
                              ...dialogState,
                              open:false,
                            });
                            const failed=()=>{
                              messageBarRef.current?.addMessage(
                                "提示","发布失败","error",
                              );
                            }
                            const success=()=>{
                              messageBarRef.current?.addMessage(
                                "提示","发布成功","success",
                              );
                              setTimeout(()=>router.push("/admin/posts"),1000);
                            }
                            const mdContent=(await getDraftBySlug(post.slug!)).mdContent;
                            if(await addPost(post)){
                              if(await updatePostMarkdown(mdContent!,post.slug!)){
                                if(await removeDraft(post.slug!)){
                                  success();
                                }
                                else failed();
                              }
                              else failed();
                            }
                            else{
                              const overwritePost=await getPostBySlug(post.slug!);
                              if(overwritePost){
                                setDialogState({
                                  open:true,
                                  title:"提示",
                                  content:<>存在相同编号的正式文章，是否覆盖？<br/><strong>{overwritePost.title}</strong></>,
                                  onConfirm:async ()=>{
                                    setDialogState({
                                      ...dialogState,
                                      open:false
                                    });
                                    if(await updatePostInfo(post)){
                                      if(await updatePostMarkdown(mdContent!,post.slug!)){
                                        if(await removeDraft(post.slug!)){
                                          success();
                                        }
                                        else failed();
                                      }
                                      else failed();
                                    }
                                    else failed();
                                  },
                                  onClose:()=>{
                                    setDialogState({
                                      ...dialogState,
                                      open:false
                                    });
                                  }
                                });
                              }
                              else failed();
                            }
                          },
                          onClose:()=>{
                            setDialogState({
                              ...dialogState,
                              open:false,
                            });
                          }
                        })
                      }}
                    />
                    <Button 
                      size="small" 
                      icon={<DeleteRegular/>}
                      title="删除草稿"
                      color="danger"
                      style={{color:"red"}}
                      onClick={()=>{
                        setDialogState({
                          open:true,
                          title:"删除草稿",
                          content:<>确定要删除这篇草稿吗？<br/><strong>{post.title}</strong></>,
                          onConfirm:()=>{
                            setDialogState({
                              open:true,
                              title:"二次确认",
                              content:<>确定要删除这篇草稿吗？<br/><strong>{post.title}</strong><br/><br/><br/>草稿将被永久删除（真的很久！！！）</>,
                              onConfirm:()=>{
                                setDialogState({
                                  ...dialogState,
                                  open:false
                                });
                                removeDraft(post.slug!).then((e)=>{
                                  if(e){
                                    messageBarRef.current?.addMessage(
                                      "提示","删除成功","success"
                                    );
                                    setUpdated(updated+1);
                                  }
                                  else{
                                    messageBarRef.current?.addMessage(
                                      "错误","删除失败","error"
                                    );
                                  }
                                })
                              },
                              onClose:()=>{
                                setDialogState({
                                  ...dialogState,
                                  open:false
                                });
                              }
                            });
                          },
                          onClose:()=>{
                            setDialogState({
                              ...dialogState,
                              open:false
                            });
                          }
                        });
                      }}
                    />
                  </TableCellLayout>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div id="posts-pagination">
        {page-2>0?<Link className="posts-pagination-pgbtn" href={`/admin/drafts?page=1&query=${query}`}>
          <Button appearance="secondary" shape="circular">1</Button>
        </Link>:<></>}
        {page-3>0?<Label className="posts-pagination-spec">...</Label>:<></>}
        {page-1>0?<Link className="posts-pagination-pgbtn" href={`/admin/drafts?page=${page-1}&query=${query}`}>
          <Button appearance="secondary" shape="circular">{page-1}</Button>
        </Link>:<></>}
        <Link className="posts-pagination-pgbtn current" href={`/admin/drafts?page=${page}&query=${query}`}>
          <Button appearance="primary" shape="circular">{page}</Button>
        </Link>
        {page+1<=maxPage?<Link className="posts-pagination-pgbtn" href={`/admin/drafts?page=${page+1}&query=${query}`}>
          <Button appearance="secondary" shape="circular">{page+1}</Button>
        </Link>:<></>}
        {page+3<=maxPage?<Label className="posts-pagination-spec">...</Label>:<></>}
        {page+2<=maxPage?<Link className="posts-pagination-pgbtn" href={`/admin/drafts?page=${maxPage}&query=${query}`}>
          <Button appearance="secondary" shape="circular">{maxPage}</Button>
        </Link>:<></>}
        <Label id="posts-pagination-text">{`20 条/页 共 ${postCount} 条`}</Label>
      </div>
      <BaseDialog {...dialogState}/>
      <EditPostDialog {...editPostDialogState} updated={updated}/>
      <Messages ref={messageBarRef}/>
    </>
  );
}
