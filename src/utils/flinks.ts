import { config } from "@/dashboardConfig";
import { FriendLinkGroup, FriendLink, FlinkApplication } from "@/interfaces/flink";

function getHeader() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + localStorage.getItem("token"),
  };
}

export async function refreshFlinksCache(){
    try{await fetch(`${config.blogUrl}/refreshCache/flinks`);}
    catch(e){}
}

export async function getFlinks(): Promise<FriendLinkGroup[]> {
  try {
    const res = await fetch(`${config.backEndUrl}/get/flink/flinks`);
    if (!res.ok) return [];
    const data = await res.json();
    refreshFlinksCache();
    return data.data;
  } catch (e) {
    return [];
  }
}

// 新增分组
export async function addGroup(name: string, description = "",order = 0): Promise<boolean> {
  try {
    const res = await fetch(`${config.backEndUrl}/update/flink/addGroup`, {
      method: "POST",
      headers: getHeader(),
      body: JSON.stringify({ name, description,order }),
    });
    refreshFlinksCache();
    return res.ok;
  } catch {
    return false;
  }
}

// 删除分组
export async function deleteGroup(name: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${config.backEndUrl}/update/flink/deleteGroup?name=${encodeURIComponent(name)}`,
      {
        method: "DELETE",
        headers: getHeader(),
      }
    );
    refreshFlinksCache();
    return res.ok;
  } catch {
    return false;
  }
}

// 更新分组
export async function updateGroup(old_name: string, name: string, description = "", order = 0): Promise<boolean> {
  try {
    const res = await fetch(`${config.backEndUrl}/update/flink/updateGroup`, {
      method: "PUT",
      headers: getHeader(),
      body: JSON.stringify({ old_name, name, description,order }),
    });
    refreshFlinksCache();
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
    const res = await fetch(`${config.backEndUrl}/update/flink/addFlink`, {
      method: "POST",
      headers: getHeader(),
      body: JSON.stringify({ ...flink, group }),
    });
    refreshFlinksCache();
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
    const res = await fetch(`${config.backEndUrl}/update/flink/updateFlink`, {
      method: "PUT",
      headers: getHeader(),
      body: JSON.stringify({ ...flink, group }),
    });
    refreshFlinksCache();
    return res.ok;
  } catch {
    return false;
  }
}

// 删除友链
export async function deleteFlink(group: string, id: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${config.backEndUrl}/update/flink/deleteFlink?group=${encodeURIComponent(group)}&id=${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: getHeader(),
      }
    );
    refreshFlinksCache();
    return res.ok;
  } catch {
    return false;
  }
}

// 移动友链到其他分组
export async function moveFlinkGroup(from_group: string, to_group: string, link_id: string): Promise<boolean> {
  try {
    const res = await fetch(`${config.backEndUrl}/update/flink/moveFlinkGroup`, {
      method: "POST",
      headers: getHeader(),
      body: JSON.stringify({ from_group, to_group, link_id }),
    });
    refreshFlinksCache();
    return res.ok;
  } catch {
    return false;
  }
}

export async function dispatchCheckLatencyWorkflow(): Promise<boolean> {
  try {
    const res = await fetch(
      `${config.backEndUrl}/update/flink/dispatchCheckLatencyWorkflow`,
      { headers: getHeader() }
    );
    return res.ok;
  } catch {
    return false;
  }
}

// ---------- 友链申请审批 ----------

// 待审核申请列表（新增申请与修改申请都在其中）
export async function getApplications(): Promise<FlinkApplication[]> {
  try {
    const res = await fetch(`${config.backEndUrl}/update/flink/applications`, {
      headers: getHeader(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch {
    return [];
  }
}

// 通过申请：group 为目标分组；其余字段可在通过前修改后再提交
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
    const res = await fetch(
      `${config.backEndUrl}/update/flink/approveApplication`,
      {
        method: "POST",
        headers: getHeader(),
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) return { ok: false, mailSent: false };
    refreshFlinksCache();
    // mailSent 表示通过后给申请人发的通知是否成功（SMTP 未配置时为 false）
    const data = await res.json().catch(() => null);
    return { ok: true, mailSent: data?.mailSent === true };
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
    const res = await fetch(
      `${config.backEndUrl}/update/flink/rejectApplication`,
      {
        method: "POST",
        headers: getHeader(),
        body: JSON.stringify({ id, reason }),
      }
    );
    if (!res.ok) return { ok: false, mailSent: false };
    const data = await res.json().catch(() => null);
    return { ok: true, mailSent: data?.mailSent === true };
  } catch {
    return { ok: false, mailSent: false };
  }
}