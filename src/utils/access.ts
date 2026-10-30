import { api, ApiResult } from "@/utils/api";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface LoginData {
  token: string;
  user?: string;
  exp?: number;
}

/** 登录。失败时 message 是可直接展示的中文（错误密码与锁定同文案，不暴露锁定状态） */
export function login(user: string, password: string): Promise<ApiResult<LoginData>> {
  return api<LoginData>("POST", "/auth/login", { body: { user, password } });
}

async function verifyToken(token: string | null): Promise<boolean> {
  if (token) {
    // 先本地解包省一次请求；exp 过期也不用问后端
    const dec = jwt.decode(token) as JwtPayload;
    if (dec && dec.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      if (dec!.exp >= currentTime) {
        try {
          const res = await api<null>("GET", "/auth/verify", { auth: true });
          if (res.ok) return true;
        } catch (e) {}
      }
    }
  }
  return false;
}
export function exitLogin() {
  window.localStorage.removeItem("token");
}

export { verifyToken as default, verifyToken };
