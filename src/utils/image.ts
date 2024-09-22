export async function uploadImage(file: File):Promise<string>{
    try{
        const formData=new FormData();
        formData.append("file",file);
        const res=await fetch("https://7bu.top/api/v1/upload",{
            method:"POST",
            headers:{
                "Content-Type":"multipart/form-data",
                "Authorization":"Bearer "+(localStorage.getItem("imageToken")??""),
                "Accept":"application/json",
                "Cookie":`XSRF-TOKEN=eyJpdiI6IkJoMmRENVh2MkEvQkM4Nm8rbmZiUEE9PSIsInZhbHVlIjoibjc3WkFLemNVSlBkWG84L2d5NUxKaWpPQ2QvWWtEc3FkT2JmRWc2aTBSYjFLWVNZVGg2YnZld200TFNsbGFvdC92aS9vb3IvTWFyOC9rdXAybnBrY043ejhYMi9Cb2p0U2p4RjhLMllJWE1BNHdhd3VhNUNtbGZneHkydy9rb0MiLCJtYWMiOiJiYmYwODNhYjA5MGMxY2NjN2RhMTZiZTk3NjM2OWMwZTFiOTM1MDc3ZmE3NzUzM2IzZmM5ZmNlMGJkZDFjM2M2IiwidGFnIjoiIn0%3D;`
            },
            body:formData,
            referrerPolicy:"no-referrer",
        });
        if(res.ok){
            return (await res.json()).links.url;
        }
    }
    catch(e){}
    return "";
}