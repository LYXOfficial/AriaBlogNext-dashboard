import { api, qs } from "@/utils/api";
import { BB } from "@/interfaces/bb";

/** 说说列表；endl 为空时用 full 拉全量（speaks 允许）。失败返回 null */
export async function getSpeaks(startl = 0, endl: null | number = null): Promise<BB[] | null> {
  try {
    const pageSize = endl !== null && endl > startl ? endl - startl : "full";
    const page = pageSize === "full" ? 1 : Math.floor(startl / pageSize) + 1;
    const res = await api<BB[]>("GET", `/speaks/list${qs({ page, pageSize })}`);
    if (res.ok) {
      return res.data;
    }
  } catch (e) {}
  return null;
}

/** 说说总数 */
export async function getSpeakCount(): Promise<number> {
  try {
    const res = await api<null>("GET", "/speaks/list?countOnly=true");
    if (res.ok) {
      return res.meta?.count ?? 0;
    }
  } catch (e) {}
  return 0;
}

export async function removeSpeaks(time: number): Promise<boolean> {
  try {
    const res = await api("DELETE", `/speaks/delete${qs({ time })}`, { auth: true });
    if (res.ok) {
      return true;
    }
  } catch (e) {}
  return false;
}

export async function updateSpeaks(speaks: BB): Promise<boolean> {
  try {
    const res = await api("PUT", "/speaks/update", { auth: true, body: speaks });
    if (res.ok) {
      return true;
    }
  } catch (e) {}
  return false;
}

export async function addSpeaks(speaks: BB): Promise<boolean> {
  try {
    const res = await api("POST", "/speaks/create", { auth: true, body: speaks });
    if (res.ok) {
      return true;
    }
  } catch (e) {}
  return false;
}
