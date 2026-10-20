import {planSVG} from '../geometry.js';
import {createViewer} from '../scene.js';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
let viewer,model,mode=params.get('view')==='plan'?'plan':'3d',whole=false,planZoom=1;
function selection(){
 const id=$('space').value,z=model.publicFitout.zones.find(z=>z.id===id);
 $('selection').textContent=z?z.title+' · 尺寸与陈设落位待核':whole?'整层轮廓参照 · 未实测':'三空间连接 · 当前候选布局';
 if(mode==='3d'&&viewer){if(id)viewer.focusFitout(id,{local:false});else if(whole)viewer.reset();else viewer.network();}
 if(mode==='plan'){
  const ids=['cafe-north','alumni-lounge','lobby-seating','classroom-link','connector-102'];
  const pts=(id?model.regions.filter(r=>r.id===id):model.regions.filter(r=>ids.includes(r.id))).flatMap(r=>r.points);
  let box=model.view.planBox;
  if(!whole||id){const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);box=[Math.min(...xs)-55,Math.min(...ys)-55,Math.max(...xs)-Math.min(...xs)+110,Math.max(...ys)-Math.min(...ys)+110];}
  const [x,y,w,h]=box;$('plan').querySelector('svg').setAttribute('viewBox',[x+w/2-w/planZoom/2,y+h/2-h/planZoom/2,w/planZoom,h/planZoom].join(' '));
 }
 const u=new URL(location.href);u.searchParams.set('view',mode);id?u.searchParams.set('focus',id):u.searchParams.delete('focus');history.replaceState(null,'',u);
}
async function show(value){
 mode=value;$('view-3d').setAttribute('aria-pressed',mode==='3d');$('view-plan').setAttribute('aria-pressed',mode==='plan');
 $('scene').hidden=$('labels').hidden=mode!=='3d';$('plan').hidden=mode!=='plan';
 $('ceiling').disabled=mode!=='3d';
 if(mode==='3d'&&!viewer){
  $('loading').hidden=false;
  try{viewer=await createViewer($('scene'),$('labels'),model,id=>{if(model.publicFitout.zones.some(z=>z.id===id)){$('space').value=id;selection();}});$('loading').hidden=true;}
  catch(error){$('loading').textContent='3D 暂未载入；可切换平面图后重试。';console.error(error);return;}
 }
 viewer?.visible(mode==='3d');selection();
}
try{
 const response=await fetch('./model.json');if(!response.ok)throw Error('空间资料未载入');
 model=await response.json();$('plan').innerHTML=planSVG(model);$('loading').hidden=true;
 if(model.publicFitout.zones.some(z=>z.id===params.get('focus')))$('space').value=params.get('focus');
 $('space').onchange=()=>{whole=false;planZoom=1;selection();};
 $('view-3d').onclick=()=>show('3d');$('view-plan').onclick=()=>show('plan');
 $('top').onclick=()=>{if(mode==='3d')viewer?.top();else{planZoom=1;selection();}};
 $('whole').onclick=()=>{$('space').value='';whole=!whole;planZoom=1;selection();};
 $('ceiling').onchange=()=>viewer?.cutaway(!$('ceiling').checked);
 for(const [id,factor] of [['zoom-in',1.2],['zoom-out',1/1.2]])$(id).onclick=()=>{if(mode==='3d')viewer?.zoom(factor);else{planZoom=Math.max(.5,Math.min(5,planZoom*factor));selection();}};
 await show(mode);
}catch(error){$('loading').hidden=false;$('loading').textContent=error.message;console.error(error);}
