// Photo-supported finishes, opt-in to R18. Geometry units remain display assumptions.
export function createAlumniVisualFixture(o,{THREE,box,cyl,rod,mat}){
 if(o.visualRevision!=='r18')return null;
 const group=new THREE.Group(),add=m=>group.add(m);
 let level='furniture';
 if(o.kind==='clipped-tile-floor'){
  level='ground';
  for(const tile of o.tiles){
   const vertices=[];
   // Builder stores counter-clockwise X/Z polygons; reverse for upward Y normals.
   for(let i=1;i<tile.points.length-1;i++)
    for(const p of [tile.points[0],tile.points[i+1],tile.points[i]])vertices.push(p[0],.0035,p[1]);
   const geo=new THREE.BufferGeometry();
   geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();
   add(new THREE.Mesh(geo,mat(o.palette[tile.tone])));
  }
 }else if(o.kind==='cocktail-table'){
  const h=o.height,r=o.radius;
  add(cyl(r,.026,[0,h,0],'#f4f3eb',40));
  const profile=[[0,0],[r*.72,0],[r*.78,.015],[r*.74,.035],[r*.43,.065],[.08,.17],[.043,.30],[.043,h-.12],[.085,h-.025],[0,h-.025]];
  add(new THREE.Mesh(new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),32),mat('#efefe8')));
 }else if(o.kind==='woven-rug'){
  level='ground';const r=o.radius;
  add(cyl(r,.006,[0,.009,0],'#d4d3c8',64));
  add(cyl(r-.035,.002,[0,.0135,0],'#e4e1d6',64));
  // Subtle tufts imply the pale mottled rug in the photos, without photo textures.
  for(let i=0;i<120;i++){
   const a=i*2.39996,d=(r-.07)*Math.sqrt((i+.5)/120);
   const tuft=cyl(.025+(i%4)*.006,.001,[Math.cos(a)*d,.015,Math.sin(a)*d],i%3?'#d9d7cb':'#c9cabe',6);
   tuft.scale.z=.42;tuft.rotation.y=a;add(tuft);
  }
 }else if(o.kind==='entry-pier-graphics'){
  level='architecture';const w=o.width;
  for(let i=0;i<5;i++){
   const x=-w*.40+i*w*.17;
   const points=[[x+.10,2.75],[x-.06,2.45],[x+.10,2.15],[x+.18,2.15],[x+.02,2.45],[x+.18,2.75]];
   const shape=new THREE.Shape(points.map(p=>new THREE.Vector2(...p)));
   const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),mat('#334b57'));mesh.position.z=.015;add(mesh);
  }
  // Simplified silver service panel seen on the white pier; no invented instructions.
  add(box([.38,1.02,.025],[w*.23,.73,.02],'#bdc4c3','metal'));
  for(const y of [.51,.96])add(box([.32,.018,.006],[w*.23,y,.036],'#818b8d'));
  for(const y of [.61,1.08])add(box([.09,.035,.008],[w*.23-.09,y,.04],'#9a554d'));
 }else if(o.kind==='column-face-details'){
  level='architecture';
  add(box([.14,.19,.018],[0,.84,.01],'#38474b'));
  add(box([.21,.105,.018],[0,.30,.01],'#4a885d'));
  add(box([.09,.024,.006],[-.025,.30,.025],'#e9f0e4'));
  for(const y of [.28,.32])add(box([.035,.013,.006],[.04,y,.025],'#e9f0e4'));
 }else if(o.kind==='photo-display'){
  const w=o.width,h=o.height;
  add(box([w,h,.035],[0,h/2+.08,0],'#ebebe4'));
  // Perforated metal backing and two framed works, not fabricated portraits.
  for(let row=0;row<15;row++)for(let col=0;col<8;col++)
   add(box([.008,.008,.002],[-w*.43+col*w*.123,.15+row*(h-.12)/15,.019],'#b9c0bc'));
  for(const [i,y] of [h*.42,h*.78].entries()){
   add(box([w*.84,.43,.035],[0,y,.032],'#303d42'));
   add(box([w*.76,.35,.012],[0,y,.055],'#ecece3'));
   for(let j=0;j<12;j++){
    const x=((j*7)%5-2)*w*.12,dy=((j*3)%7-3)*.038;
    add(box([.055,.038,.003],[x,y+dy,.064],['#567479','#b9725e','#485568','#8fa08c'][(j+i)%4]));
   }
  }
  for(const x of [-w*.44,w*.44]){
   add(rod([x,.05,-.24],[x,.05,.24],.017,'#acb6b3'));
   for(const z of [-.24,.24]){const wheel=cyl(.028,.025,[x,.028,z],'#384346',12);wheel.rotation.z=Math.PI/2;add(wheel);}
  }
 }else return null;
 return {group,level};
}
