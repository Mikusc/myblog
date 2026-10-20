import {validateScanManifest} from './scan-manifest.js';
export async function prepareScanner(signal,{manifestURL=new URL('./scan-targets.json',import.meta.url),scope,posterIds}={}){
    const response=await fetch(manifestURL,{signal});if(!response.ok)throw Object.assign(Error('目标清单不可用'),{name:'TargetError'});
    const manifest=validateScanManifest(await response.json(),{packId:scope?.packId,posterIds});
    const [module,target]=await Promise.all([import('../vendor/mindar-1.2.5/mindar-image.prod.js'),fetch(new URL(manifest.src,manifestURL),{signal})]);
    if(!target.ok)throw Object.assign(Error('目标包不可用'),{name:'TargetError'});
    const buffer=await target.arrayBuffer();
    const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',buffer))].map(v=>v.toString(16).padStart(2,'0')).join('');
    if(hash!==manifest.sha256)throw Object.assign(Error('目标包版本不匹配'),{name:'TargetError'});
    signal.throwIfAborted();
    return {targets:manifest.targets.map(t=>({...t,packId:manifest.packId,exhibitionId:manifest.exhibitionId,...scope})),create(input,onTarget){
      const controller=new module.Controller({inputWidth:input.videoWidth,inputHeight:input.videoHeight,maxTrack:1,missTolerance:0,onUpdate:event=>{if(event.type==='updateMatrix')onTarget(event.targetIndex,!!event.worldMatrix);}});
      const stop=()=>{controller.stopProcessVideo();controller.worker.terminate();};
      try{const {dimensions}=controller.addImageTargetsFromBuffer(buffer);if(dimensions.length!==manifest.targets.length)throw Error('目标数量不匹配');}
      catch(error){stop();throw error;}
      return {start(){controller.dummyRun(input);controller.processVideo(input);},stop};
    }};
}
