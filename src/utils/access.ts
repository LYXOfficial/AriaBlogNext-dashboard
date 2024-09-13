import jwt, { JwtPayload } from "jsonwebtoken";

export default function verifyToken(token:string|null):boolean{
    if(token){
        const dec=jwt.decode(token) as JwtPayload;
        if(dec&&dec.exp){
            const currentTime=Math.floor(Date.now()/1000);
            if(dec!.exp>=currentTime){
                return true;
            }
        }
    }
    return false;
}
export function exitLogin(){
    window.localStorage.removeItem("token");
}