import { config } from "@/dashboardConfig";

export async function convertToWebp(file: File): Promise<File> {
  const imageTypes = ["image/jpeg", "image/png", "image/bmp", "image/x-icon"];
  if (!imageTypes.includes(file.type)) return file; // 如果是 webp 或 gif，直接返回原文件

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              const webpFile = new File([blob], file.name.replace(/\.\w+$/, ".webp"), { type: "image/webp" });
              resolve(webpFile); // 返回转换后的webp文件
            } else {
              reject("转换失败");
            }
          }, "image/webp");
        } else {
          reject("无法获取 Canvas 上下文");
        }
      };
      img.onerror = () => reject("加载图片失败");
    };
    reader.onerror = () => reject("读取文件失败");
  });
}


export async function uploadImage(file: File):Promise<string>{
  try{
    file=await convertToWebp(file);
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