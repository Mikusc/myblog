import * as THREE from 'three';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {createModel,world} from './geometry.js';
import {northTopDirection} from './orientation.js';
import {applyCartoonStyle,presentationStyle} from './cartoon.js';
import {localFitoutModel,placedFitoutZones} from './public-fitout.js';

export async function createViewer(container,labelContainer,model,onSelect,onNorthDirection=()=>{},onUserViewChange=()=>{}){
 const refinedTools=model.blenderRefinement?await import('./refined-fitout.js'):null;
 const refinedAssets=refinedTools?await refinedTools.loadRefinedFitout(model):null;
 const style=presentationStyle(model,new URLSearchParams(location.search).get('style')),cartoon=style==='cartoon';
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0x000000,0);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=cartoon?THREE.NoToneMapping:THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.domElement.setAttribute('aria-label',`IEB 一层${cartoon?'卡通预览':'白模'}，可拖动旋转和缩放`);container.append(renderer.domElement);
 const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(model.publicFitout?'#ffffff':'#fffdef',model.publicFitout?'#d5e0e8':'#b3bfa9',cartoon?.9:1.4));
 const sun=new THREE.DirectionalLight('#fff9ef',cartoon?1.35:2.5);sun.position.set(-38,70,-30);sun.castShadow=true;
 Object.assign(sun.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:180});sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0005;sun.shadow.normalBias=.07;scene.add(sun);
 const fill=new THREE.DirectionalLight('#e8efe9',cartoon?.3:.6);fill.position.set(40,20,45);scene.add(fill);
 const built=createModel(THREE,model,{style});refinedTools?.replaceRefinedFitout(built,refinedAssets);scene.add(built.root);built.setCutaway(Boolean(model.view?.defaultCutaway));
 const cartoonStyle=cartoon?applyCartoonStyle(THREE,built.root):null;
 const localPreviews=new Map();
 for(const zone of model.publicFitout?.zones||[]){
   const localModel=localFitoutModel(model,zone.id);if(!localModel)continue;
   const local=createModel(THREE,localModel,{style});refinedTools?.replaceRefinedFitout(local,refinedAssets);local.setCutaway(Boolean(model.view?.defaultCutaway));
   const shading=cartoon?applyCartoonStyle(THREE,local.root):null;local.root.visible=false;scene.add(local.root);localPreviews.set(zone.id,{...local,shading});
 }
 refinedTools?.disposeRefinedSources(refinedAssets);
 const outlineMaterial=new THREE.LineBasicMaterial({color:cartoon?'#597583':'#6f8272',transparent:true,opacity:cartoon?.24:.2});
 for(const root of [built.root,...[...localPreviews.values()].map(p=>p.root)])root.traverse(o=>{if(o.isMesh){o.castShadow=!o.userData.region&&o.userData.level!=='ground';o.receiveShadow=true;if(!(model.assumptions.flatFloor&&o.userData.region)&&o.userData.level!=='ground'&&o.userData.level!=='ceiling')o.add(new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,40),outlineMaterial));}});
 const modelBounds=new THREE.Box3().setFromObject(built.root),center=modelBounds.getCenter(new THREE.Vector3());center.y=0;
 for(const region of model.regions.filter(r=>r.boundarySegments?.length)){
   const points=region.boundarySegments.flatMap(segment=>segment.map(p=>{const [x,z]=world(p,model);return new THREE.Vector3(x,.012,z);}));
   const line=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineDashedMaterial({color:'#908c78',transparent:true,opacity:.7,dashSize:.25,gapSize:.16}));line.computeLineDistances();built.root.add(line);
 }
 const floorOutline=model.regions.flatMap(r=>r.points.map(p=>world(p,model)));
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(240,180),new THREE.ShadowMaterial({color:'#6e8063',opacity:.12}));ground.rotation.x=-Math.PI/2;ground.position.y=-.2;ground.receiveShadow=true;scene.add(ground);
 const grid=new THREE.GridHelper(130,26,'#a6b997','#cdd6bf');grid.material.transparent=true;grid.material.opacity=.17;grid.position.y=-.19;grid.visible=!model.assumptions.flatFloor&&!model.view?.hideGrid;scene.add(grid);
 for(const cut of model.cuts){const points=cut.points.map(p=>{const [x,z]=world(p,model);return new THREE.Vector3(x,.05,z);});const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineDashedMaterial({color:'#b98352',dashSize:.6,gapSize:.4}));line.computeLineDistances();scene.add(line);}
 const camera=new THREE.OrthographicCamera(-60,60,50,-50,.1,500);camera.position.set(center.x+24,85,center.z+79);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(center);controls.enableDamping=false;controls.minPolarAngle=.00005;controls.maxPolarAngle=Math.PI*.475;controls.minZoom=.35;controls.maxZoom=18;controls.maxTargetRadius=180;controls.zoomToCursor=true;controls.update();
 let width=1,height=1,visible=true,pending=false,labelsVisible=true,networkView=false,connectionsVisible=true,fitoutVisible=true,selected=null,down=null,fitTarget=null,fitDirection=null,focusedZone=null,connectionFocused=false,connectionViewId=null,topView=false,topDirection=[0,150,.02];
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 const names=new Set(model.view?.labels||['foyer','reception','atrium','arrival','coffee','classroom-1','classroom-2','exhibition','west-core']);
 const labels=model.regions.map(region=>{const element=document.createElement('span');element.className='scene-label';const name=region.shortName||region.name.replace('（局部）','');element.textContent=name+(model.layoutReview&&region.evidence==='inferred-completion'&&!name.includes('待核')?' · 待核':'');labelContainer.append(element);const [x,z]=world(region.label,model);return {region,element,point:new THREE.Vector3(x,.35,z)};});
 if(cartoon)for(const zone of placedFitoutZones(model)){
  const element=document.createElement('span');element.className='scene-label field-label';element.textContent=zone.sceneLabel||((zone.shortTitle||zone.title.split(' · ')[0])+(zone.isCandidatePlacement?' · 暂定':' · 示意'));if(zone.isCandidatePlacement)element.classList.add('candidate-label');labelContainer.append(element);
  if(zone.areaIdentification?.confirmed){element.classList.add('area-confirmed-label');element.title='确认上方两电梯厅之间的区域身份；尺寸、边线和坐标仍待配准。';}
  const [x,z]=world(zone.origin,model);names.add(zone.id);labels.push({region:{id:zone.id,fieldZone:true},element,point:new THREE.Vector3(x,1.5,z)});
 }
 for(const node of [...(model.integration?.nodes||[]),...(model.integration?.conflicts||[]).map(c=>({id:c.id,label:'墙 / 门洞待核',origin:c.point,relationMarker:true}))]){const element=document.createElement('span');element.className='scene-label candidate-label';element.textContent=node.label+' · 暂定';labelContainer.append(element);const [x,z]=world(node.origin,model);names.add(node.id);labels.push({region:{id:node.id,fieldZone:true,relationMarker:Boolean(node.relationMarker)},element,point:new THREE.Vector3(x,.4,z)});}
 for(const note of model.connectionReview?.annotations||[]){
  const element=document.createElement('span');element.className='scene-label candidate-label connection-review-label';
  element.textContent=note.text;labelContainer.append(element);names.add(note.id);
  labels.push({region:{id:note.id,fieldZone:true,reviewViews:note.views},element,point:new THREE.Vector3(...note.point)});
 }
 function draw(){
   pending=false;if(!visible||document.hidden)return;renderer.render(scene,camera);
   if(model.orientation){const p=controls.target.clone().project(camera),[nx,nz]=model.orientation.worldNorthXZ,n=controls.target.clone().add(new THREE.Vector3(nx,0,nz)).project(camera);onNorthDirection([(n.x-p.x)*width,-(n.y-p.y)*height]);}
   const priority=item=>item.region.reviewViews?7:item.region.id===selected?6:item.region.fieldZone?5:item.region.roomNumbers?4:item.region.kind==='entrance'?3:item.region.isBase?2:1;
   const reviewLabelsOnly=connectionFocused&&model.connectionReview&&model.connectionAssembly?.views.some(v=>v.id===connectionViewId&&v.reviewNote);
   const occupied=[];
   for(const item of [...labels].sort((a,b)=>priority(b)-priority(a))){
     const p=item.point.clone().project(camera),x=(p.x*.5+.5)*width,y=(-p.y*.5+.5)*height;
     let show=labelsVisible&&(!networkView||item.region.fieldZone)&&(!item.region.fieldZone||fitoutVisible)&&(!item.region.relationMarker||connectionsVisible)&&!focusedZone&&(names.has(item.region.id)||selected===item.region.id)&&p.z>=-1&&p.z<=1&&Math.abs(p.x)<.96&&Math.abs(p.y)<.83;
     if(item.region.reviewViews)show=show&&connectionFocused&&item.region.reviewViews.includes(connectionViewId);
     else if(reviewLabelsOnly)show=false;
     const labelWidth=14+[...item.element.textContent].reduce((total,c)=>total+(c.charCodeAt(0)>255?10:6),0);
     const box={x:x-labelWidth/2,y:y-11,w:labelWidth,h:22};
     if(show&&selected!==item.region.id&&occupied.some(b=>box.x<b.x+b.w&&box.x+box.w>b.x&&box.y<b.y+b.h&&box.y+box.h>b.y))show=false;
     item.element.hidden=!show;if(show){occupied.push(box);item.element.style.left=`${x}px`;item.element.style.top=`${y}px`;item.element.classList.toggle('selected',selected===item.region.id);}
   }
 }
 function invalidate(){if(pending||!visible)return;pending=true;requestAnimationFrame(draw);}
 function showMain(){built.root.visible=true;for(const local of localPreviews.values())local.root.visible=false;}
 function fit(box,resetAngle=false,direction=null){
   const c=box.getCenter(new THREE.Vector3());c.y=0;const offset=camera.position.clone().sub(controls.target);
   if(direction||topView)offset.fromArray(direction||topDirection);else if(resetAngle){offset.fromArray(width<height*.95?(model.view?.portraitDirection||[90,105,16]):(model.view?.landscapeDirection||[24,85,79]));}controls.target.copy(c);camera.position.copy(c).add(offset);camera.zoom=1;camera.updateProjectionMatrix();controls.update();camera.updateMatrixWorld();
   const points=box===modelBounds?floorOutline:[[box.min.x,box.min.z],[box.min.x,box.max.z],[box.max.x,box.min.z],[box.max.x,box.max.z]];
   let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
   for(const [x,z] of points)for(const y of [0,3]){const p=new THREE.Vector3(x,y,z).project(camera);minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}
   const shift=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0).multiplyScalar((minX+maxX)/2*(camera.right-camera.left)/2).add(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1).multiplyScalar(((minY+maxY)/2+(focusedZone?0:.035))*(camera.top-camera.bottom)/2));
   camera.position.add(shift);controls.target.add(shift);camera.zoom=Math.min(focusedZone||connectionFocused?18:6,1.8/Math.max(maxX-minX,.08),1.66/Math.max(maxY-minY,.08));camera.updateProjectionMatrix();controls.update();invalidate();
 }
 function resize(){const rect=container.getBoundingClientRect();if(!rect.width||!rect.height)return;width=rect.width;height=rect.height;renderer.setSize(width,height,false);const aspect=width/height;camera.left=-50*aspect;camera.right=50*aspect;camera.top=50;camera.bottom=-50;camera.updateProjectionMatrix();if(fitTarget)fit(fitTarget,true,topView?null:fitDirection);else fit(modelBounds,true);}
 const observer=new ResizeObserver(resize);observer.observe(container);controls.addEventListener('change',invalidate);
 renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,time:performance.now()};});
 renderer.domElement.addEventListener('pointermove',e=>{if(!down||down.changed||Math.hypot(e.clientX-down.x,e.clientY-down.y)<=5)return;down.changed=true;topView=false;onUserViewChange();});
 renderer.domElement.addEventListener('pointerup',e=>{
   if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5||performance.now()-down.time>600){down=null;return;}down=null;
   if(!built.root.visible)return;
   const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(built.floors)[0];if(hit)onSelect(hit.object.userData.region,false);
 });
 renderer.domElement.addEventListener('pointercancel',()=>{down=null;});
 const onVisibility=()=>invalidate();document.addEventListener('visibilitychange',onVisibility);
 resize();
 return {
  select(id,focus=true){connectionFocused=false;showMain();if(id)networkView=false;selected=id;if(id){focusedZone=null;fitDirection=null;}for(const mesh of built.floors){mesh.material.emissive.set(mesh.userData.region===id?'#426740':'#000000');mesh.material.emissiveIntensity=mesh.userData.region===id?.12:0;}if(focus&&id){const mesh=built.floors.find(o=>o.userData.region===id);fitTarget=new THREE.Box3().setFromObject(mesh).expandByScalar(5);fit(fitTarget);}invalidate();},
  reset(){connectionFocused=false;showMain();networkView=false;selected=null;fitTarget=null;fitDirection=null;focusedZone=null;topView=false;fit(modelBounds,true);},
  network(){connectionFocused=false;showMain();networkView=true;selected=null;focusedZone=null;topView=false;fitTarget=new THREE.Box3().setFromObject(built.fitout.root);fitDirection=model.view?.networkDirection||[0,75,60];fit(fitTarget,true,fitDirection);},
  top(){topView=true;topDirection=[0,150,.02];fit(fitTarget||modelBounds,false,topDirection);},
  north(){if(!model.orientation||!built.root.visible)return;topView=true;topDirection=northTopDirection(model.orientation);fit(fitTarget||modelBounds,false,topDirection);},
  zoom(amount){camera.zoom=THREE.MathUtils.clamp(camera.zoom*amount,.35,18);camera.updateProjectionMatrix();invalidate();},
  opposite(){if(!focusedZone||!fitTarget)return;topView=false;const offset=camera.position.clone().sub(controls.target);offset.x*=-1;offset.z*=-1;fitDirection=offset.toArray();fit(fitTarget,false,fitDirection);},
  cutaway(value){built.setCutaway(value);for(const local of localPreviews.values())local.setCutaway(value);invalidate();},labels(value){labelsVisible=value;invalidate();},
  fitout(value){fitoutVisible=value;built.fitout.setVisible(value);for(const local of localPreviews.values())local.fitout.setVisible(value);invalidate();},
  connections(value){connectionsVisible=value;built.fitout.setConnectionsVisible?.(value);invalidate();},
  focusConnection(viewId){
   const preset=model.connectionAssembly?.views.find(v=>v.id===viewId);if(!preset)return false;
   showMain();connectionFocused=true;connectionViewId=viewId;networkView=true;focusedZone=null;selected=null;topView=false;
   fitTarget=new THREE.Box3(new THREE.Vector3(...preset.min),new THREE.Vector3(...preset.max));fitDirection=preset.direction;
   fit(fitTarget,false,fitDirection);return true;
  },
  focusDetail(id,viewId){
   connectionFocused=false;
   const zone=model.publicFitout?.zones.find(z=>z.id===id),preset=zone?.detailViews?.find(v=>v.id===viewId),local=localPreviews.get(id);
   if(!preset||!local)return false;
   showMain();built.root.visible=false;local.root.visible=true;networkView=false;focusedZone=id;topView=false;
   fitTarget=new THREE.Box3(new THREE.Vector3(...preset.min),new THREE.Vector3(...preset.max));fitDirection=preset.direction;
   fit(fitTarget,false,fitDirection);return true;
  },
  focusFitout(id,{local:isolated=false}={}){
   connectionFocused=false;
   showMain();networkView=false;const local=isolated||!built.fitout.zones.has(id)?localPreviews.get(id):null,entry=(local||built).fitout.zones.get(id);if(!entry)return;
   if(local){built.root.visible=false;local.root.visible=true;}
   focusedZone=id;topView=false;
   const host=entry.zone.relativeTo?.zoneId,hostEntry=host?built.fitout.zones.get(host):null;
   const box=new THREE.Box3().setFromObject(local?local.root:hostEntry?.group||entry.group);
   if(['lobby-seating','lobby-door110'].includes(id))built.root.traverse(mesh=>{if(mesh.isMesh&&mesh.userData.fixture==='main-stair')box.expandByObject(mesh);});
   fitTarget=box;
   const direction=new THREE.Vector3(...(entry.zone.viewDirection||(id==='cafe-north'?[9,11,-15]:id==='lobby-door110'?[-9,10,13]:[7,9,13]))).applyAxisAngle(new THREE.Vector3(0,1,0),entry.group.rotation.y);fitDirection=cartoon?direction.toArray():null;fit(box,true,fitDirection);
  },
  visible(value){visible=value;if(value)resize();},
  dispose(){observer.disconnect();document.removeEventListener('visibilitychange',onVisibility);controls.dispose();renderer.dispose();for(const root of [built.root,...[...localPreviews.values()].map(p=>p.root)])root.traverse(o=>o.geometry?.dispose());cartoonStyle?.dispose();for(const local of localPreviews.values())local.shading?.dispose();renderer.domElement.remove();labelContainer.replaceChildren();}
 };
}
