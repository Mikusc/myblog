import {createPublicFitout,fitoutPlanSVG,placedFitoutZones,fitoutPoint} from './public-fitout.js';
import {compassAngle} from './orientation.js';
import {applyCartoonPalette,presentationStyle} from './cartoon.js';
export const area=points=>Math.abs(points.reduce((a,v,i)=>{const n=points[(i+1)%points.length];return a+v[0]*n[1]-n[0]*v[1];},0))/2;
export const world=(p,model)=>[(p[0]-model.coordinates.origin[0])*model.coordinates.metersPerPixel,(p[1]-model.coordinates.origin[1])*model.coordinates.metersPerPixel];
export const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function wallSpans(wall){
 const doors=(wall.doors||[]).map(([a,b])=>[Math.max(0,a),Math.min(1,b)]).sort((a,b)=>a[0]-b[0]);
 let start=0;const spans=[];
 for(const [a,b] of doors){if(a>start)spans.push([start,a]);start=Math.max(start,b);}
 if(start<1)spans.push([start,1]);return spans;
}
export function interpolate(a,b,t){return a.map((v,i)=>v+(b[i]-v)*t);}
export function planSVG(model,{reference=false,interactive=false,imageHref=model.source.image}={}){
 const esc=escapeHTML,points=p=>p.map(v=>v.join(',')).join(' ');
 const planBox=model.view?.planBox||[130,220,1730,1040],titlePoint=model.view?.sheetTitle||[195,280];
 const regionShape=(r,attributes)=>r.parts?`<path d="${r.parts.map(p=>`M${p.map(v=>v.join(',')).join('L')}Z`).join('')}" ${attributes} style="stroke:none"/>`:`<polygon points="${points(r.points)}" ${attributes}/>`;
 const strokes=model.walls.flatMap(w=>wallSpans(w).map(([a,b])=>`<line x1="${interpolate(w.a,w.b,a)[0]}" y1="${interpolate(w.a,w.b,a)[1]}" x2="${interpolate(w.a,w.b,b)[0]}" y2="${interpolate(w.a,w.b,b)[1]}" class="wall ${w.type||''}"/>`)).join('');
 const openings=model.walls.flatMap(w=>(w.doors||[]).map(([a,b])=>`<line x1="${interpolate(w.a,w.b,a)[0]}" y1="${interpolate(w.a,w.b,a)[1]}" x2="${interpolate(w.a,w.b,b)[0]}" y2="${interpolate(w.a,w.b,b)[1]}" class="opening"/>`)).join('');
 const fixtures=model.fixtures.map(f=>{if(f.kind==='lift')return `<polygon points="${points(f.points)}" class="lift"/><path d="M${f.points[0]} L${f.points[2]} M${f.points[1]} L${f.points[3]}" class="lift-cross"/>`;
   const dx=f.b[0]-f.a[0],dy=f.b[1]-f.a[1],len=Math.hypot(dx,dy),n=[-dy/len*f.widthPixels/2,dx/len*f.widthPixels/2];
   const steps=Array.from({length:f.steps+1},(_,i)=>{const c=interpolate(f.a,f.b,i/f.steps);return `<line x1="${c[0]-n[0]}" y1="${c[1]-n[1]}" x2="${c[0]+n[0]}" y2="${c[1]+n[1]}" class="step"/>`;}).join('');
   if(!f.directionReview)return steps;
   const tail=interpolate(f.a,f.b,.15),head=interpolate(f.a,f.b,.85),u=[dx/len,dy/len],v=[-u[1],u[0]];
   const arrow=[head,[head[0]-u[0]*12+v[0]*5,head[1]-u[1]*12+v[1]*5],[head[0]-u[0]*12-v[0]*5,head[1]-u[1]*12-v[1]*5]];
   return `<g data-fixture="${esc(f.id)}" data-ascent="a-to-b"><title>主楼梯上行 · 按设计图修订，现场对应待核</title>${steps}<path d="M${tail.join(',')}L${head.join(',')}" stroke="#a96832" stroke-width="3"/><polygon points="${points(arrow)}" fill="#a96832"/><text x="${head[0]+v[0]*17}" y="${head[1]+v[1]*17}" class="small">上</text></g>`;
 }).join('');
 const north=model.orientation?`<g id="plan-north" transform="translate(${titlePoint[0]+70} ${titlePoint[1]+145})" pointer-events="none"><circle r="52" fill="#ffffff" fill-opacity=".85"/><g transform="rotate(${compassAngle(model.orientation.worldNorthXZ)})"><path d="M0 -40 -6 -20 0 -25 6 -20Z" fill="#007aff"/><path d="M0 -25V34" stroke="#007aff" stroke-width="2"/></g><text x="${model.orientation.worldNorthXZ[0]*62}" y="${model.orientation.worldNorthXZ[1]*62+5}" font-family="system-ui" font-size="16" text-anchor="middle" fill="#007aff">北</text><text x="0" y="78" class="small" text-anchor="middle">卫星估计北向</text></g>`:'';
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${planBox.join(' ')}" role="group" aria-label="${esc(model.name)}平面" data-model="${esc(model.id)}"><style>
 .space{stroke:#a6afa8;stroke-width:1.5;transition:fill-opacity .15s}.space.selected{stroke:#1a5947;stroke-width:6;fill:#b3cab9}.wall{stroke:#5f7167;stroke-width:4;stroke-linecap:butt}.wall.glass{stroke:#96aeaa;stroke-width:2.6}.wall.zone,.wall.inferred{stroke:#929d8d;stroke-width:2;stroke-dasharray:6 4}.opening{stroke:#77968a;stroke-width:1;stroke-dasharray:3 5}.cut,.design-frame{fill:none;stroke:#bb8056;stroke-width:3;stroke-dasharray:9 6}.label{font:500 17px system-ui,sans-serif;fill:#2f493f;text-anchor:middle;paint-order:stroke;stroke:#f4f4eb;stroke-width:3;stroke-linejoin:round;pointer-events:none}.small{font:12px system-ui,sans-serif;fill:#737f76}.lift{fill:#d0d9d4;stroke:#778d81;stroke-width:2}.lift-cross,.step{stroke:#788d81;stroke-width:1.7}.space[role=button]{cursor:pointer}.space[role=button]:focus{stroke:#195946;stroke-width:6;outline:none}.sheet-title{font:500 22px system-ui,sans-serif;fill:#3d5549}</style>
 <defs><pattern id="unknown-hatch" width="13" height="13" patternUnits="userSpaceOnUse"><path d="M0 13 13 0" stroke="#b5b5a9" stroke-width="1" opacity=".6"/></pattern></defs>
 ${reference?`<image id="reference-image" href="${esc(imageHref)}" x="0" y="0" width="${model.source.width}" height="${model.source.height}" opacity="0" pointer-events="none"/>`:''}
 <g id="plan-floors">${model.regions.map(r=>regionShape(r,`class="space" data-region="${r.id}" fill="${r.color||model.kinds[r.kind].color}" ${interactive?`role="button" tabindex="0" aria-label="${esc(r.name)}" aria-pressed="false"`:''}`)+(r.kind==='unknown'||r.inferred?regionShape(r,'fill="url(#unknown-hatch)" pointer-events="none"'):'' )).join('')}</g>
 <g pointer-events="none">${model.regions.flatMap(r=>(r.boundarySegments||[]).map(([a,b])=>`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="wall inferred"/>`)).join('')}</g>
 <g pointer-events="none">${strokes}${openings}${fixtures}${model.cuts.map(c=>`<polyline class="cut" points="${points(c.points)}"/>`).join('')}</g>
 ${model.completion?`<polygon points="${points(model.completion.designWindow)}" class="design-frame" pointer-events="none"/>`:''}
 ${fitoutPlanSVG(model)}
 <g id="plan-labels">${model.regions.filter(r=>!r.hideLabel&&!['connector','admin-corridor','east-core'].includes(r.id)).map(r=>`<text class="label" x="${r.label[0]}" y="${r.label[1]}">${esc(r.shortName||r.name.replace('（局部）',''))}${r.partial||r.grouped||r.inferred?`<tspan x="${r.label[0]}" dy="20" class="small">${r.inferred?'图外补全 · 待核':r.grouped?'房号组 · 未细分':'局部 · 边界待核'}</tspan>`:''}</text>`).join('')}</g>
 <text class="sheet-title" x="${titlePoint[0]}" y="${titlePoint[1]}">${esc(model.view?.title||'IEB / 1F · 局部设计白模 R1')}</text><text class="small" x="${titlePoint[0]}" y="${titlePoint[1]+28}">${esc(model.view?.subtitle||'沿用设计图名称 · 虚线表示原图裁切 · 墙高及比例待实测')}</text>
 ${north}
 </svg>`;
}

// The browser viewer and portable GLB use this same geometry builder.
export function createModel(THREE,model,{style=presentationStyle(model),editable=false}={}){
 const root=new THREE.Group();root.name=model.id;
 const floors=[],verticals=[];
 const materials={};
 for(const [kind,{color}] of Object.entries(model.kinds))materials[kind]=new THREE.MeshStandardMaterial({color,roughness:.95});
 const solid=new THREE.MeshStandardMaterial({color:'#f4f2e8',roughness:.9});
 const outer=new THREE.MeshStandardMaterial({color:'#d9e0d4',roughness:.85});
 const glass=new THREE.MeshStandardMaterial({color:'#a2b8b0',transparent:true,opacity:.42,roughness:.35,depthWrite:false});
 const stair=new THREE.MeshStandardMaterial({color:model.publicFitout?'#e7e7e3':'#dad5c6',roughness:.92});
 const lift=new THREE.MeshStandardMaterial({color:'#93a79e',roughness:.8});
 function polygonMesh(points,height,base,material,name){
   const shape=new THREE.Shape(points.map(p=>{const [x,z]=world(p,model);return new THREE.Vector2(x,-z);}));
   const geometry=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,steps:1});geometry.rotateX(-Math.PI/2);
   const mesh=new THREE.Mesh(geometry,material);mesh.position.y=base;mesh.name=name;root.add(mesh);return mesh;
 }
 for(const region of model.regions){
   let mesh;
   if(model.assumptions.flatFloor){
     const shapes=region.floorPatches.map(points=>new THREE.Shape(points.map(p=>{const [x,z]=world(p,model);return new THREE.Vector2(x,-z);}))); 
     const geometry=new THREE.ShapeGeometry(shapes);geometry.rotateX(-Math.PI/2);
     mesh=new THREE.Mesh(geometry,materials[region.kind].clone());mesh.name=region.name;root.add(mesh);
   }else mesh=polygonMesh(region.points,model.assumptions.slabThicknessM-(region.isBase ? .025 : 0),-model.assumptions.slabThicknessM,materials[region.kind].clone(),region.name);
   if(region.contextOnly)mesh.position.y-=.01;
   // Separate overlapping review layers by millimetres; this is not a site level change.
   if(region.displayFloorOffsetM)mesh.position.y+=region.displayFloorOffsetM;
   mesh.userData.region=region.id;mesh.userData.contextOnly=Boolean(region.contextOnly);floors.push(mesh);
   if(region.color)mesh.material.color.set(region.color);
   const finish=model.publicFitout?.floorMaterials[region.id];if(finish){mesh.material.color.set(finish.color);mesh.material.roughness=finish.roughness;}
 }
 if(model.assumptions.flatFloor){
   const base=model.regions.find(r=>r.isBase),shell=polygonMesh(base.points,model.assumptions.slabThicknessM,-model.assumptions.slabThicknessM,materials.public,'楼板侧面与底面');
   const g=shell.geometry.index?shell.geometry.toNonIndexed():shell.geometry,pos=g.attributes.position.array,norm=g.attributes.normal.array,p=[],n=[];
   for(let i=0;i<pos.length;i+=9){if(norm[i+1]>.99)continue;p.push(...pos.slice(i,i+9));n.push(...norm.slice(i,i+9));}
   const skin=new THREE.BufferGeometry();skin.setAttribute('position',new THREE.Float32BufferAttribute(p,3));skin.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));shell.geometry.dispose();shell.geometry=skin;
 }
 function beam(a,b,height,base,width,material,name,adjustable=true){
   const [x,z]=world(a,model),[u,v]=world(b,model),len=Math.hypot(u-x,v-z);
   if(len<.001||height<=0)return;
   const mesh=new THREE.Mesh(new THREE.BoxGeometry(len,height,width),material);
   mesh.position.set((x+u)/2,base+height/2,(z+v)/2);mesh.rotation.y=-Math.atan2(v-z,u-x);mesh.name=name;root.add(mesh);
   if(adjustable)verticals.push({mesh,height,base});return mesh;
 }
 const {wallHeightM:h,wallThicknessM:t,doorHeightM:d}=model.assumptions;
 const outlinePoints=[];
 function dashedGround(a,b){
   const [x,z]=world(a,model),[u,v]=world(b,model),length=Math.hypot(u-x,v-z);
   for(let start=0;start<length;start+=.55){const end=Math.min(start+.32,length);outlinePoints.push(x+(u-x)*start/length,.025,z+(v-z)*start/length,x+(u-x)*end/length,.025,z+(v-z)*end/length);}
 }
 for(const wall of model.walls){
   if(wall.type==='inferred'&&model.presentation?.inferredWalls==='ground-outline'){
     for(const [a,b] of wallSpans(wall))dashedGround(interpolate(wall.a,wall.b,a),interpolate(wall.a,wall.b,b));
     continue;
   }
   const material=wall.type==='glass'?glass:wall.type==='exterior'?outer:solid;
   const height=wall.heightM??h;
   for(const [a,b] of wallSpans(wall))beam(interpolate(wall.a,wall.b,a),interpolate(wall.a,wall.b,b),height,0,t,material,wall.id);
   for(const [a,b] of wall.doors||[])beam(interpolate(wall.a,wall.b,a),interpolate(wall.a,wall.b,b),height-d,d,t,material,`${wall.id}-lintel`);
 }
 for(const fixture of model.fixtures){
   if(fixture.kind==='lift'){
     const mesh=polygonMesh(fixture.points,h,0,lift,fixture.name);verticals.push({mesh,height:h,base:0,extruded:true});
   }else{
     const width=fixture.widthPixels*model.coordinates.metersPerPixel;
     for(let i=0;i<fixture.steps;i++){
       const start=interpolate(fixture.a,fixture.b,i/fixture.steps),end=interpolate(fixture.a,fixture.b,(i+1)/fixture.steps);
       const step=beam(start,end,(i+1)*fixture.rise/fixture.steps,0,width,stair,`${fixture.id}-step-${i+1}`,false);
       if(step)step.userData={fixture:fixture.id,stepIndex:i,ascent:'a-to-b',...(fixture.directionReview?{directionReview:fixture.directionReview}:{})};
     }
   }
 }
 const fitout=createPublicFitout(THREE,model,{cartoon:style==='cartoon',editable});root.add(fitout.root);
 if(model.layoutReview){
   for(const zone of placedFitoutZones(model).filter(z=>!z.isCandidatePlacement)){
     const [w,d]=zone.sizeM,localCorners=zone.footprintLocalM?zone.footprintLocalM.map(p=>[p[0],0,p[1]]):[[-w/2,0,-d/2],[w/2,0,-d/2],[w/2,0,d/2],[-w/2,0,d/2]];
     const corners=localCorners.map(p=>fitoutPoint(zone,p,model));
     corners.forEach((p,i)=>dashedGround(p,corners[(i+1)%corners.length]));
   }
 }
 if(outlinePoints.length){
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(outlinePoints,3));
   const outline=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:'#b18b5d',transparent:true,opacity:.65}));outline.name='待核边界与暂定设施范围';outline.userData={evidence:'unverified-ground-outlines',notPhysicalWalls:true};root.add(outline);
 }
 if(style==='cartoon')applyCartoonPalette(root,model);
 function setCutaway(enabled){
   for(const v of verticals){const visibleHeight=enabled?Math.max(0,Math.min(v.height,model.assumptions.cutawayHeightM-v.base)):v.height;v.mesh.visible=visibleHeight>0;v.mesh.scale.y=visibleHeight/v.height;v.mesh.position.y=v.base+(v.extruded?0:visibleHeight/2);}
   fitout.setCutaway(enabled);
 }
 return {root,floors,verticals,setCutaway,fitout};
}
