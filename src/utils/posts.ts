import { api, qs, ApiResult } from "@/utils/api";
import { Post } from "@/interfaces/post";
import moment from "moment";

export declare interface TagCategory {
  name: string,
  count: number
}

// ---------- 计数与搜索（旧 count/search 接口都合并成了 list 的参数） ----------

/** 文章总数 */
export function getPostCount(): Promise<ApiResult<number>> {
  return api<null>("GET", "/posts/list?countOnly=true").then(withCountHelper);
}

/** 分类种类数 */
export function getCategoryCount(): Promise<ApiResult<number>> {
  return api<null>("GET", "/categories/list?countOnly=true").then(withCountHelper);
}

/** 标签种类数 */
export function getTagCount(): Promise<ApiResult<number>> {
  return api<null>("GET", "/tags/list?countOnly=true").then(withCountHelper);
}

/** 草稿总数（需要登录） */
export function getDraftCount(): Promise<ApiResult<number>> {
  return api<null>("GET", "/drafts/list?countOnly=true", { auth: true }).then(withCountHelper);
}

/** 按标题搜索文章：只取数量 */
export function countPostsByTitle(query: string): Promise<ApiResult<number>> {
  return api<null>("GET", `/posts/list${qs({ countOnly: "true", titleOnly: "true", keyword: query })}`)
    .then(withCountHelper);
}

/** 按标题搜索文章：分页列表 */
export function listPostsByTitle(query: string, page: number, pageSize = 20): Promise<ApiResult<Post[]>> {
  return api<Post[]>("GET", `/posts/list${qs({ page, pageSize, titleOnly: "true", keyword: query })}`);
}

// ---------- 友链申请列表之外的草稿搜索 ----------

/** 按标题搜索草稿：只取数量 */
export function countDraftsByTitle(query: string): Promise<ApiResult<number>> {
  return api<null>("GET", `/drafts/list${qs({ countOnly: "true", keyword: query })}`, { auth: true })
    .then(withCountHelper);
}

/** 按标题搜索草稿：分页列表 */
export function listDraftsByTitle(query: string, page: number, pageSize = 20): Promise<ApiResult<Post[]>> {
  return api<Post[]>("GET", `/drafts/list${qs({ page, pageSize, keyword: query })}`, { auth: true });
}

// ---------- 摘要（读缓存 / 强制重新生成） ----------

/**
 * 读取文章摘要缓存（只读，不触发上游生成）。
 * 后台编辑弹窗一打开就会调用，所以必须带 generate=false：
 * 否则缓存 miss 会让后端现场调 LLM（最长 90s），开弹窗就卡住还烧额度。
 */
export function getCachedPostSummary(slug: string): Promise<ApiResult<{ summary: string }>> {
  return api<{ summary: string }>("GET", `/posts/summary${qs({ slug, generate: "false" })}`);
}

/** 强制重新生成摘要 */
export function regeneratePostSummary(slug: string): Promise<ApiResult<{ summary: string }>> {
  return api<{ summary: string }>("POST", "/posts/summary", { auth: true, body: { slug } });
}

// ---------- 分类 / 标签 ----------

export async function getCategories(): Promise<TagCategory[]> {
  try {
    const res = await api<TagCategory[]>("GET", "/categories/list");
    if (res.ok) return res.data ?? [];
  } catch (e) {}
  return [];
}
export async function getTags(): Promise<TagCategory[]> {
  try {
    const res = await api<TagCategory[]>("GET", "/tags/list");
    if (res.ok) return res.data ?? [];
  } catch (e) {}
  return [];
}

// ---------- 文章 CRUD ----------

/**
 * 只把元信息发给后端。
 *
 * 详情接口会带 mdContent（最长 140KB+），而 /posts/create、/posts/update
 * 的 body 上限是 1MB 的普通 JSON（markdown 走单独的 2MB content 接口）。
 * 直接把整篇 post 原样回传，长文发布会撞上限；后端本来也只认这些字段。
 */
function metaPayload(post: Post) {
  return {
    slug: post.slug,
    title: post.title,
    category: post.category,
    tags: post.tags ?? [],
    bannerImg: post.bannerImg,
    description: post.description,
    coverFit: post.coverFit,
    publishTime: post.publishTime,
    lastUpdatedTime: post.lastUpdatedTime,
  };
}

export async function removePost(slug: string): Promise<boolean> {
  try {
    const res = await api("DELETE", `/posts/delete${qs({ slug })}`, { auth: true });
    if (res.ok) return true;
    else return false;
  }
  catch (err) {
    return false;
  }
}

export async function updatePostInfo(post: Post): Promise<boolean> {
  try {
    const res = await api("PUT", "/posts/update", {
      auth: true,
      body: { ...metaPayload(post), lastUpdatedTime: moment().unix() },
    });
    if (res.ok) return true;
    else return false;
  }
  catch (err) {
    return false;
  }
}

export async function removeDraft(slug: string): Promise<boolean> {
  try {
    const res = await api("DELETE", `/drafts/delete${qs({ slug })}`, { auth: true });
    if (res.ok) return true;
    else return false;
  }
  catch (err) {
    return false;
  }
}

export async function updateDraftInfo(post: Post): Promise<boolean> {
  try {
    const res = await api("PUT", "/drafts/update", {
      auth: true,
      body: { ...metaPayload(post), lastUpdatedTime: moment().unix() },
    });
    if (res.ok) return true;
    else return false;
  }
  catch (err) {
    return false;
  }
}

export async function getPostBySlug(slug: string): Promise<Post> {
  try {
    const res = await api<Post>("GET", `/posts/detail${qs({ slug })}`);
    if (res.ok) return res.data ?? {};
  }
  catch (err) {}
  return {};
}

export async function getDraftBySlug(slug: string): Promise<Post> {
  try {
    const res = await api<Post>("GET", `/drafts/detail${qs({ slug })}`, { auth: true });
    if (res.ok) return res.data ?? {};
  }
  catch (err) {}
  return {};
}

export async function updatePostMarkdown(markdown: string, slug: string): Promise<boolean> {
  try {
    const res = await api("PUT", "/posts/content", { auth: true, body: { slug, markdown } });
    if (res.ok) return true;
    else return false;
  }
  catch (err) {
    return false;
  }
}

export async function updateDraftMarkdown(markdown: string, slug: string): Promise<boolean> {
  try {
    const res = await api("PUT", "/drafts/content", { auth: true, body: { slug, markdown } });
    if (res.ok) return true;
    else return false;
  }
  catch (err) {
    return false;
  }
}

export async function addPost(post: Post): Promise<boolean> {
  try {
    const res = await api("POST", "/posts/create", { auth: true, body: metaPayload(post) });
    if (res.ok) return true;
    else return false;
  }
  catch (err) {
    return false;
  }
}

export async function addDraft(post: Post): Promise<boolean> {
  try {
    const res = await api("POST", "/drafts/create", { auth: true, body: metaPayload(post) });
    if (res.ok) return true;
    else return false;
  }
  catch (err) {
    return false;
  }
}

function withCountHelper(r: ApiResult<null>): ApiResult<number> {
  return r.ok ? { ok: true, data: r.meta?.count ?? 0 } : r;
}
