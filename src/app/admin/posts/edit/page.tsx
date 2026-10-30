"use client";
import { useEffect, useState, useRef, RefObject } from "react";
import "@/styles/edit.scss";
import { useSearchParams } from "next/navigation";
import Messages, { MessagesRef } from "@/components/Messages";
import {
  BaseDialog,
  BaseDialogProps,
  EditPostDialog,
  EditPostDialogProps,
} from "@/components/Dialog";
import { useRouter } from "nextjs-toploader/app";
import { Button, Label } from "@fluentui/react-components";
import {
  ArrowUploadRegular,
  ChevronLeftRegular,
  Edit16Regular,
  SaveFilled,
  SaveRegular,
} from "@fluentui/react-icons";
import { Post } from "@/interfaces/post";
import {
  addDraft,
  addPost,
  getDraftBySlug,
  getPostBySlug,
  removeDraft,
  updateDraftInfo,
  updateDraftMarkdown,
  updatePostInfo,
  updatePostMarkdown,
} from "@/utils/posts";
import { config } from "@/dashboardConfig";
import Vditor from "@/components/Vditor";
import moment from "moment";
import React from "react";

export default function Edit() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const slug = searchParams.get("slug");
  const messageBarRef = useRef<MessagesRef>(null);
  const router = useRouter();
  const [dialogState, setDialogState] = useState<BaseDialogProps>({
    title: "",
    content: <></>,
    onConfirm: () => {},
    onClose: () => {},
    open: false,
  });
  const [editPostDialogState, setEditPostDialogState] =
    useState<EditPostDialogProps>({
      title: "",
      post: {},
      onConfirm: () => {},
      onClose: () => {},
      open: false,
    });
  const [currentPostInfo, setCurrentPostInfo] = useState<Post>({});
  // currentPostInfo 属于哪一篇。只有两者都对上，才把正文交给编辑器，
  // 否则切换文章的同一帧里编辑器会先拿到上一篇的内容并被当成「已载入」。
  const [loadedKey, setLoadedKey] = useState("");
  const [saving, setSaving] = useState(false);
  // 有未保存的正文改动时，标题栏显示 * 提示
  const [dirty, setDirty] = useState(false);
  const [saveAsing, setSaveAsing] = useState(false);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const vditorRef = useRef<{ getMarkdown: () => string }>(null);
  // 当前编辑器里是哪一篇。切换文章/类型时编辑器整体重建，不靠 props 覆写内容
  const docKey = `${type ?? ""}:${slug ?? ""}`;
  const loaded = loadedKey === docKey;
  // 请求回来时用来确认还停在原来那篇，避免把上一篇的 meta 写进刚切过来的文章
  const docKeyRef = useRef(docKey);
  docKeyRef.current = docKey;
  useEffect(() => {
    let alive = true;
    setLoadedKey("");
    setDirty(false);
    if (slug) {
      const loading =
        type == "post" ? getPostBySlug(slug) : getDraftBySlug(slug);
      loading.then((res) => {
        if (!alive) return;
        setCurrentPostInfo(res);
        setLoadedKey(docKey);
      });
    }
    const saveHandler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key == "s") {
        e.preventDefault();
        saveButtonRef.current?.click();
      }
    };
    const quitHandler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      return "确实要退出吗？请确认是否已经保存到 Internet 内部微软边缘集线器，然后坐和放宽";
    };
    window.addEventListener("keydown", saveHandler);
    window.addEventListener("beforeunload", quitHandler);
    return () => {
      alive = false;
      window.removeEventListener("keydown", saveHandler);
      window.removeEventListener("beforeunload", quitHandler);
    };
  }, [type, slug]);
  return (
    <>
      <h2>编辑文章</h2>
      <div id="editpost-topbar">
        <Button
          id="editpost-topbar-back"
          icon={<ChevronLeftRegular />}
          onClick={() =>
            type == "post"
              ? router.push("/admin/posts")
              : router.push("/admin/drafts")
          }
        >
          返回
        </Button>
        <div id="editpost-topbar-save">
          <Button
            icon={<SaveFilled />}
            appearance="primary"
            ref={saveButtonRef}
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              const failed = () => {
                messageBarRef.current?.addMessage("提示", "保存失败", "error");
              };
              const success = () => {
                messageBarRef.current?.addMessage(
                  "提示",
                  "保存成功",
                  "success"
                );
              };
              const markdown = vditorRef.current?.getMarkdown() ?? "";
              // 保存期间可能已经切走，回包只对原来那篇生效
              const targetKey = docKey;
              if (type == "post") {
                if (await updatePostMarkdown(markdown, slug!)) {
                  const newTime = moment().unix();
                  if (
                    await updatePostInfo({
                      ...currentPostInfo,
                      lastUpdatedTime: newTime,
                    })
                  ) {
                    success();
                    if (docKeyRef.current === targetKey) {
                      setCurrentPostInfo((prev) => ({
                        ...prev,
                        mdContent: markdown,
                        lastUpdatedTime: newTime,
                      }));
                      setDirty(false);
                    }
                  } else failed();
                } else {
                  failed();
                }
              } else if (type == "draft") {
                if (await updateDraftMarkdown(markdown, slug!)) {
                  const newTime = moment().unix();
                  if (
                    await updateDraftInfo({
                      ...currentPostInfo,
                      lastUpdatedTime: newTime,
                    })
                  ) {
                    success();
                    if (docKeyRef.current === targetKey) {
                      setCurrentPostInfo((prev) => ({
                        ...prev,
                        mdContent: markdown,
                        lastUpdatedTime: newTime,
                      }));
                      setDirty(false);
                    }
                  } else failed();
                } else {
                  failed();
                }
              }
              setSaving(false);
            }}
          >
            {saving ? "保存中..." : "保存"}
          </Button>
          <Button
            icon={type == "post" ? <SaveRegular /> : <ArrowUploadRegular />}
            disabled={saveAsing}
            onClick={async () => {
              setSaveAsing(true);
              const failed = () => {
                messageBarRef.current?.addMessage(
                  "提示",
                  type == "post" ? "另存失败" : "发布失败",
                  "error"
                );
              };
              const success = () => {
                messageBarRef.current?.addMessage(
                  "提示",
                  type == "post" ? "另存成功" : "发布成功",
                  "success"
                );
                setTimeout(
                  () =>
                    router.push(
                      `/admin/posts/edit?slug=${slug}&type=${
                        type == "post" ? "draft" : "post"
                      }`
                    ),
                  1000
                );
              };
              if (type == "post") {
                if (
                  await addDraft({
                    ...currentPostInfo,
                    lastUpdatedTime: moment().unix(),
                  })
                ) {
                  if (
                    await updateDraftMarkdown(
                      vditorRef?.current?.getMarkdown()!,
                      slug!
                    )
                  ) {
                    success();
                  } else failed();
                } else {
                  const overwritePost = await getDraftBySlug(slug!);
                  if (overwritePost) {
                    setDialogState({
                      open: true,
                      title: "提示",
                      content: (
                        <>
                          存在相同编号的草稿文章，是否覆盖？
                          <br />
                          <strong>{overwritePost.title}</strong>
                        </>
                      ),
                      onConfirm: async () => {
                        setDialogState({
                          ...dialogState,
                          open: false,
                        });
                        if (
                          await updateDraftInfo({
                            ...currentPostInfo,
                            lastUpdatedTime: moment().unix(),
                          })
                        ) {
                          if (
                            await updateDraftMarkdown(
                              vditorRef?.current?.getMarkdown()!,
                              slug!
                            )
                          ) {
                            success();
                          } else failed();
                        } else failed();
                      },
                      onClose: () => {
                        setDialogState({
                          ...dialogState,
                          open: false,
                        });
                      },
                    });
                  } else failed();
                }
              } else {
                if (
                  await addPost({
                    ...currentPostInfo,
                    lastUpdatedTime: moment().unix(),
                  })
                ) {
                  if (
                    await updatePostMarkdown(
                      vditorRef?.current?.getMarkdown()!,
                      slug!
                    )
                  ) {
                    success();
                  } else failed();
                } else {
                  const overwritePost = await getPostBySlug(slug!);
                  if (overwritePost) {
                    setDialogState({
                      open: true,
                      title: "提示",
                      content: (
                        <>
                          存在相同编号的发布文章，是否覆盖？
                          <br />
                          <strong>{overwritePost.title}</strong>
                        </>
                      ),
                      onConfirm: async () => {
                        setDialogState({
                          ...dialogState,
                          open: false,
                        });
                        if (
                          await updatePostInfo({
                            ...currentPostInfo,
                            lastUpdatedTime: moment().unix(),
                          })
                        ) {
                          if (
                            await updatePostMarkdown(
                              vditorRef?.current?.getMarkdown()!,
                              slug!
                            )
                          ) {
                            if (await removeDraft(slug!)) success();
                            else failed();
                          } else failed();
                        } else failed();
                      },
                      onClose: () => {
                        setDialogState({
                          ...dialogState,
                          open: false,
                        });
                      },
                    });
                  } else failed();
                }
              }
              setSaveAsing(false);
            }}
          >
            {type == "post"
              ? saveAsing
                ? "另存中..."
                : "另存为草稿"
              : saveAsing
              ? "发布中..."
              : "发布文章"}
          </Button>
        </div>
      </div>
      <div id="editpost-main">
        {loaded && currentPostInfo.title ? (
          <>
            <div id="editpost-main-topline">
              <Label id="editpost-main-title">{currentPostInfo.title}</Label>
              <Label id="editpost-main-slug">
                {dirty && "*"}
                {type == "post" ? "已发布 " : "草稿 "}
                {type == "post" ? (
                  <a
                    href={`${config.blogUrl}/posts/${currentPostInfo.slug}`}
                    title="查看原站文章"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {currentPostInfo.slug}
                  </a>
                ) : (
                  currentPostInfo.slug
                )}
              </Label>
              <Button
                id="editpost-main-editinfo"
                size="small"
                icon={<Edit16Regular />}
                title={`编辑${type == "post" ? "文章" : "草稿"}信息`}
                onClick={() => {
                  setEditPostDialogState({
                    open: true,
                    title: `修改${type == "post" ? "文章" : "草稿"}属性`,
                    post: currentPostInfo,
                    onClose: () => {
                      setEditPostDialogState({
                        ...editPostDialogState,
                        open: false,
                      });
                    },
                    onConfirm: (postn: Post) => {
                      setEditPostDialogState({
                        ...editPostDialogState,
                        open: false,
                      });
                      // 只把 meta 写回本地状态，不再重新拉整篇：
                      // 旧实现靠 setUpdated 触发重取，重取回来的 mdContent 会覆盖编辑器，
                      // 正在编辑、尚未保存的正文就被强制回滚了。
                      const targetKey = docKey;
                      const savingInfo =
                        type == "post"
                          ? updatePostInfo(postn)
                          : updateDraftInfo(postn);
                      savingInfo.then((res) => {
                        if (res) {
                          messageBarRef.current?.addMessage(
                            "提示",
                            "修改成功",
                            "success"
                          );
                          if (docKeyRef.current !== targetKey) return;
                          setCurrentPostInfo((prev) => ({
                            ...prev,
                            ...postn,
                            // 正文以编辑器/本地为准，meta 保存不碰它
                            mdContent: prev.mdContent,
                            // 时间用弹窗里手填的值；没填就保持原样，不偷偷改成“现在”
                            publishTime: postn.publishTime ?? prev.publishTime,
                            lastUpdatedTime:
                              postn.lastUpdatedTime ?? prev.lastUpdatedTime,
                          }));
                        } else
                          messageBarRef.current?.addMessage(
                            "提示",
                            "修改失败",
                            "error"
                          );
                      });
                    },
                  });
                }}
              />
              <Label id="editpost-main-lastsave">
                上次保存：
                {currentPostInfo.lastUpdatedTime
                  ? moment
                      .unix(currentPostInfo.lastUpdatedTime)
                      .format("MM-DD HH:mm:ss")
                  : "未保存"}
              </Label>
            </div>
          </>
        ) : (
          <>加载中...</>
        )}
        <Vditor
          // 换文章/换类型时重建编辑器，正文由新的 key 重新挂载写入；
          // 同一篇内（改 meta、保存）绝不重建，避免覆盖未保存的正文
          key={docKey}
          // 数据还没对上当前文章时不给正文，防止把上一篇写进新编辑器
          content={loaded ? currentPostInfo.mdContent : undefined}
          onChange={() => setDirty(true)}
          ref={vditorRef}
        />
      </div>
      <Messages ref={messageBarRef} />
      <BaseDialog {...dialogState} />
      {/* 共用编辑页只有正式文章可读取、生成摘要，草稿不展示摘要区块。 */}
      <EditPostDialog {...editPostDialogState} allowSummary={type === "post"} />
    </>
  );
}
