// Stable venue IDs, independent of deployment host and legacy /lab-demo/ URL.
export const VENUES=[
  {id:'lab-3f',title:'实验室三楼',purpose:'技术验证'},
  {id:'ieb-1f',title:'IEB 一楼',purpose:'目标会场预演'}
];
export const DEFAULT_VENUE='lab-3f';
export function requireVenue(id){
  const venue=VENUES.find(v=>v.id===id);
  if(!venue)throw Error('未找到这个场馆，请选择实验室三楼或 IEB 一楼');
  return venue;
}
export function venueIdFromURL(url){return requireVenue(new URL(url).searchParams.get('venue')||DEFAULT_VENUE).id;}
export function scopedURL(path,base,venueId){
  const url=new URL(path,base);url.searchParams.set('venue',requireVenue(venueId).id);return url;
}
export function switchVenueURL(base,venueId){
  const original=new URL(base),url=scopedURL('./',base,venueId);
  for(const key of ['view','poster'])if(original.searchParams.has(key))url.searchParams.set(key,original.searchParams.get(key));
  return url;
}
export function sessionKey(scope){
  return ['fieldnotes-venue-v2',scope.venueId,scope.exhibitionId,scope.layoutVersion,scope.contentId,scope.contentVersion].map(encodeURIComponent).join(':');
}
export async function loadVenueProfile(id,{readJSON}={}){
  requireVenue(id);
  readJSON ||= async url=>{const response=await fetch(url);if(!response.ok)throw Error('场馆资料载入失败');return response.json();};
  const base=new URL(`./${id}.json`,import.meta.url),profile=await readJSON(base);
  if(profile.schemaVersion!==1||profile.id!==id||!profile.layoutVersion||!profile.exhibitionId||!['lab','ieb'].includes(profile.adapter))throw Error('场馆配置版本不匹配');
  const content=await readJSON(new URL(profile.content,base));
  if(content.contentId!==profile.contentId||content.contentVersion!==profile.contentVersion)throw Error('海报内容版本不匹配');
  const ids=content.posters.map(p=>p.id);
  if(!ids.length||new Set(ids).size!==ids.length||!ids.includes(content.firstPosterId))throw Error('海报目录不完整');
  for(const id of ids){
    if(profile.placements.filter(p=>p.posterId===id).length!==1||content.connections.filter(c=>c.from===id&&ids.includes(c.to)).length!==1)throw Error(`展位配置不完整：${id}`);
  }
  if(profile.placements.some(p=>!ids.includes(p.posterId)))throw Error('布展中包含未知海报');
  const scope={venueId:id,exhibitionId:profile.exhibitionId,layoutVersion:profile.layoutVersion,contentId:content.contentId,contentVersion:content.contentVersion,packId:profile.scan.packId};
  return {profile,content,scope,modelURL:new URL(profile.model,base),planURL:new URL(profile.planURL,base),manifestURL:new URL(profile.scan.manifest,base)};
}
