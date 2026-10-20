import {toWorld,pointInPolygon} from '../lab-floor/geometry.js';
import {buildWalls} from './spatial.js';
import {decodeWalkGrid,gridAllows} from './walk-grid.js';

export const WALK={radius:.2,speed:1.6,step:.08};
const edges=polygon=>polygon.map((a,i)=>[a,polygon[(i+1)%polygon.length]]);
export function segmentDistance(p,a,b){
 const x=b[0]-a[0],z=b[1]-a[1],length=x*x+z*z;
 const t=length?Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*z)/length)):0;
 return Math.hypot(p[0]-a[0]-t*x,p[1]-a[1]-t*z);
}
export function createWalkSpace(model,exhibition,posters){
 const world=p=>{const [x,,z]=toWorld(p,model.coordinates);return [x,z];};
 const footprint=model.footprint.map(world),obstacles=[],walls=[];
 const grid=decodeWalkGrid(model.sourceModel?.walkingCollision);
 const inferred=new Set(model.adapter==='ieb'&&model.sourceModel.presentation?.inferredWalls==='ground-outline'?model.sourceModel.walls.filter(w=>w.type==='inferred').map(w=>w.id):[]);
 const width=model.adapter==='ieb'?model.sourceModel.assumptions.wallThicknessM:.13;
 for(const w of grid?[]:buildWalls(model,exhibition))if(w.base<1.5&&w.base+w.height>.2&&!inferred.has(w.regionId))walls.push({a:world(w.a),b:world(w.b),radius:width/2});
 for(const p of model.columns){const [x,z]=world(p);obstacles.push([[x-.26,z-.26],[x+.26,z-.26],[x+.26,z+.26],[x-.26,z+.26]]);}
 for(const r of model.regions)if(r.category==='outdoor'||r.stairs||r.id.startsWith('lift-'))obstacles.push(r.polygon.map(world));
 for(const f of model.sourceModel?.fixtures||[]){
  if(f.points)obstacles.push(f.points.map(world));
  else if(f.a&&f.b){const a=world(f.a),b=world(f.b),length=Math.hypot(b[0]-a[0],b[1]-a[1])||1,w=f.widthPixels*model.coordinates.metersPerPixel/2,n=[-(b[1]-a[1])/length*w,(b[0]-a[0])/length*w];obstacles.push([[a[0]+n[0],a[1]+n[1]],[b[0]+n[0],b[1]+n[1]],[b[0]-n[0],b[1]-n[1]],[a[0]-n[0],a[1]-n[1]]]);}
 }
 for(const p of posters){const [nx,nz]=p.normal,[x,,z]=p.position;walls.push({a:[x-nz*.685,z+nx*.685],b:[x+nz*.685,z-nx*.685],radius:.12});}
 for(const o of grid?[]:model.fitoutObstacles||[])obstacles.push(o.polygon.map(world));
 return {footprint,obstacles,walls,grid,walkablePolygons:model.walkablePolygons?.map(poly=>poly.map(world))};
}
export function canWalk(point,space,radius=WALK.radius){
 if(!point.every(Number.isFinite)||!pointInPolygon(point,space.footprint))return false;
 if(space.grid){
  if(!gridAllows(point,space.grid))return false;
  const extra=Math.max(0,radius-space.grid.radius);
  if(extra)for(let i=0;i<16;i++){const a=i*Math.PI/8;if(!gridAllows([point[0]+Math.cos(a)*extra,point[1]+Math.sin(a)*extra],space.grid))return false;}
 }
 if(space.walkablePolygons&&!space.walkablePolygons.some(poly=>pointInPolygon(point,poly)))return false;
 if(edges(space.footprint).some(([a,b])=>segmentDistance(point,a,b)<radius))return false;
 if(space.walls.some(w=>segmentDistance(point,w.a,w.b)<radius+w.radius))return false;
 return !space.obstacles.some(poly=>pointInPolygon(point,poly)||edges(poly).some(([a,b])=>segmentDistance(point,a,b)<radius));
}
// Example placements can put the viewing point at a fixture edge. Adjust only
// the camera start locally; never move the Poster or infer a new room layout.
export function walkStart(position,space){
 if(canWalk(position,space))return [...position];
 for(let ring=1;ring<=12;ring++)for(let i=0;i<32;i++){
  const angle=i*Math.PI/16,p=[position[0]+Math.cos(angle)*ring*.1,position[1]+Math.sin(angle)*ring*.1];
  if(canWalk(p,space))return p;
 }
 return null;
}
export function moveWalker(position,delta,space){
 if(![...position,...delta].every(Number.isFinite))return position;
 const step=space.grid?Math.min(WALK.step,space.grid.resolution/2):WALK.step;
 const count=Math.ceil(Math.hypot(...delta)/step);if(!count)return position;
 let p=[...position];const [dx,dz]=delta.map(v=>v/count);
 for(let i=0;i<count;i++){
  const next=[p[0]+dx,p[1]+dz];
  if(canWalk(next,space))p=next;
  else {if(canWalk([p[0]+dx,p[1]],space))p[0]+=dx;if(canWalk([p[0],p[1]+dz],space))p[1]+=dz;}
 }
 return p;
}
export function walkDelta({forward=0,right=0},yaw,seconds){
 const length=Math.max(1,Math.hypot(forward,right)),distance=WALK.speed*Math.max(0,Math.min(.05,seconds))/length;
 return [(Math.sin(yaw)*forward+Math.cos(yaw)*right)*distance,(-Math.cos(yaw)*forward+Math.sin(yaw)*right)*distance];
}
