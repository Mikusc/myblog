// R8 photo-supported shapes. These are stylized, unmeasured fixtures, not scans.
// Kept separate so earlier revisions keep their original procedural geometry.
export function createReviewedFixture(o,{THREE,box,cyl,rod,mat,text,neutral}){
 const group=new THREE.Group(),add=m=>group.add(m),k=o.kind;
 let level='furniture';
 if(k==='acoustic-booth'&&o.variant==='sculpted-pair'){
  const w=o.width,d=o.depth,h=o.height,grey='#909b9b';
  add(box([w-.05,.09,d-.04],[0,.065,0],'#465154'));
  add(box([w,h,.13],[0,h/2,-d/2+.065],grey));
  // Sloping wing fronts follow IMG_4654/4655; no occupant/belonging geometry.
  const outline=[[-d/2,.06],[d/2,.06],[d/2,.74],[d*.28,1.00],[d*.28,h-.04],[-d/2,h]];
  for(const side of [-1,1]){
   const shape=new THREE.Shape(outline.map(([z,y])=>new THREE.Vector2(-z,y)));
   const geo=new THREE.ExtrudeGeometry(shape,{depth:.13,bevelEnabled:false});geo.rotateY(Math.PI/2);
   const wing=new THREE.Mesh(geo,mat(grey));wing.position.x=side===1?w/2-.13:-w/2;add(wing);
   add(box([.64,.33,d-.18],[side*(w/2-.43),.29,.025],grey));
   add(box([.62,.13,d-.20],[side*(w/2-.43),.52,.035],'#748080'));
   add(box([.14,.57,d-.25],[side*(w/2-.22),.84,.01],'#7b8888'));
  }
  add(box([.73,.045,d*.76],[0,.735,.10],'#f4f3eb'));
  add(box([.30,.69,.39],[0,.365,.10],'#eaece5'));
  add(box([.13,.15,.02],[0,.78,-d/2+.14],'#e6e9e2'));
 }else if(k==='gallery-wall'){
  level='architecture';const w=o.width,h=o.height||3.1;
  add(box([w,h,.14],[0,h/2,0],'#a0a6a3'));
  add(box([w,.16,.24],[0,.10,.07],'#f5f2e8'));
  add(box([w,.035,.04],[0,.23,.20],'#fff3d9','light'));
  add(box([w,.10,.30],[0,h-.05,.06],'#ebe5dc'));
  add(box([w,.035,.04],[0,h-.15,.21],'#ffe6c5','light'));
  for(const [i,color] of ['#55bec5','#bac866','#d7a042','#486377'].entries())
   add(box([w/4,.025,.016],[-w/2+(i+.5)*w/4,h-.40,.083],color));
  const tv=-w*.29;
  add(box([2.15,1.2,.10],[tv,1.66,.13],'#242d32'));
  add(box([2.02,1.08,.02],[tv,1.66,.19],'#486e77'));
  for(let i=0;i<5;i++)add(box([.23,.20+i*.09,.02],[tv-.65+i*.31,1.38+i*.035,.21],['#9bc9a0','#d4dfc6','#718caa','#bca9bb','#b3cf9e'][i]));
  text('ALUMNI',[tv-.65,2.65,.09],.035,'#345266');
  const colors=['#b9ca8c','#d7b28e','#6a97a5','#bd8584'];
  for(let i=0;i<7;i++){
   const x=-w*.02+i*w*.067,y=i%2?1.03:1.85;
   add(box([.72,.61,.02],[x,y,.085],'#d6c6af'));
   for(const dx of [-.38,.38])add(box([.035,.66,.24],[x+dx,y,.20],'#f0e7d8'));
   for(const dy of [-.32,.32])add(box([.80,.035,.24],[x,y+dy,.20],'#f0e7d8'));
   add(box([.68,.018,.16],[x,y+.29,.20],'#ffe4bf','light'));
   add(box([.20,.27,.06],[x-.13,y-.15,.23],colors[i%4]));
   add(box([.19,.20,.07],[x+.13,y-.18,.24],'#eee7d8'));
  }
  for(const [x,y] of [[-w*.03,1.03],[w*.35,1.15],[w*.30,2.12]]){
   add(box([1.0,.48,.04],[x,y,.12],'#304e64'));
   for(let j=0;j<4;j++)add(box([.75-j*.04,.015,.01],[x,y+.13-j*.07,.148],'#c6d6d5'));
  }
  add(rod([-w/2,h+.14,.42],[w/2,h+.14,.42],.025,'#343f43'));
  for(let x=-w/2+.5;x<w/2;x+=1.35){
   const spot=cyl(.055,.18,[x,h+.04,.42],'#31393b',12);spot.rotation.x=.45;add(spot);
  }
 }else if(k==='display-plinths'){
  const colors=['#22a6c2','#d2a23f','#b34e70','#8060a1','#94b94d'];
  for(let i=0;i<5;i++){
   const x=(i-2)*.55,h=[.28,.56,.40,.74,.35][i];
   add(box([.52,h,.45],[x,h/2,0],colors[i]));
   text('ALUMNI'[i],[x-.12,h+.24,.24],.04,'#f8f4e9');
  }
 }else if(k==='merchandise-stand'){
  for(let i=0;i<3;i++){
   const x=(i-1)*.55,h=.3+i*.3;add(box([.54,h,.58],[x,h/2,0],'#f0eee8'));
   add(box([.18,.16,.08],[x,h+.08,.06],['#6b8d95','#c9aa69','#829975'][i]));
  }
 }else if(k==='rect-coffee-table'){
  const w=o.width||1.1,d=o.depth||.55,h=o.height||.44;
  add(box([w,.035,d],[0,h,0],o.color||'#424f55'));
  for(const x of [-w*.43,w*.43])for(const z of [-d*.4,d*.4])add(rod([x,.02,z],[x,h,z],.014,'#3a454a'));
 }else if(k==='cocktail-table'){
  const h=o.height||1.03,r=o.radius||.34;
  add(cyl(r,.035,[0,h,0],'#f2f2ea',24));add(cyl(.045,h-.08,[0,h/2,0],'#edf0e9',10));
  add(cyl(.23,.035,[0,.025,0],'#f2f2ea',24,.13));
 }else if(k==='metal-railing'){
  level='architecture';const w=o.width,h=o.height||1.0;
  for(const y of [.10,h])add(rod([-w/2,y,0],[w/2,y,0],.028,'#768381'));
  for(let x=-w/2;x<=w/2+.001;x+=w/Math.ceil(w/.18))add(rod([x,.10,0],[x,h,0],.016,'#768381'));
 }else if(k==='open-stair'&&o.enclosure==='white-fluted-walls'){
  const w=o.width,len=o.length,rise=o.rise,n=o.steps;
  for(let i=0;i<n;i++){
   const h=rise*(i+1)/n,z=-len/2+(i+.5)*len/n;
   add(box([w,h,len/n+.005],[0,h/2,z],'#c3bfba'));
   add(box([w,.018,.032],[0,h+.009,z-len/n/2+.04],'#e4e8e6','metal'));
  }
  add(box([w,.15,.65],[0,rise-.075,len/2+.325],'#d9d6d0'));
  // Only the visible first straight flight and a short provisional landing.
  // The upper-floor layout is deliberately not extended into an invented room.
  for(const side of [-1,1]){
   const x=side*(w/2+.07),h=rise+.6;
   add(box([.14,h,len+.65],[x,h/2,.325],'#f1eee6'));
   for(let z=-len/2+.04;z<len/2+.65;z+=.19)
    add(box([.018,h,.014],[side*(w/2-.005),h/2,z],'#d9dad3'));
  }
 }else if(k==='entry-canopy'){
  level='ceiling';const w=o.width,d=o.depth,h=o.height||3.1;
  const shape=new THREE.Shape([[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(p=>new THREE.Vector2(...p)));
  const hole=new THREE.Path();for(let i=0;i<=48;i++){const a=-i/48*Math.PI*2,r=1+.10*Math.cos(a*3);const x=Math.cos(a)*1.35*r,z=Math.sin(a)*.86*r;i?hole.lineTo(x,z):hole.moveTo(x,z);}shape.holes.push(hole);
  const geo=new THREE.ExtrudeGeometry(shape,{depth:.15,bevelEnabled:false});geo.rotateX(Math.PI/2);
  const mesh=new THREE.Mesh(geo,mat('#f4f1e9'));mesh.position.y=h;add(mesh);
 }else if(k==='bar-stool'&&o.backStyle==='perforated'){
  const color=o.color||'#d9b9ac';
  add(box([.46,.065,.43],[0,.78,0],color));
  // Rows/columns leave real openings instead of painting dots on a solid back.
  for(let row=0;row<4;row++)add(box([.43,.045,.045],[0,.88+row*.085,-.215-row*.01],color));
  for(let i=0;i<5;i++)add(box([.035,.30,.045],[-.20+i*.10,1.01,-.23],color));
  for(const x of [-1,1])for(const z of [-1,1])add(rod([x*.17,.77,z*.15],[x*.24,.025,z*.24],.014,color));
  for(const z of [-.21,.21])add(rod([-.22,.29,z],[.22,.29,z],.013,color));
 }else return null;
 return {group,level};
}
