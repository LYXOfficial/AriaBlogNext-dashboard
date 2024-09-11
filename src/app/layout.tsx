"use client";
import { FluentProvider } from '@fluentui/react-components';
import "@/styles/global.scss";
import { lightTheme } from "@/utils/theme";
import { PartialTheme,Theme } from '@fluentui/react';

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
        <div id="web-bg"/>
        <FluentProvider theme={lightTheme}>
          {children}
        </FluentProvider>
      </body>
    </html>
  );
}
