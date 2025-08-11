import { config } from "@/dashboardConfig";

export async function convertToWebp(file: File): Promise<File> {
  const imageTypes = ["image/jpeg", "image/png", "image/bmp", "image/jpg"];
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
export async function deleteImage(url: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${config.backEndUrl}/update/image/deleteImage?url=${encodeURIComponent(url)}`,
      {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Authorization": "Bearer " + (localStorage.getItem("token") ?? "")
        }
      }
    );
    if (res.ok) {
      return true;
    }
  } catch (e) {}
  return false;
}
export async function listImages(): Promise<string[]> {
  try {
    const res = await fetch(`${config.backEndUrl}/update/image/listImages`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": "Bearer " + (localStorage.getItem("token") ?? "")
      }
    });
    if (res.ok) {
      return (await res.json()).data.images;
    }
  } catch (e) {}
  return [];
}
export async function reuploadImage(oldUrl: string, file: File): Promise<string> {
  try {
    // 获取原图片扩展名
    const extMatch = oldUrl.match(/\.(\w+)(\?|$)/);
    const ext = extMatch ? extMatch[1].toLowerCase() : "";
    let targetType = "";
    switch (ext) {
      case "jpg":
      case "jpeg":
        targetType = "image/jpeg";
        break;
      case "png":
        targetType = "image/png";
        break;
      case "webp":
        targetType = "image/webp";
        break;
      case "gif":
        targetType = "image/gif";
        break;
      default:
        targetType = file.type; // 保底用原文件类型
    }

    // 自动转换文件类型
    let uploadFile = file;
    if (file.type !== targetType) {
      // 只转换为 jpg/png/webp
      if (["image/jpeg", "image/png", "image/webp"].includes(targetType)) {
        uploadFile = await convertToWebp(file); // 你可以扩展 convertToWebp 支持 png/jpg
      }
      // gif 不转换
    }

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("url", oldUrl);

    const res = await fetch(`${config.backEndUrl}/update/image/reuploadImage`, {
      method: "PUT",
      headers: {
        "Accept": "application/json",
        "Authorization": "Bearer " + (localStorage.getItem("token") ?? ""),
      },
      body: formData,
    });
    if (res.ok) {
      return (await res.json()).data.data.links.url;
    }
  } catch (e) {}
  return "";
}