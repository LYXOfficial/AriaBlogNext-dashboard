import { config } from "@/dashboardConfig";
export async function pushUpdateTime(){
    try{
        await fetch(`${config.backEndUrl}/update/siteInfo/latestUpdateTime`,{
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer "+localStorage.getItem("token")
            }
        });
    }
    catch(e){}
}
export async function getImageToken(){
    try{
        const res = await fetch(`${config.backEndUrl}/get/siteInfo/imageUploadToken`,{
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer "+localStorage.getItem("token")
            }
        });
        const data=await res.json();
        return data.token;
    }
    catch(e){
        return null;
    }
}