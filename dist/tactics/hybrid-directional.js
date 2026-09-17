// Isolated candidate-art diagnostic. Never changes simulation pose or muzzle.
import {DIMENSIONS,GAME_CAMERA,projectWorld} from './hybrid-world.js';
import {muzzlePoint} from './hybrid-combat.js';
export const SECTOR=Object.freeze({min:22.5,max:67.5,step:2.8125,tolerance:.05});
export function nearestDirection(heading){
 if(!Number.isFinite(heading)||heading<SECTOR.min||heading>SECTOR.max)return null;
 return Math.round((heading-SECTOR.min)/SECTOR.step);
}
export function nearestDirectionBound(radius,count){
 if(!(radius>=0)||!Number.isInteger(count)||count<1)throw Error('Invalid angular bound');
 return 2*radius*Math.sin(Math.PI/(2*count));
}
// Uniform scale only, using the requested atlas registration. Assets which ignore
// this registration fail visibly; do not fit their painted muzzle to its target.
export const CANDIDATE_LAYOUT=Object.freeze({width:1402,height:1122,columns:5,rows:4,cell:512,
 anchor:[256,420],scale:DIMENSIONS.standing*Math.cos(GAME_CAMERA.elevation)/360});
// Generation did not preserve row padding. These source crops isolate complete
// figures without moving their pixels or changing the requested world anchor.
export function candidateCrop(stance,index){
 const bands={standing:[[30,305],[310,574],[580,850],[855,1122]],kneeling:[[30,300],[310,568],[580,837],[850,1122]],prone:[[100,315],[375,620],[665,895],[915,1122]]};
 const [top,bottom]=bands[stance][Math.floor(index/5)],width=CANDIDATE_LAYOUT.width/5;
 return [index%5*width,top,width,bottom-top];
}
export function candidateVertex(index,atlasPixel){
 const layout=CANDIDATE_LAYOUT,factor=layout.cell*layout.columns/layout.width;
 return [(atlasPixel[0]*factor-index%5*512-layout.anchor[0])*layout.scale,
  (layout.anchor[1]-(atlasPixel[1]*factor-Math.floor(index/5)*512))*layout.scale];
}
export function physicalTip(stance,heading){
 const p=muzzlePoint({geometryMode:'hybrid'},{x:0,y:0,z:0,hp:100,stance,heading});
 return projectWorld([p.x,p.h,p.y]);
}
export function candidateError(stance,heading,landmarks){
 const index=nearestDirection(heading);if(index===null)return null;
 const p=landmarks[stance][index],painted=candidateVertex(index,p),physical=physicalTip(stance,heading);
 const error=Math.hypot(painted[0]-physical[0],painted[1]-physical[1]);
 const uncertainty=(landmarks.measurementUncertaintyPixelsPerAxis??3)*Math.SQRT2*512*5/CANDIDATE_LAYOUT.width*CANDIDATE_LAYOUT.scale;
 const interval=[Math.max(0,error-uncertainty),error+uncertainty];
 return {index,heading,frameHeading:SECTOR.min+index*SECTOR.step,painted,physical,error,interval,assessment:interval[0]>SECTOR.tolerance?'fail':interval[1]<=SECTOR.tolerance?'within estimated interval':'uncertain'};
}
