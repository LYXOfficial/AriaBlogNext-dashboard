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