// Deterministic presentation study; does not schedule gameplay actions or damage.
export const SEQUENCE_DURATION=10;
export const SHOT_TIME=6;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export function horseSequence(time){
 const t=Math.max(0,Math.min(SEQUENCE_DURATION,time)),distance=2*smooth(t/3);
 const phase=t<3?'Walk':t<3.5?'Plant feet':t<4.7?'Kneel':t<6?'Aim':t<6.7?'Fire / recover':t<7?'Hold':t<8.5?'Stand':'Standing';
 const kneel=smooth((t-3.5)/1.2)*(1-smooth((t-7)/1.5));
 const feet={};
 for(const side of [-1,1]){
  const cycle=(distance/.5+(side===1?0:.5))%1;
  let x,lift=0,planted=false;
  if(cycle<.5){x=.125-.5*cycle;planted=true;}
  else{const u=(cycle-.5)*2;x=-.125+.25*smooth(u);lift=.075*Math.sin(Math.PI*u);}
  if(t>=3){const settle=clamp((t-3)/.25-(side===1?0:1));x=(side===1?.125:-.125)*(1-smooth(settle));lift=.045*Math.sin(Math.PI*settle);planted=settle===0||settle===1;}
  // The rear foot steps back during kneeling and forward during standing.
  if(t>=3.5&&t<4.7){lift=side===-1?.065*Math.sin(Math.PI*clamp((t-3.5)/1.2)):0;planted=side===1;}
  if(t>=7&&t<8.5){lift=side===-1?.065*Math.sin(Math.PI*clamp((t-7)/1.5)):0;planted=side===1;}
  feet[side]={x,lift,planted};
 }
 const recoilTime=t-SHOT_TIME-.045,recoil=recoilTime>0&&recoilTime<.45?.045*Math.sin(Math.PI*recoilTime/.45)*Math.exp(-3*recoilTime):0;
 return {time:t,phase,distance:distance-.205*kneel,stance:kneel>.5?'kneeling':'standing',flash:t>=SHOT_TIME&&t<SHOT_TIME+.045,shotVisible:t>=SHOT_TIME&&t<SHOT_TIME+.14,motion:{kneel,feet,bob:t<3?.012*Math.sin(distance/.5*Math.PI*2)**2:0,readyPitch:-.20*(1-smooth((t-4.7)/.9)),recoil}};
}
