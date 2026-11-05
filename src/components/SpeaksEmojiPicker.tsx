"use client";
import {
  Button,
  Popover,
  PopoverSurface,
  PopoverTrigger,
} from "@fluentui/react-components";
import { EmojiRegular } from "@fluentui/react-icons";
import { config } from "@/dashboardConfig";
import { useEffect, useMemo, useState } from "react";

/** owo.json 的字段，和 twikoo 用的那份数据完全同构 */
type OwoItem = { text?: string; icon?: string };
type OwoGroup = { type?: "image" | "emoticon"; container?: OwoItem[] };
type OwoData = Record<string, OwoGroup>;

/**
 * 表情来源必须和 twikoo 的 OwO 一致。
 *
 * twikoo 的 EMOTION_CDN 配的就是站点根目录的 `/owo.json`（线上由
 * blog.yaria.top 的 public/ 直接提供，响应带 access-control-allow-origin: *），
 * 所以后台跨域拉同一份，而不是在后台再复制一份——否则以后加表情包两边会走散。
 */
const OWO_URL = `${config.blogUrl}/owo.json`;

// 模块级缓存：一次后台会话只拉一次，面板反复开合不重复下载
let owoPromise: Promise<OwoData> | null = null;

function loadOwo(): Promise<OwoData> {
  if (!owoPromise) {
    owoPromise = fetch(OWO_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<OwoData>;
      })
      .catch((err) => {
        // 失败不缓存，下次打开面板还能重试
        owoPromise = null;
        throw err;
      });
  }
  return owoPromise;
}

const IMG_SRC_RE = /<img[^>]*\bsrc=["']([^"']+)["']/i;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type ParsedEmoji = {
  label: string;
  kind: "image" | "text";
  src?: string;
  text?: string;
  /** 真正插进 Ace 编辑器里的 HTML */
  markup: string;
};

/**
 * owo.json 里有 77 条把 `https://` 写成了 `https:/`（单斜杠）。
 *
 * 不能直接 `new URL(src, window.location.origin)`：当 base 也是 https 时，
 * 单斜杠会被当成相对路径，拼成 `https://<后台域名>/testingcf.jsdelivr.net/...`
 * 然后 404。本地 dev 是 http 页面，scheme 不同反而走绝对解析、看不出问题，
 * 所以这里先把协议补成双斜杠，再按绝对地址解析。
 */
function normalizeEmojiSrc(raw: string): string {
  const src = raw.trim().replace(/^(https?):\/(?!\/)/i, "$1://");
  try {
    return new URL(src).href;
  } catch {
    // 兜底：万一以后出现站内相对路径，再按当前站点补全
    try {
      return new URL(src, window.location.origin).href;
    } catch {
      return src;
    }
  }
}

function parseEmoji(item: OwoItem): ParsedEmoji | null {
  const icon = item.icon ?? "";
  const label = item.text ?? "";
  const img = icon.match(IMG_SRC_RE);
  if (img) {
    const src = normalizeEmojiSrc(img[1]);
    return {
      label,
      kind: "image",
      src,
      markup: `<img class="bb-emoji" src="${escapeHtml(src)}" alt="${escapeHtml(
        label,
      )}">`,
    };
  }
  const text = icon.trim();
  if (!text) return null;
  // 颜文字是纯文本表情，直接插入；转义成实体，避免文本里的特殊字符破坏 HTML
  return { label, kind: "text", text, markup: escapeHtml(text) };
}

export function SpeaksEmojiPicker({
  onInsert,
}: {
  /** 把选中的表情 HTML 插到编辑器光标处 */
  onInsert: (markup: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<OwoData | null>(null);
  const [error, setError] = useState("");
  const [activeGroup, setActiveGroup] = useState("");

  useEffect(() => {
    if (!open || data) return;
    let cancelled = false;
    setError("");
    loadOwo()
      .then((loaded) => {
        if (cancelled) return;
        setData(loaded);
        setActiveGroup((prev) =>
          prev && loaded[prev] ? prev : (Object.keys(loaded)[0] ?? ""),
        );
      })
      .catch(() => {
        if (!cancelled) setError("表情加载失败，可稍后再试");
      });
    return () => {
      cancelled = true;
    };
  }, [open, data]);

  const groups = useMemo(() => (data ? Object.keys(data) : []), [data]);
  const active = data && activeGroup ? data[activeGroup] : undefined;
  const items = useMemo(() => {
    if (!active?.container) return [];
    return active.container
      .map(parseEmoji)
      .filter((item): item is ParsedEmoji => item !== null);
  }, [active]);
  const isTextGroup = active?.type === "emoticon";

  return (
    <Popover
      open={open}
      onOpenChange={(_event, popoverData) => setOpen(popoverData.open)}
      positioning="below-start"
      withArrow
      trapFocus={false}
    >
      <PopoverTrigger disableButtonEnhancement>
        <Button
          icon={<EmojiRegular />}
          size="small"
          title="表情"
          aria-label="表情"
        />
      </PopoverTrigger>
      <PopoverSurface className="speaks-emoji-picker">
        {error ? (
          <div className="speaks-emoji-picker-tip">{error}</div>
        ) : !data ? (
          <div className="speaks-emoji-picker-tip">表情加载中…</div>
        ) : (
          <>
            <div
              className="speaks-emoji-picker-tabs"
              role="tablist"
              aria-label="表情分组"
            >
              {groups.map((group) => (
                <button
                  key={group}
                  type="button"
                  role="tab"
                  aria-selected={group === activeGroup}
                  className="speaks-emoji-picker-tab"
                  onClick={() => setActiveGroup(group)}
                  title={group}
                >
                  {group}
                </button>
              ))}
            </div>
            <div
              className={`speaks-emoji-picker-grid${
                isTextGroup ? " speaks-emoji-picker-grid-text" : ""
              }`}
            >
              {items.map((emoji, index) => (
                <button
                  key={`${activeGroup}-${index}`}
                  type="button"
                  className="speaks-emoji-picker-item"
                  title={emoji.label || emoji.text}
                  aria-label={emoji.label || emoji.text}
                  onClick={() => onInsert(emoji.markup)}
                >
                  {emoji.kind === "image" ? (
                    <img src={emoji.src} alt={emoji.label} loading="lazy" />
                  ) : (
                    <span>{emoji.text}</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </PopoverSurface>
    </Popover>
  );
}
