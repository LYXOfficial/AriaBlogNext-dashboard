import { config } from "@/dashboardConfig";
import { FriendLinkGroup } from "@/interfaces/flink";

export async function getFlinks():Promise<FriendLinkGroup[]>{
    try{
        const res=await fetch(`${config.backEndUrl}/get/flink/flinks`);
        if(!res.ok) return [];
        const data=await res.json();
        return data.data;
    }
    catch(e){
        return [];
    }
}