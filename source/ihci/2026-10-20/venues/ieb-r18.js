import {placedFitoutZones,fitoutPoint} from '../ieb-floor/public-fitout.js';

// Bound digital walking to the displayed spaces. These are model collisions,
// not a claim about surveyed access or an accessible real-world route.
export function refinedVenueGeometry(source){
 if(!source.venueRelease)return null;
 const zones=placedFitoutZones(source);
 const walkable=source.regions.filter(r=>zones.some(z=>z.id===r.id)||r.id.startsWith('joint-')).map(r=>r.points);
 const obstacles=[],walls=[];
 for(const zone of zones)for(const o of zone.objects){
  const a=(o.yawDegrees||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
  const point=(x,z)=>fitoutPoint(zone,[o.position[0]+x*c+z*s,0,o.position[2]-x*s+z*c],source);
  const rect=(w,d)=>[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([x,z])=>point(x,z));
  if((o.position[1]||0)>1.7)continue;
  if(['wall-panel','gallery-wall','brand-wall','window-reference','glass-screen','yellow-divider','metal-railing','entrance-glazing'].includes(o.kind)){
   // Glazed public entrances retain their modeled opening.
   if(o.kind==='entrance-glazing')continue;
   const w=o.width||1.9;walls.push({a:point(-w/2,0),b:point(w/2,0),base:0,height:o.height||3.1,type:'wall',regionId:o.id});
  }else if(['column','pillar-planter','round-pillar-planter','open-stair','acoustic-booth','bar','coffee-counter','phone-booth','vending-cabinet','study-table','sofa','rect-planter'].includes(o.kind)){
   const sizes={column:[o.width||.82,o.depth||o.width||.82],'pillar-planter':[2.6,2.6],'round-pillar-planter':[2*(o.radius||1.45),2*(o.radius||1.45)],'open-stair':[o.width||2.8,o.length||5.1],'acoustic-booth':[o.width||2.1,o.depth||1.45],bar:[o.width||5.8,o.depth||.78],'coffee-counter':[o.width||3,o.depth||.7],'phone-booth':[o.width||1.08,o.depth||.62],'vending-cabinet':[o.width||.95,o.depth||.7],'study-table':[o.width||2.1,o.depth||.8],sofa:[o.width||2.25,.9],'rect-planter':[o.width||2.2,o.depth||.75]};
   obstacles.push({id:o.id,polygon:rect(...sizes[o.kind])});
  }
 }
 return {walkable,obstacles,walls,overviewPoints:walkable.flat()};
}
