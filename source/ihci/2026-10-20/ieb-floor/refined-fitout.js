// R7 displays the Blender-exported geometry, retaining the existing review controls.
import {GLTFLoader} from '../vendor/addons/loaders/GLTFLoader.js';
export async function loadRefinedFitout(model){
 const spec=model.blenderRefinement;if(!spec)return null;
 if(spec.status!=='built')throw Error('精修模型尚未完成导出');
 const loader=new GLTFLoader(),assets=new Map();
 await Promise.all(Object.entries(spec.assets).map(async([zone,file])=>{
  const url=new URL('./venue-r18/'+file,import.meta.url).href;
  let gltf;
  if(spec.compressedAssets&&typeof DecompressionStream!=='undefined'){
   try{
    const response=await fetch(url+'.gz');if(!response.ok)throw Error('Compressed model unavailable');
    const bytes=new Uint8Array(await response.arrayBuffer());
    // Some hosts transparently decode a .gz asset. Detect the gzip header.
    const buffer=bytes[0]===31&&bytes[1]===139
      ?await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
      :bytes.buffer;
    gltf=await loader.parseAsync(buffer,new URL('.',url).href);
   }catch{gltf=await loader.loadAsync(url);}
  }else gltf=await loader.loadAsync(url);
  gltf.scene.updateMatrixWorld(true);let meshes=0;
  gltf.scene.traverse(o=>{if(o.isMesh&&o.userData.fieldZone===zone)meshes++;});
  if(!meshes)throw Error(`精修模型缺少空间几何：${zone}`);
  assets.set(zone,gltf.scene);
 }));
 return assets;
}
export function replaceRefinedFitout(built,assets){
 if(!assets)return;
 for(const [zone,entry] of built.fitout.zones){
  const source=assets.get(zone);if(!source)throw Error(`缺少精修空间：${zone}`);
  for(const level of ['furniture','architecture','ceiling']){
   const target=entry.levels[level];
   target.traverse(o=>{o.geometry?.dispose();if(o.material&&!Array.isArray(o.material))o.material.dispose();});target.clear();
   source.traverse(o=>{
    if(!o.isMesh||o.userData.level!==level)return;
    const copy=o.clone(false);copy.geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);
    copy.position.set(0,0,0);copy.quaternion.identity();copy.scale.set(1,1,1);copy.updateMatrix();
    copy.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();
    target.add(copy);
   });
  }
 }
}
export function disposeRefinedSources(assets){
 for(const root of assets?.values()||[])root.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m?.dispose();});
}
