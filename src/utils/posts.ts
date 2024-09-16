import { config } from "@/dashboardConfig";
import pushUpdateTime from "./siteinfo";
import { Post } from "@/interfaces/post";
import moment from "moment";

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
export async function updatePostInfo(post:Post):Promise<boolean>{
    try{
        const res=await fetch(`${config.backEndUrl}/update/post/updatePostInfo`, {
            method: 'PUT',
            headers:{
                'Content-Type': 'application/json',
            },
            body:JSON.stringify({
                ...post,
                lastUpdatedTime:moment().unix(),
                token: localStorage.getItem('token'),
            })
        });
        refreshPostsCache();
        refreshPostCache(post.slug!);
        pushUpdateTime();
        if(res.ok) return true;
        else return false;
    }
    catch(err){
        return false;
    }
}
export async function removeDraft(slug:string):Promise<boolean>{
    try{
        const res=await fetch(`${config.backEndUrl}/update/draft/deleteDraft`, {
            method: 'DELETE',
            headers:{
                'Content-Type': 'application/json',
            },
            body:JSON.stringify({
                slug: slug,
                token: localStorage.getItem('token'),
            })
        });
        if(res.ok) return true;
        else return false;
    }
    catch(err){
        return false;
    }
}
export async function updateDraftInfo(post:Post):Promise<boolean>{
    try{
        const res=await fetch(`${config.backEndUrl}/update/draft/updateDraftInfo`, {
            method: 'PUT',
            headers:{
                'Content-Type': 'application/json',
            },
            body:JSON.stringify({
                ...post,
                lastUpdatedTime:moment().unix(),
                token: localStorage.getItem('token'),
            })
        });
        if(res.ok) return true;
        else return false;
    }
    catch(err){
        return false;
    }
}

export async function getPostBySlug(slug:string):Promise<Post>{
    try{
        const res=await fetch(`${config.backEndUrl}/get/post/postBySlug?slug=${slug}`);
        if(!res.ok) return {};
        const data=await res.json();
        return data.data;
    }
    catch(err){
        return {};
    }
}
export async function getDraftBySlug(slug:string):Promise<Post>{
    try{
        const res=await fetch(`${config.backEndUrl}/get/draft/draftBySlug?slug=${slug}`);
        const data=await res.json();
        return data.data;
    }
    catch(err){
        return {};
    }
}
export async function updatePostMarkdown(markdown:string,slug:string):Promise<boolean>{
    try{
        const res=await fetch(`${config.backEndUrl}/update/post/updatePostMarkdown`,{
            method: 'PUT',
            headers:{
                'Content-Type': 'application/json',
            },
            body:JSON.stringify({
                slug:slug,
                markdown:markdown,
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
export async function updateDraftMarkdown(markdown:string,slug:string):Promise<boolean>{
    try{
        const res=await fetch(`${config.backEndUrl}/update/draft/updateDraftMarkdown`,{
            method: 'PUT',
            headers:{
                'Content-Type': 'application/json',
            },
            body:JSON.stringify({
                slug:slug,
                markdown:markdown,
                token: localStorage.getItem('token'),
            })
        });
        if(res.ok) return true;
        else return false;
    }
    catch(err){
        return false;
    }
}
export async function addPost(post:Post):Promise<boolean>{
    try{
        const res=await fetch(`${config.backEndUrl}/update/post/addPost`,{
            method: 'POST',
            headers:{
                'Content-Type': 'application/json',
            },
            body:JSON.stringify({
                ...post,
                token: localStorage.getItem('token'),
            })
        });
        refreshPostsCache();
        pushUpdateTime();
        if(res.ok) return true;
        else return false;
    }
    catch(err){
        return false;
    }
}
export async function addDraft(post:Post):Promise<boolean>{
    try{
        const res=await fetch(`${config.backEndUrl}/update/draft/addDraft`,{
            method: 'POST',
            headers:{
                'Content-Type': 'application/json',
            },
            body:JSON.stringify({
                ...post,
                token: localStorage.getItem('token'),
            })
        });
        if(res.ok) return true;
        else return false;
    }
    catch(err){
        return false;
    }
}