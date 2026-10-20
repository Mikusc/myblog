import {buildFloorSVG} from '../lab-floor/geometry.js';
import {planSVG,wallSpans,interpolate,createModel} from '../ieb-floor/geometry.js';
import {refinedVenueGeometry} from './ieb-r18.js';

// Adapt coordinates for shared interaction; retain the original geometry builders.
export function adaptVenueModel(source,profile){
  if(source.id!==profile.modelId)throw Error('场馆模型版本不匹配，请同步更新场馆配置');
  let model;
  if(profile.adapter==='lab')model={...source};
  else {
    const categories={public:'circulation',classroom:'lab',exhibition:'shared',office:'office',service:'service',unknown:'service'};
    model={...source,coordinates:{...source.coordinates,originPx:source.coordinates.origin},
      footprint:source.regions.find(r=>r.isBase).points,
      regions:source.regions.map(r=>({...r,polygon:r.points,category:categories[r.kind]})),columns:[],doors:[],
      wallSegments:source.walls.flatMap(w=>[
        ...wallSpans(w).map(([a,b])=>({a:interpolate(w.a,w.b,a),b:interpolate(w.a,w.b,b),base:0,height:w.heightM??source.assumptions.wallHeightM,type:'wall',regionId:w.id})),
        ...(w.doors||[]).map(([a,b])=>({a:interpolate(w.a,w.b,a),b:interpolate(w.a,w.b,b),base:source.assumptions.doorHeightM,height:(w.heightM??source.assumptions.wallHeightM)-source.assumptions.doorHeightM,type:'lintel',regionId:w.id}))
      ])};
  }
  const refined=profile.adapter==='ieb'?refinedVenueGeometry(source):null;
  if(refined){
    model.wallSegments.push(...refined.walls);
    model.walkablePolygons=refined.walkable;
    model.fitoutObstacles=refined.obstacles;
    model.overviewPoints=refined.overviewPoints;
  }
  model.posterAnchors=profile.placements.map(p=>{
    const anchor=p.modelAnchorId?source.posterAnchors?.find(a=>a.id===p.modelAnchorId):p;
    if(!anchor)throw Error(`海报挂点不存在：${p.posterId}`);
    return {...anchor,id:p.posterId};
  });
  return {...model,adapter:profile.adapter,sourceModel:source};
}
export function composeExhibition(content,profile){
  return {...content,id:profile.exhibitionId,posters:content.posters.map(p=>({...p,anchorId:p.id})),
    connections:content.connections.map(c=>{const route=profile.routes.find(r=>r.from===c.from&&r.to===c.to);return {...c,via:route?.via||[],showRoute:!!route};})};
}
export function buildVenueMap(model){
  if(model.adapter!=='ieb')return buildFloorSVG(model);
  if(!model.overviewPoints)return planSVG(model.sourceModel);
  const xs=model.overviewPoints.map(p=>p[0]),ys=model.overviewPoints.map(p=>p[1]);
  const x=Math.min(...xs)-85,y=Math.min(...ys)-90;
  return planSVG({...model.sourceModel,view:{...model.sourceModel.view,planBox:[x,y,Math.max(...xs)-x+85,Math.max(...ys)-y+75],sheetTitle:[x+15,y+25]}});
}
export function createIEBShell(THREE,model,options){
  const shell=createModel(THREE,model.sourceModel,options);
  if(model.sourceModel.venueRelease){
    for(const mesh of shell.floors){
      const region=model.sourceModel.regions.find(r=>r.id===mesh.userData.region);
      if(region?.contextOnly||region?.isBase)mesh.visible=false;
    }
  }
  for(const region of model.sourceModel.regions){
    for(const [a,b] of region.boundarySegments||[]){
      const coord=model.coordinates,toPoint=p=>new THREE.Vector3((p[0]-coord.originPx[0])*coord.metersPerPixel,.02,(p[1]-coord.originPx[1])*coord.metersPerPixel);
      const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([toPoint(a),toPoint(b)]),new THREE.LineDashedMaterial({color:'#8d957e',dashSize:.3,gapSize:.18}));line.computeLineDistances();shell.root.add(line);
    }
  }
  return shell;
}
