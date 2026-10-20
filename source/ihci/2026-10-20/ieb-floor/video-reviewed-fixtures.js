// Opt-in R11 shapes only. Source dimensions remain unmeasured display choices.
export function createVideoReviewedFixture(o,{THREE,mat,box,cyl}){
 if(o.videoAuditRevision!=='r11')return null;
 if(o.kind==='cafe-display-shelf'){
  const group=new THREE.Group();
  for(const y of [1.28,1.83,2.31]){
   group.add(box([o.width,.05,.30],[0,y,0],'#897356'));
   for(let i=0;i<6;i++)group.add(cyl(.048,.16,[-o.width*.4+i*o.width*.16,y+.10,.015],['#e5ddd0','#7b8d7d','#c79c71'][i%3],10));
  }
  return {group,level:'architecture'};
 }
 if(o.kind==='cafe-counter-canopy'){
  const group=new THREE.Group(),w=o.width,d=o.depth,h=o.height;
  for(const x of [-w/2,w/2]){group.add(box([.10,.16,d],[x,h,0],'#946f48'));group.add(box([.04,.03,d-.2],[x,h-.10,0],'#ffe5ba','light'));}
  for(const z of [-d/2,d/2])group.add(box([w,.16,.10],[0,h,z],'#946f48'));
  for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])group.add(cyl(.012,.45,[x,h+.22,z],'#343c3e',6));
  return {group,level:'ceiling'};
 }
 if(o.kind!=='curved-sofa'||!o.arcGroups)return null;
 const group=new THREE.Group(),r=o.radius;
 const sector=(inner,outer,a,b,y,h,color)=>{
  const pts=[];
  for(let i=0;i<=20;i++){const t=(a+(b-a)*i/20)*Math.PI/180;pts.push(new THREE.Vector2(Math.sin(t)*outer,-Math.cos(t)*outer));}
  for(let i=20;i>=0;i--){const t=(a+(b-a)*i/20)*Math.PI/180;pts.push(new THREE.Vector2(Math.sin(t)*inner,-Math.cos(t)*inner));}
  const bevel=.024,geo=new THREE.ExtrudeGeometry(new THREE.Shape(pts),{depth:h-2*bevel,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,steps:1});
  geo.rotateX(-Math.PI/2);const mesh=new THREE.Mesh(geo,mat(color));mesh.position.y=y+bevel;group.add(mesh);
 };
 for(const [start,end,n] of o.arcGroups)for(let i=0;i<n;i++){
  const a=start+(end-start)*i/n+.75,b=start+(end-start)*(i+1)/n-.75;
  sector(r-.74,r-.04,a,b,.12,.28,'#35434c');
  sector(r-.74,r-.19,a,b,.40,.14,o.seatColor);
  sector(r-.18,r,a,b,.40,.48,o.color);
 }
 return {group,level:'furniture'};
}
