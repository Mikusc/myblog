// Procedural site-reference furniture, batched by zone/material to bound mobile draw calls.
import {createReviewedFixture} from './reviewed-fixtures.js';
import {createAlumniFixture} from './alumni-fixtures.js';
import {createVideoReviewedFixture} from './video-reviewed-fixtures.js';
import {createAlumniVisualFixture} from './alumni-visual-r18.js';
const validPlanPoint=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
const markup=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const placedFitoutZones=model=>(model.publicFitout?.zones||[]).flatMap(z=>{
 if(validPlanPoint(z.manualPlacement?.origin)){
  const manual=z.manualPlacement,omitted=new Set(z.candidatePlacement?.omitObjectIds||[]);
  return [{...z,origin:[...manual.origin],yawDegrees:manual.yawDegrees,regionId:null,placementStatus:'manual-candidate',sourcePlacementStatus:z.placementStatus,isCandidatePlacement:true,candidatePlacement:{...(z.candidatePlacement||{}),...manual},objects:z.objects.filter(o=>!omitted.has(o.id))}];
 }
 if(z.placementStatus!=='unlocated-local-reference'&&validPlanPoint(z.origin))return [z];
 const candidate=z.candidatePlacement;if(!validPlanPoint(candidate?.origin))return [];
 const omitted=new Set(candidate.omitObjectIds||[]);
 return [{...z,origin:[...candidate.origin],yawDegrees:candidate.yawDegrees??z.yawDegrees??0,regionId:candidate.regionId??null,placementStatus:'candidate-plan-assignment',sourcePlacementStatus:z.placementStatus,isCandidatePlacement:true,objects:z.objects.filter(o=>!omitted.has(o.id))}];
});
export function localFitoutModel(model,id){
 const zone=resolveFitoutZone(model,id);if(!zone||zone.placementStatus!=='unlocated-local-reference')return null;
 const local=structuredClone(model),s=model.coordinates.metersPerPixel,[x,y]=model.coordinates.origin,pad=zone.localPreviewPaddingM??(zone.measurement?0:1),w=(zone.sizeM[0]+pad)/s/2,d=(zone.sizeM[1]+pad)/s/2;
 const points=zone.footprintLocalM?zone.footprintLocalM.map(p=>[x+p[0]/s,y+p[1]/s]):[[x-w,y-d],[x+w,y-d],[x+w,y+d],[x-w,y+d]];
 local.id=`${model.id}-local-${zone.id}`;local.name=`${zone.title} · 独立造型`;local.orientation=null;local.completion=null;local.layoutReview={status:'local-reference-only',siteAlignment:false};delete local.integration;
 local.regions=[{id:'local-reference-floor',name:'独立预览底板 · 非现场边界',kind:'public',isBase:!model.planSync,hideLabel:true,points,floorPatches:[points],label:[x,y],...(model.planSync?{color:model.regions.find(r=>r.id===zone.id)?.color,displayFloorOffsetM:zone.displayFloorOffsetM||0}:{})}];local.walls=[];local.fixtures=[];local.cuts=[];
 const localZone=structuredClone(zone);delete localZone.candidatePlacement;delete localZone.manualPlacement;delete local.manualLayout;
 local.publicFitout={...local.publicFitout,zones:[{...localZone,origin:[x,y],yawDegrees:0,placementStatus:'local-preview-only'}],floorMaterials:model.appearanceReview&&model.publicFitout.floorMaterials?.[zone.id]?{'local-reference-floor':model.publicFitout.floorMaterials[zone.id]}:{}};
 return local;
}
export function fitoutPoint(zone,p,model){
 const a=(zone.yawDegrees||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a),scale=model.coordinates.metersPerPixel;
 return [zone.origin[0]+(p[0]*c+p[2]*s)/scale,zone.origin[1]+(-p[0]*s+p[2]*c)/scale];
}
// R6 plan symbols show relative furniture footprints, not just point markers.
function capturePlanObject(o,z,model){
 if(['floor-tiles','clipped-tile-floor','woven-rug','entry-pier-graphics','column-face-details','floor-mat','floor-disc','open-ceiling','slat-ceiling','entry-canopy','cafe-counter-canopy','alumni-lettering'].includes(o.kind))return '';
 const s=model.coordinates.metersPerPixel,a=(o.yawDegrees||0)*Math.PI/180;
 const at=(x,d)=>fitoutPoint(z,[o.position[0]+x*Math.cos(a)+d*Math.sin(a),0,o.position[2]-x*Math.sin(a)+d*Math.cos(a)],model);
 const p=at(0,0),fill=o.color||'#afbeb7',meta=`<title>${markup(o.id)} · 造型参考，尺寸与位置未实测</title>`;
 if(o.kind==='direction-arrow'){
  const len=o.length,w=o.width||.5,a=at(0,-len*.4),b=at(0,len*.4),l=at(-w,len*.23),r=at(w,len*.23);
  return `<g data-ascent="relative-observed" data-measured-angle="false"><title>上行：远离 Lift B；相对方向有视频依据，精确角度待测</title><path d="M${a}L${b}M${l}L${b}L${r}" fill="none" stroke="${fill}" stroke-width="3.2"/></g>`;
 }
 const radii={pouf:o.radius||.8,'round-table':o.radius||.65,'low-table':o.radius||.65,'pillar-planter':1.5,'round-pillar-planter':o.radius||1.45,plant:o.radius||.32,'cocktail-table':o.radius||.34};
 if(o.kind==='curved-sofa'){
  if(o.arcGroups)return `<g>${meta}${o.arcGroups.map(([lo,hi])=>{const r=o.radius-.36,pts=Array.from({length:45},(_,i)=>{const t=(lo+(hi-lo)*i/44)*Math.PI/180;return at(Math.sin(t)*r,Math.cos(t)*r);});return `<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${fill}" stroke-width="${.72/s}"/>`;}).join('')}</g>`;
  if(o.gapDegrees!==undefined){const start=o.gapDegrees*Math.PI/360,end=Math.PI*2-start,r=(o.radius||1.65)-.3,pts=Array.from({length:45},(_,i)=>at(Math.cos(start+(end-start)*i/44)*r,Math.sin(start+(end-start)*i/44)*r));return `<g>${meta}<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${fill}" stroke-width="${.6/s}"/></g>`;}
  return `<g>${meta}<circle cx="${p[0]}" cy="${p[1]}" r="${((o.radius||1.65)-.3)/s}" fill="none" stroke="${fill}" stroke-width="${.6/s}"/></g>`;
 }
 if(radii[o.kind])return `<g>${meta}<circle cx="${p[0]}" cy="${p[1]}" r="${radii[o.kind]/s}" fill="${fill}" stroke="#687f79" stroke-width="1"/></g>`;
 const sizes={'c-side-table':[o.width||.45,o.depth||.47],'phone-booth':[o.width||1.08,o.depth||.62],'acrylic-display':[o.width||.52,o.width||.52],'photo-display':[o.width||.68,.55],'rect-coffee-table':[o.width||1.1,o.depth||.55],'display-plinths':[2.8,.45],'merchandise-stand':[1.65,.58],sofa:[o.width||2.25,.9],armchair:[.8,.8],'cafe-chair':[.6,.6],'study-table':[o.width||2.1,o.depth||.8],bar:[o.width||5.8,o.depth||.78],'bar-stool':[.5,.5],'acoustic-booth':[o.width||2.1,o.depth||1.45],column:[o.width||.82,o.depth||o.width||.82],'coffee-counter':[o.width||3,o.depth||.7],'vending-cabinet':[o.width||.95,o.depth||.7],'rect-planter':[o.width||2.2,o.depth||.75],'open-stair':[o.width||2.8,o.length||5.1]};
 const [w,d]=sizes[o.kind]||[o.width||1.9,.13],pts=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(p=>at(...p));
 let shape=`<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="${fill}" stroke="#687f79" stroke-width="1"/>`;
 if(o.kind==='open-stair')for(let i=0;i<(o.steps||17);i++){const q=[at(-w/2,-d/2+i*d/(o.steps||17)),at(w/2,-d/2+i*d/(o.steps||17))];shape+=`<path d="M${q[0]}L${q[1]}" stroke="#687f79" stroke-width=".6"/>`;}
 return `<g>${meta}${shape}</g>`;
}
export function fitoutPlanSVG(model){
 if(!model.publicFitout)return '';
 return `<g id="plan-fitout" pointer-events="none">${placedFitoutZones(model).map(z=>{
  const corners=(z.footprintLocalM?z.footprintLocalM.map(p=>[p[0],0,p[1]]):[[-z.sizeM[0]/2,0,-z.sizeM[1]/2],[z.sizeM[0]/2,0,-z.sizeM[1]/2],[z.sizeM[0]/2,0,z.sizeM[1]/2],[-z.sizeM[0]/2,0,z.sizeM[1]/2]]).map(p=>fitoutPoint(z,p,model));
  const dots=model.captureReview?z.objects.map(o=>capturePlanObject(o,z,model)).join(''):z.objects.filter(o=>!['planks','floor-tiles','floor-mat','floor-carpet','floor-disc','glass-screen','entrance-glazing','door-bay','elevator-bay','phone-booth','wall-panel','slat-ceiling','open-ceiling','window-reference','yellow-divider','alumni-wall'].includes(o.kind)).map(o=>{const p=fitoutPoint(z,o.position,model);return `<circle cx="${p[0]}" cy="${p[1]}" r="${(o.radius||.5)/model.coordinates.metersPerPixel}" fill="${o.color||'#a6b1b7'}" stroke="#667f91" stroke-width="1"/>`;}).join('');
  const candidate=z.isCandidatePlacement,stroke=candidate?'#c48a32':'#668daf',title=candidate?'暂定落位；位置和朝向未配准，轮廓仅表示陈设显示范围。':'现场参考陈设范围，位置及尺寸待校准。';
  const dimension=z.measurement&&!model.planSync?`<g data-dimension-source="user-rough-estimate"><title>用户现场粗测；长边方向暂定，非测绘结果</title><text x="${z.origin[0]}" y="${z.origin[1]+z.sizeM[1]/2/model.coordinates.metersPerPixel+25}" text-anchor="middle" font-family="system-ui" font-size="15" fill="#3c6d6a">短边约 15 m</text><text x="${z.origin[0]+z.sizeM[0]/2/model.coordinates.metersPerPixel+15}" y="${z.origin[1]}" font-family="system-ui" font-size="15" fill="#3c6d6a" transform="rotate(90 ${z.origin[0]+z.sizeM[0]/2/model.coordinates.metersPerPixel+15} ${z.origin[1]})">长边约 30 m · 方向暂定</text></g>`:'';
  const joined=Boolean(model.connectionAssembly),link=joined&&z.id==='connector-102',labelY=link?z.origin[1]+75:z.origin[1]-z.sizeM[1]/2/model.coordinates.metersPerPixel-12;
  const labelText=joined?(link?'102 外廊':`${z.shortTitle||z.title} · ${z.areaIdentification?.confirmed?'区域已确认 / 尺寸待核':z.measurement?'约 30×15 m':'尺寸待核'}`):`${z.title}${candidate?' · 暂定落位':''}`;
  return `<polygon points="${corners.map(p=>p.join(',')).join(' ')}" fill="${candidate?'#edb65b18':'#e5eef633'}" stroke="${stroke}" stroke-width="1.8" stroke-dasharray="5 4" data-placement="${candidate?'hypothesis':'provisional'}"><title>${title}</title></polygon>${dots}${dimension}<text x="${z.origin[0]}" y="${labelY}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" fill="${candidate?'#946323':'#466983'}">${markup(labelText)}${link?`<tspan x="${z.origin[0]}" dy="17">长宽待核</tspan>`:''}</text>`;
 }).join('')}<g id="plan-connections">${(model.integration?.connections||[]).filter(c=>c.points?.length>1&&c.points.every(validPlanPoint)).map(c=>{const observed=['co-visible','continuous-video'].includes(c.evidenceLevel);return `<polyline points="${c.points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${observed?'#298c86':'#c48a32'}" stroke-width="2.4"${observed?'':' stroke-dasharray="7 5"'} data-connection="${markup(c.id)}" data-evidence="${markup(c.evidenceLevel)}" data-navigation-route="false"><title>${markup(`视频关系线，非导航路线；${observed?'同框或连续视频关系不代表实测路线':'假设连接，尚未核实'}。${c.note||''}`)}</title></polyline>`;}).join('')}${(model.integration?.conflicts||[]).filter(c=>validPlanPoint(c.point)).map(c=>{const [x,y]=c.point,r=.14/model.coordinates.metersPerPixel;return `<path d="M${x-r} ${y-r}L${x+r} ${y+r}M${x-r} ${y+r}L${x+r} ${y-r}" fill="none" stroke="#c48a32" stroke-width="3" data-connection-conflict="${markup(c.id)}" data-navigation-route="false"><title>${markup(`墙/门洞待核；不是已打通的通路。${c.note||''}`)}</title></path>`;}).join('')}</g></g>`;
}
export function createPublicFitout(THREE,model,{cartoon=false,editable=false}={}){
 const root=new THREE.Group();root.name='现场视频参考公共区';const zones=new Map();
 if(!model.publicFitout)return {root,zones,setCutaway(){},setVisible(){},setConnectionsVisible(){}};
 const neutral={wood:'#b5a68d',white:'#f1f0eb',dark:'#3f4346',steel:'#a4aaa9',leaf:'#627b52',soil:'#41433b',yellow:'#c5bd72',floor:'#8a8d8c'};
 const materials=new Map();
 const mat=(color,kind='solid')=>{const key=color+kind;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:kind==='glass'?.22:kind==='metal'?.42:.8,metalness:kind==='metal'?.35:0,transparent:['glass','frosted'].includes(kind),opacity:kind==='glass'?.2:kind==='frosted'?.68:1,depthWrite:!['glass','frosted'].includes(kind),...(kind==='light'?{emissive:color,emissiveIntensity:.3}:{})}));return materials.get(key);};
 function boxGeometry(size){
  const radius=Math.min(.065,...size.map(v=>v*.16));
  if(!cartoon||Math.min(...size)<.09)return new THREE.BoxGeometry(...size);
  const geometry=new THREE.BoxGeometry(...size,4,4,4),positions=geometry.attributes.position,normals=geometry.attributes.normal;
  const p=new THREE.Vector3(),inner=new THREE.Vector3(),normal=new THREE.Vector3();
  for(let i=0;i<positions.count;i++){
   p.fromBufferAttribute(positions,i);inner.set(...size.map((v,axis)=>THREE.MathUtils.clamp(p.getComponent(axis),-v/2+radius,v/2-radius)));
   normal.copy(p).sub(inner).normalize();p.copy(inner).addScaledVector(normal,radius);positions.setXYZ(i,p.x,p.y,p.z);normals.setXYZ(i,normal.x,normal.y,normal.z);
  }
  return geometry;
 }
 const box=(size,p,color,kind='solid',rot=0)=>{const mesh=new THREE.Mesh(boxGeometry(size),mat(color,kind));mesh.position.set(...p);mesh.rotation.y=rot;return mesh;};
 const cyl=(r,h,p,color,segments=16,topRadius=r,kind='solid')=>{const mesh=new THREE.Mesh(new THREE.CylinderGeometry(topRadius,r,h,segments),mat(color,kind));mesh.position.set(...p);return mesh;};
 const ball=(r,p,color)=>{const mesh=new THREE.Mesh(cartoon?new THREE.IcosahedronGeometry(r,0):new THREE.SphereGeometry(r,8,5),mat(color));mesh.position.set(...p);return mesh;};
 const rod=(a,b,r,color,kind='metal')=>{const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),direction=end.clone().sub(start);const mesh=cyl(r,direction.length(),start.add(end).multiplyScalar(.5).toArray(),color,6,r,kind);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());return mesh;};
 function softPouf(r,h,color,tapered=false){
  const top=tapered?r*.84:r*.98;
  const profile=[[0,.008],[r*.9,.008],[r*.98,.03],[r,.09],[top,h-.07],[top*.96,h-.025],[top*.82,h],[0,h]].map(p=>new THREE.Vector2(...p));
  return new THREE.Mesh(new THREE.LatheGeometry(profile,24),mat(color));
 }
 const glyphs={A:['01110','10001','11111','10001','10001'],F:['11111','10000','11110','10000','10000'],L:['10000','10000','10000','10000','11111'],U:['10001','10001','10001','10001','01110'],M:['10001','11011','10101','10001','10001'],N:['10001','11001','10101','10011','10001'],I:['11111','00100','00100','00100','11111'],
  B:['11110','10001','11110','10001','11110'],C:['01111','10000','10000','10000','01111'],D:['11110','10001','10001','10001','11110'],E:['11111','10000','11110','10000','11111'],G:['01111','10000','10111','10001','01111'],H:['10001','10001','11111','10001','10001'],J:['00111','00010','00010','10010','01100'],K:['10001','10010','11100','10010','10001'],O:['01110','10001','10001','10001','01110'],P:['11110','10001','11110','10000','10000'],Q:['01110','10001','10001','10011','01111'],R:['11110','10001','11110','10010','10001'],S:['01111','10000','01110','00001','11110'],T:['11111','00100','00100','00100','00100'],V:['10001','10001','10001','01010','00100'],W:['10001','10001','10101','11011','10001'],X:['10001','01010','00100','01010','10001'],Y:['10001','01010','00100','00100','00100'],Z:['11111','00010','00100','01000','11111'],
  0:['111','101','101','101','111'],1:['010','110','010','010','111'],2:['111','001','111','100','111'],3:['111','001','111','001','111'],4:['101','101','111','001','001'],5:['111','100','111','001','111'],6:['111','100','111','101','111'],7:['111','001','010','010','010'],8:['111','101','111','101','111'],9:['111','101','111','001','111']};
 function objectMeshes(o){
  const g=new THREE.Group();const add=m=>g.add(m);const k=o.kind,col=o.color||'#b3c181';let level='furniture';
  const text=(label,p,unit=.025,color=neutral.white,vertical=false)=>{[...String(label)].forEach((c,i)=>(glyphs[c.toUpperCase()]||[]).forEach((row,j)=>[...row].forEach((v,n)=>{if(v==='1')add(box([unit*.86,unit*.86,.012],[p[0]+(vertical?0:i*unit*6)+n*unit,p[1]-(vertical?i*unit*7:0)-j*unit,p[2]],color));})));};
  const leaves=(radius,base,count=14,flowers=false)=>{for(let i=0;i<count;i++){const a=i*2.4,d=radius*(.35+.45*Math.abs(Math.sin(i*5))),y=base+.14+(i%4)*.09;const leaf=ball(.23,[Math.cos(a)*d,y,Math.sin(a)*d],i%3===0?'#496b49':neutral.leaf);leaf.scale.set(.8,1.5,.9);leaf.rotation.set(Math.cos(a)*.5,a,Math.sin(a)*.5);add(leaf);if(flowers&&i%4===0){const flower=ball(.07,[Math.cos(a)*d,y+.28,Math.sin(a)*d],'#b8675c');flower.scale.set(1,.38,1);add(flower);}}};
  const glassBay=(w,h,x=0)=>{
   add(box([w,h,.025],[x,h/2+.08,0],'#b7d7df','glass'));
   add(box([w,.82,.027],[x,1.34,.019],'#e4eae5','frosted'));
   for(const y of [.82,.88,1.81,1.87])add(box([w,.025,.015],[x,y,.042],neutral.white,'frosted'));
   for(const xx of [x-w/2,x+w/2])add(box([.045,h+.1,.06],[xx,h/2+.06,0],neutral.dark));
   for(const y of [.055,h+.105])add(box([w,.05,.06],[x,y,0],neutral.dark));
  };
  const reviewed=createAlumniVisualFixture(o,{THREE,box,cyl,rod,mat,text,neutral})||createVideoReviewedFixture(o,{THREE,box,cyl,rod,mat,text,neutral})||createAlumniFixture(o,{THREE,box,cyl,rod,mat,text,neutral})||createReviewedFixture(o,{THREE,box,cyl,rod,mat,text,neutral});
  if(reviewed){add(reviewed.group);level=reviewed.level;
  }else if(k==='direction-arrow'){
   level='annotation';const len=o.length,rise=o.rise||0,w=o.width||.5,y=t=>rise*(t+.5)+.25;
   const a=[0,y(-.4),-len*.4],b=[0,y(.4),len*.4];
   add(rod(a,b,.055,col));for(const x of [-w,w])add(rod([x,y(.23),len*.23],b,.055,col));
  }else if(k==='curved-sofa'){
   const outer=o.radius||1.65,inner=outer-.64,n=o.segments||6,gap=o.gapDegrees===undefined?.6:o.gapDegrees*Math.PI/180,start=gap/2,end=Math.PI*2-gap/2;
   const sector=(r0,r1,a,b,h,y,color)=>{
    const pts=[];for(let i=0;i<=8;i++){const t=a+(b-a)*i/8;pts.push(new THREE.Vector2(Math.cos(t)*r1,-Math.sin(t)*r1));}
    for(let i=8;i>=0;i--){const t=a+(b-a)*i/8;pts.push(new THREE.Vector2(Math.cos(t)*r0,-Math.sin(t)*r0));}
    const bevel=o.bevel?Math.min(o.bevel,h/4):0;
    const geo=new THREE.ExtrudeGeometry(new THREE.Shape(pts),{depth:h-2*bevel,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,steps:1});geo.rotateX(-Math.PI/2);const mesh=new THREE.Mesh(geo,mat(color));mesh.position.y=y+bevel;add(mesh);
   };
   for(let i=0;i<n;i++){const a=start+(end-start)*i/n+.013,b=start+(end-start)*(i+1)/n-.013;
    sector(inner,outer,a,b,.31,.1,'#424b50');sector(inner,outer-.06,a,b,.14,.41,o.seatColor||'#4a6770');sector(outer-.17,outer,a,b,.59,.51,o.color||'#a5aca9');
   }
  }else if(k==='acoustic-booth'){
   const w=o.width||2.1,d=o.depth||1.45,h=o.height||1.52,grey=o.color||'#939d9d';
   add(box([w,.12,d],[0,.1,0],'#46545b'));add(box([w,h,.14],[0,h/2,-d/2+.07],grey));
   for(const side of [-1,1]){
    add(box([.13,h,d],[side*(w/2-.065),h/2,0],grey));
    add(box([.61,.38,d-.22],[side*(w/2-.39),.34,.035],grey));
    add(box([.58,.13,d-.23],[side*(w/2-.4),.58,.035],'#788789'));
    add(box([.16,.61,d-.24],[side*(w/2-.2),.89,.035],'#7f8a8c'));
   }
   const table=cyl(.46,.045,[0,.75,.09],neutral.white,24);table.scale.z=1.2;add(table);add(cyl(.25,.68,[0,.37,.09],neutral.white,16,.12));
  }else if(k==='column'){
   level='architecture';const w=o.width||.82,d=o.depth||w,h=o.height||3.1;
   add(box([w,h,d],[0,h/2,0],o.color||neutral.white));add(box([w+.025,.11,d+.025],[0,.055,0],neutral.dark));
   for(const [i,line] of (o.lines||[]).entries()){const unit=Math.min(.024,(w-.12)/Math.max(1,line.length*6));text(line,[-line.length*unit*3,h-.36-i*.22,d/2+.015],unit,neutral.white);}
  }else if(k==='sign-panel'){
   level='architecture';const w=o.width||2,h=o.height||.55,d=o.depth||.06;
   add(box([w,h,d],[0,h/2,0],o.color||'#284a61'));
   for(const [i,line] of (o.lines||[o.text||'']).entries()){const unit=Math.min(o.fontUnit||.055,(w-.16)/Math.max(1,line.length*6));text(line,[-line.length*unit*3,h-.12-i*(h/(o.lines?.length||1)),d/2+.012],unit,o.textColor||neutral.white);}
  }else if(k==='double-door'){
   level='architecture';const w=o.width||1.9,h=o.height||2.65,leaf=w/2,open=(o.openDegrees??55)*Math.PI/180;
   for(const x of [-w/2,w/2])add(box([.11,h,.16],[x,h/2,0],neutral.dark));add(box([w+.12,.13,.18],[0,h,0],neutral.dark));
   for(const sign of [-1,1]){
    const pivot=new THREE.Group();pivot.position.x=sign*w/2;pivot.rotation.y=sign*open;
    pivot.add(box([leaf-.04,h-.13,.065],[-sign*leaf/2,(h-.13)/2,0],o.color||'#c4b68e'));
    pivot.add(box([.14,1.0,.017],[-sign*leaf*.4,1.3,.041],'#d6e3e3','frosted'));
    pivot.add(box([.18,.035,.045],[-sign*leaf*.78,.96,.06],neutral.dark));add(pivot);
   }
   add(box([.3,.12,.04],[0,h+.15,0],'#5b997b'));
  }else if(k==='rect-planter'){
   const w=o.width||2.2,d=o.depth||.75,h=o.height||.55;
   add(box([w,h,d],[0,h/2,0],o.color||'#afb9b4','metal'));add(box([w-.1,.03,d-.1],[0,h,0],neutral.soil));
   for(let i=0;i<9;i++){const leaf=ball(.27,[-w*.4+i*w*.1,h+.17+(i%3)*.1,Math.sin(i*3)*d*.2],i%2?'#547955':'#819868');leaf.scale.set(.7,1.4,.7);add(leaf);}
  }else if(k==='open-stair'){
   const n=o.steps||17,w=o.width||2.8,len=o.length||5.1,rise=o.rise||2.9;
   for(let i=0;i<n;i++){const y=rise*(i+1)/n,z=-len/2+len*(i+.5)/n;add(box([w,y,len/n+.005],[0,y/2,z],o.color||'#e5e5df'));add(box([w,.018,.025],[0,y+.009,z-len/n/2+.04],'#b9c3c2','metal'));}
   add(box([w,.14,.9],[0,rise-.07,len/2+.45],'#e5e5df'));
   for(const sign of [-1,1]){
    for(let i=0;i<=n;i+=2){const z=-len/2+len*i/n,y=rise*i/n;add(rod([sign*w/2,y,z],[sign*w/2,y+.95,z],.022,neutral.steel));}
    add(rod([sign*w/2,1,-len/2],[sign*w/2,rise+1,len/2],.035,neutral.steel));
   }
  }else if(k==='sofa'){
   const w=o.width||2.25;add(box([w,.36,.9],[0,.4,0],col));add(box([w,.56,.18],[0,.83,-.42],col));
   for(const x of [-w*.225,w*.225])add(box([w*.43,.14,.7],[x,.62,.02],o.seatColor||'#d4d5cf'));
   for(const x of [-w/2+.07,w/2-.07])add(box([.16,.42,.9],[x,.73,0],col));
   for(const x of [-w*.42,w*.42])for(const z of [-.32,.32])add(box([.045,.21,.045],[x,.11,z],neutral.dark));
  }else if(k==='armchair'){
   add(box([.72,.18,.68],[0,.48,.02],col));
   const back=box([.76,.68,.18],[0,.83,-.26],col);back.rotation.x=-.12;add(back);
   for(const x of [-.34,.34]){const arm=box([.14,.32,.59],[x,.65,.01],col);arm.rotation.z=x>0?-.06:.06;add(arm);}
   add(box([.55,.065,.5],[0,.59,.065],col));
   for(const x of [-1,1])for(const z of [-1,1])add(rod([x*.24,.43,z*.2],[x*.33,.035,z*.3],.018,neutral.dark));
  }else if(k==='cafe-chair'){
   add(box([.49,.07,.48],[0,.46,0],o.color||'#e1e2d9'));
   const back=box([.5,.4,.065],[0,.69,-.24],o.color||'#e1e2d9');back.rotation.x=-.13;add(back);
   for(const x of [-.27,.27]){
    add(rod([x,.46,-.2],[x,.055,-.3],.014,neutral.steel));add(rod([x,.055,-.3],[x,.055,.28],.014,neutral.steel));add(rod([x,.055,.28],[x,.63,.2],.014,neutral.steel));add(rod([x,.63,.2],[x,.64,-.19],.014,neutral.steel));
    add(box([.045,.035,.29],[x,.65,.025],neutral.dark));
   }
  }else if(k==='study-table'||(k==='cafe-table'&&o.shape==='rect')){
   const w=o.width||2.1,d=o.depth||.8,h=o.height||.74;add(box([w,.055,d],[0,h,0],o.color||neutral.wood));
   for(const x of [-w*.43,w*.43]){for(const z of [-d*.38,d*.38])add(rod([x,h-.025,z],[x,.045,z],.025,neutral.steel));add(rod([x,.25,-d*.38],[x,.25,d*.38],.02,neutral.steel));}
   add(rod([-w*.43,.25,0],[w*.43,.25,0],.02,neutral.steel));
  }else if(['low-table','round-table','cafe-table'].includes(k)){
   const h=o.height||(k==='low-table'?.43:.73),r=o.radius||(k==='cafe-table'?.48:.65),color=o.color||(k==='low-table'?'#555b5e':neutral.white);
   add(cyl(r,.035,[0,h,0],color,24));
   if(k==='round-table'){
    add(cyl(.045,h-.12,[0,h/2,0],neutral.white,8));
    for(let i=0;i<4;i++){const a=i*Math.PI/2;add(rod([0,.12,0],[Math.cos(a)*r*.7,.03,Math.sin(a)*r*.7],.026,neutral.white));}
   }else{add(cyl(.035,h,[0,h/2,0],neutral.dark,8));add(cyl(Math.min(.28,r*.7),.025,[0,.02,0],neutral.dark,16));}
  }else if(k==='pouf'){
   const r=o.radius||.8,h=o.height||.42;add(cyl(r*.88,.025,[0,.022,0],neutral.dark,24));const seat=softPouf(r,h-.025,o.color||'#b7bcb9',o.tapered??r<.4);seat.position.y=.035;add(seat);
  }else if(k==='bar'){
   const w=o.width||5.8,h=o.height||1.05,d=o.depth||.78;
   for(const x of [-w/2+.065,w/2-.065])add(box([.13,h-.05,d],[x,(h-.05)/2,0],o.color||neutral.yellow));
   add(box([w-.26,h-.17,.1],[0,(h-.17)/2,-d/2+.08],o.color||neutral.yellow));
   add(box([w+.08,.07,d+.13],[0,h,0],o.topColor||'#bdc1bd'));
   add(box([w-.2,.045,.045],[0,.22,d/2-.02],neutral.steel,'metal'));
  }else if(k==='bar-stool'){
   const finish=o.color||neutral.dark,frame=o.frameColor||finish;
   add(box([.46,.065,.43],[0,.78,0],finish));
   for(const x of [-.21,.21])add(rod([x,.77,-.17],[x,1.17,-.23],.015,frame));
   for(let i=0;i<5;i++)add(box([.43,.045,.04],[0,.9+i*.06,-.2-(i*.01)],finish));
   for(const x of [-1,1])for(const z of [-1,1])add(rod([x*.17,.77,z*.15],[x*.24,.025,z*.24],.014,frame));
   for(const x of [-.22,.22])add(rod([x,.29,-.21],[x,.29,.21],.013,frame));add(rod([-.22,.29,.21],[.22,.29,.21],.013,frame));
  }else if(k==='padded-bench'){
   const w=o.width||3,d=o.depth||.57,h=o.height||.48;
   add(box([w,.14,d],[0,h-.14,0],neutral.wood));
   for(const x of [-w/2+.1,w/2-.1])add(box([.16,h-.16,d*.88],[x,(h-.16)/2,0],neutral.wood));
   const seats=Math.min(8,Math.max(1,Math.round(w/.78)));for(let i=0;i<seats;i++)add(box([w/seats-.025,.085,d+.015],[-w/2+(i+.5)*w/seats,h-.025,0],o.color||'#7c8585'));
  }else if(k==='round-pillar-planter'||(k==='pillar-planter'&&o.variant==='round-wood')){
   const r=o.radius||1.45,inner=r*.76;
   add(cyl(r,.36,[0,.18,0],o.benchColor||'#92979c',40));add(cyl(r+.025,.045,[0,.385,0],neutral.wood,40));
   add(cyl(inner,.41,[0,.61,0],neutral.wood,40));add(cyl(inner*.94,.025,[0,.825,0],neutral.soil,32));
   const slats=48;for(let i=0;i<slats;i++){const a=i/slats*Math.PI*2;add(box([.065,.39,.018],[Math.cos(a)*(inner+.008),.61,Math.sin(a)*(inner+.008)],'#cab789','solid',Math.PI/2-a));}
   leaves(inner*.9,.89,28,true);add(box([.58,o.columnHeight||2.98,.58],[0,(o.columnHeight||2.98)/2,0],neutral.white));
  }else if(k==='pillar-planter'){
   add(cyl(1.5,.43,[0,.215,0],neutral.white,40));
   add(cyl(1.49,.035,[0,.445,0],'#e3e4dc',40));
   if(o.variant==='round-white'){add(cyl(.96,.51,[0,.705,0],neutral.white,40));add(cyl(.88,.025,[0,.975,0],neutral.soil,32));}
   else{add(box([1.75,.51,1.75],[0,.705,0],neutral.white));add(box([1.6,.025,1.6],[0,.975,0],neutral.soil));}
   leaves(.75,1.02,24,true);const ch=o.columnHeight||2.98;add(box([.58,ch,.58],[0,ch/2,0],neutral.white));
  }else if(k==='plant'){
   const r=o.radius||.32,h=o.height||.42;add(cyl(r*.8,h,[0,h/2,0],neutral.white,20,r));add(cyl(r*.91,.025,[0,h,0],neutral.soil,16));leaves(r*.9,h,12);
  }else if(k==='window-reference'){
   level='architecture';const w=o.width||7.4,h=o.height||2.6;
   add(box([w,h,.035],[0,h/2+.25,0],'#c4d5d8','glass'));
   for(let i=0;i<8;i++)add(box([.04,h+.05,.06],[-w/2+w*i/7,h/2+.25,0],neutral.steel,'metal'));
   for(const y of [.22,1.05,h+.25])add(box([w,.035,.06],[0,y,0],neutral.steel,'metal'));
   if(o.blinds!==false)for(let i=0;i<10;i++)add(box([w,.025,.06],[0,1.28+i*.14,.04],'#a6aaa4'));
  }else if(k==='yellow-divider'||k==='wall-panel'){
   level='architecture';const w=o.width||3,h=o.height||(k==='yellow-divider'?1.9:2.65),d=o.depth||.08;
   add(box([w,h,d],[0,h/2,0],o.color||(k==='yellow-divider'?neutral.yellow:neutral.white)));
   if(k==='yellow-divider'||o.slatted)for(let i=0;i<=Math.min(40,Math.ceil(w/.22));i++){const n=Math.min(40,Math.ceil(w/.22));add(box([.012,h,d+.008],[-w/2+w*i/n,h/2,.008],o.slatted?(o.slatColor||o.color||neutral.wood):neutral.white));}
   if(k==='wall-panel')add(box([w,.075,d+.018],[0,.04,.012],neutral.dark));
  }else if(k==='lobby-balcony-rail'){
   level='architecture';const w=o.width,h=o.height||1;
   add(box([w,h-.12,.025],[0,h/2,0],'#b9d2d5','glass'));
   for(const y of [.04,h])add(rod([-w/2,y,0],[w/2,y,0],.025,neutral.steel));
   const n=Math.ceil(w/1.8);for(let i=0;i<=n;i++)add(rod([-w/2+w*i/n,0,0],[-w/2+w*i/n,h,0],.022,neutral.steel));
  }else if(k==='glass-screen'){
   level='architecture';glassBay(o.width||4.2,o.height||2.45);if(o.mullions!==false)add(box([.035,2.5,.06],[0,1.25,0],neutral.dark));
  }else if(k==='entrance-glazing'){
   level='architecture';const w=o.width||4.8,h=o.height||2.85,n=Math.max(2,Math.min(8,Math.round(o.leaves||4))),dh=h-.48;
   add(box([w,h,.025],[0,h/2,0],'#c4d5d8','glass'));
   for(let i=0;i<=n;i++)add(box([.055,h,.09],[-w/2+i*w/n,h/2,0],neutral.dark));
   for(const y of [.04,dh,h])add(box([w,.065,.09],[0,y,0],neutral.dark));
   for(let i=0;i<n;i++){const sign=i%2===0?1:-1,x=-w/2+(i+.5)*w/n+sign*(w/n*.35);add(rod([x,.92,.085],[x,1.48,.085],.017,neutral.steel));}
  }else if(k==='door-bay'){
   level='architecture';const w=o.width||3.6,h=o.height||2.65,dw=Math.min(o.doorWidth||.95,w),sign=o.doorSide==='left'?-1:1,gap=.16,gw=o.glassWidth??Math.max(0,w-dw-gap),dx=sign*(w/2-dw/2);
   if(gw>0)glassBay(gw,h,-sign*(w/2-gw/2));
   add(box([dw,h-.1,.075],[dx,(h-.1)/2,.025],o.color||'#c5bd83'));
   for(const x of [dx-dw/2,dx+dw/2])add(box([.07,h+.05,.14],[x,h/2,.015],neutral.dark));
   add(box([dw+.12,.075,.14],[dx,h,.015],neutral.dark));
   const labelX=dx-sign*(dw/2+.105);add(box([.22,h,.1],[labelX,h/2,.008],neutral.dark));
   add(box([.15,1.15,.018],[dx+sign*.12,1.22,.072],'#dce4dc','frosted'));
   add(box([.2,.025,.045],[dx-sign*.28,.94,.095],neutral.dark));
   text(o.doorNumber||'', [labelX-.022,h-.22,.069],.018,neutral.white,true);
   add(box([.16,.085,.022],[labelX,h-.83,.075],neutral.white));
   add(box([.15,.105,.025],[labelX,1.15,.075],'#719c71'));
   add(box([.12,.072,.015],[labelX,1.15,.092],'#485762'));
  }else if(k==='elevator-bay'){
   level='architecture';const w=o.width||1.35,h=o.height||2.7,pier=.26,dw=w-pier,dx=-pier/2,dh=h-.38;
   add(box([dw,dh,.16],[dx,dh/2,0],neutral.dark));
   for(const sign of [-1,1])add(box([dw/2-.018,dh-.07,.045],[dx+sign*dw/4,dh/2,.108],o.color||'#a9b0b0','metal'));
   for(const x of [-w/2+.0225,w/2-pier-.0225])add(box([.045,dh+.06,.2],[x,(dh+.06)/2,.015],neutral.steel,'metal'));
   add(box([dw,.38,.24],[dx,h-.19,.015],neutral.dark));add(box([dw-.06,.035,.23],[dx,dh+.025,.025],neutral.steel,'metal'));
   add(box([dw,.025,.24],[dx,.025,.035],neutral.steel,'metal'));
   const px=w/2-pier/2;add(box([pier,h,.2],[px,h/2,0],neutral.white));
   text(o.floorLabel||'1F',[px-.095,h-.48,.112],.018,neutral.dark);
   add(box([.085,.22,.03],[px,1.16,.12],neutral.steel,'metal'));add(box([.027,.027,.012],[px,1.17,.141],neutral.dark));
  }else if(k==='phone-booth'){
   level='architecture';const w=o.width||1.1,d=o.depth||1.1,h=o.height||2.25,finish=o.color||neutral.white;
   add(box([w,.085,d],[0,.045,0],neutral.dark));add(box([w,.14,d],[0,h-.07,0],finish));
   add(box([w-.12,h-.22,.075],[0,h/2,-d/2+.04],'#687575'));
   for(const x of [-w/2+.04,w/2-.04]){
    for(const z of [-d/2+.04,d/2-.04])add(box([.08,h,.08],[x,h/2,z],finish));
    add(box([.018,h-.22,d-.16],[x,h/2,0],'#b7d7df','glass'));
   }
   add(box([w-.18,h-.24,.022],[0,h/2,d/2-.025],'#b7d7df','glass'));
   for(const x of [-w/2+.1,w/2-.1])add(box([.025,h-.2,.035],[x,h/2,d/2-.009],neutral.dark));
   for(const y of [.1,h-.1])add(box([w-.2,.025,.035],[0,y,d/2-.009],neutral.dark));
   add(rod([w/2-.2,.95,d/2+.025],[w/2-.2,1.2,d/2+.025],.012,neutral.steel));
   for(const y of [.42,h-.4])add(box([.035,.08,.03],[-w/2+.11,y,d/2+.011],neutral.steel,'metal'));
   add(box([w-.23,.045,.3],[0,1.02,-d/2+.2],neutral.wood));
  }else if(k==='radiator'){
   const w=o.width||1.6,h=o.height||.58,d=o.depth||.16;add(box([w,h,d],[0,h/2+.12,0],neutral.white));
   for(let i=0;i<=Math.ceil(w/.1);i++)add(box([.018,h*.84,d+.012],[-w/2+w*i/Math.ceil(w/.1),h/2+.12,.008],'#d0d4cd'));
   for(const x of [-w*.35,w*.35])add(box([.045,.13,.06],[x,.065,0],neutral.steel));
  }else if(k==='floor-disc'){
   level='ground';add(cyl(o.radius||1.9,.006,[0,.009,0],o.color||neutral.white,40));
  }else if(k==='floor-mat'){
   level='ground';add(box([o.width||2.6,.012,o.depth||1.8],[0,.009,0],o.color||'#626a6c'));
  }else if(k==='floor-carpet'){
   level='ground';const w=o.width||5,d=o.depth||4;add(box([w,.012,d],[0,.009,0],o.color||'#77868a'));
   const count=Math.min(48,Math.ceil(d/.13));for(let i=0;i<count;i++)add(box([w,.002,d/count*.32],[0,.016,-d/2+(i+.5)*d/count],i%2?'#8c9899':'#62777f'));
  }else if(k==='floor-tiles'){
   level='ground';const w=o.width||8,d=o.depth||7,step=o.tileSize||.8;
   add(box([w,.006,d],[0,.005,0],o.color||'#dfdfd7'));
   for(let x=-w/2+step;x<w/2;x+=step)add(box([.007,.002,d],[x,.009,0],o.seamColor||'#c8ccc5'));
   for(let z=-d/2+step;z<d/2;z+=step)add(box([w,.002,.007],[0,.009,z],o.seamColor||'#c8ccc5'));
  }else if(k==='alumni-wall'){
   level='architecture';const w=o.width||7.5;
   add(box([w,2.45,.075],[0,1.3,0],'#858a88'));add(box([w,.035,.075],[0,2.28,.065],'#c2cb98'));
   add(box([2.08,1.14,.065],[-1.85,1.38,.07],neutral.dark));add(box([1.98,1.04,.015],[-1.85,1.38,.111],'#53667f'));
   add(box([.82,.98,.017],[-2.39,1.38,.123],'#89a966'));add(box([1.08,.32,.017],[-1.38,1.05,.123],'#688798'));
   text('ALUMNI',[.05,2.02,.083],.035);
   for(const x of [.4,1.13,1.86,2.59]){
    add(box([.61,.62,.08],[x,1.36,.085],neutral.wood));
    for(const xx of [-.31,.31])add(box([.035,.65,.19],[x+xx,1.36,.16],neutral.white));
    for(const y of [1.04,1.68])add(box([.66,.035,.19],[x,y,.16],neutral.white));
    add(box([.51,.015,.11],[x,1.65,.16],neutral.white,'light'));
    add(box([.18,.24,.06],[x-.08,1.18,.19],'#c2cb98'));add(box([.11,.15,.08],[x+.11,1.135,.2],neutral.white));
   }
   add(box([w,.16,.2],[0,.12,.08],neutral.white));
  }else if(k==='info-stand'){
   const w=o.width||.58,h=o.height||1.65;
   add(box([w+.1,.035,.42],[0,.025,0],neutral.dark));add(rod([0,.04,0],[0,h*.8,0],.023,neutral.dark));
   const panel=box([w,h*.66,.045],[0,h*.66,0],o.color||'#4c6373');panel.rotation.x=-.06;add(panel);
   add(box([w*.8,.065,.012],[0,h*.92,.034],o.accentColor||'#c2cb98'));
   for(let i=0;i<5;i++)add(box([w*(i===4?.48:.75),.015,.012],[0,h*.83-i*.09,.034],neutral.white));
  }else if(k==='water-station'){
   const w=o.width||.65,h=o.height||1.15,d=o.depth||.45;
   add(box([w,h,d],[0,h/2,0],o.color||'#ecece5'));add(box([w*.7,h*.27,.018],[0,h*.68,d/2+.012],neutral.dark));
   add(box([w*.58,.035,.18],[0,h*.49,d/2+.06],neutral.steel,'metal'));
   for(const x of [-w*.15,w*.15])add(box([.035,.07,.06],[x,h*.72,d/2+.04],neutral.steel,'metal'));
   add(box([w*.7,.035,.018],[0,h*.91,d/2+.012],'#719c71'));
  }else if(k==='pantry-counter'||k==='coffee-counter'){
   const w=o.width||3,d=o.depth||.7,h=o.height||(k==='coffee-counter'?.96:.86),coffee=k==='coffee-counter';
   add(box([w,h-.055,d],[0,(h-.055)/2,0],o.color||'#8f9695'));add(box([w+.06,.055,d+.06],[0,h,0],coffee?'#e1dfd3':'#b9beba'));
   if(coffee){
    const ribs=Math.min(48,Math.ceil(w/.065));for(let i=0;i<ribs;i++)add(box([.012,h-.14,.02],[-w/2+(i+.5)*w/ribs,h/2,d/2+.012],'#b9beba'));
    add(box([w-.06,.025,.04],[0,.07,d/2+.025],o.lightColor||neutral.white,'light'));
    if(o.machine!==false){
     add(box([.75,.38,.4],[0,h+.2,-.03],neutral.dark));add(box([.69,.11,.12],[0,h+.29,.21],neutral.steel,'metal'));
     for(const x of [-.2,.2])add(cyl(.035,.08,[x,h+.17,.25],neutral.steel,8));add(box([.7,.025,.23],[0,h+.04,.21],neutral.steel,'metal'));
    }
   }else{
    const doors=Math.max(2,Math.round(w/.65));for(let i=1;i<doors;i++)add(box([.012,h-.12,.016],[-w/2+i*w/doors,h/2,d/2+.01],neutral.dark));
    for(let i=0;i<doors;i++)add(box([w/doors*.48,.018,.026],[-w/2+(i+.5)*w/doors,h-.19,d/2+.03],neutral.steel,'metal'));
    if(o.sink!==false){const sx=-w*.24;add(box([.56,.009,.39],[sx,h+.031,0],neutral.steel,'metal'));add(box([.46,.012,.29],[sx,h+.036,0],'#677b7b'));
    add(rod([sx,h+.04,-.22],[sx,h+.3,-.22],.016,neutral.steel));add(rod([sx,h+.3,-.22],[sx,h+.3,-.02],.016,neutral.steel));add(rod([sx,h+.3,-.02],[sx,h+.25,-.02],.016,neutral.steel));}
   }
  }else if(k==='vending-cabinet'){
   const w=o.width||.95,h=o.height||1.95,d=o.depth||.7,red=o.color||'#af4842';
   add(box([w,h,d],[0,h/2,0],red));add(box([w*.78,h*.72,.035],[0,h*.48,d/2+.022],neutral.dark));
   add(box([w*.64,h*.64,.015],[0,h*.49,d/2+.048],'#9fb6b3','glass'));
   add(box([w*.7,.07,.016],[0,h*.91,d/2+.025],neutral.white));
   for(let row=0;row<4;row++){
    const y=h*(.25+row*.14);add(box([w*.65,.02,.07],[0,y-.025,d/2+.042],neutral.steel,'metal'));
    for(let column=0;column<4;column++){
     const x=(column-1.5)*w*.14;add(cyl(.032,.15,[x,y+.055,d/2+.055],column%2?'#c6b36a':'#6b9479',8));add(cyl(.017,.03,[x,y+.145,d/2+.055],neutral.white,6));
    }
   }
   add(box([.035,h*.22,.035],[w*.36,h*.49,d/2+.073],neutral.steel,'metal'));
  }else if(k==='ceiling-projector'){
   level='ceiling';const h=o.height||3.3;
   add(rod([0,h,0],[0,h-.32,0],.035,neutral.white));add(box([.62,.22,.42],[0,h-.41,0],neutral.white));add(cyl(.09,.06,[.17,h-.4,.24],neutral.dark));
  }else if(k==='slat-ceiling'||k==='open-ceiling'){
   level='ceiling';const w=o.width||8,d=o.depth||7,h=o.height||2.94;
   if(k==='slat-ceiling'){
    for(let x=-w/2;x<=w/2;x+=.23)add(box([.055,.14,d],[x,h,0],o.slatColor||o.color||neutral.wood));
    for(const x of [-w*.3,0,w*.3])for(const z of [-d*.3,0,d*.3])add(box([Math.min(o.lightLength||1.15,w*.25),.025,.055],[x,h-.09,z],neutral.white,'light'));
   }else{
    for(let z=-d/2;z<=d/2;z+=1.8)add(box([w,.16,.11],[0,h,z],neutral.dark));
    for(let z=-d/2+.55;z<d/2;z+=1.8)add(box([w*.72,.08,.72],[0,h-.02,z],'#919492'));
    for(const x of [-w*.36,w*.36])add(rod([x,h+.04,-d/2],[x,h+.04,d/2],.035,neutral.dark));
    for(const x of [-w*.24,w*.24]){
     add(box([.07,.035,d*.86],[x,h-.2,0],neutral.white,'light'));
     for(const z of [-d*.32,d*.32])add(rod([x,h,z],[x,h-.2,z],.009,neutral.steel));
    }
   }
  }else if(k==='planks'){
   level='ground';const w=o.width||8,d=o.depth||10,step=cartoon?.4:.21;
   for(let i=0;i<Math.ceil(w/step);i++){const x=-w/2+i*step,span=Math.min(step,w/2-x);if(span>.005)add(box([span-.005,.002,d],[x+span/2,.001,0],i%2?'#8d918f':'#939795'));}
  }
  g.position.set(...o.position);g.rotation.y=(o.yawDegrees||0)*Math.PI/180;g.updateMatrixWorld(true);
  return {group:g,level};
 }
 // No textures, instancing extensions, or DOM are required by the portable exporter.
 function batch(source,target,extra){
  source.updateMatrixWorld(true);const buckets=new Map();
  source.traverse(m=>{if(!m.isMesh)return;const geometry=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();geometry.applyMatrix4(m.matrixWorld);
   const entry=buckets.get(m.material.uuid)||{material:m.material,positions:[],normals:[]};entry.positions.push(geometry.attributes.position.array);entry.normals.push(geometry.attributes.normal.array);buckets.set(m.material.uuid,entry);geometry.dispose();m.geometry.dispose();
  });
  for(const entry of buckets.values()){
   const join=arrays=>{const result=new Float32Array(arrays.reduce((n,a)=>n+a.length,0));let offset=0;for(const a of arrays){result.set(a,offset);offset+=a.length;}return result;};
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(join(entry.positions),3));geometry.setAttribute('normal',new THREE.BufferAttribute(join(entry.normals),3));
   const mesh=new THREE.Mesh(geometry,entry.material);mesh.name=`${extra.sourceObject||extra.fieldZone}-${extra.level}-${entry.material.color.getHexString()}`;mesh.userData={...extra,evidence:'video-informed-provisional-fitout'};target.add(mesh);
  }
 }
 for(const zone of placedFitoutZones(model)){
  const group=new THREE.Group();group.name=zone.title;group.userData={fieldZone:zone.id,placementStatus:zone.placementStatus};
  group.position.set((zone.origin[0]-model.coordinates.origin[0])*model.coordinates.metersPerPixel,0,(zone.origin[1]-model.coordinates.origin[1])*model.coordinates.metersPerPixel);group.rotation.y=(zone.yawDegrees||0)*Math.PI/180;
  const levels={};for(const name of ['ground','furniture','architecture','ceiling','annotation']){levels[name]=new THREE.Group();levels[name].name=name;group.add(levels[name]);}
  const sources=Object.fromEntries(Object.keys(levels).map(level=>[level,new THREE.Group()]));
  for(const o of zone.objects){const part=objectMeshes(o);if(editable)batch(part.group,levels[part.level],{fieldZone:zone.id,level:part.level,sourceObject:o.id,sourceKind:o.kind,sourceEvidence:o.evidence,...(o.assemblyRevision?{assemblyRevision:o.assemblyRevision,assemblyEvidence:o.assemblyEvidence,portalIdentity:o.identity,sharedBy:o.sharedBy,publicConnector:Boolean(o.publicConnector),notPublicConnector:Boolean(o.notPublicConnector)}:{})});else sources[part.level].add(part.group);}
  if(!editable)for(const level of Object.keys(levels))batch(sources[level],levels[level],{fieldZone:zone.id,level,...(zone.isCandidatePlacement?{placementStatus:zone.placementStatus,placementConfidence:zone.candidatePlacement.confidence||'low',siteAlignment:false}:{})});
  root.add(group);zones.set(zone.id,{group,levels,zone});
 }
 // Bake every dash into line-segment geometry so uncertainty survives portable GLB export.
 const relationLines=new THREE.Group();relationLines.name='视频关系线 · 非导航路线';
 const lineMaterials={candidate:new THREE.LineBasicMaterial({color:'#c48a32'}),observed:new THREE.LineBasicMaterial({color:'#298c86'})};
 const planWorld=p=>new THREE.Vector3((p[0]-model.coordinates.origin[0])*model.coordinates.metersPerPixel,.045,(p[1]-model.coordinates.origin[1])*model.coordinates.metersPerPixel);
 function relationshipLine(points,dashed,name,metadata){
  const vertices=[];
  for(let i=1;i<points.length;i++){
   const a=planWorld(points[i-1]),b=planWorld(points[i]),length=a.distanceTo(b);if(length<.001)continue;
   if(!dashed){vertices.push(...a.toArray(),...b.toArray());continue;}
   for(let t=0;t<length;t+=.55){const end=Math.min(t+.32,length);vertices.push(...a.clone().lerp(b,t/length).toArray(),...a.clone().lerp(b,end/length).toArray());}
  }
  if(!vertices.length)return null;
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  const line=new THREE.LineSegments(geometry,lineMaterials[dashed?'candidate':'observed']);line.name=name;line.userData={...metadata,navigationRoute:false,notNavigation:true,metricCalibration:false};return line;
 }
 for(const zone of placedFitoutZones(model).filter(z=>z.isCandidatePlacement)){
  const [w,d]=zone.sizeM,localCorners=zone.footprintLocalM?zone.footprintLocalM.map(p=>[p[0],0,p[1]]):[[-w/2,0,-d/2],[w/2,0,-d/2],[w/2,0,d/2],[-w/2,0,d/2]],corners=[...localCorners,localCorners[0]].map(p=>fitoutPoint(zone,p,model));
  const line=relationshipLine(corners,true,`${zone.id} · 暂定落位轮廓`,{candidateZone:zone.id,evidence:'hypothesis',notPhysicalWalls:true,description:'未配准的陈设显示范围；不是现场房间边界或导航路线。'});if(line)root.add(line);
 }
 for(const connection of model.integration?.connections||[]){
  if(connection.points?.length<2||!connection.points?.every(validPlanPoint))continue;
  const observed=['co-visible','continuous-video'].includes(connection.evidenceLevel);
  const line=relationshipLine(connection.points,!observed,`${connection.id} · ${observed?'视频关系':'假设连接'} · 非导航路线`,{integrationConnection:true,connectionId:connection.id,from:connection.from,to:connection.to,evidenceLevel:connection.evidenceLevel,note:connection.note||'',sourceTimes:connection.sourceTimes||[],description:observed?'同框或连续视频关系；连接位置与路径仍是示意，不是导航路线。':'假设连接，尚未核实；不是导航路线。'});if(line)relationLines.add(line);
 }
 for(const conflict of model.integration?.conflicts||[]){
  if(!validPlanPoint(conflict.point))continue;
  const p=planWorld(conflict.point),r=.14,positions=[p.x-r,.065,p.z-r,p.x+r,.065,p.z+r,p.x-r,.065,p.z+r,p.x+r,.065,p.z-r];
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const mark=new THREE.LineSegments(geometry,lineMaterials.candidate);mark.name=`${conflict.id} · 墙/门洞待核`;
  mark.userData={integrationConflict:true,conflictId:conflict.id,connectionId:conflict.connectionId,wallId:conflict.wallId,note:conflict.note||'',notPhysicalWalls:true,notNavigation:true,navigationRoute:false,description:'候选关系线与保留设计墙相交；门洞及现场连通性待核，没有切开或改变实体墙。'};relationLines.add(mark);
 }
 root.add(relationLines);
 const noses=new THREE.Group(),stair=model.fixtures.find(f=>f.id==='main-stair');
 if(stair){const [ax,az]=stair.a.map((v,i)=>(v-model.coordinates.origin[i])*model.coordinates.metersPerPixel),[bx,bz]=stair.b.map((v,i)=>(v-model.coordinates.origin[i])*model.coordinates.metersPerPixel),angle=-Math.atan2(bz-az,bx-ax),width=stair.widthPixels*model.coordinates.metersPerPixel;
  for(let i=0;i<stair.steps;i++){const t=i/stair.steps;noses.add(box([.035,.012,width],[ax+(bx-ax)*t,(i+1)*stair.rise/stair.steps+.005,az+(bz-az)*t],neutral.steel,'metal',angle));}
  batch(noses,root,{fieldZone:'main-stair',level:'furniture'});
 }
 // Keep recognisable display walls upright in the cartoon view; hide overhead beams.
 function setCutaway(enabled){for(const {levels} of zones.values()){levels.ceiling.visible=!enabled;levels.architecture.scale.y=enabled&&!cartoon?model.assumptions.cutawayHeightM/model.assumptions.wallHeightM:1;}}
 return {root,zones,setCutaway,setVisible(value){root.visible=value;},setConnectionsVisible(value){relationLines.visible=value;}};
}
export function resolveFitoutZone(model,id){
 return model.publicFitout?.zones.find(zone=>zone.id===id||zone.aliases?.includes(id));
}
