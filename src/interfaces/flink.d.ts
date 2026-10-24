export declare interface FriendLink{
    name: string;
    url: string;
    avatar: string;
    description: string;
    color: string;
    id: string;
    latency?: number;
}
export declare interface FriendLinkGroup{
    name: string;
    description: string;
    order?: number;
    links: FriendLink[];
}

// AI 初筛结论（GitHub Actions 抓站分析后回写）
export declare interface FlinkScreening {
    verdict: "pass" | "review";
    backlink?: "found" | "not_found"; // 是否检测到指向本站的回链
    summary?: string;
    reason?: string;
    model?: string;
    screenedAt?: string;
}

// 友链申请：type 0=新增申请，1=修改已有友链
export declare interface FlinkApplication{
    id: string;
    type: number;
    name: string;
    link: string;
    avatar: string;
    descr: string;
    color: string;
    email: string;
    targetId?: string | null;
    targetGroup?: string | null;
    createdAt?: string;
    aiScreening?: FlinkScreening | null;
}