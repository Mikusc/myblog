// Keep the virtual venue centered in the area between floating controls.
// This changes the projection only, never a real-world coordinate or viewpoint.
export function safeViewportFrame(width,height,{top=0,bottom=0}={}){
  width=Math.max(1,Number(width)||1);height=Math.max(1,Number(height)||1);
  top=Math.max(0,Number(top)||0);bottom=Math.max(0,Number(bottom)||0);
  const reserved=top+bottom,scale=reserved>height*.7?height*.7/reserved:1;
  top*=scale;bottom*=scale;
  const availableHeight=height-top-bottom;
  return {width,height,availableHeight,aspect:width/availableHeight,
    offsetY:(bottom-top)/2,
    fov:2*Math.atan(Math.tan(31*Math.PI/180)*height/availableHeight)*180/Math.PI};
}
