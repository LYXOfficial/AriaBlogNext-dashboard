import { config } from "@/dashboardConfig";
import { FriendLinkGroup, FriendLink } from "@/interfaces/flink";

function getHeader() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + localStorage.getItem("token"),
  };
}

export async function getFlinks(): Promise<FriendLinkGroup[]> {
  try {
    const res = await fetch(`${config.backEndUrl}/get/flink/flinks`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data;
  } catch (e) {
    return [];
  }
}

// 新增分组
export async function addGroup(name: string, description = ""): Promise<boolean> {
  try {
    const res = await fetch(`${config.backEndUrl}/update/flink/addGroup`, {
      method: "POST",
      headers: getHeader(),
      body: JSON.stringify({ name, description }),
    });
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
    return res.ok;
  } catch {
    return false;
  }
}

// 更新分组
export async function updateGroup(old_name: string, name: string, description = ""): Promise<boolean> {
  try {
    const res = await fetch(`${config.backEndUrl}/update/flink/updateGroup`, {
      method: "PUT",
      headers: getHeader(),
      body: JSON.stringify({ old_name, name, description }),
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
    const res = await fetch(`${config.backEndUrl}/update/flink/addFlink`, {
      method: "POST",
      headers: getHeader(),
      body: JSON.stringify({ ...flink, group }),
    });
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
    return res.ok;
  } catch {
    return false;
  }
}