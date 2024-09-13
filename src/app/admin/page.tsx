"use client";
import { useEffect } from "react";
import { useRouter } from "nextjs-toploader/app";

export default function Page(){
    const router=useRouter();
    useEffect(()=>{
        router.push("/admin/overview");
    },[]);
    return <></>;
}