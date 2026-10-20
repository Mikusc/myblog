import * as THREE from 'three';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {toWorld,polygonArea} from '../lab-floor/geometry.js';
import {buildWalls,routePoints,clamp,cameraRotation} from './spatial.js';
import {createIEBShell} from '../venues/model-adapters.js';
import {safeViewportFrame} from './framing.js';
import {applyCartoonStyle,presentationStyle} from '../ieb-floor/cartoon.js';
import {createWalkSpace,walkStart,moveWalker,walkDelta} from './walk-space.js';
import {mountWalkInput} from './walk-input.js';

const COLORS={lab:'#e2e5eb',office:'#e5e3ec',shared:'#e8e5df',circulation:'#f0f0f3',service:'#d9dce2',outdoor:'#e3e7e2'};

function labelTexture(text,{background,color='#48484a'}={}) {
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=100;
  const ctx=canvas.getContext('2d');
  if(background){ctx.fillStyle=background;ctx.fillRect(0,0,512,100);}
  ctx.fillStyle=color;ctx.font='500 32px -apple-system, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,50,475);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

function conceptTexture(poster) {
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=960;
  const c=canvas.getContext('2d');c.fillStyle='#f8f7ed';c.fillRect(0,0,640,960);
  c.fillStyle=poster.color;c.fillRect(0,0,640,16);c.font='500 15px sans-serif';c.fillText('IHCI 2026   /   DIGITAL VENUE',42,70);
  c.font='100 126px Georgia';c.fillText(poster.number,36,214);
  c.font='500 34px -apple-system, sans-serif';c.fillText(poster.title,42,290,565);
  c.font='500 17px sans-serif';c.fillText(poster.english,44,326);
  c.strokeStyle='#d5ddce';c.beginPath();c.moveTo(44,358);c.lineTo(596,358);c.stroke();
  const nodes=[[136,500],[476,500],[306,681]];
  c.strokeStyle=poster.color;c.globalAlpha=.4;c.lineWidth=3;c.beginPath();c.moveTo(...nodes[0]);c.lineTo(...nodes[1]);c.lineTo(...nodes[2]);c.closePath();c.stroke();c.globalAlpha=1;
  nodes.forEach(([x,y],i)=>{c.fillStyle=i===Number(poster.number)-1?poster.color:'#e4e9dc';c.beginPath();c.arc(x,y,49,0,Math.PI*2);c.fill();c.fillStyle=i===Number(poster.number)-1?'#f8f8ee':poster.color;c.font='26px Georgia';c.textAlign='center';c.fillText('0'+(i+1),x,y+9);});
  c.textAlign='left';c.fillStyle=poster.color;c.font='500 22px -apple-system,sans-serif';c.fillText(poster.topic,44,800);
  c.fillStyle='#8b947f';c.font='16px -apple-system,sans-serif';c.fillText('示例海报 · 点击阅读全文',44,844);c.font='14px sans-serif';c.fillText('DISCOVER  /  EXPLORE  /  RETURN',44,909);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

export async function createVenue(container,model,exhibition,posters,{onPoster,onLook,onUnavailable,onThread,observer:displayOnly=false}={}) {
  const refined=model.adapter==='ieb'&&model.sourceModel.blenderRefinement?await import('../ieb-floor/refined-fitout.js'):null;
  let refinedAssets=null;
  if(refined){
    container.dataset.modelStatus='loading';
    try{refinedAssets=await refined.loadRefinedFitout(model.sourceModel);container.dataset.modelStatus='refined';}
    catch(error){console.warn('精修模型载入失败，显示同版基础几何',error);container.dataset.modelStatus='fallback';onUnavailable?.('refinement');}
  }
  const style=model.adapter==='ieb'?presentationStyle(model.sourceModel,new URLSearchParams(location.search).get('style')):'reference',cartoon=style==='cartoon';
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=cartoon?THREE.NoToneMapping:THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','三维展厅：总览时拖动旋转；海报浏览时 WASD 或方向键移动，拖动转向');container.append(canvas);
  // Neutral illumination keeps the venue from tinting every glass control green.
  const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight('#ffffff','#a4a8b0',cartoon?.9:2));
  const sun=new THREE.DirectionalLight('#ffffff',cartoon?1.35:2.6);sun.position.set(-30,70,35);scene.add(sun);
  const fill=new THREE.DirectionalLight('#eef3ff',cartoon?.3:.8);fill.position.set(65,20,-30);scene.add(fill);
  const overviewCamera=new THREE.OrthographicCamera(-45,45,45,-45,.1,400);
  const camera=new THREE.PerspectiveCamera(62,1,.06,200);camera.rotation.order='YXZ';
  const controls=new OrbitControls(overviewCamera,canvas);controls.enableDamping=false;controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI*.46;controls.minZoom=.5;controls.maxZoom=4;
  const overviewLabels=new THREE.Group(),markers=new THREE.Group();scene.add(overviewLabels,markers);
  const boxGeometry=new THREE.BoxGeometry(1,1,1),matCache=new Map(),pickables=[],occluders=[];
  const material=color=>{if(!matCache.has(color))matCache.set(color,new THREE.MeshLambertMaterial({color}));return matCache.get(color);};
  const box=(parent,position,size,color)=>{const mesh=new THREE.Mesh(boxGeometry,material(color));mesh.position.set(...position);mesh.scale.set(...size);parent.add(mesh);return mesh;};
  const iebShell=model.adapter==='ieb'?createIEBShell(THREE,model,{style}):null;
  if(iebShell&&refinedAssets){refined.replaceRefinedFitout(iebShell,refinedAssets);refined.disposeRefinedSources(refinedAssets);}
  const cartoonStyle=cartoon?applyCartoonStyle(THREE,iebShell.root):null;
  if(iebShell){
    scene.add(iebShell.root);iebShell.setCutaway(true);occluders.push(...iebShell.verticals.map(v=>v.mesh));
    if(model.sourceModel.venueRelease)iebShell.fitout.root.traverse(o=>{if(o.isMesh&&o.userData.level==='architecture')occluders.push(o);});
    for(const room of model.regions.filter(r=>!r.isBase&&!r.contextOnly&&!r.hideLabel&&(['lab','office','shared'].includes(r.category)||model.sourceModel.venueRelease&&['lobby-seating','alumni-lounge','cafe-north'].includes(r.id)))){
      const label=new THREE.Mesh(new THREE.PlaneGeometry(5,1),new THREE.MeshBasicMaterial({map:labelTexture(room.name),transparent:true,depthWrite:false}));
      label.rotation.x=-Math.PI/2;label.position.set(...toWorld(room.label,model.coordinates,.04));overviewLabels.add(label);
    }
  }else{
  const shape=polygon=>new THREE.Shape(polygon.map(p=>{const [x,,z]=toWorld(p,model.coordinates);return new THREE.Vector2(x,-z);}));
  const slab=new THREE.Mesh(new THREE.ExtrudeGeometry(shape(model.footprint),{depth:.28,bevelEnabled:false}),material('#c7c9d0'));
  slab.rotation.x=-Math.PI/2;slab.position.y=-.28;scene.add(slab);
  for(const room of model.regions) {
    const floor=new THREE.Mesh(new THREE.ShapeGeometry(shape(room.polygon)),material(COLORS[room.category]));floor.rotation.x=-Math.PI/2;floor.position.y=room.category==='outdoor'?-.02:.015;scene.add(floor);
    const vertices=[...room.polygon,room.polygon[0]].map(p=>new THREE.Vector3(...toWorld(p,model.coordinates,.025)));
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(vertices),new THREE.LineBasicMaterial({color:'#aeb2ba',transparent:true,opacity:.48})));
    if(['lab','office','shared'].includes(room.category)&&polygonArea(room.polygon)>5000) {
      const label=new THREE.Mesh(new THREE.PlaneGeometry(5,1),new THREE.MeshBasicMaterial({map:labelTexture(room.name),transparent:true,depthWrite:false}));
      label.rotation.x=-Math.PI/2;label.position.set(...toWorld(room.label,model.coordinates,.04));overviewLabels.add(label);
    }
  }
  const wallData=buildWalls(model,exhibition),wallMesh=new THREE.InstancedMesh(boxGeometry,material('#f5f5f7'),wallData.length),dummy=new THREE.Object3D();
  wallData.forEach((wall,i)=>{
    const a=toWorld(wall.a,model.coordinates),b=toWorld(wall.b,model.coordinates);
    const dx=b[0]-a[0],dz=b[2]-a[2];dummy.position.set((a[0]+b[0])/2,wall.base+wall.height/2,(a[2]+b[2])/2);dummy.rotation.set(0,-Math.atan2(dz,dx),0);dummy.scale.set(Math.hypot(dx,dz),wall.height,.13);dummy.updateMatrix();wallMesh.setMatrixAt(i,dummy.matrix);
  });wallMesh.instanceMatrix.needsUpdate=true;scene.add(wallMesh);occluders.push(wallMesh);
  const columns=new THREE.InstancedMesh(boxGeometry,material('#b1b4bc'),model.columns.length);
  model.columns.forEach((point,i)=>{dummy.position.set(...toWorld(point,model.coordinates,exhibition.wallHeight/2));dummy.rotation.set(0,0,0);dummy.scale.set(.52,exhibition.wallHeight,.52);dummy.updateMatrix();columns.setMatrixAt(i,dummy.matrix);});columns.instanceMatrix.needsUpdate=true;scene.add(columns);occluders.push(columns);
  }
  const routeVertices=[];
  for(const connection of exhibition.connections.filter(c=>c.showRoute!==false)) {
    const points=routePoints(connection,posters);
    for(let i=1;i<points.length;i++) routeVertices.push(new THREE.Vector3(...toWorld(points[i-1],model.coordinates,.055)),new THREE.Vector3(...toWorld(points[i],model.coordinates,.055)));
  }
  const routes=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(routeVertices),new THREE.LineBasicMaterial({color:'#729acb',transparent:true,opacity:.38}));overviewLabels.add(routes);
  const textureLoader=new THREE.TextureLoader();
  for(const poster of posters) {
    const stand=new THREE.Group();stand.position.set(poster.position[0],0,poster.position[2]);stand.rotation.y=Math.atan2(poster.normal[0],poster.normal[1]);scene.add(stand);
    occluders.push(box(stand,[0,exhibition.eyeHeight,0],[1.37,2.00,.12],poster.color));
    box(stand,[-.46,.37,0],[.055,.74,.08],'#a4a7af');box(stand,[.46,.37,0],[.055,.74,.08],'#a4a7af');box(stand,[0,.06,0],[1.05,.08,.5],'#a4a7af');
    const faceMaterial=new THREE.MeshBasicMaterial({map:conceptTexture(poster)});
    const face=new THREE.Mesh(new THREE.PlaneGeometry(1.25,1.875),faceMaterial);face.position.set(0,exhibition.eyeHeight,.066);face.userData.posterId=poster.id;stand.add(face);pickables.push(face);
    if(poster.image)textureLoader.load(poster.image,texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());faceMaterial.map.dispose();faceMaterial.map=texture;faceMaterial.needsUpdate=true;invalidate();},undefined,()=>{onUnavailable?.('image',poster.id);});
    const marker=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTexture(`${poster.id}  ${poster.title}`,{background:poster.color,color:'#fffdf2'}),depthTest:false}));marker.position.set(poster.position[0],4.5,poster.position[2]);marker.scale.set(6.8,1.33,1);marker.userData.posterId=poster.id;marker.renderOrder=5;markers.add(marker);pickables.push(marker);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.35,.43,32),new THREE.MeshBasicMaterial({color:poster.color,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(poster.view[0],.065,poster.view[2]);scene.add(ring);
  }
  // A low parapet describes outdoor edges without turning terraces into rooms.
  for(const region of model.regions.filter(r=>r.id.startsWith('terrace'))) {
    for(let i=0;i<region.polygon.length;i++) {
      const a=toWorld(region.polygon[i],model.coordinates),b=toWorld(region.polygon[(i+1)%region.polygon.length],model.coordinates),dx=b[0]-a[0],dz=b[2]-a[2];
      const rail=box(scene,[(a[0]+b[0])/2,.25,(a[2]+b[2])/2],[Math.hypot(dx,dz),.5,.09],'#d0d2d8');rail.rotation.y=-Math.atan2(dz,dx);
    }
  }
  let mode='overview',visible=true,raf=0,lost=false,look={yaw:0,pitch:0},current=null,currentWalkStart=null,walker;
  const walkSpace=createWalkSpace(model,exhibition,posters),walkPanel=document.getElementById('walk-controls');
  const footprint=(model.overviewPoints||model.footprint).map(p=>new THREE.Vector3(...toWorld(p,model.coordinates)));
  const center=new THREE.Box3().setFromPoints(footprint).getCenter(new THREE.Vector3());
  function viewportFrame(){
    const glass=document.body.classList.contains('glass-ui')&&!document.body.classList.contains('display-mode');
    const footer=container.closest('.stage')?.querySelector('.stage-footer');
    const narrow=container.clientWidth<350;
    if(glass&&document.body.classList.contains('venue-shell')){
      const footerBottom=parseFloat(getComputedStyle(footer).bottom)||12;
      return safeViewportFrame(container.clientWidth,container.clientHeight,{
        top:54,bottom:(footer?.offsetHeight||0)+footerBottom+16+(mode==='explore'&&walkPanel.offsetHeight?walkPanel.offsetHeight+12:0)
      });
    }
    return safeViewportFrame(container.clientWidth,container.clientHeight,glass?{
      top:narrow?145:88,bottom:(footer?.offsetHeight||0)+(mode==='explore'?(walkPanel.offsetHeight||110)+50:32)
    }:{});
  }
  function invalidate(){if(!raf&&visible&&!lost&&!document.hidden)raf=requestAnimationFrame(()=>{raf=0;const activeCamera=mode==='overview'?overviewCamera:camera;renderer.render(scene,activeCamera);});}
  function fitOverview(){
    overviewCamera.position.copy(center).add(new THREE.Vector3(...(model.sourceModel?.venueRelease?[45,110,75]:[47,73,71])));overviewCamera.up.set(0,1,0);overviewCamera.lookAt(center);overviewCamera.updateMatrixWorld();controls.target.copy(center);overviewCamera.zoom=1;
    const inverse=overviewCamera.matrixWorldInverse;const projected=footprint.map(p=>p.clone().applyMatrix4(inverse));
    const b=new THREE.Box3().setFromPoints(projected),size=b.getSize(new THREE.Vector3()),frame=viewportFrame();
    const h=Math.max(size.y+11,(size.x+10)/frame.aspect)*1.08*frame.height/frame.availableHeight,aspect=frame.width/frame.height;
    overviewCamera.left=-h*aspect/2;overviewCamera.right=h*aspect/2;overviewCamera.top=h/2;overviewCamera.bottom=-h/2;
    overviewCamera.setViewOffset(frame.width,frame.height,0,frame.offsetY,frame.width,frame.height);overviewCamera.updateProjectionMatrix();controls.update();invalidate();
  }
  function applyLook(){look.pitch=clamp(look.pitch,-.78,.78);camera.rotation.set(...cameraRotation(look));container.dataset.walkYaw=look.yaw.toFixed(6);invalidate();}
  function setLook(value){look={yaw:value.yaw,pitch:value.pitch};applyLook();onLook?.({...look});}
  function resize(){const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;const frame=viewportFrame();renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=frame.fov;camera.setViewOffset(w,h,0,frame.offsetY,w,h);camera.updateProjectionMatrix();fitOverview();invalidate();}
  function updatePosition(){
    for(const [axis,value] of Object.entries({x:camera.position.x,y:camera.position.y,z:camera.position.z}))container.dataset[`walk${axis.toUpperCase()}`]=value.toFixed(3);
    if(current){const distance=Math.hypot(camera.position.x-current.position[0],camera.position.z-current.position[2]);document.getElementById('walk-distance').textContent=currentWalkStart?`${current.id} · 约 ${distance.toFixed(1)} m`:'起点待校准';}
  }
  function goHome(){if(!current)return;walker?.stop();camera.position.set(...(currentWalkStart?[currentWalkStart[0],exhibition.eyeHeight,currentWalkStart[1]]:current.view));setLook({yaw:current.yaw,pitch:current.pitch});updatePosition();invalidate();}
  function walk(axes,seconds){
    if(mode!=='explore'||!visible||lost||displayOnly||!currentWalkStart)return;
    const before=[camera.position.x,camera.position.z],next=moveWalker(before,walkDelta(axes,look.yaw,seconds),walkSpace);
    if(next[0]!==before[0]||next[1]!==before[1]){camera.position.set(next[0],exhibition.eyeHeight,next[1]);updatePosition();invalidate();}
  }
  function showOverview(){walker?.setEnabled(false);iebShell?.setCutaway(true);mode='overview';controls.enabled=true;overviewLabels.visible=true;markers.visible=true;resize();}
  function enter(posterId,savedLook){
    current=posters.find(p=>p.id===posterId);if(!current)return;
    currentWalkStart=walkStart([current.view[0],current.view[2]],walkSpace);
    walker?.stop();iebShell?.setCutaway(false);mode='explore';controls.enabled=false;overviewLabels.visible=false;markers.visible=false;goHome();setLook(savedLook||{yaw:current.yaw,pitch:current.pitch});walker?.setEnabled(visible&&!lost&&!displayOnly&&currentWalkStart);resize();
  }
  let gesture=null;const touches=new Set(),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const down=e=>{if(e.button!==0)return;canvas.focus({preventScroll:true});touches.add(e.pointerId);gesture={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:touches.size>1};if(mode==='explore')canvas.setPointerCapture(e.pointerId);};
  const move=e=>{
    if(!gesture||e.pointerId!==gesture.id)return;
    const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;gesture.x=e.clientX;gesture.y=e.clientY;
    if(Math.hypot(e.clientX-gesture.startX,e.clientY-gesture.startY)>5)gesture.moved=true;
    if(mode==='explore'&&touches.size===1&&gesture.moved){look.yaw-=dx*.0045;look.pitch=clamp(look.pitch+dy*.0045,-.78,.78);applyLook();}
  };
  const up=e=>{
    touches.delete(e.pointerId);if(!gesture||gesture.id!==e.pointerId)return;
    if(!gesture.moved&&e.type==='pointerup'){
      const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,mode==='overview'?overviewCamera:camera);
      const candidates=mode==='explore'?pickables.filter(p=>p.isMesh):pickables.filter(p=>p.parent.visible);
      const hit=raycaster.intersectObjects(candidates,false)[0];
      // Do not open a different Poster through an intervening wall while walking.
      if(hit){const obstruction=mode==='explore'?raycaster.intersectObjects(occluders,false)[0]:null;if(!obstruction||obstruction.distance>=hit.distance-.08)onPoster?.(hit.object.userData.posterId);}
    }
    if(mode==='explore')onLook?.({...look});gesture=null;
  };
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
  controls.addEventListener('change',invalidate);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;walker?.setEnabled(false);onUnavailable?.('context');});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;onUnavailable?.('restored');invalidate();});
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else invalidate();};document.addEventListener('visibilitychange',visibility);
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  const footer=container.closest('.stage')?.querySelector('.stage-footer');if(footer)observer.observe(footer);
  walker=mountWalkInput(canvas,walkPanel,{move:walk,reset:goHome});observer.observe(walkPanel);
  return {
    enter,showOverview,fitOverview,getLook:()=>({...look}),
    stopWalking(){walker?.stop();},
    setVisible(value){visible=value;walker.setEnabled(value&&mode==='explore'&&!lost&&!displayOnly&&currentWalkStart);if(!value){cancelAnimationFrame(raf);raf=0;}else{resize();invalidate();}},
    turn(amount){look.yaw+=amount;applyLook();onLook?.({...look});},
    recenter(){if(current)setLook({yaw:Math.atan2(current.position[0]-camera.position.x,camera.position.z-current.position[2]),pitch:0});},
    dispose(){walker.dispose();observer.disconnect();cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);controls.dispose();scene.traverse(o=>{o.geometry?.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials){m?.map?.dispose();m?.dispose();}});cartoonStyle?.dispose();renderer.dispose();canvas.remove();}
  };
}
