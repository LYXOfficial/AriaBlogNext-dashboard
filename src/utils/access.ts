import { config } from "@/dashboardConfig";
import jwt, { JwtPayload } from "jsonwebtoken";

export default async function verifyToken(token:string|null):Promise<boolean>{
    if(token){
        const dec=jwt.decode(token) as JwtPayload;
        if(dec&&dec.exp){
            const currentTime=Math.floor(Date.now()/1000);
            if(dec!.exp>=currentTime){
                try{
                    const res=await fetch(`${config.backEndUrl}/access/user/verify`,{headers:{"Authorization":`Bearer ${token}`}})
                    if(res.ok) return true;
                }
                catch(e){}
            }
        }
    }
    return false;
}
export function exitLogin(){
    window.localStorage.removeItem("token");
}