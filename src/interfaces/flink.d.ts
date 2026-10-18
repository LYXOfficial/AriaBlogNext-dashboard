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
}