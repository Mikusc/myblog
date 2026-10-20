import {adaptVenueModel,composeExhibition} from './model-adapters.js';
import {resolvePosters,buildWalls,containsAtEye} from '../lab-demo/spatial.js';
import {pointInPolygon} from '../lab-floor/geometry.js';

const finitePair=v=>Array.isArray(v)&&v.length===2&&v.every(Number.isFinite);
const text=v=>typeof v==='string'&&v.trim().length>0;
const validDate=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
const reviewFields=['status','physicalBooth','source','checkedBy','checkedAt','notes'];

export function createPlacementReview(profile,source){
  const model=adaptVenueModel(source,profile);
  return {schemaVersion:1,venueId:profile.id,exhibitionId:profile.exhibitionId,
    modelId:profile.modelId,baseLayoutVersion:profile.layoutVersion,
    contentId:profile.contentId,contentVersion:profile.contentVersion,
    placements:model.posterAnchors.map(anchor=>{
      const existing=profile.placements.find(p=>p.posterId===anchor.id)?.review||{};
      return {posterId:anchor.id,roomId:anchor.roomId,position:[...anchor.position],facing:[...anchor.facing],
        review:Object.fromEntries(reviewFields.map(key=>[key,existing[key]||(key==='status'?'pending':'')]))};
    })};
}

// Local drafts may be incomplete or temporarily outside the room. Preserve the
// work, but require the current scope and editable shape before restoring it.
// Export and candidate creation still use the full inspection below.
export function restorePlacementDraft(saved,profile,source){
  const baseline=createPlacementReview(profile,source);
  if(!saved||typeof saved!=='object')return null;
  for(const key of Object.keys(baseline).filter(k=>k!=='placements'))if(saved[key]!==baseline[key])return null;
  if(!Array.isArray(saved.placements)||saved.placements.length!==baseline.placements.length)return null;
  const ids=new Set(baseline.placements.map(p=>p.posterId));
  for(const p of saved.placements){
    if(!p||!ids.delete(p.posterId)||typeof p.roomId!=='string'||
      !Array.isArray(p.position)||p.position.length!==2||!p.position.every(v=>v===null||Number.isFinite(v))||
      !finitePair(p.facing)||Math.hypot(...p.facing)<.001||
      !p.review||!['pending','confirmed'].includes(p.review.status)||
      !reviewFields.filter(k=>k!=='status').every(k=>typeof p.review[k]==='string'&&p.review[k].length<=1000))return null;
  }
  return saved;
}

// A reviewer records evidence of a booth on a plan. This never calibrates metric
// scale, establishes north, or grants author privileges.
export function inspectPlacementReview(review,profile,source,content){
  const errors=[],geometryErrors=[],confirmed=[];
  if(!review||typeof review!=='object'||review.schemaVersion!==1)return {errors:['校对文件格式不支持'],geometryErrors,confirmed};
  for(const [key,value] of Object.entries({venueId:profile.id,exhibitionId:profile.exhibitionId,modelId:profile.modelId,
    baseLayoutVersion:profile.layoutVersion,contentId:profile.contentId,contentVersion:profile.contentVersion})){
    if(review[key]!==value)errors.push(`${key} 不匹配，请基于当前场馆版本重新校对`);
  }
  const ids=content.posters.map(p=>p.id),items=review.placements;
  if(!Array.isArray(items)||items.length!==ids.length||new Set(items.map(p=>p?.posterId)).size!==ids.length||items.some(p=>!ids.includes(p?.posterId))){
    errors.push('展位清单必须完整，每个 Poster 恰好出现一次');return {errors,geometryErrors,confirmed};
  }
  const model=adaptVenueModel(source,profile),walls=buildWalls(model,content),booths=new Set();
  for(const item of items){
    const id=item.posterId,room=model.regions.find(r=>r.id===item.roomId),info=item.review;
    if(!room||room.isBase)geometryErrors.push(`${id}：请选择具体空间`);
    if(!finitePair(item.position)||!finitePair(item.facing)||Math.hypot(...(item.facing||[]))<.001){
      geometryErrors.push(`${id}：坐标和朝向必须为有限数值，朝向不可为零`);continue;
    }
    if(room&&!pointInPolygon(item.position,room.polygon))geometryErrors.push(`${id}：展板不在所选空间内`);
    try {
      const one={...profile,placements:[item]};
      const p=resolvePosters(adaptVenueModel(source,one),composeExhibition({...content,posters:content.posters.filter(p=>p.id===id)},one))[0];
      for(let step=0;step<=40;step++){
        const point=p.viewPx.map((v,i)=>v+(p.positionPx[i]-v)*step/40);
        if(walls.some(w=>containsAtEye(point,w,content.eyeHeight))){geometryErrors.push(`${id}：观看视线穿过模型墙体，请调整位置或朝向`);break;}
      }
    }catch(error){geometryErrors.push(`${id}：观看点无效，请调整朝向并留出观看距离`);}
    if(!info||!['pending','confirmed'].includes(info.status)){errors.push(`${id}：校对状态无效`);continue;}
    for(const key of reviewFields.filter(k=>k!=='status'))if(typeof info[key]!=='string'||info[key].length>1000)errors.push(`${id}：${key} 应为不超过 1000 字的文本`);
    if(info.status==='confirmed'){
      if(!['physicalBooth','source','checkedBy'].every(key=>text(info[key]))||!validDate(info.checkedAt)){
        errors.push(`${id}：已核对点位须记录实体展位、依据、核对人及有效日期`);
      }else confirmed.push(id);
      if(text(info.physicalBooth)&&booths.has(info.physicalBooth.trim()))errors.push(`${id}：实体展位编号重复`);
      if(text(info.physicalBooth))booths.add(info.physicalBooth.trim());
    }
  }
  return {errors:[...errors,...geometryErrors],geometryErrors,confirmed};
}

export function applyPlacementReview(review,profile,source,content,layoutVersion){
  const result=inspectPlacementReview(review,profile,source,content);
  if(result.errors.length)throw Error(result.errors.join('\n'));
  if(!text(layoutVersion)||layoutVersion===profile.layoutVersion||!/^[A-Za-z0-9_-]+$/.test(layoutVersion))throw Error('请提供新的布局版本，只使用字母、数字、横线或下划线');
  const baseline=createPlacementReview(profile,source),moved=new Set(review.placements.filter(p=>{
    const previous=baseline.placements.find(item=>item.posterId===p.posterId);
    return JSON.stringify([p.roomId,p.position,p.facing])!==JSON.stringify([previous.roomId,previous.position,previous.facing]);
  }).map(p=>p.posterId));
  return {...profile,layoutVersion,placementsStatus:result.confirmed.length===content.posters.length?'confirmed':'demo-unverified',
    routes:profile.routes.filter(route=>!moved.has(route.from)&&!moved.has(route.to)),
    placements:review.placements.map(p=>({posterId:p.posterId,roomId:p.roomId,position:[...p.position],facing:[...p.facing],
      review:Object.fromEntries(reviewFields.map(k=>[k,p.review[k]]))}))};
}

export function siteReviewItems(source){
  const items=(source.publicFitout?.zones||[]).map(z=>({id:z.id,title:z.title,position:z.origin,
    status:z.placementStatus==='unlocated-local-reference'?'尚未定位':'整层位置待核',
    evidence:z.evidenceNote||'',timeRange:z.timeRange}));
  const stair=source.fixtures?.find(s=>s.id==='main-stair');
  if(stair)items.push({id:stair.id,title:'主楼梯',position:stair.a.map((v,i)=>(v+stair.b[i])/2),
    status:'设计图方向已改 · 现场对应待核',evidence:'上行轴线按蓝色改绘校正；不代表实测方位。'});
  return items;
}
