"use client";
import { FluentProvider } from '@fluentui/react-components';
import "@/styles/global.scss";
import { lightTheme } from "@/utils/theme";
import NextTopLoader from 'nextjs-toploader';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-cn">
      <head>
        <title>AriaBlogNext - DashBoard</title>
        <link href="https://fonts.googleapis.cn/css2?family=Noto+Serif+SC:wght@400..900&display=swap" rel="stylesheet"/>
      </head>
      <body>
        <NextTopLoader color="#AC4068" height={5}/>
        <div id="web-bg"/>
        <FluentProvider theme={lightTheme}>
          {children}
        </FluentProvider>
      </body>
    </html>
  );
}
