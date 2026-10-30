/**
 * new-goapi 后端 API 层（唯一出口）。
 *
 * 所有对后端的请求都从这里走：统一拼 backEndUrl、附带登录态、
 * 拆 `{ok, data, meta}` 信封、把 `error.message`（面向用户的中文）带回来。
 * 契约见 ariablognext-backend-go/docs/api-v1.md。
 *
 * 失败时返回 `{ok:false, status, message}` 而不是抛异常，
 * 方便沿用「失败就 return false / [] / ""」的既有调用风格；
 * 网络层异常（断网等）原样抛出，由调用方兜底。
 */
import { config } from "@/dashboardConfig";

export type ListMeta = {
  page?: number;
  pageSize?: number | "full";
  count: number;
  hasMore?: boolean;
};

export type ApiResult<T> =
  | { ok: true; data: T; meta?: ListMeta }
  | { ok: false; status: number; message: string };

export interface ApiOptions {
  /** 附带 localStorage 里的登录 token（写接口和后台读接口都要） */
  auth?: boolean;
  /** JSON 请求体，自动序列化 */
  body?: unknown;
  /** multipart 表单（图片上传用），不要和 body 同时传 */
  form?: FormData;
}

export async function api<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  opts: ApiOptions = {},
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {};
  if (opts.auth) {
    headers.Authorization = "Bearer " + (localStorage.getItem("token") ?? "");
  }
  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form; // 让浏览器自己带 multipart boundary
  } else if (opts.body !== undefined) {
    body = JSON.stringify(opts.body);
    headers["Content-Type"] = "application/json";
  }
  // 后台要的是实时数据：显式 no-store，连浏览器的 HTTP 缓存/启发式缓存都不碰。
  // 主题色那种「可缓存」的 GET 不在这里，走的是前端 api 层。
  const res = await fetch(`${config.backEndUrl}${path}`, { method, headers, body, cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    return {
      ok: false,
      status: res.status,
      message: err?.error?.message ?? `请求失败（HTTP ${res.status}）`,
    };
  }
  const json = await res.json().catch(() => null);
  if (!json?.ok) {
    return { ok: false, status: res.status, message: json?.error?.message ?? "响应格式异常" };
  }
  return { ok: true, data: json.data as T, meta: json.meta };
}

/** 把 countOnly 响应（data 为 null、数量在 meta.count）规整成 ApiResult<number> */
export function withCount<T>(r: ApiResult<null>): ApiResult<number> {
  return r.ok ? { ok: true, data: r.meta?.count ?? 0 } : r;
}

/** 拼带 query 的路径（自动 encodeURIComponent） */
export function qs(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}
