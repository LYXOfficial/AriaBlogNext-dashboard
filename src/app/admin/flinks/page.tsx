"use client";
import { config } from "@/dashboardConfig";
import { FriendLinkGroup } from "@/interfaces/flink";
import {
  getFlinks,
  addFlink,
  deleteFlink,
  addGroup,
  deleteGroup,
  updateGroup,
  updateFlink,
  moveFlinkGroup,
} from "@/utils/flinks";
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
  Color24Regular,
  DeleteRegular,
  Add16Regular,
  ArrowLeftRegular,
  LinkEditRegular,
} from "@fluentui/react-icons";
import {
  Input,
  Button,
  Label,
  Dropdown,
  Option,
} from "@fluentui/react-components";
import { BaseDialog } from "@/components/Dialog";
import Messages, { MessagesRef } from "@/components/Messages";
import "@/styles/flinks.scss";
import stringRandom from "string-random";

export default function Flinks() {
  const [fLinks, setFLinks] = useState<FriendLinkGroup[]>([]);
  const [nameEditing, setNameEditing] = useState<{
    groupIdx: number;
    linkIdx: number;
  } | null>(null);
  const [nameEditValue, setNameEditValue] = useState("");
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
  const [avatarEditing, setAvatarEditing] = useState<{
    groupIdx: number;
    linkIdx: number;
    avatar: string;
  } | null>(null);
  const [avatarInput, setAvatarInput] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);
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
  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [moveLinkInfo, setMoveLinkInfo] = useState<{
    groupIdx: number;
    linkIdx: number;
  } | null>(null);
  const [moveTargetGroup, setMoveTargetGroup] = useState<number | null>(null);
  const [editing, setEditing] = useState<number>(0);
  const messageBarRef = useRef<MessagesRef>(null);
  const [urlEditing, setUrlEditing] = useState<{ groupIdx: number; linkIdx: number } | null>(null);
  const [urlEditValue, setUrlEditValue] = useState("");

  useEffect(() => {
    (async () => {
      setFLinks(await getFlinks());
    })();
  }, []);
  useEffect(() => {
    const lazyLoadInstance = new LazyLoad({ elements_selector: ".lazy-img" });
    lazyLoadInstance.update();
  }, [fLinks, editing]);

  const handleEdit = (groupIdx: number, linkIdx: number, name: string) => {
    setNameEditing({ groupIdx, linkIdx });
    setNameEditValue(name);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameEditValue(e.target.value);
  };

  const handleEditConfirm = async () => {
    if (nameEditing) {
      const group = fLinks[nameEditing.groupIdx];
      const link = group.links[nameEditing.linkIdx];
      const updated = { ...link, name: nameEditValue };
      const ok = await updateFlink(group.name, updated);
      if (ok) {
        setFLinks((prev) =>
          prev.map((g, gi) =>
            gi === nameEditing.groupIdx
              ? {
                  ...g,
                  links: g.links.map((l, li) =>
                    li === nameEditing.linkIdx ? updated : l
                  ),
                }
              : g
          )
        );
        messageBarRef.current?.addMessage("提示", "修改成功", "success");
      } else {
        messageBarRef.current?.addMessage("错误", "修改失败", "error");
      }
      setNameEditing(null);
      setEditing(Math.random());
    }
  };

  const handleEditCancel = () => {
    setNameEditing(null);
    setNameEditValue("");
    setEditing(Math.random());
  };

  const handleDescrEdit = (
    groupIdx: number,
    linkIdx: number,
    descr: string
  ) => {
    setDescrEditing({ groupIdx, linkIdx });
    setDescrEditValue(descr);
  };

  const handleDescrEditConfirm = async () => {
    if (descrEditing) {
      const group = fLinks[descrEditing.groupIdx];
      const link = group.links[descrEditing.linkIdx];
      const updated = { ...link, description: descrEditValue };
      const ok = await updateFlink(group.name, updated);
      if (ok) {
        setFLinks((prev) =>
          prev.map((g, gi) =>
            gi === descrEditing.groupIdx
              ? {
                  ...g,
                  links: g.links.map((l, li) =>
                    li === descrEditing.linkIdx ? updated : l
                  ),
                }
              : g
          )
        );
        messageBarRef.current?.addMessage("提示", "描述修改成功", "success");
      } else {
        messageBarRef.current?.addMessage("错误", "描述修改失败", "error");
      }
      setDescrEditing(null);
      setEditing(Math.random());
    }
  };

  const handleDescrEditCancel = () => {
    setDescrEditing(null);
    setDescrEditValue("");
    setEditing(Math.random());
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
  const handleDeleteGroup = async () => {
    if (deleteGroupIdx !== null) {
      const groupName = fLinks[deleteGroupIdx].name;
      const ok = await deleteGroup(groupName);
      if (ok) {
        setFLinks((prev) => prev.filter((_, idx) => idx !== deleteGroupIdx));
        messageBarRef.current?.addMessage("提示", "删除分组成功", "success");
      } else {
        messageBarRef.current?.addMessage("错误", "删除分组失败", "error");
      }
      setDeleteGroupIdx(null);
      setEditing(Math.random());
    }
  };

  // 删除友链
  const handleDeleteLink = async () => {
    if (deleteLinkInfo) {
      const groupName = fLinks[deleteLinkInfo.groupIdx].name;
      const linkId =
        fLinks[deleteLinkInfo.groupIdx].links[deleteLinkInfo.linkIdx].id;
      const ok = await deleteFlink(groupName, linkId);
      if (ok) {
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
        messageBarRef.current?.addMessage("提示", "删除友链成功", "success");
      } else {
        messageBarRef.current?.addMessage("错误", "删除友链失败", "error");
      }
      setDeleteLinkInfo(null);
      setEditing(Math.random());
    }
  };

  return (
    <>
      <BaseDialog
        title="编辑头像"
        open={!!avatarEditing}
        onClose={() => {
          setAvatarEditing(null);
          setEditing(Math.random());
        }}
        onConfirm={async () => {
          if (avatarEditing) {
            const group = fLinks[avatarEditing.groupIdx];
            const link = group.links[avatarEditing.linkIdx];
            const updated = { ...link, avatar: avatarInput };
            const ok = await updateFlink(group.name, updated);
            if (ok) {
              setFLinks((prev) =>
                prev.map((g, gi) =>
                  gi === avatarEditing.groupIdx
                    ? {
                        ...g,
                        links: g.links.map((l, li) =>
                          li === avatarEditing.linkIdx ? updated : l
                        ),
                      }
                    : g
                )
              );
              messageBarRef.current?.addMessage(
                "提示",
                "头像修改成功",
                "success"
              );
            } else {
              messageBarRef.current?.addMessage(
                "错误",
                "头像修改失败",
                "error"
              );
            }
          }
          setAvatarEditing(null);
          setEditing(Math.random());
        }}
        content={
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {avatarInput && (
              <img
                src={avatarInput}
                alt="预览"
                style={{ width: 36, height: 36, borderRadius: "50%" }}
                onError={e => (e.currentTarget.src = config.falldownAvatar)}
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
        onClose={() => {
          setGroupEditing(null);
          setEditing(Math.random());
        }}
        onConfirm={async () => {
          if (groupEditing) {
            const oldName = fLinks[groupEditing.groupIdx].name;
            const ok = await updateGroup(
              oldName,
              groupEditing.name,
              groupEditing.description
            );
            if (ok) {
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
              messageBarRef.current?.addMessage(
                "提示",
                "分组修改成功",
                "success"
              );
            } else {
              messageBarRef.current?.addMessage(
                "错误",
                "分组修改失败",
                "error"
              );
            }
          }
          setGroupEditing(null);
          setEditing(Math.random());
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
        onClose={() => {
          setDeleteGroupIdx(null);
          setEditing(Math.random());
        }}
        onConfirm={handleDeleteGroup}
        content={<div>确定要删除该分组吗？分组下所有友链也会被删除！</div>}
      />

      {/* 删除友链确认对话框 */}
      <BaseDialog
        title="确认删除友链"
        open={deleteLinkInfo !== null}
        onClose={() => {
          setDeleteLinkInfo(null);
          setEditing(Math.random());
        }}
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
          setEditing(Math.random());
        }}
        onConfirm={async () => {
          if (newGroupName.trim()) {
            const ok = await addGroup(newGroupName.trim(), newGroupDesc.trim());
            if (ok) {
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
              messageBarRef.current?.addMessage(
                "提示",
                "新建分组成功",
                "success"
              );
            } else {
              messageBarRef.current?.addMessage(
                "错误",
                "新建分组失败",
                "error"
              );
            }
            setEditing(Math.random());
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
        onClose={() => {
          setMoveLinkInfo(null);
          setEditing(Math.random());
        }}
        onConfirm={async () => {
          if (
            moveLinkInfo &&
            moveTargetGroup !== null &&
            moveTargetGroup !== moveLinkInfo.groupIdx
          ) {
            const fromGroup = fLinks[moveLinkInfo.groupIdx].name;
            const toGroup = fLinks[moveTargetGroup].name;
            const linkId =
              fLinks[moveLinkInfo.groupIdx].links[moveLinkInfo.linkIdx].id;
            const ok = await moveFlinkGroup(fromGroup, toGroup, linkId);
            if (ok) {
              setFLinks((prev) => {
                const link =
                  prev[moveLinkInfo.groupIdx].links[moveLinkInfo.linkIdx];
                return prev.map((group, gi) => {
                  if (gi === moveLinkInfo.groupIdx) {
                    // 移除
                    return {
                      ...group,
                      links: group.links.filter(
                        (_, li) => li !== moveLinkInfo.linkIdx
                      ),
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
              messageBarRef.current?.addMessage("提示", "移动成功", "success");
            } else {
              messageBarRef.current?.addMessage("错误", "移动失败", "error");
            }
            setMoveLinkInfo(null);
            setMoveTargetGroup(null);
            setEditing(Math.random());
          }
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

      {/* 编辑友链链接对话框 */}
      <BaseDialog
        title="编辑友链链接"
        open={!!urlEditing}
        onClose={() => {
          setUrlEditing(null);
          setEditing(Math.random());
        }}
        onConfirm={async () => {
          if (urlEditing) {
            const group = fLinks[urlEditing.groupIdx];
            const link = group.links[urlEditing.linkIdx];
            const updated = { ...link, url: urlEditValue };
            const ok = await updateFlink(group.name, updated);
            if (ok) {
              setFLinks(prev =>
                prev.map((g, gi) =>
                  gi === urlEditing.groupIdx
                    ? {
                        ...g,
                        links: g.links.map((l, li) =>
                          li === urlEditing.linkIdx ? updated : l
                        ),
                      }
                    : g
                )
              );
              messageBarRef.current?.addMessage("提示", "链接修改成功", "success");
            } else {
              messageBarRef.current?.addMessage("错误", "链接修改失败", "error");
            }
            setUrlEditing(null);
            setEditing(Math.random());
          }
        }}
        content={
          <Input
            value={urlEditValue}
            onChange={(_, data) => setUrlEditValue(data.value)}
            placeholder="请输入新的友链地址"
            style={{ width: "100%" }}
          />
        }
      />

      <h1>友链</h1>
      <div className="flink-groups">
        <div className="flink-topbar">
          <Button
            appearance="primary"
            icon={<Add16Regular />}
            onClick={() => {
              setNewGroupDialogOpen(true);
              setEditing(Math.random());
            }}
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
                onClick={() => {
                  setGroupEditing({
                    groupIdx,
                    name: item.name,
                    description: item.description || "",
                  });
                  setEditing(Math.random());
                }}
                style={{ verticalAlign: "middle" }}
              />
              <Button
                appearance="subtle"
                size="small"
                icon={<DeleteRegular />}
                aria-label="删除分组"
                onClick={() => {
                  setDeleteGroupIdx(groupIdx);
                  setEditing(Math.random());
                }}
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
                  nameEditing &&
                  nameEditing.groupIdx === groupIdx &&
                  nameEditing.linkIdx === linkIdx;
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
                    {/* 头像渲染 */}
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
                        setEditing(Math.random());
                      }}
                      dangerouslySetInnerHTML={{
                        __html: `
                            <img 
                                class="flink-item-avatar-img lazy-img" 
                                src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" 
                                data-src="${link.avatar}"
                                alt="${link.name}"
                                onerror="this.src='${config.falldownAvatar}';"
                            />
                          `,
                      }}
                    />

                    <span className="flink-item-name">
                      {isEditing ? (
                        <Input
                          value={nameEditValue}
                          onChange={(_, data) => setNameEditValue(data.value)}
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
                            onClick={() => {
                              handleEdit(groupIdx, linkIdx, link.name);
                              setEditing(Math.random());
                            }}
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
                                  } catch (e) {}
                                } else {
                                  messageBarRef.current?.addMessage(
                                    "错误",
                                    "当前浏览器不支持取色器功能",
                                    "error"
                                  );
                                }
                              }}
                              style={{ marginLeft: 4 }}
                            />
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<Checkmark16Regular />}
                              onClick={async () => {
                                const group = fLinks[groupIdx];
                                const link = group.links[linkIdx];
                                const updated = {
                                  ...link,
                                  color: colorEditing.color,
                                };
                                const ok = await updateFlink(
                                  group.name,
                                  updated
                                );
                                if (ok) {
                                  setFLinks((prev) =>
                                    prev.map((g, gi) =>
                                      gi === groupIdx
                                        ? {
                                            ...g,
                                            links: g.links.map((l, li) =>
                                              li === linkIdx ? updated : l
                                            ),
                                          }
                                        : g
                                    )
                                  );
                                  messageBarRef.current?.addMessage(
                                    "提示",
                                    "颜色修改成功",
                                    "success"
                                  );
                                } else {
                                  messageBarRef.current?.addMessage(
                                    "错误",
                                    "颜色修改失败",
                                    "error"
                                  );
                                }
                                setColorEditing(null);
                                setEditing(Math.random());
                              }}
                              aria-label="确认"
                            />
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<Dismiss16Regular />}
                              onClick={() => {
                                setColorEditing(null);
                                setEditing(Math.random());
                              }}
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
                              onClick={() => {
                                setColorEditing({
                                  groupIdx,
                                  linkIdx,
                                  color: link.color,
                                });
                                setEditing(Math.random());
                              }}
                            />
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
                      {isDescrEditing ? (
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
                            onClick={() => {
                              handleDescrEdit(
                                groupIdx,
                                linkIdx,
                                link.description || ""
                              );
                              setEditing(Math.random());
                            }}
                          >
                            <ComposeRegular />
                          </button>
                          <div className="flink-item-descr-text">
                            {link.description}
                          </div>
                        </>
                      )}
                    </div>
                    <Link className="flink-item-button open" href={link.url}>
                      <OpenFilled />
                    </Link>

                    <button
                      className="flink-item-button editlink"
                      aria-label="编辑链接"
                      onClick={() => {
                        setUrlEditing({ groupIdx, linkIdx });
                        setUrlEditValue(link.url);
                        setEditing(Math.random());
                      }}
                    >
                      <LinkEditRegular />
                    </button>
                    <button
                      className="flink-item-button delete"
                      onClick={() => {
                        setDeleteLinkInfo({ groupIdx, linkIdx });
                        setEditing(Math.random());
                      }}
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
                      style={{ width: "fit-content" }}
                      onClick={() => {
                        setMoveLinkInfo({ groupIdx, linkIdx });
                        setMoveTargetGroup(null);
                        setEditing(Math.random());
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
                onClick={async () => {
                  const newLink = {
                    name: "新友链喵",
                    description: "114514",
                    url: "https://0v0.my",
                    color: "#66ccff",
                    avatar: "https://img.0v0.my/2024/09/06/66dabf7f748c8.jpg",
                    id: stringRandom(16, { letters: "ABCDEF" }),
                    latency: 0.114,
                  };
                  const groupName = fLinks[groupIdx].name;
                  const ok = await addFlink(groupName, newLink);
                  if (ok) {
                    setFLinks((prev) =>
                      prev.map((group, gi) =>
                        gi === groupIdx
                          ? { ...group, links: [...group.links, newLink] }
                          : group
                      )
                    );
                    messageBarRef.current?.addMessage(
                      "提示",
                      "添加友链成功",
                      "success"
                    );
                  } else {
                    messageBarRef.current?.addMessage(
                      "错误",
                      "添加失败",
                      "error"
                    );
                  }
                  setEditing(Math.random());
                }}
              >
                添加友链
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Messages ref={messageBarRef} />
    </>
  );
}
