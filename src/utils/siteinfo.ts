import { config } from "@/dashboardConfig";
export default async function pushUpdateTime(){
    try{
        await fetch(`${config.backEndUrl}/update/siteInfo/latestUpdateTime`,{
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: localStorage.getItem("token")
            })
        });
    }
    catch(e){}
}