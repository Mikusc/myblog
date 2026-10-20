// Direction metadata is shared by viewers/exports. Source geometry remains unchanged.
export function supportsOrientation(model){
 return model.coordinates?.units==='design-image-pixels'||model.coordinates?.units==='reference-image-pixels'&&model.revision==='R1';
}
export function northTopDirection(orientation){
 const [x,z]=orientation.worldNorthXZ;return [-x*.02,150,-z*.02];
}
export function compassAngle(northScreen){
 return Math.atan2(northScreen[0],-northScreen[1])*180/Math.PI;
}
export function cardinalScreenVectors(northScreen){
 const length=Math.hypot(...northScreen)||1,[x,y]=northScreen.map(v=>v/length);
 return {N:[x,y],E:[-y,x],S:[-x,-y],W:[y,-x]};
}
export function directionBearing([x,z],orientation){
 const [nx,nz]=orientation.worldNorthXZ,[ex,ez]=orientation.worldEastXZ;
 return (Math.atan2(x*ex+z*ez,x*nx+z*nz)*180/Math.PI+360)%360;
}
export function comparisonPixel(point,orientation){
 const matrix=orientation.geographicComparison.planToWebMercator,image=orientation.comparisonImage,e=image.extent;
 const [x,y]=matrix.map(row=>row[0]*point[0]+row[1]*point[1]+row[2]);
 return [(x-e.xmin)/(e.xmax-e.xmin)*image.width,(e.ymax-y)/(e.ymax-e.ymin)*image.height];
}
export function orientationCompass(container){
 container.innerHTML='<svg viewBox="0 0 104 104" role="img" aria-label="卫星估计的东南西北"><circle cx="52" cy="52" r="30" fill="none" stroke="currentColor" opacity=".13"/><g data-needle><path d="M52 30 47 44 52 41 57 44Z" fill="#007aff"/><path d="M52 41V70" stroke="#007aff" stroke-width="1.8"/></g><text data-cardinal="N" fill="#007aff">北</text><text data-cardinal="E">东</text><text data-cardinal="S">南</text><text data-cardinal="W">西</text></svg><small>北向估计</small>';
 return north=>{
  const angle=compassAngle(north),vectors=cardinalScreenVectors(north);
  container.querySelector('[data-needle]').setAttribute('transform',`rotate(${angle} 52 52)`);
  for(const [label,[x,y]] of Object.entries(vectors)){const el=container.querySelector(`[data-cardinal="${label}"]`);el.setAttribute('x',52+x*42);el.setAttribute('y',52+y*42+4);}
 };
}
