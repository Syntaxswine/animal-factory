// G5 happiness and quitting (GUARDS.md). A merc's happiness is a 0..100 meter apart from stress (combat) and fatigue (rest debt).
// It is settled whenever the campaign clock advances, pro rata: opposing partners (rung resented or feud) on the same local map cost
// 5 per 24 clock hours each; with none present the merc recovers 5 a day, or 10 when every opposing partner is deployed elsewhere;
// liked partners present add 5 (bonded) or 2 (trusted) a day. Twenty-four consecutive hours at exactly zero and the merc quits at the
// next safe moment. Guards have no meter. This module is pure: units in, log lines out; the clock is the campaign clock in minutes.
import {rungOf,opposing,RUNGS} from './archetypes.js';

export const DAY=1440,DECAY_PER_DAY=5,CALM_PER_DAY=5,APART_PER_DAY=10,LIKED_PER_DAY={bonded:5,trusted:2},QUIT_HOURS=24,CLEAN_WIN=5,RUNG_UP=5;
// A partner's loss, by the rung in force at that moment (decision 4: cautious 10 stress, strained 5, resented none, feud relief).
export const PARTNER_DEATH={bonded:{happiness:75,stress:25},trusted:{happiness:35,stress:15},'cautious trust':{happiness:0,stress:10},strained:{happiness:0,stress:5},resented:{happiness:0,stress:0},feud:{happiness:0,stress:-10}};
export const PARTNER_CAPTURED={bonded:20,trusted:10},PARTNER_RESCUED={bonded:15,trusted:5},PARTNER_QUIT={bonded:15,trusted:5},STABILIZED_RELIEF={bonded:5,trusted:3};
export const KILLER_GRUDGE={bonded:2,trusted:1.5},KILLER_BOND={bonded:40,trusted:20},GRUDGE_STEP=20;

const clamp=(v,min=0,max=100)=>Math.max(min,Math.min(max,v));
export const onContract=u=>u.team==='squad'&&!['dead','captured','quit'].includes(u.casualty);
export const hasMeter=u=>!!u?.social&&Number.isFinite(u.social.happiness);
export const bondTo=(u,p)=>u.social?.bonds?.[p.name]??0;
const rungIndex=b=>RUNGS.findIndex(r=>r.name===rungOf(b).name);
// The other mercs still on contract. Guards never carry a meter, so they are never partners.
export const partners=(u,units)=>units.filter(p=>p!==u&&hasMeter(p)&&onContract(p));
function change(u,delta){const before=u.social.happiness;u.social.happiness=clamp(before+delta);return u.social.happiness-before;}
function remember(u,text){if(!u.social.memories)return;u.social.memories.unshift(text);u.social.memories.length=Math.min(8,u.social.memories.length);}

export function initHappiness(u){u.social.happiness=100;u.social.zeroSince=null;u.social.rungSeen=Object.fromEntries(Object.entries(u.social.bonds||{}).map(([n,b])=>[n,rungIndex(b)]));}
export const quitHoursLeft=(u,now)=>u?.social?.zeroSince==null?null:Math.max(0,QUIT_HOURS-(now-u.social.zeroSince)/60);

// One settlement covering `minutes` of campaign clock that ends at `now`. mapOf(u) names the local map the merc counts as on (a waiting
// crosser: its destination). Zero minutes still stamps the zero timer, so an event that empties the meter starts the clock at once.
export function settleHappiness(units,minutes,now,mapOf=()=>'here'){
 const lines=[],quitting=[],days=Math.max(0,minutes||0)/DAY;
 for(const u of units){if(!hasMeter(u)||!onContract(u))continue;const m=u.social,here=mapOf(u),ps=partners(u,units);
  const opp=ps.filter(p=>opposing(bondTo(u,p))),oppHere=opp.filter(p=>mapOf(p)===here);
  let delta=-DECAY_PER_DAY*oppHere.length*days;
  if(!oppHere.length)delta+=(opp.length?APART_PER_DAY:CALM_PER_DAY)*days; // one rate, two tiers (decision 2)
  for(const p of ps)if(mapOf(p)===here){const r=rungOf(bondTo(u,p)).name;if(LIKED_PER_DAY[r])delta+=LIKED_PER_DAY[r]*days;}
  // A partner's rung crossing upward lifts the meter once per crossing; the crossing itself came from a hand-over, a rescue or rest.
  for(const p of ps){const idx=rungIndex(bondTo(u,p)),seen=m.rungSeen?.[p.name];if(m.rungSeen){if(seen!==undefined&&idx<seen){delta+=RUNG_UP;lines.push(`${u.name} is glad of ${p.name}: ${RUNGS[idx].name}.`);}m.rungSeen[p.name]=idx;}}
  change(u,delta);
  if(m.happiness>0)m.zeroSince=null;
  else{m.zeroSince??=now;if(now-m.zeroSince>=QUIT_HOURS*60&&!u.quitPending){u.quitPending=true;const names=oppHere.map(p=>p.name).join(' and ')||'the squad';lines.push(`${u.name} has had enough of ${names} (${Math.round((now-m.zeroSince)/60)} hours at zero).`);quitting.push(u);}}
 }
 return {lines,quitting};
}

// A partner lost to death, capture or quitting: the survivors settle at the rung in force now, resting level ignored (a feud partner's
// death is relief). A squadmate's bullet as the cause: the survivor's grudge against the killer rises at 2x (trusted 1.5x) and its bond
// toward the killer drops a further 40 (trusted 20), decision 4.
export function partnerLost(units,lost,cause,killer=null){const lines=[];
 for(const u of partners(lost,units)){const r=rungOf(bondTo(u,lost)).name,m=u.social;
  if(cause==='dead'){const d=PARTNER_DEATH[r];change(u,-d.happiness);m.stress=clamp(m.stress+d.stress);remember(u,`${lost.name} died.`);
   if(d.happiness>=75)lines.push(`${u.name} has not spoken since ${lost.name} died.`);else if(d.happiness)lines.push(`${u.name} takes ${lost.name}'s death hard.`);else if(d.stress<0)lines.push(`${u.name} will not mourn ${lost.name}.`);
   if(killer&&killer.team==='squad'&&killer!==u&&killer!==lost&&KILLER_BOND[r]){const inc=m.incidents[killer.name]||={hits:0,damage:0,grudge:0};inc.grudge=clamp(inc.grudge+GRUDGE_STEP*KILLER_GRUDGE[r]);m.bonds[killer.name]=clamp((m.bonds[killer.name]??0)-KILLER_BOND[r],-100,100);lines.push(`${u.name} holds ${killer.name} responsible for ${lost.name}.`);}}
  else if(cause==='captured'){if(PARTNER_CAPTURED[r]){change(u,-PARTNER_CAPTURED[r]);remember(u,`${lost.name} was taken.`);lines.push(`${u.name} cannot stop thinking about ${lost.name}.`);}}
  else if(cause==='quit'){if(PARTNER_QUIT[r]){change(u,-PARTNER_QUIT[r]);remember(u,`${lost.name} walked out.`);}}
 }
 return lines;}
// The rescue facility is not built; the hook is here for when it is (decision 3: net -5 after a rescue).
export function partnerRescued(units,rescued){const lines=[];for(const u of partners(rescued,units)){const r=rungOf(bondTo(u,rescued)).name;if(PARTNER_RESCUED[r]){change(u,PARTNER_RESCUED[r]);lines.push(`${u.name} has ${rescued.name} back.`);}}return lines;}
// The medic who stabilizes a liked partner feels the relief (on top of the patient's bond gain).
export function stabilizedPartner(medic,patient){if(!hasMeter(medic))return 0;const r=rungOf(bondTo(medic,patient)).name;return STABILIZED_RELIEF[r]?change(medic,STABILIZED_RELIEF[r]):0;}
// A contact won with no squad casualty lifts everyone still on contract.
export function cleanWin(units){let n=0;for(const u of units)if(hasMeter(u)&&onContract(u)){change(u,CLEAN_WIN);n++;}return n;}
