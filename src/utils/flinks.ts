import { api, qs, ApiResult } from "@/utils/api";
import { FriendLinkGroup, FriendLink, FlinkApplication } from "@/interfaces/flink";

/** 友链分组列表；失败返回空数组 */
export async function getFlinks(): Promise<FriendLinkGroup[]> {
  try {
    const res = await api<FriendLinkGroup[]>("GET", "/links/list");
    if (res.ok) return res.data ?? [];
  } catch {}
  return [];
}

/** 友链条目总数 */
export function getFlinkCount(): Promise<ApiResult<number>> {
  return api<null>("GET", "/links/list?countOnly=true").then((r) =>
    r.ok ? { ok: true, data: r.meta?.count ?? 0 } : r,
  );
}

// 新增分组
export async function addGroup(name: string, description = "", order = 0): Promise<boolean> {
  try {
    const res = await api("POST", "/links/groups/create", {
      auth: true,
      body: { name, description, order },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// 删除分组
export async function deleteGroup(name: string): Promise<boolean> {
  try {
    const res = await api("DELETE", `/links/groups/delete${qs({ name })}`, { auth: true });
    return res.ok;
  } catch {
    return false;
  }
}

// 更新分组
export async function updateGroup(old_name: string, name: string, description = "", order = 0): Promise<boolean> {
  try {
    const res = await api("PUT", "/links/groups/update", {
      auth: true,
      // 新契约字段是驼峰的 oldName
      body: { oldName: old_name, name, description, order },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// 添加友链
export async function addFlink(
  group: string,
  flink: Omit<FriendLink, "id"> & { id: string }
): Promise<boolean> {
  try {
    const res = await api("POST", "/links/create", { auth: true, body: { ...flink, group } });
    return res.ok;
  } catch {
    return false;
  }
}

// 更新友链
export async function updateFlink(
  group: string,
  flink: FriendLink
): Promise<boolean> {
  try {
    const res = await api("PUT", "/links/update", { auth: true, body: { ...flink, group } });
    return res.ok;
  } catch {
    return false;
  }
}

// 删除友链
export async function deleteFlink(group: string, id: string): Promise<boolean> {
  try {
    const res = await api("DELETE", `/links/delete${qs({ group, id })}`, { auth: true });
    return res.ok;
  } catch {
    return false;
  }
}

// 移动友链到其他分组
export async function moveFlinkGroup(from_group: string, to_group: string, link_id: string): Promise<boolean> {
  try {
    const res = await api("POST", "/links/move", {
      auth: true,
      // 新契约字段是驼峰的 fromGroup/toGroup/id
      body: { fromGroup: from_group, toGroup: to_group, id: link_id },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function dispatchCheckLatencyWorkflow(): Promise<boolean> {
  try {
    const res = await api("POST", "/links/check", { auth: true });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------- 友链申请审批 ----------

// 待审核申请列表（新增申请与修改申请都在其中），按 createdAt 升序（最早的先审）
export async function getApplications(): Promise<FlinkApplication[]> {
  try {
    const res = await api<FlinkApplication[]>("GET", "/links/applications/list", { auth: true });
    if (res.ok) return res.data ?? [];
  } catch {}
  return [];
}

// 通过申请：group 为目标分组；其余字段可在通过前修改后再提交（放 overrides）。
// 返回 mailSent 表示「通过后给申请人的通知邮件」是否发出（SMTP 未配置时为 false）
export async function approveApplication(payload: {
  id: string;
  group: string;
  name?: string;
  link?: string;
  avatar?: string;
  descr?: string;
  color?: string;
}): Promise<{ ok: boolean; mailSent: boolean }> {
  try {
    // 新契约把通过/拒绝合并为 decide；可在通过前修改的字段放在 overrides 里。
    // 注意 overrides 用友链契约的字段名（url/description），不是申请契约（link/descr）：
    // 后端按 store.LinkPatch 反序列化，写错键会被静默忽略（2026-10-30 修复）。
    const overrides: Record<string, string> = {};
    if (payload.name !== undefined) overrides.name = payload.name;
    if (payload.link !== undefined) overrides.url = payload.link;
    if (payload.avatar !== undefined) overrides.avatar = payload.avatar;
    if (payload.descr !== undefined) overrides.description = payload.descr;
    if (payload.color !== undefined) overrides.color = payload.color;
    const res = await api<{ mailSent: boolean }>("POST", "/links/applications/decide", {
      auth: true,
      body: {
        id: payload.id,
        decision: "approved",
        group: payload.group,
        overrides: Object.keys(overrides).length ? overrides : undefined,
      },
    });
    if (!res.ok) return { ok: false, mailSent: false };
    return { ok: true, mailSent: res.data?.mailSent === true };
  } catch {
    return { ok: false, mailSent: false };
  }
}

// 拒绝申请：可选填写理由。
// 填了理由 -> 后端会给申请人发邮件说明；不填 -> 静默丢弃（不发邮件）。
// 申请记录会保留 14 天（申请人可自查），到期后后端自动清理。
export async function rejectApplication(
  id: string,
  reason = ""
): Promise<{ ok: boolean; mailSent: boolean }> {
  try {
    const res = await api<{ mailSent: boolean }>("POST", "/links/applications/decide", {
      auth: true,
      body: { id, decision: "rejected", reason },
    });
    if (!res.ok) return { ok: false, mailSent: false };
    return { ok: true, mailSent: res.data?.mailSent === true };
  } catch {
    return { ok: false, mailSent: false };
  }
}
