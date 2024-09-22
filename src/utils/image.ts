import { config } from "@/dashboardConfig";

export async function uploadImage(file: File):Promise<string>{
    try{
        const formData=new FormData();
        formData.append("file",file);
        const res=await fetch(`${config.backEndUrl}/update/image/uploadImage`,{
            method:"POST",
            headers:{
                "Accept":"application/json",
                "Authorization":"Bearer "+(localStorage.getItem("token")??"")
            },
            body:formData,
        });
        if(res.ok){
            return (await res.json()).data.data.links.url;
        }
    }
    catch(e){}
    return "";
}