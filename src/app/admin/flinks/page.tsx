"use client";
import { config } from '@/dashboardConfig';
import { FriendLinkGroup } from '@/interfaces/flink';
import { getFlinks } from '@/utils/flinks';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import LazyLoad from "vanilla-lazyload";
import "@/styles/flinks.scss";

export default function Flinks(){
  const [fLinks,setFLinks]=useState<FriendLinkGroup[]>([]);
  useEffect(()=>{
    (async ()=>{
      setFLinks(await getFlinks());
    })();
  },[]);
  useEffect(()=>{
    const lazyLoadInstance=new LazyLoad({elements_selector:".lazy-img"});
    lazyLoadInstance.update();
  },[fLinks]);
  return (  
    <>
      <h1>友链</h1>
      <div className="flink-groups">
        <div className="flink-topbar"></div>
        {
          fLinks.map(item=>(
            <div className="flink-group">
              <div className="flink-group-header">
                <h2 className="flink-group-title">{item.name}</h2>
                <span className="flink-group-descr">{item.description}</span>
              </div>
              <div className="flink-list">
                {
                  item.links.map(link=>{
                    let linkLatencyColor="";
                    if(link.latency!>0){
                      if(link.latency!<1) linkLatencyColor="green";
                      else if(link.latency!<2) linkLatencyColor="yellowgreen";
                      else if(link.latency!<5) linkLatencyColor="goldenrod";
                      else linkLatencyColor="orangered";
                    }
                    else if(link.latency){
                      linkLatencyColor="red";
                    }
                    return (
                      <div className="flink-item">
                        <div className="flink-item-avatar" dangerouslySetInnerHTML={{__html:`
                          <img 
                              class="flink-item-avatar-img lazy-img" 
                              src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" 
                              data-src="${link.avatar} "
                              alt="${link.name}"
                              onerror="this.src='${config.falldownAvatar}';"
                          />
                        `}}/>
                        <Link className="flink-item-link" href={link.url}>{link.name}</Link>
                        <div className="flink-item-color">
                          <div className="flink-item-color-box" style={{backgroundColor:link.color}}></div>
                          <div className="flink-item-color-text">
                            {link.color}
                            <span className="flink-item-latency" style={{color:linkLatencyColor}}>
                              {link.latency!>0?` ${Math.round(link.latency!*1000)}ms`:" Error"}
                            </span>
                          </div>
                        </div>
                        <div className="flink-item-descr">{link.description}</div>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          ))
        }
      </div>
    </>
  );
}