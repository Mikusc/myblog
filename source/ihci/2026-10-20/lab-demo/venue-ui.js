export function filterPosters(posters,query){
  const text=query.trim().toLocaleLowerCase();
  return new Set(posters.filter(p=>`${p.id} ${p.title}`.toLocaleLowerCase().includes(text)).map(p=>p.id));
}
export function joinURL(base,venueId,exhibitionId){
  const url=new URL('./',base);url.searchParams.set('venue',venueId);url.searchParams.set('view','overview');if(exhibitionId)url.searchParams.set('exhibition',exhibitionId);return url;
}
export function mountDisplay(context,observer){
  const link=new URL('./display.html',location.href);link.searchParams.set('venue',context.profile.id);
  document.getElementById('display-link').href=link;
  if(!observer)return;
  document.body.classList.add('display-mode');document.getElementById('display-banner').hidden=false;
  const qr=document.getElementById('display-qr'),url=joinURL(location.href,context.profile.id,context.scope.exhibitionId);
  if(['localhost','127.0.0.1','[::1]'].includes(url.hostname)){
    qr.textContent='本机预览 · 正式地址部署后显示入场二维码';
  }else if(globalThis.qrcode){
    const code=qrcode(0,'M');code.addData(url.href,'Byte');code.make();
    qr.innerHTML=code.createSvgTag({cellSize:4,margin:12,scalable:true})+'<span>扫码加入数字会场</span>';
  }else qr.textContent='入场链接：'+url.href;
  document.getElementById('display-fullscreen').onclick=async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{document.getElementById('display-status').textContent='当前浏览器不支持全屏，可使用浏览器全屏模式';}
  };
}
