import { api, qs } from "@/utils/api";

/**
 * 图片上传统一出入口：所有落进图床的图片都走 WebP。
 *
 * 两条链路：
 * 1. 本地文件（选择 / 拖拽 / 剪贴板粘贴）→ convertToWebp 后 POST /images/upload；
 * 2. 外链转存 → 先由后端下载进图床（SSRF 校验在后端），再由前端从自有图床读回来转码后回传。
 *    不在前端直接抓第三方图片：对方大多没有 CORS 头，canvas 读出来会是污染图。
 *
 * 例外：gif 可能是动图，canvas 只能取一帧，硬转会掉动画；已经是 webp 的也直接放行。
 */
const CONVERTIBLE_TYPES = ["image/jpeg", "image/png", "image/bmp", "image/jpg"];
/** 拖动 / 系统剪贴板偶尔给不出 MIME，按扩展名兜个底 */
const TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  bmp: "image/bmp",
  gif: "image/gif",
  webp: "image/webp",
};
/** 0.92 是「肉眼看不出差别、体积又明显比 png/jpg 小」的常用档位 */
const WEBP_QUALITY = 0.92;

function typeOf(file: File): string {
  const mime = file.type.toLowerCase();
  // MIME 可信就用 MIME；给不出（拖拽 / 剪贴板）或是 octet-stream 这种笼统值时，
  // 退回看扩展名，否则「明明能转的 png 被当成未知格式放过去」。
  if (CONVERTIBLE_TYPES.includes(mime) || mime === "image/gif" || mime === "image/webp") {
    return mime;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return TYPE_BY_EXT[ext] ?? mime;
}

/** 上传接口按文件名后缀判断格式，所以转换后必须叫 .webp */
function webpName(name: string): string {
  const base = name.replace(/\.[^./\\]+$/, "").trim();
  return `${base || "image"}.webp`;
}

export async function convertToWebp(file: File): Promise<File> {
  if (!CONVERTIBLE_TYPES.includes(typeOf(file))) return file;

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        if (!img.width || !img.height) {
          reject(new Error("图片尺寸为 0，无法转换"));
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("无法获取 Canvas 上下文"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            // 个别浏览器不支持 WebP 编码时会静默回落成 png，这里必须拦住，
            // 否则会把「没转换成功」当成成功传给后端。
            if (!blob || blob.type !== "image/webp") {
              reject(new Error("当前浏览器无法生成 WebP，换个浏览器再试"));
              return;
            }
            resolve(
              new File([blob], webpName(file.name), {
                type: "image/webp",
                lastModified: Date.now(),
              })
            );
          },
          "image/webp",
          WEBP_QUALITY
        );
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("图片打不开，可能已损坏或格式不受支持"));
    };
    img.src = objectUrl;
  });
}

/** POST /images/upload：只负责发请求，不负责转码（避免转码逻辑被调两次） */
async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api<{ url: string }>("POST", "/images/upload", {
    auth: true,
    form: formData,
  });
  return res.ok ? res.data?.url ?? "" : "";
}

export async function uploadImage(file: File): Promise<string> {
  try {
    return await uploadFile(await convertToWebp(file));
  } catch (e) {
    return "";
  }
}

export async function deleteImage(url: string): Promise<boolean> {
  try {
    const res = await api("DELETE", `/images/delete${qs({ url })}`, { auth: true });
    if (res.ok) {
      return true;
    }
  } catch (e) {}
  return false;
}
export async function listImages(): Promise<string[]> {
  try {
    const res = await api<{ images: string[] }>("GET", "/images/list", { auth: true });
    if (res.ok) {
      return res.data?.images ?? [];
    }
  } catch (e) {}
  return [];
}

export async function reuploadImage(oldUrl: string, file: File): Promise<string> {
  try {
    // 覆盖上传要保住旧地址（正文里引用的就是它），所以只转码、不改文件类型。
    // 后端按「新文件的扩展名」写 Content-Type，图片内容就是 WebP。
    const converted = await convertToWebp(file);
    const formData = new FormData();
    formData.append("file", converted);
    formData.append("url", oldUrl);

    const res = await api<{ url: string }>("PUT", "/images/reupload", { auth: true, form: formData });
    if (res.ok) {
      return res.data?.url ?? "";
    }
  } catch (e) {}
  return "";
}

/**
 * 把外链图片转存到自有图床（S3），并且保证存进去的是 WebP。
 * 成功返回新地址；失败返回空字符串（调用方自行决定是否保留原地址）。
 */
export async function rehostImageByUrl(url: string): Promise<string> {
  let imported = "";
  try {
    const res = await api<{ url: string }>("POST", "/images/import", {
      auth: true,
      body: { url },
    });
    if (!res.ok) return "";
    imported = res.data?.url ?? "";
  } catch {
    return "";
  }
  if (!imported) return "";
  return ensureHostedWebp(imported);
}

/**
 * 后端 /images/import 只负责「下载进图床」，不会转码，所以外链头像原样落成 jpg/png。
 * 这里补一步：从自有图床把图读回来（img.0v0.my 带 access-control-allow-origin: *，
 * canvas 不会被污染）→ 转 WebP → 重新上传 → 删掉原图。
 * 任何一步失败都退回原地址：转存本身是成功的，不该因为转码失败整个报错。
 */
async function ensureHostedWebp(url: string): Promise<string> {
  const ext = (url.match(/\.([a-z0-9]+)(?:[?#]|$)/i)?.[1] ?? "").toLowerCase();
  if (ext === "webp" || ext === "gif") return url; // 已是目标格式 / 动图不动
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return url;
    const blob = await res.blob();
    const file = new File([blob], `rehost.${ext || "img"}`, { type: blob.type });
    const webp = await convertToWebp(file);
    if (webp.type !== "image/webp") return url;
    const uploaded = await uploadFile(webp);
    if (!uploaded) return url;
    await deleteImage(url); // 删不掉只是多留一张原图，不影响新地址
    return uploaded;
  } catch {
    return url;
  }
}
