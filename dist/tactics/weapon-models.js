import * as THREE from './vendor/three.module.js';
import {createWorkerRifle} from './horse-rifle.js';

export const WEAPON_MODELS={
 hands:{label:'Unarmed',kind:'unarmed'},knife:{label:'NR-40 knife',kind:'melee'},pistol:{label:'TT-33 pistol',kind:'firearm'},
 rifle:{label:'Mosin-Nagant',kind:'firearm'},assault:{label:'AK-47',kind:'firearm'},smg:{label:'PPSh submachine gun',kind:'firearm'},
 hmg:{label:'Heavy machine gun',kind:'firearm'},shotgun:{label:'Pump-action shotgun',kind:'firearm'},sniper:{label:'Sniper rifle',kind:'firearm'},
 grenade:{label:'Fragmentation grenade',kind:'thrown'},launcher:{label:'Grenade launcher',kind:'launcher'},rpg:{label:'RPG',kind:'launcher'},flamethrower:{label:'Backpack flamethrower',kind:'flame'},
};
const V=a=>new THREE.Vector3(...a);
const defaultCarry={position:[.24,1.005,.035],axis:[.20,.38,-.90],hands:[1,-1]};
export function createWeaponModel(id,texture=null){
 if(!WEAPON_MODELS[id])throw Error('Unknown weapon model: '+id);
 if(id==='rifle'){const asset=createWorkerRifle(texture);return {...asset,id,...WEAPON_MODELS[id],carry:defaultCarry,muzzleMesh:asset.parts.find(p=>p.name==='muzzle opening')};}
 const root=new THREE.Group();root.name=WEAPON_MODELS[id].label;const parts=[],anchors={};
 const materials={wood:new THREE.MeshStandardMaterial({color:0x986039,roughness:.88}),steel:new THREE.MeshStandardMaterial({color:0x424b4f,roughness:.7,metalness:.3}),edge:new THREE.MeshStandardMaterial({color:0x85908e,roughness:.6,metalness:.35}),dark:new THREE.MeshStandardMaterial({color:0x21292a,roughness:.9}),olive:new THREE.MeshStandardMaterial({color:0x646745,roughness:.88}),brass:new THREE.MeshStandardMaterial({color:0xb29954,roughness:.55,metalness:.4}),blade:new THREE.MeshStandardMaterial({color:0xc5cbbb,roughness:.55,metalness:.15}),bore:new THREE.MeshBasicMaterial({color:0x090c0c})};
 if(texture){materials.wood.map=texture;materials.wood.color.set(0xd6b090);}
 function add(geometry,mat,name,pos=[0,0,0],group=root){if(mat==='wood'&&texture){const uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(.03+uv.getX(i)*.94)/4,1-(2.03+uv.getY(i)*.94)/4);}const mesh=new THREE.Mesh(geometry,materials[mat]);mesh.name=name;mesh.position.fromArray(pos);group.add(mesh);parts.push(mesh);return mesh;}
 const box=(name,size,pos,mat='steel',group=root)=>add(new THREE.BoxGeometry(...size),mat,name,pos,group);
 function rod(name,a,b,r,mat='steel',r2=r,sides=10,group=root){const axis=V(b).sub(V(a));const g=new THREE.CylinderGeometry(r2,r,axis.length(),sides);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V([0,1,0]),axis.clone().normalize()));g.translate(...V(a).add(V(b)).multiplyScalar(.5).toArray());return add(g,mat,name,[0,0,0],group);}
 function profile(name,points,depth,mat='wood'){const shape=new THREE.Shape();shape.moveTo(...points[0]);for(const pt of points.slice(1))shape.lineTo(...pt);shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:1});g.translate(0,0,-depth/2);return add(g,mat,name);}
 function anchor(name,p,group=root){const a=new THREE.Object3D();a.name=name;a.position.fromArray(p);group.add(a);anchors[name]=a;return a;}
 function ring(name,r,t,pos,mat='steel',axis='z',group=root){const m=add(new THREE.TorusGeometry(r,t,5,12),mat,name,pos,group);if(axis==='x')m.rotation.y=Math.PI/2;else if(axis==='y')m.rotation.x=Math.PI/2;return m;}
 function stock(length=.30){profile('wooden shoulder stock',[[-length,-.079],[-length,.025],[-.20,.020],[-.12,-.008],[-.045,-.018],[-.012,-.04],[-.055,-.061],[-.15,-.04]],.045);box('stock heel cap',[.012,.10,.051],[-length,-.026,0],'dark');anchor('stock',[-length,-.025,0]);}
 let muzzleMesh=null,carry={...defaultCarry},mount=null,hose=null;
 function muzzle(x,y,r){const m=add(new THREE.CircleGeometry(r*.72,12),'bore','muzzle opening',[x+.0001,y,0]);m.rotation.y=Math.PI/2;muzzleMesh=m;anchor('muzzle',[x+.0001,y,0]);ring('muzzle rim',r*.88,r*.10,[x,y,0],'edge','x');}
 function barrel(x0,x1,r=.011,y=.020){rod('barrel',[x0,y,0],[x1,y,0],r);muzzle(x1,y,r);box('front sight',[.012,.019,.009],[x1-.029,y+r+.009,0]);}
 function receiver(length=.18){const lo=.05-length/2,hi=.05+length/2;profile('receiver',[[lo,-.019],[hi-.008,-.019],[hi,.0],[hi,.020],[hi-.016,.031],[lo+.012,.031],[lo,.020]],.046,'steel');box('receiver highlight',[length*.80,.003,.042],[.05,.034,0],'edge');for(const z of [-.026,.026]){box('ejection port',[.055,.017,.003],[.066,.013,z],'dark');box('bolt edge',[.044,.003,.004],[.059,.005,z*1.03],'edge');box('receiver lower seam',[length*.75,.002,.003],[.05,-.015,z],'edge');for(const x of [lo+.025,hi-.025]){const pin=add(new THREE.CircleGeometry(.0035,6),'edge','receiver pin',[x,-.003,z*1.03]);if(z<0)pin.rotation.y=Math.PI;}}}
 function guard(pos=[0,-.050,0]){const m=ring('trigger guard',.026,.004,pos);m.scale.x=1.2;box('trigger',[.009,.027,.007],[pos[0]+.005,pos[1]+.011,0],'dark');}
 function pistolGrip(x=-.025,y=-.065,mat='wood'){profile('pistol grip',[[x-.025,y+.042],[x+.02,y+.036],[x+.005,y-.055],[x-.048,y-.052]],.033,mat);anchor('grip',[x-.012,y-.006,0]);}
 function longContacts(grip=[-.025,-.050,0],support=[.225,-.044,0]){anchor('grip',grip);anchor('support',support);}
 if(id==='hands'){carry={...carry,hands:[]};}
 if(id==='knife'){
  profile('steel blade',[[.002,-.014],[.115,-.014],[.186,.010],[.116,.025],[.002,.019]],.009,'blade');profile('blade bevel',[[.003,-.014],[.115,-.014],[.186,.010],[.102,-.005],[.003,-.005]],.011,'edge');
  rod('dark handle',[-.110,0,0],[-.005,0,0],.017,'dark');box('cross guard',[.012,.059,.024],[0,0,0],'steel');for(let i=0;i<5;i++)ring('handle wrap '+i,.017,.0015,[-.021-i*.017,0,0],'edge','x');anchor('grip',[-.057,0,0]);anchor('tip',[.188,.010,0]);carry={position:[.29,.88,.26],axis:[.35,-.9,-.3],hands:[1]};
 }
 if(id==='pistol'){
  profile('slide',[[.0,.003],[.157,.003],[.157,.040],[.025,.040],[.0,.030]],.036,'steel');box('slide edge',[.138,.004,.038],[.081,.041,0],'edge');
  pistolGrip(.008,-.046,'dark');guard([.044,-.024,0]);barrel(.025,.165,.009,.020);box('rear sight',[.010,.009,.042],[.017,.046,0]);for(let i=0;i<5;i++)box('slide serration '+i,[.002,.022,.038],[.022+i*.006,.019,0],'dark');carry={position:[.30,.95,.24],axis:[1,-.2,-.05],hands:[1]};
 }
 if(['assault','smg','shotgun','sniper','hmg','launcher'].includes(id)){
  stock(id==='hmg'?.29:.30);receiver(id==='hmg'?.27:.18);guard();longContacts();
 }
 if(id==='assault'){
  pistolGrip();box('wooden lower handguard',[.145,.039,.045],[.217,-.007,0],'wood');rod('gas tube',[.125,.043,0],[.354,.043,0],.009);barrel(.13,.52,.011);
  profile('curved magazine',[[.065,-.022],[.118,-.023],[.114,-.12],[.074,-.211],[.025,-.19],[.064,-.114]],.042,'dark');
  for(const z of [-.023,.023]){const seam=box('magazine rib',[.007,.11,.003],[.081,-.086,z],'edge');seam.rotation.z=-.15;}box('gas block',[.018,.057,.026],[.35,.02,0]);anchor('support',[.232,-.027,0]);
 }
 if(id==='smg'){
  box('wooden fore-end',[.17,.036,.047],[.22,-.018,0],'wood');rod('perforated barrel shroud',[.11,.019,0],[.43,.019,0],.023);barrel(.13,.457,.010);
  for(let i=0;i<7;i++)for(const z of [-.024,.024])box('shroud vent',[.017,.012,.001],[.185+i*.031,.020,z],'bore');
  rod('drum magazine',[.065,-.097,-.035],[.065,-.097,.035],.068,'dark',.068,16);ring('drum rim',.059,.003,[.065,-.097,.037],'edge');rod('drum hub',[.065,-.097,.035],[.065,-.097,.041],.021,'steel');anchor('support',[.24,-.04,0]);
 }
 if(id==='shotgun'){
  barrel(.09,.61,.012);rod('magazine tube',[.09,-.012,0],[.49,-.012,0],.010);rod('wooden pump',[.15,-.015,0],[.32,-.015,0],.026,'wood');for(let i=0;i<7;i++)ring('pump groove '+i,.026,.002,[.167+i*.021,-.015,0],'dark','x');anchor('support',[.245,-.039,0]);
 }
 if(id==='sniper'){
  box('long wooden fore-end',[.28,.031,.039],[.22,-.017,0],'wood');barrel(.10,.66,.010);rod('scope tube',[.00,.094,0],[.225,.094,0],.017);rod('scope objective',[.187,.094,0],[.252,.094,0],.024);rod('scope eyepiece',[-.030,.094,0],[.018,.094,0],.020);for(const x of [.035,.155])box('scope mount',[.024,.06,.027],[x,.051,0]);rod('scope lens',[.252,.094,0],[.253,.094,0],.018,'dark');rod('scope turret',[.109,.094,0],[.109,.126,0],.013);longContacts();
 }
 if(id==='hmg'){
  box('feed cover',[.21,.055,.065],[.086,.035,0]);rod('heavy barrel shroud',[.21,.025,0],[.62,.025,0],.027);barrel(.23,.70,.014,.025);
  for(let i=0;i<8;i++)for(const z of [-.028,.028])box('cooling port',[.024,.016,.001],[.25+i*.045,.025,z],'bore');
  box('ammunition box',[.12,.13,.09],[.045,-.075,.075],'olive');box('feed bridge',[.031,.016,.105],[.078,.008,.080],'dark');box('belt backing',[.022,.171,.005],[.077,-.082,.129],'dark');for(let i=0;i<9;i++){const y=-.010-i*.018,z=.13+.012*Math.sin(i*.25);rod('belt round '+i,[.046,y,z],[.111,y,z],.006,'brass',.0025,8);ring('cartridge link '+i,.007,.002,[.077,y,z],'steel','x');if(i<8)rod('belt joining link '+i,[.077,y,z],[.077,y-.018,.13+.012*Math.sin((i+1)*.25)],.0025,'dark',.0025,5);}
  for(const z of [-1,1]){rod('bipod leg',[.49,.012,z*.021],[.53,-.235,z*.10],.007);box('bipod foot',[.047,.009,.027],[.53,-.238,z*.10],'dark');}anchor('support',[.23,-.010,0]);carry={...carry,position:[.27,.98,.035]};
 }
 if(id==='launcher'){
  pistolGrip(-.028,-.065);rod('revolving cylinder',[.071,.025,0],[.221,.025,0],.052,'dark',.052,12);
  for(let i=0;i<6;i++){const a=i*Math.PI/3;rod('chamber ridge '+i,[.076,.025+Math.sin(a)*.051,Math.cos(a)*.051],[.211,.025+Math.sin(a)*.051,Math.cos(a)*.051],.018,'steel');}
  ring('cylinder front band',.065,.004,[.210,.025,0],'edge','x');ring('cylinder rear band',.065,.004,[.079,.025,0],'steel','x');barrel(.20,.405,.030,.025);box('foregrip',[.067,.055,.042],[.28,-.026,0],'wood');anchor('support',[.28,-.044,0]);
 }
 if(id==='rpg'){
  rod('launch tube',[-.39,.025,0],[.35,.025,0],.033,'olive');rod('rear venturi',[-.48,.025,0],[-.39,.025,0],.062,'steel',.033);ring('rear rim',.057,.004,[-.48,.025,0],'edge','x');
  for(const x of [-.23,-.12])ring('tube clamp',.035,.003,[x,.025,0],'steel','x');pistolGrip(-.035,-.046,'dark');box('forward grip',[.035,.106,.03],[.07,-.057,0],'wood');anchor('support',[.07,-.060,0]);
  rod('rocket shoulder',[.35,.025,0],[.465,.025,0],.032,'olive',.066,12);rod('warhead',[.465,.025,0],[.62,.025,0],.066,'olive',.013,12);rod('nose fuse',[.62,.025,0],[.65,.025,0],.013,'brass',.007,8);muzzle(.35,.025,.033);box('folding sight',[.013,.10,.017],[.02,.095,-.04],'steel');carry={...carry,position:[.23,1.225,.16],axis:[.98,.01,-.2]};
 }
 if(id==='grenade'){
  const body=add(new THREE.SphereGeometry(.034,12,8),'olive','segmented grenade body');body.scale.y=1.35;for(const y of [-.025,-.010,.010,.025])ring('body groove',Math.sqrt(Math.max(0,.034*.034-(y/1.35)**2)),.0015,[0,y,0],'dark','y');
  for(let i=0;i<6;i++){const angle=i*Math.PI/3,points=[];for(let j=0;j<=10;j++){const a=.24+j*(Math.PI-.48)/10;points.push(V([.034*Math.sin(a)*Math.cos(angle),.046*Math.cos(a),.034*Math.sin(a)*Math.sin(angle)]));}add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),10,.0014,4,false),'dark','vertical grenade groove');}
  rod('fuse neck',[0,.037,0],[0,.061,0],.012,'steel');box('safety lever',[.018,.068,.012],[.020,.029,0],'steel');ring('pull ring',.014,.002,[-.018,.057,0],'edge');anchor('grip',[0,0,0]);anchor('release',[0,0,0]);carry={position:[.17,1.28,.34],axis:[.65,.1,-.7],hands:[1]};
 }
 if(id==='flamethrower'){
  receiver(.12);pistolGrip(-.06,-.060,'dark');guard([-.025,-.065,0]);rod('fuel lance',[-.07,.020,0],[.46,.020,0],.021);barrel(.30,.49,.028);box('support grip',[.035,.070,.035],[.18,-.037,0],'dark');anchor('support',[.18,-.046,0]);rod('igniter tube',[.27,-.017,0],[.50,-.017,0],.007,'brass');anchor('hoseIn',[-.11,.014,.026]);
  mount=new THREE.Group();mount.name='backpack fuel system';
  box('backplate',[.050,.33,.28],[-.015,0,0],'dark',mount);
  for(const z of [-.083,.083]){rod('fuel cylinder',[-.064,-.13,z],[-.064,.15,z],.065,'olive',.065,12,mount);for(const y of [-.12,.13])ring('tank band',.067,.007,[-.064,y,z],'steel','y',mount);rod('tank valve',[-.064,.15,z],[-.064,.205,z],.012,'brass',.012,8,mount);ring('valve wheel',.022,.004,[-.064,.202,z],'steel','y',mount);}
  for(const z of [-.15,.15]){const curve=new THREE.CatmullRomCurve3([V([-.01,-.14,z]),V([.06,.18,z]),V([.22,.17,z]),V([.26,-.03,z]),V([.10,-.18,z])]);add(new THREE.TubeGeometry(curve,16,.009,5,false),'olive','backpack shoulder strap',[0,0,0],mount);}
  anchor('hoseOut',[-.076,-.125,.15],mount);hose=new THREE.Mesh(new THREE.BufferGeometry(),materials.dark);hose.name='flexible fuel hose';parts.push(hose);
 }
 const asset={id,...WEAPON_MODELS[id],root,parts,anchors,carry,mount,hose,muzzleMesh,get triangles(){return parts.reduce((n,p)=>n+(p.geometry.index?.count||p.geometry.attributes.position?.count||0)/3,0);},dispose(){for(const p of parts)p.geometry.dispose();for(const m of Object.values(materials))m.dispose();}};
 if(hose)asset.updateHose=characterRoot=>{characterRoot.updateMatrixWorld(true);const a=characterRoot.worldToLocal(anchors.hoseOut.getWorldPosition(new THREE.Vector3())),b=characterRoot.worldToLocal(anchors.hoseIn.getWorldPosition(new THREE.Vector3()));const curve=new THREE.CatmullRomCurve3([a,a.clone().add(V([-.03,-.16,.07])),b.clone().add(V([-.06,-.12,.12])),b]);hose.geometry.dispose();hose.geometry=new THREE.TubeGeometry(curve,18,.011,6,false);};
 return asset;
}
