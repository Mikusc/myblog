// Progressive material enhancement. The venue and discussions never depend on it.
// Only small navigation surfaces use the pinned, locally bundled optical engine.
const preferenceKey='ihci-archive-20261020.glass.reduce';
const body=document.body;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const reducedTransparency=matchMedia('(prefers-reduced-transparency: reduce)');
const highContrast=matchMedia('(prefers-contrast: more)');
const forcedColors=matchMedia('(forced-colors: active)');
const lenses=[...document.querySelectorAll('[data-glass="lens"]')];
const filterCache=new Map();
const cleanups=[];
let enginePromise,engineFailed=false,revision=0,resizeTimer,pointerFrame,layoutFrame;
let preference=false;
try{preference=localStorage.getItem(preferenceKey)==='true';}catch{}

// WebKit can carry :focus-visible through dialog auto-focus / focus restoration.
// Keep focus itself (including keyboard and screen-reader navigation), but don't
// draw a control ring after touch, pen or mouse interaction. Text fields retain
// their native editing cue; typing on a phone keyboard is not keyboard navigation.
let lastPointerTime=-Infinity;
const pointerFocus=()=>{lastPointerTime=performance.now();body.dataset.focusInput='pointer';};
for(const type of ['pointerdown','touchstart','mousedown']){
  document.addEventListener(type,pointerFocus,{capture:true,passive:true});
}
document.addEventListener('keydown',event=>{
  if(event.metaKey||event.altKey||event.ctrlKey||event.isComposing||['Shift','Control','Alt','Meta','Process','Unidentified'].includes(event.key))return;
  const editing=event.target.closest?.('input,textarea,[contenteditable]:not([contenteditable="false"])');
  if(editing&&event.key!=='Tab'&&event.key!=='Escape')return;
  body.dataset.focusInput='keyboard';
},true);
// Assistive activation can arrive without a preceding pointer or key event.
document.addEventListener('click',event=>{
  if(event.isTrusted&&event.detail===0&&performance.now()-lastPointerTime>500)body.dataset.focusInput='keyboard';
},true);

for(const dialog of document.querySelectorAll('dialog')){
  dialog.classList.add('glass-surface');
  dialog.dataset.glass='panel';
}

function removeLens(element){
  filterCache.get(element)?.svg.remove();
  filterCache.delete(element);
  element.style.removeProperty('--glass-filter');
  delete element.dataset.glassLens;
}

function updateIndicator(){
  const footer=document.querySelector('.stage-footer'),stage=document.querySelector('.stage');
  if(footer&&stage)stage.style.setProperty('--footer-height',`${footer.offsetHeight}px`);
  const nav=document.querySelector('.mode-switch');
  const selected=nav?.querySelector('[aria-pressed="true"]');
  if(!selected||!nav.offsetWidth)return;
  nav.style.setProperty('--selection-left',`${selected.offsetLeft}px`);
  nav.style.setProperty('--selection-width',`${selected.offsetWidth}px`);
  nav.dataset.indicatorReady='true';
}

async function updateMaterial(){
  const current=++revision;
  const reduce=preference||reducedTransparency.matches||highContrast.matches||forcedColors.matches;
  const noMotion=reduce||reducedMotion.matches;
  const openDialogs=[...document.querySelectorAll('dialog[open]')];
  const modal=openDialogs.length>0;
  for(const dialog of document.querySelectorAll('dialog'))dialog.classList.toggle('glass-inactive',dialog.open&&dialog!==openDialogs.at(-1));
  body.dataset.glassReduced=String(reduce);
  body.dataset.glassMotion=String(!noMotion);
  body.classList.toggle('glass-dialog-open',modal);
  const checkbox=document.getElementById('glass-reduce');
  if(checkbox)checkbox.checked=preference;
  updateIndicator();

  // CSS is the baseline, including Safari / Firefox and resource-constrained modes.
  const eligible=!noMotion&&!modal&&!document.hidden&&!body.classList.contains('display-mode')
    &&new URL(location.href).searchParams.get('glass')!=='css'&&!engineFailed;
  body.dataset.glassRenderer=reduce?'solid':'css';
  if(!eligible||!lenses.length){lenses.forEach(removeLens);return;}
  try{
    enginePromise??=import('../vendor/liquid-glass-1.2.0/liquid-glass.esm.js');
    const engine=await enginePromise;
    if(current!==revision)return;
    if(!engine.supportsBackdropFilter()){lenses.forEach(removeLens);return;}
    for(const element of lenses){
      const width=Math.ceil(element.clientWidth),height=Math.ceil(element.clientHeight);
      // Never allocate a full-screen displacement map, or maps for hidden controls.
      if(!element.getClientRects().length||width<2||height<2||width*height>60000){removeLens(element);continue;}
      const radius=Math.min(parseFloat(getComputedStyle(element).borderRadius)||24,width/2,height/2);
      const signature=`${width}:${height}:${radius}`;
      if(filterCache.get(element)?.signature===signature)continue;
      removeLens(element);
      const maps=engine.buildMaps({width,height,radius,bezelWidth:Math.min(9,radius),glassThickness:22,refractiveIndex:1.45});
      const id=engine.nextFilterId('fieldnotes-glass');
      const {svg,refs}=engine.createFilterSVG({filterId:id,width,height,blur:2.2,scale:Math.min(maps.maxDisplacement,20),saturation:1.16,specularSlope:.22});
      engine.injectImages(refs,maps.dispUrl,maps.specUrl);
      element.append(svg);
      element.style.setProperty('--glass-filter',`url("#${id}")`);
      element.dataset.glassLens='true';
      filterCache.set(element,{svg,signature});
    }
    if(filterCache.size)body.dataset.glassRenderer='svg';
  }catch(error){
    engineFailed=true;lenses.forEach(removeLens);body.dataset.glassRenderer='css';
    console.warn('玻璃折射不可用，已保留基础视觉与全部功能。',error);
  }
}

function scheduleLayout(){
  cancelAnimationFrame(layoutFrame);
  layoutFrame=requestAnimationFrame(updateIndicator);
  clearTimeout(resizeTimer);
  resizeTimer=setTimeout(updateMaterial,140);
}

const checkbox=document.getElementById('glass-reduce');
checkbox?.addEventListener('change',()=>{
  preference=checkbox.checked;
  try{localStorage.setItem(preferenceKey,String(preference));}catch{}
  updateMaterial();
});
for(const media of [reducedMotion,reducedTransparency,highContrast,forcedColors]){
  media.addEventListener('change',updateMaterial);
  cleanups.push(()=>media.removeEventListener('change',updateMaterial));
}

// Observe only layout and navigation attributes, never discussion text or 3D frames.
if('ResizeObserver' in window){
  const observer=new ResizeObserver(scheduleLayout);
  for(const element of lenses)observer.observe(element);
  const footer=document.querySelector('.stage-footer');if(footer)observer.observe(footer);
  cleanups.push(()=>observer.disconnect());
}
const stateObserver=new MutationObserver(scheduleLayout);
for(const element of document.querySelectorAll('dialog,[data-mode],#look-controls')){
  stateObserver.observe(element,{attributes:true,attributeFilter:['open','aria-pressed','hidden']});
}
cleanups.push(()=>stateObserver.disconnect());

function lightAtPointer(event){
  if(body.dataset.glassMotion==='false'||(event.type==='pointermove'&&event.pointerType!=='mouse'))return;
  const element=event.target.closest?.('[data-glass="lens"],[data-glass="regular"]');
  if(!element)return;
  const {clientX,clientY}=event;
  cancelAnimationFrame(pointerFrame);
  pointerFrame=requestAnimationFrame(()=>{
    const rect=element.getBoundingClientRect();
    element.style.setProperty('--glass-light-x',`${Math.max(0,clientX-rect.left)}px`);
    element.style.setProperty('--glass-light-y',`${Math.max(0,clientY-rect.top)}px`);
  });
}
document.addEventListener('pointermove',lightAtPointer,{passive:true});
document.addEventListener('pointerdown',lightAtPointer,{passive:true});
document.addEventListener('visibilitychange',updateMaterial);
window.addEventListener('pageshow',updateMaterial);
window.addEventListener('storage',event=>{
  if(event.key===preferenceKey||event.key===null){
    try{preference=localStorage.getItem(preferenceKey)==='true';}catch{}
    updateMaterial();
  }
});
window.addEventListener('pagehide',event=>{
  ++revision;clearTimeout(resizeTimer);cancelAnimationFrame(pointerFrame);cancelAnimationFrame(layoutFrame);
  lenses.forEach(removeLens);
  if(!event.persisted){cleanups.forEach(fn=>fn());}
});
updateMaterial();
