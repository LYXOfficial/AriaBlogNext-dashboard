"use client";
import { Button, Input, Label } from "@fluentui/react-components";
import "@/styles/login.scss";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "nextjs-toploader/app";
import { login, verifyToken } from "@/utils/access";
import Messages, { MessagesRef } from "@/components/Messages";
import NoSSR from "@/components/NoSSR";
import React from "react";

export default function Page() {
  const userRef = useRef<HTMLInputElement>(null);
  const pwdRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const messageBarRef = useRef<MessagesRef>(null);
  const [logining, setLogining] = useState(false);
  const router = useRouter();
  useEffect(() => {
    // 清理函数必须直接返回给 useEffect；写在 async IIFE 里 React 不会执行（监听器泄漏）
    const keydownHandler = (e: KeyboardEvent) => {
      if (e.key === "Enter") submitRef.current?.click();
    };
    document.addEventListener("keydown", keydownHandler);
    verifyToken(localStorage.getItem("token"))
      .then((res) => {
        if (res) {
          messageBarRef.current?.addMessage(
            "提示",
            "已登录，跳转中...",
            "info"
          );
          setTimeout(() => {
            router.push("/admin/overview");
          }, 1000);
        }
      })
      .catch(() => {});
    return () => document.removeEventListener("keydown", keydownHandler);
  }, []);
  return (
    <>
      <Messages ref={messageBarRef} />
      <NoSSR>
        <div id="login-container">
          <Label size="large" id="login-title">
            登录
            <br />
            AriaのBlog 管理
          </Label>
          <div id="login-form">
            <div className="login-form-line">
              <Label>用户名</Label>
              <Input placeholder="用户名" ref={userRef} />
            </div>
            <div className="login-form-line">
              <Label>密码</Label>
              <Input placeholder="密码" ref={pwdRef} type="password" />
            </div>
            <Button
              id="login-button"
              type="submit"
              appearance="primary"
              ref={submitRef}
              disabled={logining}
              onClick={async () => {
                if (
                  !userRef.current!.value.trim() ||
                  !pwdRef.current!.value.trim()
                ) {
                  messageBarRef.current?.addMessage(
                    "错误",
                    "用户名或密码不能为空！",
                    "error"
                  );
                } else {
                  setLogining(true);
                  try {
                    const res = await login(
                      userRef.current!.value,
                      pwdRef.current!.value,
                    );
                    if (res.ok && res.data?.token) {
                      localStorage.setItem("token", res.data.token);
                      messageBarRef.current?.addMessage(
                        "消息",
                        "登录成功！跳转中...",
                        "success"
                      );
                      setTimeout(() => router.push("/admin/overview"), 2000);
                    } else {
                      // 403：错误密码与锁定同文案（后端不暴露锁定状态）。
                      // 失败时保留原来的“坐和放宽”彩蛋，别把梗删了。
                      if (!res.ok && res.status === 403) {
                        messageBarRef.current?.addMessage(
                          "错误",
                          "登录失败，用户名或密码错误",
                          "error"
                        );
                      }
                      messageBarRef.current?.addMessage(
                        "内部错误",
                        "保持与您的 Internet 管理员联系，坐和放宽。\n这不是你的错，是我们的错。",
                        "error"
                      );
                      setLogining(false);
                    }
                  } catch {
                    // 网络异常也走同一个彩蛋；以前这里会直接抛未处理异常
                    messageBarRef.current?.addMessage(
                      "内部错误",
                      "保持与您的 Internet 管理员联系，坐和放宽。\n这不是你的错，是我们的错。",
                      "error"
                    );
                    setLogining(false);
                  }
                }
              }}
            >
              {logining ? "登录中..." : "登录！"}
            </Button>
          </div>
        </div>
      </NoSSR>
    </>
  );
}
