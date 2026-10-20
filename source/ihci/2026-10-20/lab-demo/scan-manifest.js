export function validateScanManifest(manifest,{packId,posterIds}={}){
  const invalid=()=>{throw Object.assign(Error('目标清单与当前场馆不匹配'),{name:'TargetError'});};
  if(manifest.schemaVersion!==1||!manifest.packId||(packId&&manifest.packId!==packId)||!Array.isArray(manifest.targets)||!manifest.targets.length||!/^[a-f0-9]{64}$/.test(manifest.sha256)||typeof manifest.src!=='string')invalid();
  const indices=new Set();
  for(const target of manifest.targets){
    if(!Number.isInteger(target.targetIndex)||target.targetIndex<0||indices.has(target.targetIndex)||!target.posterId||(posterIds&&!posterIds.includes(target.posterId)))invalid();
    indices.add(target.targetIndex);
  }
  if(manifest.targets.some((_,index)=>!indices.has(index)))invalid();
  return manifest;
}
