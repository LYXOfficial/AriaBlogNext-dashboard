import { config } from "@/dashboardConfig";
import pushUpdateTime from "./siteinfo";

export declare interface TagCategory{
    name:string,
    count:number
}

export async function refreshPostsCache(){
    try{await fetch(`${config.blogUrl}/refreshCache/posts`);}
    catch(e){}
}
export async function refreshPostCache(slug:string){
    try{await fetch(`${config.blogUrl}/refreshCache/post/${slug}`);}
    catch(e){}
}
export async function removePost(slug:string):Promise<boolean>{
    try{
        const res=await fetch(`${config.backEndUrl}/update/post/deletePost`, {
            method: 'DELETE',
            headers:{
                'Content-Type': 'application/json',
            },
            body:JSON.stringify({
                slug: slug,
                token: localStorage.getItem('token'),
            })
        });
        refreshPostsCache();
        refreshPostCache(slug);
        pushUpdateTime();
        if(res.ok) return true;
        else return false;
    }
    catch(err){
        return false;
    }
}
export async function getCategories():Promise<TagCategory[]>{
    try{
        const res=await fetch(`${config.backEndUrl}/get/category/categories`);
        if(!res.ok) return [];
        const data=await res.json();
        return data.data;
    }
    catch(e){
        return [];
    }
}
export async function getTags():Promise<TagCategory[]>{
    try{
        const res=await fetch(`${config.backEndUrl}/get/tag/tags`);
        if(!res.ok) return [];
        const data=await res.json();
        return data.data;
    }
    catch(e){
        return [];
    }
}