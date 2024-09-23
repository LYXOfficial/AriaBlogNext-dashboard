import { config } from "@/dashboardConfig";
import { BB } from "@/interfaces/bb";

export async function refreshSpeaksCache(){
    try{await fetch(`${config.blogUrl}/refreshCache/speaks`);}
    catch(e){}
}
export async function getSpeaks(startl=0,endl:null|number=null):Promise<BB[]|null>{
    try{
        const res=await fetch(`${config.backEndUrl}/get/speaks/speaks?startl=${startl}&endl=${endl}`);
        if(res.ok){
            return (await res.json()).data;
        }
    }
    catch(e){}
    return null;
}
export async function getSpeakCount():Promise<number>{
    try{
        const res=await fetch(`${config.backEndUrl}/get/speaks/speaksCount`);
        if(res.ok){
            return (await res.json()).count;
        }
    }
    catch(e){}
    return 0;
}
export async function removeSpeaks(time:number):Promise<boolean>{
    try{
        const res=await fetch(`${config.backEndUrl}/update/speaks/deleteSpeaks`,{
            method:"DELETE",
            headers:{
                "Content-Type":"application/json",
                "Authorization":`Bearer ${localStorage.getItem("token")}`
            },
            body:JSON.stringify({time})
        });
        if(res.ok){
            refreshSpeaksCache();
            return true;
        }
    }
    catch(e){}
    return false;
}
export async function updateSpeaks(speaks:BB):Promise<boolean>{
    try{
        const res=await fetch(`${config.backEndUrl}/update/speaks/updateSpeaks`,{
            method:"PUT",
            headers:{
                "Content-Type":"application/json",
                "Authorization":`Bearer ${localStorage.getItem("token")}`
            },
            body:JSON.stringify(speaks)
        });
        if(res.ok){
            refreshSpeaksCache();
            return true;
        }
    }
    catch(e){}
    return false;
}
export async function addSpeaks(speaks:BB):Promise<boolean>{
    try{
        const res=await fetch(`${config.backEndUrl}/update/speaks/newSpeaks`,{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization":`Bearer ${localStorage.getItem("token")}`
            },
            body:JSON.stringify(speaks)
        });
        if(res.ok){
            refreshSpeaksCache();
            return true;
        }
    }
    catch(e){}
    return false;
}