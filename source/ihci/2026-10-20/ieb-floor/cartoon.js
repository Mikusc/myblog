// Presentation choices do not establish site registration or measured dimensions.
export function presentationStyle(model,requested){
 return ['cartoon','reference'].includes(requested)?requested:model.presentation?.defaultStyle||'reference';
}
export const cartoonPalette={public:'#dce7e4',classroom:'#ecd9b8',exhibition:'#e4bd93',office:'#d5dce9',service:'#aebfc6',unknown:'#e4e5e2',inferred:'#e5e5df'};
const furniturePalette={'52687a':'#4d6e82','657f8d':'#5d8090','b8c282':'#afbf70','b3c181':'#a6ba70','909590':'#8f9e98','d2bf80':'#ccbd70','c5bd72':'#beb66a','b5a68d':'#beaa83','858a88':'#899792','3f4346':'#3b4b54','627b52':'#718e5d','7c925b':'#8da56c','8d918f':'#939e98','939795':'#a1aba4','c8d29f':'#c4d48e','afc4c9':'#9fc2ca','eeeee3':'#f0f0e8'};
export function applyCartoonPalette(root,model){
 root.traverse(object=>{
  if(!object.isMesh)return;
  const region=model.regions.find(r=>r.id===object.userData.region);
  for(const material of Array.isArray(object.material)?object.material:[object.material]){
   if(!material?.color||material.userData.cartoonPalette)continue;
   const color=region?(model.publicFitout?.floorMaterials?.[region.id]?.color||cartoonPalette[region.kind]):furniturePalette[material.color.getHexString()];
   if(color)material.color.set(color);
   material.userData.cartoonPalette=true;
  }
 });
}
export function applyCartoonStyle(THREE,root){
 const gradient=new THREE.DataTexture(new Uint8Array([110,190,245]),3,1,THREE.RedFormat);
 gradient.minFilter=THREE.NearestFilter;gradient.magFilter=THREE.NearestFilter;gradient.generateMipmaps=false;gradient.needsUpdate=true;
 const converted=new Map();
 function material(source){
  if(!source?.isMeshStandardMaterial||source.transparent)return source;
  if(converted.has(source))return converted.get(source);
  const toon=new THREE.MeshToonMaterial({color:source.color.clone(),gradientMap:gradient,vertexColors:source.vertexColors,
   emissive:source.emissive.clone(),emissiveIntensity:source.emissiveIntensity,side:source.side,
   opacity:source.opacity,depthWrite:source.depthWrite});
  toon.name=source.name;toon.userData={...source.userData};converted.set(source,toon);return toon;
 }
 root.traverse(object=>{if(object.isMesh)object.material=Array.isArray(object.material)?object.material.map(material):material(object.material);});
 return {dispose(){for(const [source,toon] of converted){source.dispose();toon.dispose();}gradient.dispose();}};
}
