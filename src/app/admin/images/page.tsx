"use client";
import { useEffect, useRef, useState } from "react";
import "@/styles/images.scss";
import {
  ArrowClockwiseRegular,
  ArrowExitRegular,
  DocumentArrowUpRegular,
  ClipboardLinkRegular,
  DeleteRegular,
  MultiselectLtrRegular,
  CopyRegular,
  ArrowUploadRegular,
} from "@fluentui/react-icons";
import Messages, { MessagesRef } from "@/components/Messages";
import { BaseDialog, BaseDialogProps } from "@/components/Dialog";
import {
  uploadImage,
  listImages,
  deleteImage,
  reuploadImage,
} from "@/utils/image";
import React from "react";
import LazyLoad from "vanilla-lazyload";
import {
  Button,
  Link,
  Checkbox,
  ProgressBar,
} from "@fluentui/react-components";
import '@fancyapps/ui/dist/fancybox/fancybox.css';
import { Fancybox } from '@fancyapps/ui';

const imageTypes = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/jpg",
];

const PAGE_SIZE = 30;

type UploadQueueItem = {
  id: string;
  name: string;
  progress: number;
  status: string;
  url?: string;
};

export default function Page() {
  const [allImages, setAllImages] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [cols, setCols] = useState(1);
  const messageBarRef = useRef<MessagesRef>(null);
  const [dialogState, setDialogState] = useState<BaseDialogProps>({
    title: "",
    content: <></>,
    onConfirm: () => {},
    onClose: () => {},
    open: false,
  });
  const uploadImageInputRef = useRef<HTMLInputElement>(null);
  const reuploadInputRef = useRef<HTMLInputElement>(null);
  const [reuploadTarget, setReuploadTarget] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);

  // 加载全部图片列表
  const refreshImages = async () => {
    const imgs = await listImages();
    setAllImages(imgs);
    setPage(1);
    setImages(imgs.slice(0, PAGE_SIZE));
  };

  // 加载下一页
  const loadMore = () => {
    const nextPage = page + 1;
    const nextImages = allImages.slice(0, nextPage * PAGE_SIZE);
    setImages(nextImages);
    setPage(nextPage);
  };

  // 监听滚动到底部
  useEffect(() => {
    const onScroll = () => {
      const el = document.getElementById("images-list");
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        // 已到底部，且还有未加载的图片
        if (images.length < allImages.length) {
          loadMore();
        }
      }
    };
    const el = document.getElementById("images-list");
    if (el) el.addEventListener("scroll", onScroll);
    return () => {
      if (el) el.removeEventListener("scroll", onScroll);
    };
  }, [images, allImages, page]);

  useEffect(() => {
    refreshImages();
    const resizeHandler = () => {
      const width = document.documentElement.clientWidth;
      if (width < 600) setCols(2);
      else if (width < 900) setCols(4);
      else setCols(6);
    };
    window.addEventListener("resize", resizeHandler);
    import("wc-waterfall");
    resizeHandler();
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  // 懒加载
  useEffect(() => {
    const lazyLoadInstance = new LazyLoad({ elements_selector: ".lazy-img" });
    lazyLoadInstance.update();
  }, [images]);

  const tryFillScreen = () => {
    setTimeout(() => {
      const listEl = document.getElementById("images-list");
      const wfEl = document.getElementById("images-waterfall");
      if (listEl && wfEl && images.length < allImages.length) {
        if (wfEl.offsetHeight < listEl.offsetHeight) {
          loadMore();
        }
      }
    }, 100); // 等待 DOM 渲染
  };

  useEffect(() => {
    tryFillScreen();
  }, [images, allImages]);

  useEffect(() => {
    setLoadedCount(0); // 每次 images 变化时重置计数
  }, [images]);

  useEffect(() => {
    if (loadedCount === images.length && images.length > 0) {
      tryFillScreen();
    }
  }, [loadedCount, images.length]);

  // 批量删除
  const handleBatchDelete = () => {
    setDialogState({
      open: true,
      title: "批量删除图片",
      content: (
        <div>
          确定要删除以下 {selectedImages.length} 张图片吗？
          <br />
          <div style={{ maxHeight: 200, overflow: "auto" }}>
            {selectedImages.map((img) => (
              <div key={img} style={{ fontSize: 12, wordBreak: "break-all" }}>
                {img}
              </div>
            ))}
          </div>
        </div>
      ),
      onConfirm: async () => {
        setDialogState({ ...dialogState, open: false });
        let success = 0;
        for (const img of selectedImages) {
          if (await deleteImage(img)) success++;
        }
        messageBarRef.current?.addMessage(
          "提示",
          `成功删除 ${success} 张图片`,
          "success"
        );
        setSelectedImages([]);
        setSelectMode(false);
        await refreshImages();
      },
      onClose: () => setDialogState({ ...dialogState, open: false }),
    });
  };

  // 上传图片队列处理
  const handleUploadFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    // 新文件加入队列
    setUploadQueue((q) => [
      ...q,
      ...fileArr.map((file) => ({
        id: Math.random().toString(36).slice(2),
        name: file.name,
        progress: 0,
        status: "pending",
      })),
    ]);
    // 逐个上传
    for (const file of fileArr) {
      const id = Math.random().toString(36).slice(2);
      setUploadQueue((q) =>
        q.map((item) =>
          item.name === file.name && item.status === "pending"
            ? { ...item, status: "uploading", progress: 0, id }
            : item
        )
      );
      // 假进度条
      let fakeProgress = 0;
      const timer = setInterval(() => {
        fakeProgress += Math.random() * 20;
        setUploadQueue((q) =>
          q.map((item) =>
            item.id === id && item.status === "uploading"
              ? { ...item, progress: Math.min(95, fakeProgress) }
              : item
          )
        );
      }, 200);

      let url = "";
      try {
        url = await uploadImage(file);
        clearInterval(timer);
        setUploadQueue((q) =>
          q.map((item) =>
            item.id === id
              ? {
                  ...item,
                  progress: 100,
                  status: url ? "success" : "error",
                  url: url || undefined,
                }
              : item
          )
        );
      } catch {
        clearInterval(timer);
        setUploadQueue((q) =>
          q.map((item) =>
            item.id === id ? { ...item, progress: 100, status: "error" } : item
          )
        );
      }
    }
    await refreshImages();
  };

  useEffect(() => {
    Fancybox.bind('[data-fancybox="gallery"]', {
      groupAll: true,
      dragToClose: false,
    });
    return () => {
      Fancybox.unbind('[data-fancybox="gallery"]');
    };
  }, [images]);

  return (
    <>
      <h2>图床</h2>
      <div
        id="images-topbar"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUploadFiles(e.dataTransfer.files);
          }
        }}
      >
        {/* 非选择模式下显示批量选择按钮和其它操作 */}
        {!selectMode && (
          <>
            <input
              type="file"
              accept={imageTypes.join(",")}
              multiple
              style={{ display: "none" }}
              ref={uploadImageInputRef}
              onChange={async (e) => {
                if (e.target.files && e.target.files.length > 0) {
                  await handleUploadFiles(e.target.files);
                  uploadImageInputRef.current!.value = "";
                }
              }}
            />
            <Button
              icon={<ArrowUploadRegular />}
              appearance="primary"
              onClick={() => uploadImageInputRef.current?.click()}
            >
              上传图片
            </Button>
            <Button
              icon={<ArrowClockwiseRegular />}
              appearance="secondary"
              onClick={refreshImages}
            >
              刷新列表
            </Button>
            <Button
              icon={<MultiselectLtrRegular />}
              appearance="secondary"
              style={{ marginLeft: "auto" }}
              onClick={() => {
                setSelectMode(true);
                setSelectedImages([]);
              }}
            >
              批量选择
            </Button>
          </>
        )}
        {/* 选择模式下只显示批量删除和退出选择 */}
        {selectMode && (
          <>
            <Button
              icon={<DeleteRegular />}
              appearance="primary"
              disabled={selectedImages.length === 0}
              style={{ marginLeft: "auto" }}
              onClick={handleBatchDelete}
            >
              批量删除 ({selectedImages.length})
            </Button>
            <Button
              icon={<ArrowExitRegular />}
              appearance="secondary"
              style={{ marginLeft: 8 }}
              onClick={() => {
                setSelectMode(false);
                setSelectedImages([]);
              }}
            >
              退出选择
            </Button>
          </>
        )}
      </div>
      <input
        type="file"
        accept={imageTypes.join(",")}
        style={{ display: "none" }}
        ref={reuploadInputRef}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file || !reuploadTarget) return;
          messageBarRef.current?.addMessage("提示", "重新上传中...", "info");
          const url = await reuploadImage(reuploadTarget, file);
          setReuploadTarget(null);
          reuploadInputRef.current!.value = "";
          if (url) {
            messageBarRef.current?.addMessage(
              "提示",
              "重新上传成功",
              "success"
            );
            await refreshImages();
          } else {
            messageBarRef.current?.addMessage("错误", "重新上传失败", "error");
          }
        }}
      />
      {/* 上传队列展示 */}
      {uploadQueue.length > 0 && (
        <div className="upload-queue">
          {uploadQueue.map((item) => (
            <div key={item.id} className="upload-queue-item">
              <span className="upload-queue-item-name">{item.name}</span>
              <ProgressBar
                className="upload-queue-item-pgbar"
                value={item.progress / 100}
                color={
                  item.status === "success"
                    ? "brand"
                    : item.status === "error"
                    ? "error"
                    : undefined
                }
              />
              {item.status === "success" && item.url && (
                <span className="upload-queue-item-url">
                  <code>
                    {item.url}
                  </code>
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<CopyRegular />}
                    onClick={() => {
                      navigator.clipboard.writeText(item.url!);
                      messageBarRef.current?.addMessage(
                        "提示",
                        "图片链接已复制到剪贴板",
                        "success"
                      );
                    }}
                  />
                </span>
              )}
              {item.status === "error" && (
                <span style={{ color: "#f44336", marginLeft: 8 }}>
                  上传失败
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <div
        id="images-list"
        className={dragActive ? "drag-active" : ""}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUploadFiles(e.dataTransfer.files);
          }
        }}
      >
        <wc-waterfall id="images-waterfall" gap={10} cols={cols}>
          {images.map((img, idx) => (
            <div
              key={img}
              className="images-item"
              style={{ cursor: selectMode ? "pointer" : "default" }}
              onClick={() => {
                if (selectMode) {
                  setSelectedImages((sel) =>
                    sel.includes(img)
                      ? sel.filter((i) => i !== img)
                      : [...sel, img]
                  );
                }
              }}
            >
              {selectMode && (
                <Checkbox
                  checked={selectedImages.includes(img)}
                  onChange={(_, data) => {
                    setSelectedImages((sel) =>
                      data.checked
                        ? [...sel, img]
                        : sel.filter((i) => i !== img)
                    );
                  }}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: 10,
                    zIndex: 3,
                    pointerEvents: "none",
                  }}
                />
              )}
              {/* Fancybox 包裹图片 */}
              <a
                data-fancybox="gallery"
                href={img}
                onClick={e => selectMode && e.preventDefault()}
                style={{ display: "block" }}
              >
                <img
                  className="lazy-img"
                  data-src={img}
                  alt={`img-${idx}`}
                  src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                  style={{ width: "100%", borderRadius: 10 }}
                  onLoad={() => setLoadedCount(c => c + 1)}
                />
              </a>
              {/* 非选择模式下显示操作按钮 */}
              {!selectMode && (
                <div className="op-btns">
                  {/* <Button
                    appearance="subtle"
                    className="op-btn reupload-btn"
                    size="small"
                    title="重新上传"
                    icon={<DocumentArrowUpRegular />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setReuploadTarget(img);
                      reuploadInputRef.current?.click();
                    }}
                  /> */}
                  <Button
                    icon={<DeleteRegular />}
                    appearance="subtle"
                    className="op-btn delete-btn"
                    size="small"
                    title="删除图片"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDialogState({
                        open: true,
                        title: "删除图片",
                        content: (
                          <div style={{ display: "grid" }}>
                            确定要删除该图片吗？图片将会被永久删除！（真的很久！）
                            <br />
                            <Link
                              href={img}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {img}
                            </Link>
                            <img
                              src={img}
                              style={{
                                maxWidth: 200,
                                borderRadius: 8,
                                margin: "auto",
                              }}
                            />
                          </div>
                        ),
                        onConfirm: async () => {
                          setDialogState({ ...dialogState, open: false });
                          const ok = await deleteImage(img);
                          if (ok) {
                            messageBarRef.current?.addMessage(
                              "提示",
                              "删除成功",
                              "success"
                            );
                            await refreshImages();
                          } else {
                            messageBarRef.current?.addMessage(
                              "错误",
                              "删除失败",
                              "error"
                            );
                          }
                        },
                        onClose: () =>
                          setDialogState({ ...dialogState, open: false }),
                      });
                    }}
                  />
                  <Button
                    appearance="subtle"
                    className="op-btn copy-btn"
                    size="small"
                    title="复制链接"
                    icon={<ClipboardLinkRegular />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(img);
                      messageBarRef.current?.addMessage(
                        "提示",
                        "图片链接已复制到剪贴板",
                        "success"
                      );
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </wc-waterfall>
        {dragActive && (
          <div className="drag-overlay">
            <span>松开上传图片</span>
          </div>
        )}
      </div>
      <Messages ref={messageBarRef} />
      <BaseDialog {...dialogState} />
    </>
  );
}
