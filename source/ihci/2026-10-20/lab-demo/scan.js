import {ScanSession,cameraError} from './scanner-core.js';
import {prepareScanner} from './mindar-adapter.js';
import {returnToVenue,scanResultKey} from './entry.js';
import {venueIdFromURL,loadVenueProfile,scopedURL} from '../venues/registry.js';
const $=id=>document.getElementById(id),video=$('camera');
let context,returnURL;
async function startPage(){
context=await loadVenueProfile(venueIdFromURL(location.href));
const posterIds=context.content.posters.map(p=>p.id);
returnURL=returnToVenue(location.href,{posterIds});
$('scan-context').textContent=`${context.profile.title} · ${context.profile.purpose}`;
document.title=`扫描海报 · ${context.profile.title} | IHCI 数字会场`;
for(const link of document.querySelectorAll('a[href]')){
  const target=new URL(link.getAttribute('href'),location.href);
  if(target.origin===location.origin&&!/\.(png|jpg)$/.test(target.pathname)){target.searchParams.set('venue',context.profile.id);link.href=target.href;}
}
document.querySelector('.manual-entry').replaceChildren(...context.content.posters.map(p=>{const a=document.createElement('a');a.className='button secondary';a.textContent=p.id;const url=scopedURL('./',location.href,context.profile.id);url.searchParams.set('view','explore');url.searchParams.set('poster',p.id);url.searchParams.set('entry','manual');a.href=url.href;return a;}));

$('return-link').href=returnURL.href;
let displayedState=null;
const failCode=new URL(location.href).searchParams.get('failure');
if(failCode){$('scan-status').textContent=cameraError(failCode);$('start-scan').textContent='重新尝试';}
const supported=window.isSecureContext&&!!navigator.mediaDevices?.getUserMedia;
if(!supported){$('scan-status').textContent=cameraError(window.isSecureContext?'Unsupported':'InsecureContext');$('start-scan').disabled=true;}

const session=new ScanSession({
  prepare:signal=>prepareScanner(signal,{manifestURL:context.manifestURL,scope:context.scope,posterIds}),
  getMedia:()=>navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:640},height:{ideal:480},frameRate:{ideal:24,max:30}}}),
  attachVideo:async(stream,signal)=>{
    video.srcObject=stream;
    await new Promise((resolve,reject)=>{
      const clean=()=>{video.removeEventListener('loadedmetadata',ready);video.removeEventListener('error',error);signal.removeEventListener('abort',abort);};
      const ready=()=>{clean();resolve();},error=()=>{clean();reject(Error('视频载入失败'));},abort=()=>{clean();reject(signal.reason);};
      if(signal.aborted){abort();return;}if(video.readyState>=1){ready();return;}
      video.addEventListener('loadedmetadata',ready);video.addEventListener('error',error);signal.addEventListener('abort',abort,{once:true});
    });
    signal.throwIfAborted();video.width=video.videoWidth;video.height=video.videoHeight;await video.play();signal.throwIfAborted();return video;
  },
  detachVideo:()=>{video.pause();video.srcObject=null;},
  onState:state=>{
    if(state===displayedState)return;displayedState=state;
    const labels={loading:'正在准备识别资源…',permission:'请允许浏览器使用相机',starting:'相机已开启，正在准备识别…',scanning:'将整张海报放入画面',candidate:'已发现海报，请保持片刻',found:'识别完成，相机已关闭',cancelled:'扫描已取消',error:'相机已关闭'};
    $('scan-status').textContent=labels[state]||'相机未开启';
    $('camera-placeholder').hidden=['starting','scanning','candidate','found'].includes(state);
    $('start-scan').disabled=!!session.current||!supported;
    document.body.dataset.scanning=String(!!session.current);
  },
  onFound:target=>{
    try{sessionStorage.setItem(scanResultKey(context.scope),JSON.stringify({...target,at:Date.now()}));}catch{}
    const destination=scopedURL('./',location.href,context.profile.id);destination.searchParams.set('view','explore');destination.searchParams.set('poster',target.posterId);destination.searchParams.set('entry','image');destination.searchParams.set('exhibition',context.scope.exhibitionId);location.replace(destination);
  },
  onError:error=>{
    // A new document retires the scanner's WebGL context and all vendor allocations before retry.
    const next=new URL(location.href);next.searchParams.set('failure',error?.name||'Error');location.replace(next);
  }
});
function cancel(event){event?.preventDefault();session.stop();location.replace(returnURL);}
$('start-scan').disabled=!supported;$('start-scan').addEventListener('click',()=>session.start());$('cancel-scan').addEventListener('click',cancel);$('return-link').addEventListener('click',cancel);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&session.current){session.stop('cancelled');const next=new URL(location.href);next.searchParams.set('failure','Background');location.replace(next);}});
window.addEventListener('pagehide',()=>session.stop());window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
window.addEventListener('unhandledrejection',event=>{if(session.current){event.preventDefault();session.fail(event.reason);}});
window.addEventListener('error',event=>{if(session.current)session.fail(event.error||Error('识别失败'));});

}
startPage().catch(error=>{$('start-scan').disabled=true;$('scan-status').textContent=error.message;});
