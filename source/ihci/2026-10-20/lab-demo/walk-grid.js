// Baked from the displayed geometry. No network or renderer state is needed.
export function decodeWalkGrid(data){
 if(!data)return null;
 if(data.schemaVersion!==1||data.space!=='world-xz'||data.encoding!=='base64-lsb0-blocked-cells'||data.resolution<=0||data.radius<0)throw Error('模型通行范围版本不匹配');
 const bytes=Uint8Array.from(atob(data.bits),c=>c.charCodeAt(0));
 if(bytes.length!==Math.ceil(data.width*data.height/8))throw Error('模型通行范围数据不完整');
 return {...data,bits:bytes};
}
export function gridAllows(point,grid){
 const x=Math.floor((point[0]-grid.origin[0])/grid.resolution),z=Math.floor((point[1]-grid.origin[1])/grid.resolution);
 if(x<0||z<0||x>=grid.width||z>=grid.height)return false;
 const index=z*grid.width+x;
 return (grid.bits[index>>3]&(1<<(index&7)))===0;
}
