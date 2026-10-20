// R9 Alumni-only details. Display proportions are visual candidates, not measurements.
// Variants are opt-in, preserving the procedural geometry of R5–R8.
export function createAlumniFixture(o,{THREE,box,cyl,rod,mat,text}){
 if(o.detailRevision!=='r9')return null;
 const group=new THREE.Group(),add=m=>group.add(m),k=o.kind;
 let level='furniture';
 const soft=(size,p,color,r=.07)=>{
  const geo=new THREE.BoxGeometry(...size,6,6,6),a=geo.attributes.position,n=geo.attributes.normal;
  const v=new THREE.Vector3(),q=new THREE.Vector3(),d=new THREE.Vector3();r=Math.min(r,...size.map(s=>s*.45));
  for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i);q.set(...size.map((s,j)=>THREE.MathUtils.clamp(v.getComponent(j),-s/2+r,s/2-r)));d.copy(v).sub(q).normalize();v.copy(q).addScaledVector(d,r);a.setXYZ(i,v.x,v.y,v.z);n.setXYZ(i,d.x,d.y,d.z);}
  const mesh=new THREE.Mesh(geo,mat(color));mesh.position.set(...p);return mesh;
 };
 const shapeMesh=(points,depth,color,bevel=.015)=>{
  const shape=new THREE.Shape(points.map(p=>new THREE.Vector2(...p)));
  return new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,curveSegments:8}),mat(color));
 };
 const roundedShape=(w,h,r)=>{
  const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
 };
 if(k==='acoustic-booth'){
  const w=o.width,d=o.depth,h=o.height,gray='#969b9d';
  add(soft([w-.04,.07,d-.03],[0,.07,0],'#444c50',.028));
  add(soft([w,h-.12,.13],[0,h/2+.03,-d/2+.065],gray,.035));
  for(const side of [-1,1]){
   const outline=[[-d/2+.02,.09],[d/2-.10,.09],[d/2-.01,.17],[d/2-.01,.63],[d*.24,.87],[d*.24,h-.10],[d*.18,h-.035],[-d/2+.02,h-.035]];
   const wing=shapeMesh(outline.map(([z,y])=>[-z,y]),.115,gray,.025);wing.rotation.y=Math.PI/2;wing.position.x=side>0?w/2-.145:-w/2+.025;add(wing);
   add(soft([.66,.32,d-.16],[side*(w/2-.40),.29,.015],gray,.09));
   add(soft([.62,.125,d-.20],[side*(w/2-.40),.51,.025],'#727b7f',.055));
   const back=soft([.14,.57,d-.24],[side*(w/2-.17),.83,.015],'#818a8d',.055);back.rotation.z=side*.05;add(back);
   // A fine seam follows the upholstered seat, not a hard plastic border.
   add(rod([side*(w/2-.09),.59,-d*.35],[side*(w/2-.09),.59,d*.32],.005,'#b9bcb8','solid'));
  }
  add(soft([.76,.055,d*.77],[0,.745,.1],'#f1f1e8',.024));
  add(cyl(.25,.675,[0,.38,.1],'#e4e6e0',24,.14));
  add(box([.16,.11,.025],[0,.80,-d/2+.15],'#eceee7'));
  for(const x of [-.045,.045])add(box([.037,.045,.028],[x,.80,-d/2+.17],'#434c50'));
 }else if(k==='bar'){
  const w=o.width,d=o.depth,h=o.height;
  add(box([w-.10,h-.12,.075],[0,(h-.12)/2,o.twoSided?0:-d/2+.05],'#b49362'));
  for(const x of [-w/2+.045,w/2-.045]){
   add(box([.09,h-.045,d],[x,(h-.045)/2,0],'#c7a064'));
   for(let z=-d/2+.035;z<d/2;z+=.065)add(box([.006,h-.10,.008],[x+Math.sign(x)*.047,(h-.10)/2,z],'#b99059'));
  }
  for(const x of o.twoSided?[0]:[-w*.25,w*.25])add(box([.075,h-.10,d-.12],[x,(h-.10)/2,-.03],'#b79460'));
  add(soft([w+.04,.055,d+.035],[0,h,0],'#607782',.02));
  add(box([w-.18,.035,.035],[0,.28,d/2-.08],'#c9ad87','metal'));
  for(const x of [-w*.40,0,w*.40])add(rod([x,.28,d/2-.08],[x,.28,-d/2+.10],.013,'#c9ad87'));
  // Quiet linework stands in for the printed tabletop graphic; no invented prose.
  for(let i=0;i<3;i++)add(box([w*.44-i*.23,.002,.013],[-.7,h+.03,-.10+i*.075],'#a8bbc1'));
 }else if(k==='bar-stool'){
  const color=o.videoAuditRevision==='r10'?(o.color||'#d6b8a8'):'#d6b8a8';add(soft([.45,.055,.43],[0,.78,.015],color,.023));
  const s=roundedShape(.44,.37,.065);
  for(let row=0;row<3;row++)for(let col=0;col<4;col++){const hole=new THREE.Path();hole.absellipse(-.147+col*.098,-.105+row*.105,.026,.019,0,Math.PI*2,true);s.holes.push(hole);}
  const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:.025,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2,curveSegments:8}),mat(color));mesh.position.set(0,1.005,-.205);mesh.rotation.x=-.16;add(mesh);
  for(const x of [-1,1])for(const z of [-1,1])add(rod([x*.17,.77,z*.16],[x*.235,.025,z*.235],.013,color));
  for(const z of [-.22,.22])add(rod([-.22,.30,z],[.22,.30,z],.012,color));
  for(const x of [-.22,.22])add(rod([x,.30,-.22],[x,.30,.22],.012,color));
 }else if(k==='armchair'){
  const c=o.color||'#91a75c';add(soft([.65,.18,.67],[0,.48,.025],c,.075));
  const back=soft([.73,.68,.16],[0,.82,-.27],c,.075);back.rotation.x=-.15;add(back);
  for(const side of [-1,1]){const arm=soft([.13,.29,.56],[side*.32,.65,.01],c,.059);arm.rotation.z=-side*.10;add(arm);}
  add(soft([.54,.07,.52],[0,.58,.06],c,.033));
  for(const x of [-1,1])for(const z of [-1,1])add(rod([x*.235,.44,z*.20],[x*.35,.025,z*.32],.013,'#303a3a'));
  add(rod([-.30,.18,-.27],[.30,.18,.27],.011,'#303a3a'));add(rod([.30,.18,-.27],[-.30,.18,.27],.011,'#303a3a'));
 }else if(k==='sofa'){
  const w=o.width,c='#36566a',seat='#b6bebf',n=w>1.4?2:1;
  add(soft([w,.24,.87],[0,.33,0],c,.04));
  add(soft([w,.51,.14],[0,.70,-.37],c,.035));
  for(const x of [-w/2+.075,w/2-.075])add(soft([.15,.46,.86],[x,.60,0],c,.035));
  for(let i=0;i<n;i++){
   const x=(i-(n-1)/2)*(w-.34)/n,cw=(w-.34)/n-.018;
   add(soft([cw,.15,.65],[x,.505,.045],seat,.055));
   const b=soft([cw,.45,.15],[x,.78,-.255],seat,.06);b.rotation.x=-.1;add(b);
  }
  for(const x of [-w*.42,w*.42])for(const z of [-.31,.31])add(rod([x,.235,z],[x,.035,z],.015,'#2f393e'));
 }else if(k==='c-side-table'){
  const w=o.width||.45,d=o.depth||.47,h=o.height||.58,c='#354b59';
  add(box([w,.027,d],[0,.025,0],c));add(box([w,.024,d],[0,h,0],c));add(box([w,h-.04,.025],[0,h/2,-d/2+.012],c));
 }else if(k==='gallery-wall'){
  level='architecture';const w=o.referenceSpan||o.width,h=o.height;
  add(box([w,h,.14],[0,h/2,0],'#959b9d'));add(box([w,.21,.22],[0,.11,.055],'#eeeae3'));
  for(const y of [.235,h-.16])add(box([w,.028,.045],[0,y,.18],'#ffe9c8','light'));
  add(box([w,.12,.31],[0,h-.06,.07],'#ddd9d3'));
  for(const [i,c] of ['#5f94af','#dc9c52','#a8bd52','#5bb5c8'].entries())add(box([w/4,.027,.012],[-w/2+(i+.5)*w/4,h-.44,.079],c));
  // The TV is near the bar end. The other bays are distinct warm-lit displays.
  add(soft([2.12,1.18,.07],[-4.0,1.70,.13],'#202a30',.025));add(box([1.98,1.06,.016],[-4.0,1.70,.178],'#407880'));
  for(let i=0;i<5;i++)add(box([.25,.23+i*.09,.012],[-4.65+i*.32,1.50+i*.03,.192],['#86b09c','#c3d8d2','#b9ad89','#7e9aab','#c7cfc1'][i]));
  const bays=[[-5.65,1.10,.58],[-5.7,2.05,.62],[-2.45,2.0,.66],[-1.55,2.0,.66],[-.65,2.0,.66],[-1.98,1.12,.66],[-1.10,1.12,.66],[1.65,2.0,.70],[2.62,2.0,.70],[3.58,2.0,.70],[4.65,2.0,.70]];
  for(const [i,[x,y,bw]] of bays.entries()){
   const bh=.56;add(box([bw,bh,.02],[x,y,.082],'#bca691'));
   for(const dx of [-bw/2,bw/2])add(box([.035,bh+.04,.24],[x+dx,y,.20],'#e8d8c3'));
   for(const dy of [-bh/2,bh/2])add(box([bw,.035,.24],[x,y+dy,.20],'#edddc9'));
   add(box([bw-.04,.015,.13],[x,y+bh/2-.02,.20],'#ffdfb2','light'));
   // Abstract publications and keepsakes, without reproducing faces or tiny text.
   add(box([bw*.24,.24,.055],[x-bw*.16,y-bh/2+.13,.20],['#6b8a9a','#d7b080','#b1bd7b'][i%3]));
   add(box([bw*.25,.18,.075],[x+bw*.16,y-bh/2+.10,.21],'#e8e2d3'));
   add(box([bw-.045,bh-.045,.008],[x,y,.325],'#d3e3df','glass'));
  }
  for(const [x,y,bw] of [[.1,1.52,1.25],[4.8,1.24,1.6]]){
   add(box([bw+.22,.72,.018],[x+.10,y+.06,.088],'#aebd65'));add(box([bw,.63,.023],[x,y,.104],'#24435b'));
   for(let i=0;i<6;i++)add(box([bw*.75-(i%2)*.08,.013,.01],[x,y+.20-i*.065,.12],'#c0d1d4'));
  }
  // Stylized globe graphic; deliberately not a surveyed map.
  const globe=new THREE.Mesh(new THREE.CircleGeometry(1.13,40),mat('#d1d9d8'));globe.scale.y=.47;globe.position.set(2.55,.56,.086);add(globe);
  for(let i=0;i<7;i++)add(box([.18+i%3*.10,.08,.015],[1.72+i*.27,.52+Math.sin(i*2)*.18,.10],'#8fa4ab'));
  add(rod([-w/2,h+.10,.36],[w/2,h+.10,.36],.02,'#30383a'));
  for(let x=-w/2+.45;x<w/2;x+=.95){const spot=cyl(.04,.13,[x,h-.025,.36],'#2b3335',12);spot.rotation.x=.45;add(spot);}
  if(o.referenceSpan)group.scale.x=o.width/o.referenceSpan;
 }else if(k==='window-reference'){
  level='architecture';const w=o.width,h=o.height,n=o.panes||5;
  add(box([w,h,.018],[0,h/2+.08,0],'#c4dce1','glass'));
  for(let i=0;i<=n;i++)add(box([.042,h+.10,.09],[-w/2+i*w/n,h/2+.07,0],'#a7b3b3','metal'));
  for(const y of [.10,1.02,h+.1])add(box([w,.045,.09],[0,y,0],'#a7b3b3','metal'));
  for(let i=0;i<n;i++){
   const x=-w/2+(i+.5)*w/n,drop=[1.72,1.92,1.76,1.9,1.70][i%5];
   add(cyl(.045,w/n-.06,[x,h+.02,.06],'#d3d5cb',12));const roller=group.children.at(-1);roller.rotation.z=Math.PI/2;
   add(box([w/n-.07,drop,.012],[x,h-drop/2+.01,.075],'#dbe0d5','frosted'));
   add(rod([x-w/n/2+.035,h-drop,.084],[x+w/n/2-.035,h-drop,.084],.012,'#abb5ac'));
  }
 }else if(k==='phone-booth'){
  level='architecture';const w=o.width||1.08,h=o.height||2.35,d=o.depth||.62;
  add(box([w,h,.045],[0,h/2,-d/2],'#a99b82'));add(box([w,.04,d],[0,.025,0],'#a5aeaa'));
  for(const x of [-w/2,w/2])add(box([.045,h,.045],[x,h/2,d/2],'#f1f0e9'));
  for(const y of [.04,h])add(box([w,.045,.045],[0,y,d/2],'#f1f0e9'));
  add(box([w-.08,h-.08,.013],[0,h/2,d/2],'#b9cfd0','glass'));
  add(box([w-.10,.48,.016],[0,1.02,d/2+.012],'#d5ddda','frosted'));
  for(const side of [-1,1])add(box([.018,h,d],[side*w/2,h/2,0],'#bfceca','glass'));
  add(box([w-.18,.045,d*.55],[0,1.02,-.04],'#dedbd1'));
  add(rod([w*.34,.96,d/2+.04],[w*.34,1.21,d/2+.04],.012,'#bfc5c1'));
  add(box([.13,.13,.03],[-w*.30,1.55,d/2+.025],'#e8e9e4'));
 }else if(k==='open-ceiling'){
  level='ceiling';const w=o.width,d=o.depth,h=o.height;
  for(const x of [-w*.43,-w*.12,w*.20,w*.43]){
   add(box([.42,.25,d],[x,h+.28,0],'#363f43'));
   for(let z=-d/2+1;z<d/2;z+=2.5){
    add(box([.95,.13,1.5],[x,h+.10,z],'#4b555b'));
    for(let j=0;j<7;j++)add(box([.80,.012,.018],[x,h+.026,z-.5+j*.16],'#252e33'));
   }
  }
  for(let z=-d/2+.6;z<d/2;z+=1.65){
   add(box([w,.11,.10],[0,h+.12,z],'#343e43'));
   add(box([w-.5,.055,.075],[0,h-.14,z],'#cad3d0'));
   add(box([w-.55,.015,.060],[0,h-.175,z],'#f3f5df','light'));
   for(const x of [-w*.36,w*.36])add(rod([x,h-.1,z],[x,h+.32,z],.009,'#303b40'));
  }
  for(const x of [-w*.3,w*.30])add(rod([x,h+.35,-d/2],[x,h+.35,d/2],.045,'#434c50'));
 }else if(k==='display-plinths'){
  const colors=['#24a5cc','#e0a43d','#c04c77','#8757a4','#9bbb4d','#65a6b4'];
  for(let i=0;i<6;i++){const x=(i-2.5)*.48,h=[.3,.55,.42,.67,.32,.47][i];add(soft([.46,h,.52],[x,h/2,0],colors[i],.015));}
 }else if(k==='acrylic-display'){
  const s=o.width||.52;
  for(let i=0;i<3;i++){
   const y=s/2+i*s;for(const dx of [-s/2,s/2])add(box([.008,s,s],[dx,y,0],'#d0e1dc','glass'));
   for(const dz of [-s/2,s/2])add(box([s,s,.008],[0,y,dz],'#d0e1dc','glass'));
   add(box([s,.008,s],[0,y+s/2,0],i===1?'#c7a478':'#d0e1dc',i===1?'solid':'glass'));
   for(const x of [-s/2,s/2])for(const z of [-s/2,s/2])add(rod([x,y-s/2,z],[x,y+s/2,z],.006,'#b5c5c3'));
  }
 }else if(k==='photo-display'){
  const w=o.width||.68,h=o.height||1.65;
  add(box([w,h,.045],[0,h/2+.1,0],'#e4e4dc'));
  for(const y of o.photoCount===3?[h*.27,h*.55,h*.83]:[h*.38,h*.75]){add(box([w*.83,.42,.025],[0,y,.033],'#40525a'));add(box([w*.75,.34,.013],[0,y,.05],'#bbc8bd'));for(let i=0;i<5;i++)add(box([.055,.075,.015],[-w*.28+i*w*.14,y-.04+(i%2)*.06,.063],['#607b79','#c59b83','#728c9c'][i%3]));}
  for(const x of [-w*.44,w*.44]){add(rod([x,.05,-.25],[x,.05,.25],.018,'#9caaa9'));for(const z of [-.25,.25])add(cyl(.025,.035,[x,.025,z],'#344448',8));}
 }else if(k==='portable-screen'){
  const w=o.width||1.22,h=o.height||1.98;
  add(soft([w,w*.56,.055],[0,h-w*.28,0],'#24333b',.02));
  add(box([w-.065,w*.56-.065,.012],[0,h-w*.28,.036],'#486f7c'));
  for(let i=0;i<4;i++)add(box([w*.15,.18+i*.035,.008],[-w*.3+i*w*.2,h-w*.32,.048],['#a6c8a9','#8eabbc','#bac0a6','#a3c5cc'][i]));
  for(const s of [-1,1]){add(rod([s*w*.26,h-w*.50,-.05],[s*w*.43,.06,.28],.022,'#e5e6df'));add(rod([s*w*.26,h-w*.50,-.05],[s*w*.43,.06,-.29],.022,'#e5e6df'));}
  add(rod([-w*.43,.28,.2],[w*.43,.28,.2],.018,'#e5e6df'));
 }else if(k==='alumni-lettering'){
  level='architecture';const h=o.textHeight||.3,label=o.text||'',unit=Math.min(h/5,(o.maxWidth||Infinity)/Math.max(1,label.length*6));
  // Portable procedural fallback. The Blender pass replaces this with font meshes.
  text(label,[-label.length*unit*3,h,0],unit,o.color||'#f6f4e9');
 }else return null;
 if(o.mirrorLocalX){
  // Bake the reflection and reverse winding. A negative object scale leaves the
  // editable Blender import with inverted face orientation under weighted normals.
  for(const mesh of group.children.filter(c=>c.isMesh)){
   mesh.updateMatrix();mesh.geometry.applyMatrix4(mesh.matrix);mesh.geometry.scale(-1,1,1);
   const index=mesh.geometry.index;
   if(index){for(let i=0;i<index.count;i+=3){const v=index.getX(i+1);index.setX(i+1,index.getX(i+2));index.setX(i+2,v);}index.needsUpdate=true;}
   else for(const attr of Object.values(mesh.geometry.attributes)){
    for(let i=0;i<attr.count;i+=3)for(let c=0;c<attr.itemSize;c++){const a=(i+1)*attr.itemSize+c,b=(i+2)*attr.itemSize+c,v=attr.array[a];attr.array[a]=attr.array[b];attr.array[b]=v;}attr.needsUpdate=true;
   }
   mesh.position.set(0,0,0);mesh.quaternion.identity();mesh.scale.set(1,1,1);mesh.updateMatrix();
  }
 }
 return {group,level};
}
