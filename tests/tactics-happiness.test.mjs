import test from 'node:test';import assert from 'node:assert/strict';
import {createWorld,currentMap,tickWorld,spendTime,travel,settleMorale,advanceTime,TRAVEL_MINUTES} from '../dist/tactics/world.js';
import {createGame,refresh,attack,endTurn,stepEnemy,stabilize,abandonCasualties,quitMerc,squad,guards,alive,occupant,setState} from '../dist/tactics/engine.js';
import {settleHappiness,partnerLost,partnerRescued,stabilizedPartner,cleanWin,quitHoursLeft,hasMeter,onContract,rungMemory,DAY,QUIT_HOURS,RECONCILE_MINUTES,PARTNER_DEATH,PARTNER_CAPTURED,PARTNER_QUIT,STABILIZED_RELIEF,CLEAN_WIN,RUNG_UP,KILLER_BOND,GRUDGE_STEP} from '../dist/tactics/happiness.js';
import {blankMap} from '../dist/tactics/maps.js';
import {helped} from '../dist/tactics/personalities.js';

// GUARDS.md G5. A campaign world on a blank map: four mercs with their authored bonds, no guards, the map already won.
const world=()=>{const w=createWorld(blankMap());const s=currentMap(w);return {w,s,mercs:s.units.slice(0,4)};};
const gather=s=>{squad(s).forEach((u,i)=>{u.x=3+(i%2);u.y=4+Math.floor(i/2);u.lastAt=u.x+','+u.y+',0';});refresh(s);};
const pair=(a,b,value)=>{a.social.bonds[b.name]=value;b.social.bonds[a.name]=value;};
const near=(a,b,msg)=>assert.ok(Math.abs(a-b)<1e-9,(msg?msg+': ':'')+a+' vs '+b);
const happy=u=>u.social.happiness;
const stamp=(w,s)=>settleMorale(w,s,0); // a zero-minute settle records the rungs as they stand, so a fixture's bond changes are not read as crossings

test('the meter exists in the campaign only, starts at 100, and guards never carry one (check 6)',()=>{
 const {s,mercs}=world();for(const u of mercs){assert.ok(hasMeter(u));assert.equal(happy(u),100);}
 const g=createGame(1,blankMap(),true,'standard',{social:true});for(const x of guards(g))assert.ok(!hasMeter(x));
 const plain=createGame(1,blankMap());for(const u of plain.units.slice(0,4))assert.ok(!hasMeter(u),'a plain game has no meter: G4 to the byte');
 const {lines,quitting}=settleHappiness(plain.units,DAY*10,plain.seed);assert.deepEqual([lines,quitting],[[],[]]);
});

test('check 1: two mercs at cautious trust on one map for ten days lose nothing; check 2: a resented pair loses exactly five a day each, pro rata across rest, travel and exploration',()=>{
 const {w,s,mercs:[yakov,anya,misha,vera]}=world();pair(yakov,anya,10);
 settleMorale(w,s,DAY*10);assert.equal(happy(yakov),100);assert.equal(happy(anya),100);
 pair(yakov,anya,-50);for(const u of [misha,vera]){u.casualty='dead';u.hp=0;} // only the two of them on contract
 settleMorale(w,s,DAY);near(happy(yakov),95,'one day together');near(happy(anya),95);
 assert.ok(spendTime(w,'rest',8).ok);near(happy(yakov),95-5/3,'eight hours of rest: 1.67');
 gather(s);assert.ok(travel(w,'yard').ok);const y=currentMap(w);const [yk,an]=y.units;near(happy(yk),95-5/3-5*TRAVEL_MINUTES/DAY,'the hour on the road');
 const before=happy(yk);tickWorld(w,60000);near(happy(yk),before-5*(60/DAY),'one real-time minute of exploration is one clock minute');
});

test('check 7: a bonded partner present adds five a day and cancels an opposing one to net zero; a trusted one adds two; with no opposing partner present the merc recovers five a day, ten when its opposing partners are all elsewhere (decision 2)',()=>{
 const {w,s,mercs:[yakov,anya,misha,vera]}=world();pair(yakov,anya,-50);pair(yakov,misha,70);vera.casualty='dead';vera.hp=0;stamp(w,s);
 for(const u of [yakov,anya,misha])u.social.happiness=50;
 settleMorale(w,s,DAY);near(happy(yakov),50,'−5 Anya, +5 Misha, no tier bonus while Anya is present');near(happy(anya),45,'Anya has only the opposing Yakov here');near(happy(misha),50+5+5,'Misha: calm tier plus the bonded Yakov');
 pair(yakov,misha,30);stamp(w,s);for(const u of [yakov,anya,misha])u.social.happiness=50;settleMorale(w,s,DAY);near(happy(yakov),47,'trusted: +2');
 // Apart: Anya waits beyond the edge of the map she crossed to, so she counts as on the yard.
 for(const u of [yakov,anya,misha])u.social.happiness=50;anya.away={destination:'yard',side:'east',ap:0};
 settleMorale(w,s,DAY);near(happy(yakov),50+10+2,'all opposing partners elsewhere: the +10 tier, plus Misha');near(happy(anya),50+10,'the same from her side');near(happy(misha),50+5+2,'Misha has no opposing partner: the +5 tier, plus the trusted Yakov');
});

test('check 5: happiness never leaves 0..100 and the clock rollover does not double-settle: two chunks across midnight equal one',()=>{
 const a=world(),b=world();for(const {mercs:[y,an]} of [a,b])pair(y,an,-50);
 settleMorale(a.w,a.s,DAY*40);for(const u of a.mercs)assert.ok(happy(u)>=0&&happy(u)<=100);settleMorale(b.w,b.s,DAY*40);
 const c=world(),d=world();for(const {mercs:[y,an]} of [c,d])pair(y,an,-50);
 settleMorale(c.w,c.s,960);settleMorale(c.w,c.s,480); // 08:00 → 00:00 → 08:00
 settleMorale(d.w,d.s,1440);near(happy(c.mercs[0]),happy(d.mercs[0]),'one day in two chunks or one');near(happy(c.mercs[0]),99,'−5 for Anya, +2 each for the trusted Misha and Vera of the authored roster');
});

test('checks 3 and 4: exactly zero for a day, then the walk, never mid-contact, skills intact; a separation resets the clock; the partners feel the quit by rung',()=>{
 const {w,s,mercs:[yakov,anya,misha,vera]}=world();pair(yakov,anya,-90);pair(anya,vera,-90);pair(anya,misha,-90); // three opposing partners: −15 a day, nothing lifts it
 anya.social.happiness=0;anya.skills.marksmanship=7;
 settleMorale(w,s,0);assert.equal(anya.social.zeroSince,w.clock.minutes,'the stamp is taken at once');
 advanceTime(w,23*60);settleMorale(w,s,23*60);assert.equal(happy(anya),0);assert.equal(anya.quitPending,undefined);near(quitHoursLeft(anya,w.clock.minutes),1,'one hour left on the card');
 // Separated for the last hour: she crossed to the yard. Yakov, Misha and Vera stay; she recovers above zero and the timer resets.
 anya.away={destination:'yard',side:'east',ap:0};advanceTime(w,60);settleMorale(w,s,60);assert.ok(happy(anya)>0,'+10 a day apart: 0.42 in an hour');assert.equal(anya.social.zeroSince,null);assert.equal(quitHoursLeft(anya,w.clock.minutes),null);
 // Back together, at zero again, through a contact: she quits only when the contact ends.
 delete anya.away;anya.social.happiness=0;settleMorale(w,s,0);advanceTime(w,QUIT_HOURS*60);s.phase='player';settleMorale(w,s,QUIT_HOURS*60);
 assert.equal(anya.quitPending,true);assert.equal(anya.casualty,null,'not mid-contact');assert.ok(s.log.some(l=>/Anya has had enough of Yakov and Misha and Vera \(24 hours at zero\)\./.test(l)),s.log.slice(0,3).join(' | '));
 s.phase='explore';const before={yakov:happy(yakov),vera:happy(vera),misha:happy(misha)},stood={x:anya.x,y:anya.y};refresh(s);
 assert.equal(anya.casualty,'quit');assert.ok(!alive(anya));assert.ok(!onContract(anya));assert.equal(anya.skills.marksmanship,7,'skills intact');assert.equal(anya.hp,anya.maxHp,'she walked, she was not shot');
 assert.equal(occupant(s,stood.x,stood.y),undefined,'off the map');assert.equal(squad(s).length,3);assert.ok(s.log.some(l=>l==='Anya has quit the squad.'));
 assert.equal(happy(yakov),before.yakov,'at feud: nothing');assert.equal(happy(vera),before.vera);assert.equal(happy(misha),before.misha);
 // Her going lifts nobody and costs her friends: with Vera bonded to her the quit would have cost Vera 15.
 const {s:t,mercs:[y2,a2,m2,v2]}=world();pair(a2,v2,80);pair(a2,m2,30);quitMerc(t,a2);assert.equal(happy(v2),100-PARTNER_QUIT.bonded);assert.equal(happy(m2),100-PARTNER_QUIT.trusted);assert.equal(happy(y2),100);
});

test('check 8: a bonded partner\'s death costs 75 happiness and 25 stress at once; a feud partner\'s death costs nothing and relieves 10 stress; cautious 10 stress, strained 5',()=>{
 const {s,mercs:[yakov,anya,misha,vera]}=world();pair(vera,misha,80);pair(anya,misha,-90);pair(yakov,misha,10);for(const u of [yakov,anya,vera])u.social.stress=30;
 const lines=partnerLost(s.units,misha,'dead');
 assert.equal(happy(vera),25);assert.equal(vera.social.stress,55);assert.ok(lines.includes('Vera has not spoken since Misha died.'));
 assert.equal(happy(anya),100);assert.equal(anya.social.stress,20);assert.ok(lines.includes('Anya will not mourn Misha.'));
 assert.equal(happy(yakov),100);assert.equal(yakov.social.stress,40,'cautious trust: stress only');
 const {s:t,mercs:[y2,a2,m2]}=world();pair(y2,m2,-20);y2.social.stress=30;partnerLost(t.units,m2,'dead');assert.equal(y2.social.stress,35,'strained: five');
 assert.deepEqual(Object.keys(PARTNER_DEATH),['bonded','trusted','cautious trust','strained','resented','feud']);
});

test('check 9: a bonded partner killed by a squadmate raises the survivor\'s grudge at 2x and drops its bond toward the killer a further 40; trusted 1.5x and 20',()=>{
 const {s,mercs:[yakov,anya,misha,vera]}=world();pair(vera,misha,80);pair(yakov,misha,30);vera.social.bonds.Anya=10;yakov.social.bonds.Anya=10;
 const lines=partnerLost(s.units,misha,'dead',anya);
 assert.equal(vera.social.incidents.Anya.grudge,GRUDGE_STEP*2);assert.equal(vera.social.bonds.Anya,10-KILLER_BOND.bonded);assert.ok(lines.includes('Vera holds Anya responsible for Misha.'));
 assert.equal(yakov.social.incidents.Anya.grudge,GRUDGE_STEP*1.5);assert.equal(yakov.social.bonds.Anya,10-KILLER_BOND.trusted);
 assert.equal(anya.social.incidents.Anya,undefined,'the killer holds no grudge against herself');
});

test('in play: a merc bleeding out at the end of a turn grieves her partners through the engine; a comrade left behind on a crossed map counts as captured or dead for the others',()=>{
 {const m=blankMap();m.starts=[{x:14,y:30,z:0},{x:15,y:30,z:0},{x:15,y:31,z:0},{x:14,y:31,z:0}];m.guards=[{x:40,y:30,heading:180,species:'donkey',weapon:'rifle'}];
  const s=createGame(1,m,false,'standard',{social:true});for(const p of s.units)p.lastAt=p.x+','+p.y+','+(p.z||0);refresh(s);const [yakov,anya,misha,vera]=s.units;
  pair(vera,yakov,80);pair(anya,yakov,-90);yakov.hp=0;yakov.casualty='bleeding';yakov.bleedTurns=1;s.phase='player';s.queue=[];
  assert.ok(endTurn(s));assert.equal(yakov.casualty,'dead');
  assert.equal(happy(vera),100-PARTNER_DEATH.bonded.happiness);assert.equal(vera.social.stress>=PARTNER_DEATH.bonded.stress,true);assert.equal(happy(anya),100);assert.ok(s.log.some(l=>l==='Vera has not spoken since Yakov died.'));
  // Left behind: Misha stabilized, Anya bleeding, the others cross. Misha is captured, Anya dies; Vera (bonded to Misha, trusted with Anya) pays 20 and 35.
  misha.hp=0;misha.casualty='stable';anya.hp=0;anya.casualty='bleeding';pair(vera,misha,80);pair(vera,anya,30);vera.social.happiness=100;
  const left=abandonCasualties(s);assert.equal(left.length,2);assert.equal(misha.casualty,'captured');assert.equal(anya.casualty,'dead');
  assert.equal(happy(vera),100-PARTNER_CAPTURED.bonded-PARTNER_DEATH.trusted.happiness);}
 // A plain game: the same bleed-out changes no partner's stress (the meter and the events are campaign-only).
 {const m=blankMap();m.starts=[{x:14,y:30,z:0},{x:15,y:30,z:0},{x:15,y:31,z:0},{x:14,y:31,z:0}];m.guards=[{x:40,y:30,heading:180,species:'donkey',weapon:'rifle'}];const s=createGame(1,m,false);const [yakov,,,vera]=s.units;vera.social.bonds.Yakov=80;yakov.hp=0;yakov.casualty='bleeding';yakov.bleedTurns=1;s.phase='player';assert.ok(endTurn(s));assert.equal(yakov.casualty,'dead');assert.equal(vera.social.stress,0);assert.equal(vera.social.happiness,undefined);}
});

test('the medic\'s relief and the clean win: stabilizing a bonded partner lifts the medic five; a contact won with nobody down lifts everyone five, one with a casualty lifts nobody',()=>{
 const {s,mercs:[yakov,anya,misha,vera]}=world();pair(vera,misha,80);vera.social.happiness=50;misha.social.happiness=50;
 assert.equal(stabilizedPartner(vera,misha),STABILIZED_RELIEF.bonded);assert.equal(happy(vera),55);assert.equal(happy(misha),50,'the patient\'s gain is the bond, not the meter');
 for(const u of [yakov,anya,misha,vera])u.social.happiness=50;s.fight={casualty:false};s.phase='player';s.units.forEach(u=>{});refresh(s); // no guards: the map is won, the fight ends clean
 for(const u of [yakov,anya,misha,vera])assert.equal(happy(u),55,u.name);assert.equal(s.fight,null);assert.ok(s.log.some(l=>/clean fight/.test(l)));
 for(const u of [yakov,anya,misha,vera])u.social.happiness=50;s.fight={casualty:true};s.phase='player';refresh(s);for(const u of [yakov,anya,misha,vera])assert.equal(happy(u),50,'a casualty: no lift');
 assert.equal(cleanWin([]),0);
});

test('a partner\'s rung crossing upward lifts the meter five, once per crossing; the rescue hook pays 15 / 5 (no rescue facility calls it yet)',()=>{
 const {w,s,mercs:[yakov,anya,misha,vera]}=world();for(const u of [yakov,anya,misha,vera])u.social.happiness=50;
 yakov.social.rungSeen.Anya=rungMemory(4,w.clock.minutes);pair(yakov,anya,-40);settleMorale(w,s,0);pair(yakov,anya,-30); // the pair starts life resented; resented → strained is new ground
 settleMorale(w,s,0);assert.equal(happy(yakov),55);assert.ok(s.log.some(l=>l==='Yakov is glad of Anya: strained.'));
 settleMorale(w,s,0);assert.equal(happy(yakov),55,'once');pair(yakov,anya,-60);settleMorale(w,s,0);assert.equal(happy(yakov),55,'downward crossings cost nothing here (the events do that)');
 pair(vera,misha,80);pair(anya,misha,30);misha.casualty='captured';misha.hp=0;vera.social.happiness=50;anya.social.happiness=50;
 partnerRescued(s.units,misha);assert.equal(happy(vera),50+15);assert.equal(happy(anya),50+5);
});

test('review round 1: a quitter has no body after travel; escaped crossers grieve a lost map; no quit while guards are alerted; a lifted meter cancels the walk; a map change ends the contact; the engine marks casualties; the medic\'s relief through stabilize',()=>{
 // (1) travel after a quit: Anya is a record at (-1,-1) on the next map, no occupant anywhere, and the previous map's contact is closed.
 {const {w,s,mercs:[yakov,anya]}=world();quitMerc(s,anya);assert.deepEqual([anya.x,anya.y],[-1,-1]);s.fight={casualty:true};gather(s);assert.ok(travel(w,'yard').ok);const y=currentMap(w);const a2=y.units.find(u=>u.name==='Anya');
  assert.equal(a2.casualty,'quit');assert.deepEqual([a2.x,a2.y],[-1,-1],'never placed on a landing tile');assert.ok(!alive(a2));assert.equal(y.fight,null);assert.equal(s.fight,null);assert.equal(y.units.filter(u=>u.team==='squad'&&alive(u)).length,3);}
 // (2) a partial defeat: Yakov crossed east and waits beyond the edge; the three left behind fall; he grieves Vera (bonded) and Misha (trusted) from the yard side.
 {const {s,mercs:[yakov,anya,misha,vera]}=world();pair(yakov,vera,80);pair(yakov,misha,30);pair(yakov,anya,-90);yakov.away={destination:'yard',side:'east',ap:0};
  for(const u of [anya,misha,vera]){u.hp=0;u.casualty='bleeding';}refresh(s);assert.equal(s.phase,'lost');assert.deepEqual([anya.casualty,misha.casualty,vera.casualty],['dead','dead','dead']);
  assert.equal(happy(yakov),0,'Vera and Misha at the rung in force: 75 and 35 exhaust the meter');assert.equal(yakov.social.stress,40,'Anya fell first: her feud relief landed on an empty meter, then Misha 15 and Vera 25');assert.ok(s.log.some(l=>l==='Yakov has not spoken since Vera died.'));}
 // (3) alerted guards closing in real time are still the contact: no quit until the alert is over.
 {const {w,s,mercs:[yakov,anya]}=world();pair(yakov,anya,-100);anya.social.happiness=0;stamp(w,s);advanceTime(w,QUIT_HOURS*60);s.alerted=new Set([9]);settleMorale(w,s,QUIT_HOURS*60);
  assert.equal(anya.quitPending,true);assert.equal(anya.casualty,null,'guards alerted: not yet');s.alerted=new Set();settleMorale(w,s,0);assert.equal(anya.casualty,'quit','the alert is over');}
 // (4) the decision to walk goes with the timer: a meter lifted before the contact ends is no longer quitting.
 {const {w,s,mercs:[yakov,anya]}=world();pair(yakov,anya,-100);anya.social.happiness=0;stamp(w,s);advanceTime(w,QUIT_HOURS*60);s.phase='player';settleMorale(w,s,QUIT_HOURS*60);assert.equal(anya.quitPending,true);
  anya.social.happiness=40;settleMorale(w,s,0);assert.equal(anya.quitPending,false);assert.equal(anya.social.zeroSince,null);s.phase='explore';refresh(s);assert.equal(anya.casualty,null,'she stays');}
 // (5) the engine marks a casualty: a contact that cost a bleed-out pays no clean win; and −15 a day with three opposing partners; a liked partner elsewhere adds nothing.
 {const m=blankMap();m.starts=[{x:14,y:30,z:0},{x:15,y:30,z:0},{x:15,y:31,z:0},{x:14,y:31,z:0}];m.guards=[{x:24,y:30,heading:180,species:'donkey',weapon:'rifle'}];
  const s=createGame(1,m,false,'standard',{social:true});for(const p of s.units)p.lastAt=p.x+','+p.y+','+(p.z||0);refresh(s);const [yakov,anya,misha,vera]=s.units,g=s.units[4];
  assert.equal(s.phase,'player','the guard sees them: contact');assert.deepEqual(s.fight,{casualty:false});
  // A hit that puts a merc down marks the contact through combatDamage itself, not only the bleed-out (reviewer M35).
  {const m2=blankMap();m2.starts=m.starts;m2.guards=[{x:24,y:30,heading:180,species:'donkey',weapon:'rifle'}];const s2=createGame(1,m2,false,'standard',{social:true});for(const p of s2.units)p.lastAt=p.x+','+p.y+','+(p.z||0);refresh(s2);const y2=s2.units[0],g2=s2.units[4];
   assert.deepEqual(s2.fight,{casualty:false});y2.hp=1;y2.x=17;y2.lastAt='17,30,0';g2.accuracy=1000;s2.phase='enemy';let shot=false;for(let i=0;i<8&&!shot;i++){shot=attack(s2,g2,y2,false,true)&&y2.hp===0;g2.ap=g2.maxAp;}assert.ok(shot,'the rifle found him');assert.equal(y2.casualty,'bleeding');assert.equal(s2.fight.casualty,true,'down is a casualty for the clean win, stabilized or not');}for(const u of [yakov,anya,misha,vera]){u.social.happiness=50;for(const p of [yakov,anya,misha,vera])if(p!==u)u.social.bonds[p.name]=10;}
  yakov.hp=0;yakov.casualty='bleeding';yakov.bleedTurns=1;s.queue=[];assert.ok(endTurn(s));assert.equal(yakov.casualty,'dead');assert.equal(s.fight.casualty,true);
  g.hp=0;refresh(s);assert.equal(s.phase,'won');assert.equal(s.fight,null);for(const u of [anya,misha,vera])assert.equal(happy(u),50,'a bleed-out is a casualty: no lift (cautious partners pay stress, not happiness)');}
 {const {w,s,mercs:[yakov,anya,misha,vera]}=world();pair(anya,yakov,-90);pair(anya,misha,-90);pair(anya,vera,-90);stamp(w,s);anya.social.happiness=50;settleMorale(w,s,DAY);near(happy(anya),35,'three opposing partners: fifteen a day');
  pair(anya,yakov,-90);pair(anya,misha,80);stamp(w,s);anya.social.happiness=50;misha.away={destination:'yard',side:'east',ap:0};settleMorale(w,s,DAY);near(happy(anya),50-5-5,'Yakov and Vera here, the bonded Misha elsewhere adds nothing');}
 // (6) stabilize() itself pays the medic's relief; the literal numbers the tables promise.
 {const {s,mercs:[yakov,anya,misha,vera]}=world();pair(vera,misha,80);vera.social.happiness=50;misha.hp=0;misha.casualty='bleeding';misha.bleedTurns=6;vera.x=misha.x+1;vera.y=misha.y;vera.medical=100;vera.medkits=1;s.phase='explore';
  assert.ok(stabilize(s,vera,misha),'adjacent, a kit, the skill');assert.equal(happy(vera),55);}
 {const {s,mercs:[yakov,anya,misha,vera]}=world();pair(vera,misha,30);pair(yakov,misha,80);vera.social.bonds.Anya=10;yakov.social.bonds.Anya=10;partnerLost(s.units,misha,'dead',anya);
  assert.equal(happy(vera),65,'trusted death: 35');assert.equal(vera.social.bonds.Anya,10-20,'trusted: the killer costs 20');assert.equal(yakov.social.bonds.Anya,10-40);}
 {const {s,mercs:[yakov,anya,misha,vera]}=world();pair(vera,misha,80);pair(yakov,misha,30);partnerLost(s.units,misha,'captured');assert.equal(happy(vera),80);assert.equal(happy(yakov),90);
  pair(vera,anya,80);quitMerc(s,anya);assert.equal(happy(vera),80-15);}
 // (7) the killer never grieves against itself even when bonded to the victim; a quitter is not converted by a total defeat; the best rung seen is paid once.
 {const {s,mercs:[yakov,anya,misha,vera]}=world();pair(anya,misha,80);partnerLost(s.units,misha,'dead',anya);assert.equal(anya.social.incidents.Anya,undefined);assert.equal(happy(anya),25,'she grieves him all the same');}
 {const {s,mercs:[yakov,anya,misha,vera]}=world();quitMerc(s,anya);for(const u of [yakov,misha,vera]){u.hp=0;u.casualty='bleeding';}refresh(s);assert.equal(s.phase,'lost');assert.equal(anya.casualty,'quit');}
 {const {w,s,mercs:[yakov,anya]}=world();for(const u of s.units.slice(0,4))u.social.happiness=50;yakov.social.rungSeen.Anya=rungMemory(4,w.clock.minutes);pair(yakov,anya,-36);stamp(w,s);pair(yakov,anya,-30);settleMorale(w,s,0);assert.equal(happy(yakov),55);
  pair(yakov,anya,-40);settleMorale(w,s,0);pair(yakov,anya,-30);settleMorale(w,s,0);assert.equal(happy(yakov),55,'a wobble across the same boundary pays nothing');pair(yakov,anya,0);settleMorale(w,s,0);assert.equal(happy(yakov),60,'a new best rung pays');
  // Reconciliation: a real fall (a day or more at the lower rung) followed by the climb back pays again, though the rung is not new ground. The clock
  // runs three days first, so the fall's own stamp (not the memory's birth) is what the day is measured from (reviewer M71).
  advanceTime(w,3*DAY);settleMorale(w,s,3*DAY);yakov.social.happiness=50;pair(yakov,anya,-40);settleMorale(w,s,0);advanceTime(w,RECONCILE_MINUTES-1);settleMorale(w,s,RECONCILE_MINUTES-1);yakov.social.happiness=50;pair(yakov,anya,0);settleMorale(w,s,0);assert.equal(happy(yakov),50,'a minute short of a day: still a wobble');
  pair(yakov,anya,-40);settleMorale(w,s,0);advanceTime(w,RECONCILE_MINUTES);settleMorale(w,s,RECONCILE_MINUTES);yakov.social.happiness=50;pair(yakov,anya,0);settleMorale(w,s,0);assert.equal(happy(yakov),55,'a day at feud, then cautious trust again: reconciliation pays');}
 // The whole squad walking out is named, and the run is lost as with any empty roster.
 {const {s,mercs}=world();for(const u of mercs)quitMerc(s,u);refresh(s);assert.equal(s.phase,'lost');assert.ok(s.log.some(l=>l==='The squad has walked out.'));assert.ok(!s.log.some(l=>/0 captured \/ 0 dead/.test(l)));}
});

test('ai-65 falsifier: a hand-over that lifts a bond across a rung pays once, and the same-day rest drift dropping it back and the next hand-over lifting it again pay nothing; a day later the climb pays again',()=>{
 const {w,s,mercs:[yakov,anya]}=world();anya.social.bonds.Yakov=22;stamp(w,s);anya.social.happiness=50; // cautious trust, two short of trusted; the authored resting level is +5
 helped(anya,yakov);assert.ok(anya.social.bonds.Yakov>=25,'stabilized by Yakov: +20 crosses into trusted');settleMorale(w,s,0);assert.equal(happy(anya),55,'new ground for the pair');
 anya.social.bonds.Yakov=20;settleMorale(w,s,0);assert.equal(happy(anya),55,'drift back below the line the same day: nothing');
 helped(anya,yakov);settleMorale(w,s,0);assert.equal(happy(anya),55,'and the same-day climb back pays nothing: a wobble');
 anya.social.bonds.Yakov=20;settleMorale(w,s,0);advanceTime(w,DAY);settleMorale(w,s,DAY);anya.social.happiness=50;helped(anya,yakov);settleMorale(w,s,0);assert.equal(happy(anya),55,'a day at cautious trust, then trusted again: reconciliation');
});

test('downtime rest settles the meter beside the bond drift, and the card shows the hours left when a merc is about to quit',()=>{
 const {w,s,mercs:[yakov,anya,misha,vera]}=world();pair(yakov,anya,-100);pair(yakov,misha,10);pair(yakov,vera,10);stamp(w,s);yakov.social.happiness=2; // no trusted partner to soften it; a feud deep enough that two days of rest drift (toward the authored +5) leave it opposing
 assert.ok(spendTime(w,'rest',24).ok);assert.equal(happy(yakov),0,'2 − 5');assert.equal(yakov.social.zeroSince,w.clock.minutes);near(quitHoursLeft(yakov,w.clock.minutes),QUIT_HOURS);
 assert.ok(spendTime(w,'rest',24).ok);assert.equal(yakov.casualty,'quit','a calm map: he walks at the end of the rest');
 assert.ok(s.log.some(l=>/Yakov has had enough of Anya/.test(l)));
});
