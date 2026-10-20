// Input owns only the movement loop. Rendering and spatial audio continue to use
// the venue's existing camera/invalidation path, with no idle animation loop.
export function mountWalkInput(canvas,panel,{move,reset}={}){
 const vectors={forward:[1,0],back:[-1,0],left:[0,-1],right:[0,1]},keys={KeyW:'forward',ArrowUp:'forward',KeyS:'back',ArrowDown:'back',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
 const held=new Map(),cleanups=[];let enabled=false,raf=0,last=0;
 const listen=(target,name,handler,options)=>{target.addEventListener(name,handler,options);cleanups.push(()=>target.removeEventListener(name,handler,options));};
 const allowed=()=>enabled&&!document.hidden&&!document.querySelector('dialog[open]');
 function axes(){let forward=0,right=0;for(const direction of held.values()){forward+=vectors[direction][0];right+=vectors[direction][1];}return {forward:Math.sign(forward),right:Math.sign(right)};}
 function stop(){held.clear();cancelAnimationFrame(raf);raf=0;panel.querySelectorAll('[data-walk]').forEach(b=>b.classList.remove('is-held'));}
 function frame(now){raf=0;if(!allowed()){stop();return;}if(!held.size)return;move(axes(),Math.min(.05,(now-last)/1000));last=now;raf=requestAnimationFrame(frame);}
 function begin(id,direction){if(!allowed()||held.has(id))return;held.set(id,direction);move(axes(),.05);if(!raf){last=performance.now();raf=requestAnimationFrame(frame);}}
 function end(id){held.delete(id);if(!held.size){cancelAnimationFrame(raf);raf=0;}}
 listen(canvas,'keydown',e=>{const direction=keys[e.code];if(!direction||e.isComposing||e.ctrlKey||e.altKey||e.metaKey||!allowed())return;e.preventDefault();begin(e.code,direction);});
 listen(document,'keyup',e=>end(e.code));
 listen(canvas,'blur',stop);listen(window,'blur',stop);listen(document,'visibilitychange',stop);
 for(const button of panel.querySelectorAll('[data-walk]')){
  const release=e=>{end(`pointer:${e.pointerId}`);button.classList.remove('is-held');};
  listen(button,'pointerdown',e=>{if(e.button!==0||!allowed())return;e.preventDefault();button.setPointerCapture(e.pointerId);button.classList.add('is-held');begin(`pointer:${e.pointerId}`,button.dataset.walk);});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])listen(button,name,release);
  listen(button,'click',e=>{if(e.detail===0&&allowed()){const [forward,right]=vectors[button.dataset.walk];move({forward,right},.05);}});
  listen(button,'contextmenu',e=>e.preventDefault());
 }
 listen(panel.querySelector('#walk-home'),'click',()=>{stop();reset();canvas.focus({preventScroll:true});});
 const dialogs=new MutationObserver(()=>{if(document.querySelector('dialog[open]'))stop();});
 for(const d of document.querySelectorAll('dialog'))dialogs.observe(d,{attributes:true,attributeFilter:['open']});
 return {stop,setEnabled(value){enabled=Boolean(value);if(!enabled)stop();},dispose(){stop();dialogs.disconnect();cleanups.forEach(fn=>fn());}};
}
