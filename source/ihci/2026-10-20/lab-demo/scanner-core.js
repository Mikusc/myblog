// Independent of DOM and MindAR so cancellation races can be tested deterministically.
export class StableTarget {
  constructor({duration=350,maxGap=250,minSamples=3}={}){Object.assign(this,{duration,maxGap,minSamples});this.reset();}
  reset(){this.id=null;this.since=0;this.last=0;this.samples=0;}
  update(id,visible,now){
    if(!visible){if(id===this.id)this.reset();return false;}
    if(this.id!==id||now-this.last>this.maxGap){this.id=id;this.since=now;this.samples=0;}
    this.last=now;this.samples++;
    return this.samples>=this.minSamples&&now-this.since>=this.duration;
  }
}

export class ScanSession {
  constructor({prepare,getMedia,attachVideo,detachVideo,onState=()=>{},onFound=()=>{},onError=()=>{},now=()=>performance.now(),schedule=(fn,ms)=>setTimeout(fn,ms),unschedule=id=>clearTimeout(id)}){
    Object.assign(this,{prepare,getMedia,attachVideo,detachVideo,onState,onFound,onError,now,schedule,unschedule});this.current=null;this.epoch=0;
  }
  active(ctx){return this.current===ctx&&!ctx.abort.signal.aborted;}
  async start(){
    if(this.current)return;
    const ctx={id:++this.epoch,abort:new AbortController(),stream:null,tracker:null,gate:new StableTarget(),deadline:null};this.current=ctx;
    const live=()=>this.active(ctx);
    ctx.deadline=this.schedule(()=>this.fail(Object.assign(Error('扫描启动超时'),{name:'TimeoutError'}),ctx),45000);
    try{
      this.onState('loading');const prepared=await this.prepare(ctx.abort.signal);if(!live())return;
      this.onState('permission');const stream=await this.getMedia();
      if(!live()){stream.getTracks().forEach(track=>track.stop());return;}
      ctx.stream=stream;
      for(const track of stream.getTracks())track.addEventListener?.('ended',()=>{if(live())this.fail(Object.assign(Error('相机流已结束'),{name:'NotReadableError'}),ctx);},{once:true,signal:ctx.abort.signal});
      this.onState('starting');const video=await this.attachVideo(stream,ctx.abort.signal);if(!live())return;
      ctx.tracker=prepared.create(video,(id,visible)=>{
        if(!live())return;
        const target=prepared.targets.find(target=>target.targetIndex===id);if(!target)return;
        const ready=ctx.gate.update(id,visible,this.now());this.onState(visible?'candidate':'scanning');
        if(ready){this.stop('found');this.onFound(target);}
      });
      if(!live()){ctx.tracker.stop();return;}
      this.unschedule(ctx.deadline);ctx.deadline=null;this.onState('scanning');ctx.tracker.start();
    }catch(error){if(live())this.fail(error,ctx);}
  }
  fail(error,ctx=this.current){if(!ctx||!this.active(ctx))return;this.stop('error');this.onError(error);}
  stop(reason='cancelled'){
    const ctx=this.current;if(!ctx)return;
    this.current=null;ctx.abort.abort();this.unschedule(ctx.deadline);
    try{ctx.tracker?.stop();}catch{}
    for(const track of ctx.stream?.getTracks()||[])track.stop();
    this.detachVideo();ctx.gate.reset();this.onState(reason);
  }
}

export function cameraError(code){
  return ({NotAllowedError:'相机未获授权。可以在浏览器设置中允许相机，或直接选择展位。',NotFoundError:'没有找到可用相机。可以直接选择展位进入。',NotReadableError:'相机暂时无法打开，可能正被其他应用使用。',TimeoutError:'等待时间较长，扫描已停止。可以重试或直接选择展位。',InsecureContext:'当前地址无法调用相机。请通过手机可访问的 HTTPS 地址打开。',Unsupported:'这个浏览器暂不支持相机访问。可以换系统浏览器，或直接选择展位。',TargetError:'识别目标载入失败，请检查网络后重试。',Background:'扫描已因页面切到后台而停止，请重新开始。'})[code]||'扫描暂时无法启动。请重试，或直接选择展位进入。';
}
