// Read-only portfolio archive: browsing only; no session, discussion, presence or upload transport.
import {presentationStyle} from '../ieb-floor/cartoon.js';
import {VENUES,venueIdFromURL,loadVenueProfile,sessionKey,switchVenueURL,scopedURL} from '../venues/registry.js';
import {adaptVenueModel,composeExhibition,buildVenueMap} from '../venues/model-adapters.js';
import {resolvePosters,routePoints} from './spatial.js';
import {scanURL,consumeScanResult} from './entry.js';
import {mountProgram} from './program.js';
import {filterPosters} from './venue-ui.js';
import {mountVenueShell} from './mobile-shell.js';

const $=id=>document.getElementById(id);
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let STORAGE,context,mobileUI;
const initialParams=new URL(location.href).searchParams,observer=false;
let model,exhibition,posters=[],venue=null,activeId=null,mode='overview',lookCache={},readingScroll={},past=[],visited=new Set(),token=0,toastTimer,webglAvailable=true;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3400);}
function save(){try{sessionStorage.setItem(STORAGE,JSON.stringify({activeId,lookCache,readingScroll,past,visited:[...visited]}));}catch{}}
function restore(){try{
  const saved=JSON.parse(sessionStorage.getItem(STORAGE));if(!saved)return;
  const ids=new Set(posters.map(p=>p.id));activeId=ids.has(saved.activeId)?saved.activeId:null;
  lookCache=Object.fromEntries(Object.entries(saved.lookCache||{}).filter(([id,look])=>ids.has(id)&&Number.isFinite(look?.yaw)&&Number.isFinite(look?.pitch)));
  readingScroll=saved.readingScroll||{};
  past=(Array.isArray(saved.past)?saved.past:[]).filter(id=>ids.has(id)).slice(-40);
  visited=new Set((Array.isArray(saved.visited)?saved.visited:[]).filter(id=>ids.has(id)));
}catch{}}
function selected(){return posters.find(p=>p.id===activeId);}
function rememberLook(){if(activeId&&venue&&mode==='explore')lookCache[activeId]=venue.getLook();}
function updateRoute(){const url=new URL(location.href);url.searchParams.set('venue',context.profile.id);url.searchParams.set('exhibition',context.scope.exhibitionId);url.searchParams.set('view',mode);activeId?url.searchParams.set('poster',activeId):url.searchParams.delete('poster');history.replaceState(null,'',url);}
function updateUI(){
  const p=selected();
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  document.querySelectorAll('[data-poster]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.poster===activeId)));
  $('visit-count').textContent=`${visited.size} / ${posters.length} 已浏览`;
  $('poster-footer').hidden=(mode==='overview'||!p)&&!(!model&&p);$('overview-footer').hidden=!$('poster-footer').hidden;
  $('walk-controls').hidden=mode!=='explore'||observer;$('look-controls').hidden=mode!=='explore';$('map').hidden=mode!=='map';$('scene').hidden=mode==='map';
  if($('scene').dataset.modelStatus==='loading')$('loading').hidden=mode==='map';
  $('view-caption').textContent=mode==='overview'?(model?.adapter==='ieb'&&presentationStyle(model.sourceModel,initialParams.get('style'))==='cartoon'?'卡通公共区 · 布局待校':'楼层白模 · 高度暂定'):mode==='map'?(context.profile.routes.length?'点击编号进入海报 · 路线为示意':'示例布展 · 展位切换不表示实地路线'):'自由走动 · 按住箭头或 WASD 移动 · 拖动转向';
  $('overview-title').textContent=mode==='map'?'选择地图中的海报编号':'从一个展位开始';
  if(model?.sourceModel?.venueRelease&&mode==='overview')$('overview-title').textContent='大厅 · Alumni · 咖啡厅';
  $('interaction-help').textContent=mode==='map'?'从任意展位进入，继续浏览同一楼层':'拖动旋转 · 滚轮缩放 · 点击展位进入';
  $('start-tour').disabled=false;$('start-tour').innerHTML=activeId?'继续浏览 <span>↗</span>':'开始浏览 <span>↗</span>';
  if(p){$('active-code').textContent=p.id;$('active-room').textContent=`${p.roomName} / ${p.topic}`;$('active-title').textContent=p.title;const next=exhibition.connections.find(c=>c.from===p.id);$('next-poster').disabled=!next;$('next-poster').textContent=next?`下一站 ${next.to} →`:'已到最后一站';$('next-poster').setAttribute('aria-label',next?`前往下一张海报 ${next.to}`:'已到最后一张海报');}
  $('back-spot').disabled=!past.length;
  $('reset-view').disabled=mode==='map';
  mobileUI?.sync();
  updateRoute();save();
  $('open-scanner').href=scanURL(location.href,{posterIds:posters.map(p=>p.id)}).href;
}
function changeMode(next){
  ++token;$('fade').classList.remove('is-active');rememberLook();
  if(!webglAvailable&&next!=='map'){toast('3D 暂不可用，已保留地图与海报阅读');next='map';}
  if(next==='explore'&&!activeId){navigate(exhibition.firstPosterId);return;}
  mode=next;venue?.setVisible(mode!=='map');
  if(mode==='overview')venue?.showOverview();else if(mode==='explore')venue?.enter(activeId,lookCache[activeId]);
  updateUI();
}
async function navigate(id,{back=false,immediate=false}={}){
  if(observer||!posters.some(p=>p.id===id))return;
  const currentToken=++token;rememberLook();
  if(!immediate&&!reduced()){$('fade').classList.add('is-active');await new Promise(r=>setTimeout(r,145));}
  if(currentToken!==token)return;
  if(!back&&activeId&&activeId!==id){past.push(activeId);past=past.slice(-40);}
  activeId=id;visited.add(id);mode=webglAvailable?'explore':'map';
  $('scene-error').hidden=true;venue?.setVisible(mode!=='map');venue?.enter(id,lookCache[id]);
  updateUI();$('fade').classList.remove('is-active');
  if(matchMedia('(max-width:720px)').matches)window.scrollTo({top:0,behavior:'instant'});
}
function showReader(){
  ++token;$('fade').classList.remove('is-active');rememberLook();
  const p=selected();if(!p)return;
  $('reader-code').textContent=`${p.id} / ${p.roomName}`;
  $('reader-content').style.setProperty('--accent',p.color);
  $('reader-content').innerHTML=`<p class="eyebrow">${esc(p.english||p.id)} / ${p.publicationStatus==='approved'?'POSTER':'DEMO'}</p><h1 id="reader-title">${esc(p.title)}</h1><p class="reader-authors">${esc(Array.isArray(p.authors)&&p.authors.length?p.authors.map(a=>typeof a==='string'?a:a.name).join('、'):'作者信息待会务核对')}</p>${p.physicalBooth||p.session?`<p>${esc(p.physicalBooth||'')} · ${esc(p.session||'')}</p>`:''}<div class="reader-summary">${esc(p.summary||'')}</div>${!p.image&&p.publicationStatus!=='approved'?`<div class="concept-art" aria-hidden="true"><div class="nodes"><b>01</b><em>—</em><b>02</b><em>—</em><b>03</b></div><small>${esc(p.english)}</small></div>`:''}${(p.sections||[]).map(s=>`<section><h2>${esc(s.title)}</h2><p>${esc(s.text)}</p></section>`).join('')}${p.url&&/^https?:\/\//.test(p.url)?`<p><a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">查看相关资料 ↗</a></p>`:''}${p.image?`<figure><img src="${esc(p.image)}" alt="${esc(p.title)}海报原图"><figcaption>${esc(p.credit)}</figcaption></figure>`:`<p class="reader-credit">${esc(p.credit)}</p>`}`;
  $('reader').showModal();$('reader-scroll').scrollTop=readingScroll[p.id]||0;venue?.setVisible(false);
}
function renderMap(){
  if(!model){$('map').innerHTML='<div class="map-fallback"><h2>楼层地图暂不可用</h2><p>可从海报目录阅读内容并继续浏览。</p></div>';return;}
  $('map').innerHTML=buildVenueMap(model);
  const svg=$('map').querySelector('svg');svg.setAttribute('role','group');svg.setAttribute('aria-label',`${context.profile.title}展厅平面地图，${posters.length}个海报入口`);
  const routes=exhibition.connections.filter(c=>c.showRoute!==false).map(c=>`<polyline class="map-route" points="${routePoints(c,posters).map(p=>p.join(',')).join(' ')}"/>`).join('');
  svg.insertAdjacentHTML('beforeend',`<g>${routes}</g><g>${posters.map(p=>`<g class="map-node" data-poster="${p.id}" role="button" tabindex="0" aria-pressed="false" aria-label="地图进入 ${p.id} ${esc(p.title)}" style="--accent:${p.color}" transform="translate(${p.positionPx.join(' ')})"><circle r="25"/><text y="6">${p.number}</text></g>`).join('')}</g>`);
  $('map').insertAdjacentHTML('beforeend',`<nav class="map-shortcuts" aria-label="地图展位快捷入口">${posters.map(p=>`<button data-poster="${p.id}" aria-label="地图快捷进入 ${p.id}" aria-pressed="false">${p.id}</button>`).join('')}</nav>`);
  $('map').addEventListener('click',e=>{const node=e.target.closest('[data-poster]');if(node)navigate(node.dataset.poster);});
  $('map').addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)&&e.target.matches('[data-poster]')){e.preventDefault();navigate(e.target.dataset.poster);}});
}
function bind(){
  mobileUI=mountVenueShell({observer,getView:()=>({mode,posterId:activeId}),onStopWalking:()=>venue?.stopWalking(),onMenuChange:()=>venue?.setVisible(mode!=='map'&&!document.querySelector('dialog[open]'))});
  $('poster-search').addEventListener('input',()=>{const ids=filterPosters(posters,$('poster-search').value);document.querySelectorAll('#poster-list [data-poster]').forEach(b=>b.hidden=!ids.has(b.dataset.poster));$('search-empty').hidden=ids.size>0;});
  $('venue-select').addEventListener('change',()=>{rememberLook();save();const url=switchVenueURL(location.href,$('venue-select').value);if(observer)url.searchParams.set('display','1');location.assign(url);});
  $('open-scanner').addEventListener('click',()=>{++token;rememberLook();save();venue?.setVisible(false);});
  $('poster-list').addEventListener('click',e=>{const b=e.target.closest('[data-poster]');if(b)navigate(b.dataset.poster);});
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>changeMode(b.dataset.mode)));
  $('start-tour').addEventListener('click',()=>navigate(activeId||exhibition.firstPosterId));
  $('next-poster').addEventListener('click',()=>{const next=exhibition.connections.find(c=>c.from===activeId);if(next)navigate(next.to);});
  $('back-spot').addEventListener('click',()=>{const id=past.pop();if(id)navigate(id,{back:true});});
  $('read-poster').addEventListener('click',showReader);
  $('close-reader').addEventListener('click',()=>$('reader').close());
  $('reader').addEventListener('close',()=>{readingScroll[activeId]=$('reader-scroll').scrollTop;save();venue?.setVisible(mode!=='map');});
  $('reset-view').addEventListener('click',()=>mode==='overview'?venue?.fitOverview():venue?.recenter());
  $('look-left').addEventListener('click',()=>venue?.turn(-.35));$('look-right').addEventListener('click',()=>venue?.turn(.35));$('look-center').addEventListener('click',()=>venue?.recenter());
  $('error-map').addEventListener('click',()=>{$('scene-error').hidden=true;changeMode('map');});
  $('restart-tour').addEventListener('click',()=>{activeId=null;lookCache={};readingScroll={};past=[];visited.clear();changeMode('overview');venue?.fitOverview();toast('已重新开始演示');if(matchMedia('(max-width:720px)').matches)window.scrollTo({top:0,behavior:'instant'});});
  window.addEventListener('pagehide',()=>{rememberLook();save();});
  window.addEventListener('pageshow',event=>{if(event.persisted)venue?.setVisible(mode!=='map'&&!document.querySelector('dialog[open]'));});
}
async function start(){
  context=await loadVenueProfile(venueIdFromURL(location.href));
  if(initialParams.has('exhibition')&&initialParams.get('exhibition')!==context.scope.exhibitionId)throw Error('这个链接属于另一届展览，当前入口已更新。请从下方选择当前场馆。');
  exhibition=composeExhibition(context.content,context.profile);
  try {
    const response=await fetch(context.modelURL,{signal:AbortSignal.timeout(4500)});if(!response.ok)throw new Error('楼层数据载入失败');
    model=adaptVenueModel(await response.json(),context.profile);posters=resolvePosters(model,exhibition);
  } catch(error) {
    console.warn('楼层不可用，保留目录与海报',error);model=null;webglAvailable=false;
    posters=exhibition.posters.map((p,i)=>({...p,number:String(i+1).padStart(2,'0'),roomName:'展位位置待载入'}));
  }
  STORAGE='ihci-archive-20261020:'+sessionKey(context.scope);if(!observer)restore();
  document.title='IHCI 数字会场 · 2026-10-20 只读存档';document.body.dataset.venue=context.profile.id;
  document.body.dataset.modelRevision=model?.sourceModel?.venueRelease?.revision||'';
  $('venue-select').innerHTML=VENUES.map(v=>`<option value="${v.id}">${v.title} · ${v.purpose}</option>`).join('');$('venue-select').value=context.profile.id;
  $('current-venue').textContent=context.profile.title;$('venue-title').textContent=context.profile.title;$('venue-purpose').textContent=context.profile.purpose;
  $('venue-description').textContent=context.profile.description;$('venue-boundary').textContent=context.profile.description;
  document.querySelector('.brand').href=scopedURL('./',location.href,context.profile.id).href;
  $('plan-link').href=context.planURL.href;$('access-link').href=scopedURL('./access.html',location.href,context.profile.id).href;
  $('poster-count').textContent=String(posters.length).padStart(2,'0');
  $('space-count').textContent=model?.regions.length||'—';
  $('poster-list').innerHTML=posters.map(p=>`<button class="poster-entry" data-poster="${p.id}" aria-pressed="false" aria-label="进入 ${p.id} ${esc(p.title)}" style="--accent:${p.color}"><span class="entry-number">${p.number}</span><span><span class="entry-title">${esc(p.title)}</span><span class="entry-room">${p.id} · ${esc(p.roomName)}</span><span class="entry-activity" data-activity="${p.id}">示例海报</span></span><span class="entry-arrow" aria-hidden="true">↗</span></button>`).join('');
  renderMap();bind();mountProgram(context);
  const params=initialParams,requested=params.get('poster'),requestedMode=observer?'overview':params.get('view');
  const validRequested=posters.some(p=>p.id===requested);
  let scanResult=null;try{scanResult=consumeScanResult(sessionStorage,{posterId:requested,...context.scope});}catch{}
  if(scanResult||['qr-or-link','image'].includes(params.get('entry')))delete lookCache[requested];
  if(!validRequested&&requested){activeId=null;toast('未找到这个展位，可从地图或目录重新选择');}
  $('loading').hidden=true;
  if(!webglAvailable){if(validRequested)await navigate(requested,{immediate:true});else changeMode('map');$('scene-error').hidden=true;toast(model?'3D 暂不可用，平面地图和海报正文仍可浏览':'楼层模型暂不可用，海报目录和正文仍可使用');}
  else if(requestedMode==='map'||requestedMode==='overview'){if(validRequested)activeId=requested;changeMode(requestedMode);}
  else if(validRequested)await navigate(requested,{immediate:true});
  else if(!requested&&requestedMode==='explore')await navigate(activeId||exhibition.firstPosterId,{immediate:true});
  else changeMode('overview');
  if(scanResult)toast(`已识别 ${scanResult.posterId}，相机已关闭`);
  const cleanURL=new URL(location.href);cleanURL.searchParams.delete('entry');cleanURL.searchParams.delete('thread');cleanURL.searchParams.delete('display');history.replaceState(null,'',cleanURL);
  try{
    if(!model)return;
    const {createVenue}=await import('./scene.js');
    if(model.sourceModel?.venueRelease){$('loading').hidden=mode==='map';$('loading').textContent='正在载入 IEB R18 · 大厅 / Alumni / 咖啡厅';}
    venue=await createVenue($('scene'),model,exhibition,posters,{observer,onPoster:id=>!observer&&id===activeId&&mode==='explore'?showReader():navigate(id),onLook:look=>{if(activeId){lookCache[activeId]=look;save();}},onUnavailable:reason=>{
      if(reason==='refinement'){toast('精修资源暂未载入，当前显示 R18 基础造型；刷新可重试');return;}
      if(reason==='image'){toast('示例图片暂未载入，仍可打开海报正文');return;}
      if(reason==='restored'){webglAvailable=true;toast('3D 已恢复，可切换回总览或海报浏览');return;}
      webglAvailable=false;changeMode('map');toast('图形显示中断，已切换到平面地图');
    }});
    $('loading').hidden=true;
    if(mode==='overview')venue.showOverview();else if(activeId)venue.enter(activeId,lookCache[activeId]);venue.setVisible(mode!=='map'&&!document.querySelector('dialog[open]'));
  }catch(error){$('loading').hidden=true;console.warn('3D 初始化失败，保留二维入口：',error);webglAvailable=false;changeMode('map');toast('3D 暂不可用，地图和海报仍可使用');}
}

start().catch(error=>{console.error(error);$('loading').hidden=false;$('loading').innerHTML=`<strong>展厅暂时无法载入</strong><span>${esc(error.message)}</span><a class="button secondary" href="./?venue=lab-3f">实验室三楼</a><a class="button secondary" href="./?venue=ieb-1f">IEB 一楼</a>`;});
