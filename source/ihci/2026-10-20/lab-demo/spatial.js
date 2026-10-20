import {toWorld, pointInPolygon} from '../lab-floor/geometry.js';

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
// Navigation yaw turns clockwise from -Z; Three.js Euler yaw turns the other way.
export const cameraRotation = look => [look.pitch, -look.yaw, 0, 'YXZ'];
const distance = (a,b) => Math.hypot(b[0]-a[0],b[1]-a[1]);

export function resolvePosters(model, exhibition) {
  return exhibition.posters.map(poster => {
    const anchor = model.posterAnchors.find(a => a.id === poster.anchorId);
    if (!anchor) throw new Error(`Missing anchor: ${poster.anchorId}`);
    const room = model.regions.find(r => r.id === anchor.roomId);
    const length = Math.hypot(...anchor.facing);
    if(!Number.isFinite(length)||length<=0)throw new Error(`Invalid anchor facing: ${poster.id}`);
    const normal = anchor.facing.map(v => v / length);
    const viewPx = anchor.position.map((v,i) => v + normal[i] * exhibition.viewDistance / model.coordinates.metersPerPixel);
    if (!room || !pointInPolygon(viewPx,room.polygon)) throw new Error(`Viewpoint outside room: ${poster.id}`);
    return {...poster, roomId:room.id, roomName:room.name, positionPx:anchor.position,
      position:toWorld(anchor.position,model.coordinates,exhibition.eyeHeight),
      normal, viewPx, view:toWorld(viewPx,model.coordinates,exhibition.eyeHeight),
      yaw:Math.atan2(-normal[0],normal[1]), pitch:0};
  });
}

export function routePoints(connection, posters) {
  const from = posters.find(p => p.id === connection.from), to = posters.find(p => p.id === connection.to);
  if (!from || !to) throw new Error('Route endpoint missing');
  return [from.viewPx,...connection.via,to.viewPx];
}

export function roomEdges(region) {
  return region.polygon.map((a,i) => ({a,b:region.polygon[(i+1)%region.polygon.length],regionId:region.id}));
}

// Only closed indoor rooms create partitions. Corridors, open lounges and outdoor
// zones remain open. Nearby doorway intervals cut both faces of a shared wall.
export function buildWalls(model, {wallHeight=3,doorHeight=2.15} = {}) {
  if(model.wallSegments)return model.wallSegments;
  const edges = model.regions.filter(r => !r.openEdges && !['outdoor','circulation'].includes(r.category)).flatMap(roomEdges);
  const walls = [];
  for (const edge of edges) {
    const {a,b,regionId} = edge, len = distance(a,b);
    if (!len) continue;
    const u = [(b[0]-a[0])/len,(b[1]-a[1])/len];
    const pointAt = t => [a[0]+u[0]*t,a[1]+u[1]*t];
    const gaps = [];
    for (const door of model.doors) {
      const axis = door.axis === 'v' ? [0,1] : [1,0];
      if (Math.abs(u[0]*axis[0]+u[1]*axis[1]) < .995) continue;
      const d = [door.at[0]-a[0],door.at[1]-a[1]];
      if (Math.abs(d[0]*u[1]-d[1]*u[0]) > 5) continue;
      const t0 = d[0]*u[0]+d[1]*u[1], t1 = t0+door.width*(u[0]*axis[0]+u[1]*axis[1]);
      const start = clamp(Math.min(t0,t1)-1,0,len), end = clamp(Math.max(t0,t1)+1,0,len);
      if (end-start > 3) gaps.push([start,end]);
    }
    gaps.sort((a,b)=>a[0]-b[0]);
    const merged = [];
    for (const gap of gaps) {
      const last = merged.at(-1);
      if (last && gap[0] <= last[1]) last[1] = Math.max(last[1],gap[1]); else merged.push([...gap]);
    }
    const add = (start,end,base,height,type) => {
      if (end-start < .1 || height <= 0) return;
      walls.push({a:pointAt(start),b:pointAt(end),base,height,type,regionId});
    };
    let cursor = 0;
    for (const [start,end] of merged) {
      add(cursor,start,0,wallHeight,'wall');
      add(start,end,doorHeight,wallHeight-doorHeight,'lintel');
      cursor = end;
    }
    add(cursor,len,0,wallHeight,'wall');
  }
  return walls;
}

export function containsAtEye(point, wall, height=1.65, tolerance=2.5) {
  if (height < wall.base || height > wall.base+wall.height) return false;
  const dx=wall.b[0]-wall.a[0], dy=wall.b[1]-wall.a[1], length2=dx*dx+dy*dy;
  const t=clamp(((point[0]-wall.a[0])*dx+(point[1]-wall.a[1])*dy)/length2,0,1);
  return distance(point,[wall.a[0]+t*dx,wall.a[1]+t*dy]) <= tolerance;
}
