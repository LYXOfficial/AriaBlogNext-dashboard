"use client";
import { config } from "@/dashboardConfig";
import { FriendLinkGroup } from "@/interfaces/flink";
import { getFlinks } from "@/utils/flinks";
import Link from "next/link";
import React, { useEffect, useState, useRef } from "react";
import LazyLoad from "vanilla-lazyload";
import {
  ArrowUploadFilled,
  Checkmark16Regular,
  Dismiss16Regular,
  EditFilled,
  ComposeRegular,
  OpenFilled,
  Color24Regular, // 新增调色板图标
  DeleteRegular,
  Add16Regular,
  ArrowLeftRegular,
} from "@fluentui/react-icons";
import { Input, Button, Label, Dropdown, Option } from "@fluentui/react-components";
import { BaseDialog } from "@/components/Dialog";
import "@/styles/flinks.scss";
import stringRandom from "string-random";

export default function Flinks() {
  const [fLinks, setFLinks] = useState<FriendLinkGroup[]>([]);
  const [editing, setEditing] = useState<{
    groupIdx: number;
    linkIdx: number;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [colorEditing, setColorEditing] = useState<{
    groupIdx: number;
    linkIdx: number;
    color: string;
  } | null>(null);
  const [descrEditing, setDescrEditing] = useState<{
    groupIdx: number;
    linkIdx: number;
  } | null>(null);
  const [descrEditValue, setDescrEditValue] = useState("");

  // 头像编辑弹窗内容
  const [avatarEditing, setAvatarEditing] = useState<{
    groupIdx: number;
    linkIdx: number;
    avatar: string;
  } | null>(null);
  const [avatarInput, setAvatarInput] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);

  // 新增分组编辑相关 state
  const [groupEditing, setGroupEditing] = useState<{
    groupIdx: number;
    name: string;
    description: string;
  } | null>(null);

  const [deleteGroupIdx, setDeleteGroupIdx] = useState<number | null>(null);
  const [deleteLinkInfo, setDeleteLinkInfo] = useState<{
    groupIdx: number;
    linkIdx: number;
  } | null>(null);

  // 新建分组相关 state
  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");

  // 移动友链相关 state
  const [moveLinkInfo, setMoveLinkInfo] = useState<{
    groupIdx: number;
    linkIdx: number;
  } | null>(null);
  const [moveTargetGroup, setMoveTargetGroup] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      setFLinks(await getFlinks());
    })();
  }, []);
  useEffect(() => {
    const lazyLoadInstance = new LazyLoad({ elements_selector: ".lazy-img" });
    lazyLoadInstance.update();
  }, [fLinks]);

  const handleEdit = (groupIdx: number, linkIdx: number, name: string) => {
    setEditing({ groupIdx, linkIdx });
    setEditValue(name);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleEditConfirm = () => {
    if (editing) {
      setFLinks((prev) =>
        prev.map((group, gi) =>
          gi === editing.groupIdx
            ? {
                ...group,
                links: group.links.map((link, li) =>
                  li === editing.linkIdx ? { ...link, name: editValue } : link
                ),
              }
            : group
        )
      );
      setEditing(null);
    }
  };

  const handleEditCancel = () => {
    setEditing(null);
    setEditValue("");
  };

  const handleDescrEdit = (
    groupIdx: number,
    linkIdx: number,
    descr: string
  ) => {
    setDescrEditing({ groupIdx, linkIdx });
    setDescrEditValue(descr);
  };

  const handleDescrEditConfirm = () => {
    if (descrEditing) {
      setFLinks((prev) =>
        prev.map((group, gi) =>
          gi === descrEditing.groupIdx
            ? {
                ...group,
                links: group.links.map((link, li) =>
                  li === descrEditing.linkIdx
                    ? { ...link, description: descrEditValue }
                    : link
                ),
              }
            : group
        )
      );
      setDescrEditing(null);
    }
  };

  const handleDescrEditCancel = () => {
    setDescrEditing(null);
    setDescrEditValue("");
  };

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarInput("上传中...");
    const { uploadImage } = await import("@/utils/image");
    const url = await uploadImage(file);
    setAvatarInput(url || "上传失败");
  }

  // 删除分组
  const handleDeleteGroup = () => {
    if (deleteGroupIdx !== null) {
      setFLinks((prev) => prev.filter((_, idx) => idx !== deleteGroupIdx));
      setDeleteGroupIdx(null);
    }
  };

  // 删除友链
  const handleDeleteLink = () => {
    if (deleteLinkInfo) {
      setFLinks((prev) =>
        prev.map((group, gi) =>
          gi === deleteLinkInfo.groupIdx
            ? {
                ...group,
                links: group.links.filter(
                  (_, li) => li !== deleteLinkInfo.linkIdx
                ),
              }
            : group
        )
      );
      setDeleteLinkInfo(null);
    }
  };

  return (
    <>
      <BaseDialog
        title="编辑头像"
        open={!!avatarEditing}
        onClose={() => setAvatarEditing(null)}
        onConfirm={() => {
          if (avatarEditing) {
            setFLinks((prev) =>
              prev.map((group, gi) =>
                gi === avatarEditing.groupIdx
                  ? {
                      ...group,
                      links: group.links.map((l, li) =>
                        li === avatarEditing.linkIdx
                          ? { ...l, avatar: avatarInput }
                          : l
                      ),
                    }
                  : group
              )
            );
          }
          setAvatarEditing(null);
        }}
        content={
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {avatarInput && (
              <img
                src={avatarInput}
                alt="预览"
                style={{ width: 36, height: 36, borderRadius: "50%" }}
              />
            )}
            <Input
              value={avatarInput}
              onChange={(_, data) => setAvatarInput(data.value)}
              placeholder="输入图片链接"
              style={{ height: "fit-content", width: "100%" }}
            />
            <Button
              onClick={() => uploadRef.current?.click()}
              appearance="secondary"
              icon={<ArrowUploadFilled />}
              style={{ height: "fit-content" }}
            />
            <div>
              <input
                ref={uploadRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarUpload}
              />
            </div>
          </div>
        }
      />
      <BaseDialog
        title="编辑分组"
        open={!!groupEditing}
        onClose={() => setGroupEditing(null)}
        onConfirm={() => {
          if (groupEditing) {
            setFLinks((prev) =>
              prev.map((group, gi) =>
                gi === groupEditing.groupIdx
                  ? {
                      ...group,
                      name: groupEditing.name,
                      description: groupEditing.description,
                    }
                  : group
              )
            );
          }
          setGroupEditing(null);
        }}
        content={
          groupEditing && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Label>分组名称</Label>
              <Input
                value={groupEditing.name}
                onChange={(_, data) =>
                  setGroupEditing({ ...groupEditing, name: data.value })
                }
                placeholder="分组名称"
                style={{ width: "100%" }}
              />
              <Label>分组描述</Label>
              <Input
                value={groupEditing.description}
                onChange={(_, data) =>
                  setGroupEditing({ ...groupEditing, description: data.value })
                }
                placeholder="分组描述"
                style={{ width: "100%" }}
              />
            </div>
          )
        }
      />
      {/* 删除分组确认对话框 */}
      <BaseDialog
        title="确认删除分组"
        open={deleteGroupIdx !== null}
        onClose={() => setDeleteGroupIdx(null)}
        onConfirm={handleDeleteGroup}
        content={<div>确定要删除该分组吗？分组下所有友链也会被删除！</div>}
      />

      {/* 删除友链确认对话框 */}
      <BaseDialog
        title="确认删除友链"
        open={deleteLinkInfo !== null}
        onClose={() => setDeleteLinkInfo(null)}
        onConfirm={handleDeleteLink}
        content={<div>确定要删除该友链吗？</div>}
      />

      {/* 新建分组对话框 */}
      <BaseDialog
        title="新建分组"
        open={newGroupDialogOpen}
        onClose={() => {
          setNewGroupDialogOpen(false);
          setNewGroupName("");
          setNewGroupDesc("");
        }}
        onConfirm={() => {
          if (newGroupName.trim()) {
            setFLinks((prev) => [
              ...prev,
              {
                name: newGroupName.trim(),
                description: newGroupDesc.trim(),
                links: [],
              },
            ]);
            setNewGroupDialogOpen(false);
            setNewGroupName("");
            setNewGroupDesc("");
          }
        }}
        content={
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Label>分组名称</Label>
            <Input
              value={newGroupName}
              onChange={(_, data) => setNewGroupName(data.value)}
              placeholder="分组名称"
              style={{ width: "100%" }}
            />
            <Label>分组描述</Label>
            <Input
              value={newGroupDesc}
              onChange={(_, data) => setNewGroupDesc(data.value)}
              placeholder="分组描述"
              style={{ width: "100%" }}
            />
          </div>
        }
      />

      {/* 移动友链对话框 */}
      <BaseDialog
        title="移动友链到其他分组"
        open={!!moveLinkInfo}
        onClose={() => setMoveLinkInfo(null)}
        onConfirm={() => {
          if (
            moveLinkInfo &&
            moveTargetGroup !== null &&
            moveTargetGroup !== moveLinkInfo.groupIdx
          ) {
            setFLinks(prev => {
              const link = prev[moveLinkInfo.groupIdx].links[moveLinkInfo.linkIdx];
              return prev.map((group, gi) => {
                if (gi === moveLinkInfo.groupIdx) {
                  // 移除
                  return {
                    ...group,
                    links: group.links.filter((_, li) => li !== moveLinkInfo.linkIdx),
                  };
                }
                if (gi === moveTargetGroup) {
                  // 添加
                  return {
                    ...group,
                    links: [...group.links, link],
                  };
                }
                return group;
              });
            });
          }
          setMoveLinkInfo(null);
          setMoveTargetGroup(null);
        }}
        content={
          <div>
            <Dropdown
              value={
                moveTargetGroup !== null
                  ? fLinks[moveTargetGroup]?.name
                  : "请选择目标分组"
              }
              onOptionSelect={(_, data) => {
                setMoveTargetGroup(Number(data.optionValue));
              }}
              style={{ width: "100%" }}
            >
              {fLinks.map((g, idx) =>
                moveLinkInfo && idx === moveLinkInfo.groupIdx ? null : (
                  <Option key={g.name} value={idx.toString()}>
                    {g.name}
                  </Option>
                )
              )}
            </Dropdown>
          </div>
        }
      />

      <h1>友链</h1>
      <div className="flink-groups">
        <div className="flink-topbar">
          <Button
            appearance="primary"
            icon={<Add16Regular />}
            onClick={() => setNewGroupDialogOpen(true)}
          >
            新建分组
          </Button>
        </div>
        {fLinks.map((item, groupIdx) => (
          <div className="flink-group" key={item.name}>
            <div className="flink-group-header">
              <h2
                className="flink-group-title"
                style={{ display: "inline-block", marginRight: 8 }}
              >
                {item.name}
              </h2>
              <Button
                appearance="subtle"
                size="small"
                icon={<EditFilled />}
                aria-label="编辑分组"
                onClick={() =>
                  setGroupEditing({
                    groupIdx,
                    name: item.name,
                    description: item.description || "",
                  })
                }
                style={{ verticalAlign: "middle" }}
              />
              <Button
                appearance="subtle"
                size="small"
                icon={<DeleteRegular />}
                aria-label="删除分组"
                onClick={() => setDeleteGroupIdx(groupIdx)}
                style={{ verticalAlign: "middle", marginLeft: 4 }}
              />
              <span className="flink-group-descr">{item.description}</span>
            </div>
            <div className="flink-list">
              {item.links.map((link, linkIdx) => {
                let linkLatencyColor = "";
                if (link.latency! > 0) {
                  if (link.latency! < 1) linkLatencyColor = "green";
                  else if (link.latency! < 2) linkLatencyColor = "yellowgreen";
                  else if (link.latency! < 5) linkLatencyColor = "goldenrod";
                  else linkLatencyColor = "orangered";
                } else if (link.latency) {
                  linkLatencyColor = "#bd2a2a";
                }
                const isEditing =
                  editing &&
                  editing.groupIdx === groupIdx &&
                  editing.linkIdx === linkIdx;
                const isColorEditing =
                  colorEditing &&
                  colorEditing.groupIdx === groupIdx &&
                  colorEditing.linkIdx === linkIdx;
                const isDescrEditing =
                  descrEditing &&
                  descrEditing.groupIdx === groupIdx &&
                  descrEditing.linkIdx === linkIdx;
                return (
                  <div className="flink-item" key={link.name}>
                    <div
                      className="flink-item-avatar"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setAvatarEditing({
                          groupIdx,
                          linkIdx,
                          avatar: link.avatar,
                        });
                        setAvatarInput(link.avatar || "");
                      }}
                      dangerouslySetInnerHTML={{
                        __html: `
                          <img 
                              class="flink-item-avatar-img lazy-img" 
                              src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" 
                              data-src="${link.avatar} "
                              alt="${link.name}"
                              onerror="this.src='${config.falldownAvatar}';"
                          />
                        `,
                      }}
                    />
                    <span className="flink-item-name">
                      {isEditing ? (
                        <Input
                          value={editValue}
                          onChange={(_, data) => setEditValue(data.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEditConfirm();
                            if (e.key === "Escape") handleEditCancel();
                          }}
                          className="flink-item-name-edit"
                          autoFocus
                          size="small"
                          contentAfter={
                            <>
                              <Button
                                appearance="subtle"
                                size="small"
                                icon={<Checkmark16Regular />}
                                onClick={handleEditConfirm}
                                aria-label="确认"
                              />
                              <Button
                                appearance="subtle"
                                size="small"
                                icon={<Dismiss16Regular />}
                                onClick={handleEditCancel}
                                aria-label="取消"
                              />
                            </>
                          }
                        />
                      ) : (
                        <>
                          <button
                            className="flink-item-button"
                            onClick={() =>
                              handleEdit(groupIdx, linkIdx, link.name)
                            }
                          >
                            <EditFilled />
                          </button>
                          <span
                            className="flink-item-name-text"
                            title={link.name}
                          >
                            {link.name}
                          </span>
                        </>
                      )}
                    </span>
                    <div className="flink-item-color">
                      <div className="flink-item-color-text">
                        {isColorEditing ? (
                          <>
                            <input
                              type="color"
                              className="flink-item-color-box"
                              style={{
                                backgroundColor: colorEditing.color,
                              }}
                              value={colorEditing.color}
                              onChange={(e) =>
                                setColorEditing({
                                  groupIdx,
                                  linkIdx,
                                  color: e.target.value,
                                })
                              }
                              title="选择颜色"
                              autoFocus
                            />
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<Color24Regular />}
                              aria-label="取色"
                              onClick={async () => {
                                // 取色器功能
                                if ("EyeDropper" in window) {
                                  // @ts-ignore
                                  const eyeDropper = new window.EyeDropper();
                                  try {
                                    const result = await eyeDropper.open();
                                    setColorEditing({
                                      groupIdx,
                                      linkIdx,
                                      color: result.sRGBHex,
                                    });
                                  } catch (e) {
                                    // 用户取消取色
                                  }
                                } else {
                                  alert("当前浏览器不支持取色器功能");
                                }
                              }}
                              style={{ marginLeft: 4 }}
                            />
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<Checkmark16Regular />}
                              onClick={() => {
                                setFLinks((prev) =>
                                  prev.map((group, gi) =>
                                    gi === groupIdx
                                      ? {
                                          ...group,
                                          links: group.links.map((l, li) =>
                                            li === linkIdx
                                              ? {
                                                  ...l,
                                                  color: colorEditing.color,
                                                }
                                              : l
                                          ),
                                        }
                                      : group
                                  )
                                );
                                setColorEditing(null);
                              }}
                              aria-label="确认"
                            />
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<Dismiss16Regular />}
                              onClick={() => setColorEditing(null)}
                              aria-label="取消"
                            />
                            <span style={{ marginLeft: 8 }}>
                              {colorEditing.color}
                            </span>
                          </>
                        ) : (
                          <>
                            <span
                              className="flink-item-color-box"
                              style={{
                                display: "inline-block",
                                backgroundColor: link.color,
                              }}
                              title="点击编辑颜色"
                              onClick={() =>
                                setColorEditing({
                                  groupIdx,
                                  linkIdx,
                                  color: link.color,
                                })
                              }
                            />
                            {link.color}
                            <span
                              className="flink-item-latency"
                              style={{ color: linkLatencyColor }}
                            >
                              {link.latency! > 0
                                ? ` ${Math.round(link.latency! * 1000)}ms`
                                : " Error"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flink-item-descr">
                      {descrEditing &&
                      descrEditing.groupIdx === groupIdx &&
                      descrEditing.linkIdx === linkIdx ? (
                        <Input
                          value={descrEditValue}
                          onChange={(_, data) => setDescrEditValue(data.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleDescrEditConfirm();
                            if (e.key === "Escape") handleDescrEditCancel();
                          }}
                          className="flink-item-descr-edit"
                          autoFocus
                          size="small"
                          contentAfter={
                            <>
                              <Button
                                appearance="subtle"
                                size="small"
                                icon={<Checkmark16Regular />}
                                onClick={handleDescrEditConfirm}
                                aria-label="确认"
                              />
                              <Button
                                appearance="subtle"
                                size="small"
                                icon={<Dismiss16Regular />}
                                onClick={handleDescrEditCancel}
                                aria-label="取消"
                              />
                            </>
                          }
                        />
                      ) : (
                        <>
                          <button
                            className="flink-item-button"
                            style={{ marginRight: 4 }}
                            onClick={() =>
                              handleDescrEdit(
                                groupIdx,
                                linkIdx,
                                link.description || ""
                              )
                            }
                          >
                            <ComposeRegular />
                          </button>
                          {link.description}
                        </>
                      )}
                    </div>
                    <Link className="flink-item-button open" href={link.url}>
                      <OpenFilled />
                    </Link>

                    <button
                      className="flink-item-button delete"
                      onClick={() => setDeleteLinkInfo({ groupIdx, linkIdx })}
                      style={{ marginLeft: 2 }}
                      title="删除友链"
                    >
                      <DeleteRegular />
                    </button>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<ArrowLeftRegular />}
                      aria-label="移动分组"
                      style={{ width:"100%" }}
                      onClick={() => {
                        setMoveLinkInfo({ groupIdx, linkIdx });
                        setMoveTargetGroup(null);
                      }}
                    >
                      移动分组
                    </Button>
                  </div>
                );
              })}
              {/* 添加友链按钮 */}
              <Button
                appearance="subtle"
                icon={<Add16Regular />}
                className="flink-group-addlinkbtn"
                onClick={() => {
                  setFLinks(prev =>
                    prev.map((group, gi) =>
                      gi === groupIdx
                        ? {
                            ...group,
                            links: [
                              ...group.links,
                              {
                                name: "新友链喵",
                                description: "114514",
                                url: "https://0v0.my",
                                color: "#66ccff",
                                avatar: "https://img.0v0.my/2024/09/06/66dabf7f748c8.jpg",
                                id: stringRandom(16,{letters:"ABCDEF" }),
                                latency: 0.114, 
                              },
                            ],
                          }
                        : group
                    )
                  );
                }}
              >
                添加友链
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
