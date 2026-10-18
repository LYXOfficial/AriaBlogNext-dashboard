"use client";
import { config } from "@/dashboardConfig";
import { FriendLink, FriendLinkGroup, FlinkApplication } from "@/interfaces/flink";
import {
  getFlinks,
  addFlink,
  deleteFlink,
  addGroup,
  deleteGroup,
  updateGroup,
  updateFlink,
  moveFlinkGroup,
  dispatchCheckLatencyWorkflow,
  getApplications,
  approveApplication,
  rejectApplication,
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
  ArrowLeftRegular,
  LinkEditRegular,
  AddRegular,
  ArrowClockwiseRegular,
} from "@fluentui/react-icons";
import {
  Input,
  Button,
  Label,
  Dropdown,
  Option,
  SpinButton,
  Textarea,
  Checkbox,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  ProgressBar,
} from "@fluentui/react-components";
import { BaseDialog } from "@/components/Dialog";
import { rehostImageByUrl, uploadImage } from "@/utils/image";
import Messages, { MessagesRef } from "@/components/Messages";
import "@/styles/flinks.scss";
import stringRandom from "string-random";
function isValidUrl(url: string) {
  return /^https?:\/\/.+/i.test(url);
}
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
    order?: number;
  } | null>(null);
  const [deleteGroupIdx, setDeleteGroupIdx] = useState<number | null>(null);
  const [deleteLinkInfo, setDeleteLinkInfo] = useState<{
    groupIdx: number;
    linkIdx: number;
  } | null>(null);
  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newOrder, setNewOrder] = useState(0);
  const [moveLinkInfo, setMoveLinkInfo] = useState<{
    groupIdx: number;
    linkIdx: number;
  } | null>(null);
  const [moveTargetGroup, setMoveTargetGroup] = useState<number | null>(null);
  const [editing, setEditing] = useState<number>(0);
  const messageBarRef = useRef<MessagesRef>(null);
  const [urlEditing, setUrlEditing] = useState<{
    groupIdx: number;
    linkIdx: number;
  } | null>(null);
  const [urlEditValue, setUrlEditValue] = useState("");

  // 友链申请（待审核）
  const [applications, setApplications] = useState<FlinkApplication[]>([]);
  const [approveTarget, setApproveTarget] = useState<FlinkApplication | null>(null);
  const [approveForm, setApproveForm] = useState({
    group: "",
    name: "",
    link: "",
    avatar: "",
    descr: "",
    color: "#888888",
  });
  const [rejectTarget, setRejectTarget] = useState<FlinkApplication | null>(null);
  // 拒绝理由：留空表示静默丢弃（不发邮件）
  const [rejectReason, setRejectReason] = useState("");
  // 通过时是否把头像转存到本站图床
  const [rehostAvatar, setRehostAvatar] = useState(true);
  // 本站图床前缀（来自 dashboardConfig.imageHost）/ 批量转存状态 / 单个头像转存状态
  const imageHost = (config.imageHost || "").replace(/\/$/, "");
  const [rehostingAll, setRehostingAll] = useState(false);
  // 批量转存进度弹窗的数据
  const [rehostTask, setRehostTask] = useState<{
    running: boolean;
    note?: string;
    items: {
      name: string;
      avatar: string;
      status: "pending" | "running" | "done" | "skipped";
      note?: string;
    }[];
  } | null>(null);
  const [rehostingAvatar, setRehostingAvatar] = useState(false);

  useEffect(() => {
    (async () => {
      // 拉取后排序
      const groups = await getFlinks();
      setFLinks(groups.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    })();
    loadApplications().catch(() => undefined);
  }, []);

  // ---------- 友链申请审批 ----------

  const reloadGroups = async () => {
    const groups = await getFlinks();
    setFLinks(groups.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  };

  const loadApplications = async () => {
    setApplications(await getApplications());
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // 通过前可修改信息：默认用申请内容，修改申请默认定位到它原本所在的分组
  /** 该地址是否已经在本站图床 */
  // 批量转存进度统计
  const rehostDone = rehostTask
    ? rehostTask.items.filter((i) => i.status === "done").length
    : 0;
  const rehostSkipped = rehostTask
    ? rehostTask.items.filter((i) => i.status === "skipped").length
    : 0;
  const rehostFinished = rehostDone + rehostSkipped;
  const rehostTotal = rehostTask?.items.length ?? 0;

  const isOwnHost = (url: string) =>
    !!imageHost && !!url && url.startsWith(imageHost);

  /** 批量转存：把所有不在本站图床的头像下载后转存，图片无法访问的跳过 */
  const rehostAllAvatars = async () => {
    const host = imageHost;
    const targets: { group: string; link: FriendLink }[] = [];
    fLinks.forEach((g) =>
      g.links.forEach((l) => {
        if (l.avatar && !(host && l.avatar.startsWith(host))) {
          targets.push({ group: g.name, link: l });
        }
      })
    );

    setRehostTask({
      running: targets.length > 0,
      note: targets.length === 0 ? "所有头像都已在图床，无需转存" : undefined,
      items: targets.map((t) => ({
        name: t.link.name,
        avatar: t.link.avatar,
        status: "pending" as const,
      })),
    });
    if (targets.length === 0) return;

    const patch = (index: number, data: Partial<{ status: "done" | "skipped" | "running"; note: string }>) =>
      setRehostTask((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((item, i) =>
                i === index ? { ...item, ...data } : item
              ),
            }
          : prev
      );

    setRehostingAll(true);
    try {
      for (let i = 0; i < targets.length; i++) {
        const { group, link } = targets[i];
        patch(i, { status: "running" });
        const url = await rehostImageByUrl(link.avatar);
        if (!url) {
          patch(i, { status: "skipped", note: "图片无法访问" });
          continue;
        }
        const updated = { ...link, avatar: url };
        if (!(await updateFlink(group, updated))) {
          patch(i, { status: "skipped", note: "写入失败" });
          continue;
        }
        patch(i, { status: "done" });
        setFLinks((prev) =>
          prev.map((g) =>
            g.name === group
              ? { ...g, links: g.links.map((l) => (l.id === link.id ? updated : l)) }
              : g
          )
        );
      }
    } finally {
      setRehostTask((prev) => (prev ? { ...prev, running: false } : prev));
      setRehostingAll(false);
    }
  };

  const openApproveDialog = (app: FlinkApplication) => {
    setApproveTarget(app);
    setApproveForm({
      group: app.targetGroup || fLinks[fLinks.length - 1]?.name || "",
      name: app.name,
      link: app.link,
      avatar: app.avatar,
      descr: app.descr,
      color: app.color || "#888888",
    });
    setEditing(Math.random());
  };

  const confirmApprove = async () => {
    if (!approveTarget) return;
    const target = approveTarget;

    // 可选：先把头像下载并转存到本站图床
    let avatar = approveForm.avatar;
    let rehostFailed = false;
    if (rehostAvatar && avatar.trim()) {
      messageBarRef.current?.addMessage("提示", "正在把头像转存到图床…", "info");
      const uploaded = await rehostImageByUrl(avatar.trim());
      if (uploaded) avatar = uploaded;
      else rehostFailed = true;
    }

    const result = await approveApplication({
      id: target.id,
      ...approveForm,
      avatar,
    });
    if (result.ok) {
      setApplications((prev) => prev.filter((a) => a.id !== target.id));
      await reloadGroups();
      const base =
        target.type === 1 ? "修改已应用，友链信息已更新" : "已通过，友链已加入列表";
      messageBarRef.current?.addMessage(
        "提示",
        base +
          (!target.email
            ? "，申请人未填写邮箱，未发送通知"
            : result.mailSent
              ? "，已通知申请人"
              : "，但通知邮件未发出（可让申请人用邮箱自查）") +
          (rehostAvatar
            ? rehostFailed
              ? "，头像转存失败已保留原地址"
              : "，头像已转存到图床"
            : ""),
        "success"
      );
    } else {
      messageBarRef.current?.addMessage(
        "错误",
        target.type === 1 ? "应用修改失败（原友链可能已被删除）" : "通过失败，请重试",
        "error"
      );
    }
    setApproveTarget(null);
    setEditing(Math.random());
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    const target = rejectTarget;
    const reason = rejectReason.trim();
    const result = await rejectApplication(target.id, reason);
    if (result.ok) {
      setApplications((prev) => prev.filter((a) => a.id !== target.id));
      messageBarRef.current?.addMessage(
        "提示",
        reason
          ? result.mailSent
            ? "已拒绝，并已把理由邮件告知对方"
            : "已拒绝（理由邮件发送失败，对方可用邮箱自查）"
          : "已拒绝并静默丢弃（未发送邮件）",
        "success"
      );
    } else {
      messageBarRef.current?.addMessage("错误", "拒绝失败，请重试", "error");
    }
    setRejectTarget(null);
    setRejectReason("");
    setEditing(Math.random());
  };

  // 修改申请：拿出现网信息用于对比
  const findCurrentLink = (app: FlinkApplication) =>
    app.type === 1
      ? fLinks.flatMap((g) => g.links).find((l) => l.id === app.targetId)
      : undefined;
  useEffect(() => {
    const lazyLoadInstance = new LazyLoad({ elements_selector: ".lazy-img" });
    lazyLoadInstance.update();
  }, [
    fLinks,
    editing,
    nameEditing,
    colorEditing,
    descrEditing,
    avatarEditing,
    urlEditing,
  ]);

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
          if (!isValidUrl(avatarInput)) {
            messageBarRef.current?.addMessage(
              "错误",
              "请输入合法的图片链接（以 http:// 或 https:// 开头）",
              "error"
            );
            return;
          }
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
          <div
            style={{ display: "flex", gap: 6, alignItems: "center" }}
            onPaste={async (e) => {
              // 支持直接粘贴剪贴板里的图片：上传后填入链接
              const items = e.clipboardData?.items ?? [];
              for (const item of items) {
                if (!item.type.startsWith("image/")) continue;
                const file = item.getAsFile();
                if (!file) continue;
                e.preventDefault();
                e.stopPropagation();
                const url = await uploadImage(file);
                if (url) {
                  setAvatarInput(url);
                  messageBarRef.current?.addMessage("提示", "已上传剪贴板图片", "success");
                } else {
                  messageBarRef.current?.addMessage("错误", "剪贴板图片上传失败", "error");
                }
                return;
              }
            }}
          >
            {avatarInput && (
              <img
                src={avatarInput}
                alt="预览"
                style={{ width: 36, height: 36, borderRadius: "50%" }}
                onError={(e) => (e.currentTarget.src = config.falldownAvatar)}
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
            <Button
              appearance="secondary"
              disabled={rehostingAvatar || !avatarInput || isOwnHost(avatarInput)}
              title={
                isOwnHost(avatarInput)
                  ? "已经在自有图床，无需转存"
                  : "下载这张图片并转存到本站图床"
              }
              onClick={async () => {
                if (!avatarInput.trim() || isOwnHost(avatarInput)) return;
                setRehostingAvatar(true);
                try {
                  const url = await rehostImageByUrl(avatarInput.trim());
                  if (url) {
                    setAvatarInput(url);
                    messageBarRef.current?.addMessage("提示", "已转存到自有图床", "success");
                  } else {
                    messageBarRef.current?.addMessage(
                      "错误",
                      "转存失败（图片可能无法访问或格式不支持）",
                      "error"
                    );
                  }
                } finally {
                  setRehostingAvatar(false);
                }
              }}
              style={{ height: "fit-content", whiteSpace: "nowrap" }}
            >
              {rehostingAvatar ? "转存中…" : "转存"}
            </Button>
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
              groupEditing.description,
              groupEditing.order ?? 0
            );
            if (ok) {
              setFLinks((prev) =>
                prev
                  .map((group, gi) =>
                    gi === groupEditing.groupIdx
                      ? {
                          ...group,
                          name: groupEditing.name,
                          description: groupEditing.description,
                          order: groupEditing.order ?? 0,
                        }
                      : group
                  )
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
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
              <Label>分组排序</Label>
              <SpinButton
                defaultValue={groupEditing.order ?? 0}
                max={1919810}
                min={-1919810}
                onChange={(_, data) =>
                  setGroupEditing({
                    ...groupEditing,
                    order: Number(data.displayValue ?? 0),
                  })
                }
                placeholder="分组排序"
                style={{ width: "100%", boxSizing: "border-box" }}
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
        content={<div>确定要删除该分组吗？分组下所有友链都会被永久删除！（真的很久！）</div>}
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
        content={<div>确定要删除该友链吗？将会被永久删除！（真的很久！）</div>}
      />

      {/* 新建分组对话框 */}
      <BaseDialog
        title="新建分组"
        open={newGroupDialogOpen}
        onClose={() => {
          setNewGroupDialogOpen(false);
          setNewGroupName("");
          setNewGroupDesc("");
          setNewOrder(
            fLinks.length > 0
              ? Math.max(...fLinks.map((g) => g.order ?? 0))
              : 0 + 1
          );
          setEditing(Math.random());
        }}
        onConfirm={async () => {
          if (newGroupName.trim()) {
            setNewOrder(
              fLinks.length > 0
                ? Math.max(...fLinks.map((g) => g.order ?? 0))
                : 0 + 1
            );
            const ok = await addGroup(
              newGroupName.trim(),
              newGroupDesc.trim(),
              newOrder
            );
            if (ok) {
              setFLinks((prev) =>
                [
                  ...prev,
                  {
                    name: newGroupName.trim(),
                    description: newGroupDesc.trim(),
                    links: [],
                    order: newOrder,
                  },
                ].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              );
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
            <Label>分组排序</Label>
            <SpinButton
              defaultValue={
                fLinks.length > 0
                  ? Math.max(...fLinks.map((g) => g.order ?? 0))
                  : 0 + 1
              }
              max={1919810}
              min={-1919810}
              onChange={(_, data) =>
                setNewOrder(Number(data.displayValue ?? 0))
              }
              placeholder="分组排序"
              style={{ width: "100%", boxSizing: "border-box" }}
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
          if (!isValidUrl(urlEditValue)) {
            messageBarRef.current?.addMessage(
              "错误",
              "请输入合法的链接（以 http:// 或 https:// 开头）",
              "error"
            );
            return;
          }
          if (urlEditing) {
            const group = fLinks[urlEditing.groupIdx];
            const link = group.links[urlEditing.linkIdx];
            const updated = { ...link, url: urlEditValue };
            const ok = await updateFlink(group.name, updated);
            if (ok) {
              setFLinks((prev) =>
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
              messageBarRef.current?.addMessage(
                "提示",
                "链接修改成功",
                "success"
              );
            } else {
              messageBarRef.current?.addMessage(
                "错误",
                "链接修改失败",
                "error"
              );
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

      {/* 友链申请 —— 通过（可先修改信息、选择分组） */}
      <BaseDialog
        title={approveTarget?.type === 1 ? "应用修改申请" : "通过友链申请"}
        open={!!approveTarget}
        onClose={() => {
          setApproveTarget(null);
          setEditing(Math.random());
        }}
        onConfirm={confirmApprove}
        content={
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {approveTarget?.type === 1 && (
              <div className="flink-application-current">
                {findCurrentLink(approveTarget)
                  ? `现网信息：${findCurrentLink(approveTarget)!.name} · ${
                      findCurrentLink(approveTarget)!.url
                    } · ${findCurrentLink(approveTarget)!.description}`
                  : "⚠️ 未找到对应的友链，应用修改可能会失败"}
              </div>
            )}
            <Label>加入分组</Label>
            <Dropdown
              value={approveForm.group || "请选择分组"}
              onOptionSelect={(_, data) =>
                setApproveForm((p) => ({
                  ...p,
                  group: String(data.optionValue ?? ""),
                }))
              }
              style={{ width: "100%" }}
            >
              {fLinks.map((g) => (
                <Option key={g.name} value={g.name}>
                  {g.name}
                </Option>
              ))}
            </Dropdown>
            <Label>站点名称</Label>
            <Input
              value={approveForm.name}
              onChange={(_, d) => setApproveForm((p) => ({ ...p, name: d.value }))}
            />
            <Label>网站链接</Label>
            <Input
              value={approveForm.link}
              onChange={(_, d) => setApproveForm((p) => ({ ...p, link: d.value }))}
            />
            <Label>头像链接</Label>
            <Input
              value={approveForm.avatar}
              onChange={(_, d) => setApproveForm((p) => ({ ...p, avatar: d.value }))}
            />
            <Label>站点描述</Label>
            <Textarea
              value={approveForm.descr}
              resize="vertical"
              onChange={(_, d) => setApproveForm((p) => ({ ...p, descr: d.value }))}
            />
            <Label>背景色</Label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="color"
                value={
                  /^#[0-9a-fA-F]{6}$/.test(approveForm.color)
                    ? approveForm.color
                    : "#888888"
                }
                onChange={(e) =>
                  setApproveForm((p) => ({ ...p, color: e.target.value }))
                }
                style={{ width: 42, height: 32, padding: 2, cursor: "pointer" }}
              />
              <Input
                value={approveForm.color}
                onChange={(_, d) => setApproveForm((p) => ({ ...p, color: d.value }))}
                style={{ flex: 1 }}
              />
            </div>
            <Checkbox
              checked={rehostAvatar}
              onChange={(_, d) => setRehostAvatar(!!d.checked)}
              label="把头像转存到自有图床"
            />
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {approveTarget?.email
                ? `邮箱：${approveTarget.email}（通过后会发送通知邮件）`
                : "申请人未填写邮箱（通过后不会发送通知）"}
            </div>
          </div>
        }
      />

      {/* 友链申请 —— 拒绝（直接删除，与老站一致） */}
      <BaseDialog
        title="拒绝友链申请"
        open={!!rejectTarget}
        onClose={() => {
          setRejectTarget(null);
          setRejectReason("");
          setEditing(Math.random());
        }}
        onConfirm={confirmReject}
        content={
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              确定拒绝 <b>{rejectTarget?.name}</b>（{rejectTarget?.link}）的申请吗？
            </div>
            <Label>拒绝理由（可选）</Label>
            <Textarea
              value={rejectReason}
              resize="vertical"
              placeholder="可选：填写后会通过邮件告知对方"
              onChange={(_, d) => setRejectReason(d.value)}
            />
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {rejectReason.trim() ? "将发送邮件通知对方。" : ""}
              申请记录会保留 14 天，申请人可自行查询结果。
            </div>
          </div>
        }
      />

      {/* 批量转存进度 */}
      <Dialog
        open={!!rehostTask}
        onOpenChange={(_, data) => {
          if (!data.open && !rehostTask?.running) setRehostTask(null);
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>转存友链头像</DialogTitle>
            <DialogContent>
              {rehostTotal > 0 ? (
                <>
                  <div className="flink-rehost-summary">
                    {rehostTask?.running
                      ? `正在转存：已完成 ${rehostFinished}/${rehostTotal}`
                      : `处理完成：成功 ${rehostDone} 个，跳过 ${rehostSkipped} 个`}
                  </div>
                  <ProgressBar
                    value={rehostTotal ? rehostFinished / rehostTotal : 0}
                    thickness="large"
                  />
                  <ul className="flink-rehost-list">
                    {rehostTask?.items.map((item, i) => (
                      <li key={`${item.avatar}-${i}`}>
                        <span className="flink-rehost-name" title={item.name}>
                          {item.name}
                        </span>
                        <ProgressBar
                          className="flink-rehost-bar"
                          value={
                            item.status === "pending"
                              ? 0
                              : item.status === "running"
                                ? undefined
                                : 1
                          }
                          color={
                            item.status === "skipped"
                              ? "error"
                              : item.status === "done"
                                ? "success"
                                : "brand"
                          }
                          thickness="medium"
                        />
                        <span className={`flink-rehost-state ${item.status}`}>
                          {item.status === "pending"
                            ? "等待中"
                            : item.status === "running"
                              ? "转存中…"
                              : item.status === "done"
                                ? "已转存"
                                : item.note || "已跳过"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div>{rehostTask?.note}</div>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                appearance="primary"
                disabled={rehostTask?.running}
                onClick={() => setRehostTask(null)}
              >
                关闭
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <h1>友链</h1>

      <div className="flink-toolbar">
        <Button
          appearance="secondary"
          icon={<ArrowClockwiseRegular />}
          disabled={rehostingAll}
          title={
            imageHost
              ? "把所有不在本站图床的头像下载后转存，无法访问的会自动跳过"
              : "把所有不在本站图床的头像下载后转存，图片无法访问的会自动跳过"
          }
          onClick={rehostAllAvatars}
        >
          {rehostingAll ? "转存中…" : "一键转存所有外链头像"}
        </Button>
      </div>

      {applications.length > 0 && (
        <div className="flink-applications">
          <h2 className="flink-applications-title">
            待审核申请
            <span className="flink-applications-count">{applications.length}</span>
          </h2>
          {applications.map((app) => (
            <div className="flink-application" key={app.id}>
              <img
                className="flink-application-avatar"
                src={app.avatar}
                alt=""
                onError={(e) => {
                  (e.target as HTMLImageElement).src = config.falldownAvatar;
                }}
              />
              <div className="flink-application-main">
                <div className="flink-application-head">
                  <span
                    className={`flink-application-tag${
                      app.type === 1 ? " modify" : ""
                    }`}
                  >
                    {app.type === 1 ? "修改申请" : "新增申请"}
                  </span>
                  <b>{app.name}</b>
                  <a href={app.link} target="_blank" rel="noreferrer">
                    {app.link}
                  </a>
                </div>
                <div className="flink-application-descr">{app.descr}</div>
                <div className="flink-application-meta">
                  {app.email || "未填写邮箱"}
                  {app.createdAt
                    ? ` · ${new Date(app.createdAt).toLocaleString("zh-CN")}`
                    : ""}
                </div>
                {app.type === 1 && (
                  <div className="flink-application-current">
                    {findCurrentLink(app)
                      ? `现网信息：${findCurrentLink(app)!.name} · ${
                          findCurrentLink(app)!.url
                        } · ${findCurrentLink(app)!.description}`
                      : "⚠️ 未找到对应的友链（可能已被删除或移动分组）"}
                  </div>
                )}
              </div>
              <div className="flink-application-actions">
                <Button
                  appearance="primary"
                  size="small"
                  icon={<Checkmark16Regular />}
                  onClick={() => openApproveDialog(app)}
                >
                  通过
                </Button>
                <Button
                  appearance="secondary"
                  size="small"
                  icon={<Dismiss16Regular />}
                  onClick={() => {
                    setRejectTarget(app);
                    setRejectReason("");
                    setEditing(Math.random());
                  }}
                >
                  拒绝
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flink-groups">
        <div className="flink-topbar">
          <Button
            appearance="primary"
            icon={<AddRegular />}
            onClick={() => {
              setNewOrder(
                fLinks.length > 0
                  ? Math.max(...fLinks.map((g) => g.order ?? 0))
                  : 0 + 1
              );
              setNewGroupDialogOpen(true);
              setEditing(Math.random());
            }}
          >
            新建分组
          </Button>
          <Button
            appearance="secondary"
            icon={<ArrowClockwiseRegular />}
            onClick={() => {
              dispatchCheckLatencyWorkflow().then((ok) => {
                if (ok) {
                  messageBarRef.current?.addMessage(
                    "提示",
                    "友链延迟检查已开始，可能需要几分钟，保持您的Internet连接到集线器，坐和放宽。",
                    "success"
                  );
                } else {
                  messageBarRef.current?.addMessage(
                    "错误",
                    "友链延迟检查失败",
                    "error"
                  );
                }
              });
            }}
          >
            重新检查延迟
          </Button>
        </div>
        <h4 style={{marginTop:10, marginBottom: 0}}>
          总计{" "}
          {fLinks
            .map((g) => g.links.length)
            .reduce((prev, curr) => prev + curr, 0)}{" "}
          个友链
        </h4>
        {fLinks
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((item, groupIdx) => (
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
                  title="编辑分组"
                  onClick={() => {
                    setGroupEditing({
                      groupIdx,
                      name: item.name,
                      description: item.description || "",
                      order: item.order ?? 0, // 必须加上
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
                  title="删除分组"
                  onClick={() => {
                    setDeleteGroupIdx(groupIdx);
                    setEditing(Math.random());
                  }}
                  style={{
                    verticalAlign: "middle",
                    marginLeft: 4,
                    color: "red",
                  }}
                />
                <Button
                  appearance="subtle"
                  icon={<AddRegular />}
                  size="small"
                  aria-label="添加该分组下友链"
                  title="添加该分组下友链"
                  onClick={async () => {
                    const newLink = {
                      name: "新友链喵",
                      description: "114514",
                      url: "https://0v0.my",
                      color: "#66ccff",
                      avatar: "https://img.0v0.my/2024/09/06/66dabf7f748c8.jpg",
                      id: stringRandom(32, { letters: "abcdef" }),
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
                />
                <span className="flink-group-descr">{item.description}</span>
                <span className="flink-group-count">
                  共 {item.links.length} 个友链
                </span>
              </div>
              <div className="flink-list">
                {item.links.map((link, linkIdx) => {
                  let linkLatencyColor = "";
                  if (link.latency! > 0) {
                    if (link.latency! < 1) linkLatencyColor = "green";
                    else if (link.latency! < 2)
                      linkLatencyColor = "yellowgreen";
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
                            onChange={(_, data) =>
                              setDescrEditValue(data.value)
                            }
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
                      <Link
                        className="flink-item-button open"
                        href={link.url}
                        aria-label="打开链接"
                        title="打开链接"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <OpenFilled />
                      </Link>

                      <button
                        className="flink-item-button editlink"
                        aria-label="编辑链接"
                        title="编辑链接"
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
                        aria-label="删除友链"
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
                  icon={<AddRegular />}
                  className="flink-group-addlinkbtn"
                  onClick={async () => {
                    const newLink = {
                      name: "新友链喵",
                      description: "114514",
                      url: "https://0v0.my",
                      color: "#66ccff",
                      avatar: "https://img.0v0.my/2024/09/06/66dabf7f748c8.jpg",
                      id: stringRandom(32, { letters: "abcdef" }),
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
