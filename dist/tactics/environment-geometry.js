import * as THREE from './vendor/three.module.js';
export function environmentGeometries(){
 const g={box:new THREE.BoxGeometry(1,1,1),cylinder:new THREE.CylinderGeometry(.5,.5,1,12),taper:new THREE.CylinderGeometry(.3,.5,1,9),cone:new THREE.ConeGeometry(.5,1,10),crown:new THREE.IcosahedronGeometry(.5,1),cushion:new THREE.SphereGeometry(.5,12,8),leaf:new THREE.OctahedronGeometry(.5),ring:new THREE.TorusGeometry(.35,.15,5,12),wedge:new THREE.BoxGeometry(1,1,1)};
 g.ring.rotateX(Math.PI/2);
 const p=g.wedge.attributes.position;for(let i=0;i<p.count;i++)if(p.getY(i)<0)p.setY(i,-.5+(p.getX(i)+.5)*.88);p.needsUpdate=true;g.wedge.computeVertexNormals();
 for(const geometry of Object.values(g)){geometry.computeBoundingBox();const b=geometry.boundingBox,s=new THREE.Vector3(),c=new THREE.Vector3();b.getSize(s);b.getCenter(c);geometry.translate(-c.x,-c.y,-c.z);geometry.scale(1/s.x,1/s.y,1/s.z);geometry.computeBoundingSphere();}
 return g;
}
