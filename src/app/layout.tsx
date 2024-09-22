"use client";
import { FluentProvider } from '@fluentui/react-components';
import "@/styles/global.scss";
import { darkTheme, lightTheme } from "@/utils/theme";
import NextTopLoader from 'nextjs-toploader';
import { useState,useEffect } from 'react';

process.env.TZ="Asia/Shanghai";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [currentTheme,setCurrentTheme]=useState(lightTheme);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    if(mediaQuery.matches)
      setCurrentTheme(darkTheme);
    else
      setCurrentTheme(lightTheme);
    const handleChange=(e:MediaQueryListEvent)=>{
      if(e.matches)
        setCurrentTheme(darkTheme);
      else
        setCurrentTheme(lightTheme);
    };
    mediaQuery.addEventListener("change", handleChange);
    // 清除监听器
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);
  return (
    <html lang="zh-cn">
      <head>
        <title>AriaBlogNext - DashBoard</title>
        <link href="https://fonts.googleapis.cn/css2?family=Noto+Sans+SC:wght@400..900&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.cn/css2?family=Noto+Serif+SC:wght@400..900&display=swap" rel="stylesheet"/>
      </head>
      <body>
        <NextTopLoader color="#AC4068" height={5}/>
        <div id="web-bg"/>
        <FluentProvider theme={currentTheme}>
          {children}
        </FluentProvider>
      </body>
    </html>
  );
}
