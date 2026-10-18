declare interface Config{
    backEndUrl: string,
    blogUrl: string,
    falldownAvatar: string,
    // 本站图床地址前缀（需与后端 S3_PUBLIC_URL 一致），用于判断友链头像是否已转存
    imageHost: string,
}
export const config:Config={
    backEndUrl: "https://blognext-end.yaria.top",
    blogUrl: "https://blog.yaria.top",
    falldownAvatar: "https://img.0v0.my/2024/09/06/66dabf7f748c8.jpg",
    imageHost: "https://img.0v0.my",
}