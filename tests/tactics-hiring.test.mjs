import test from 'node:test';import assert from 'node:assert/strict';
import {createWorld,currentMap,travel,hire,renew,release,candidates,hiringReason,hiringDay,settleContracts,enlist,contracted,tickWorld,spendTime,advanceTime,renewReason} from '../dist/tactics/world.js';
import {createGame,unit,roster,squad,guards,alive,refresh,move,stepMovement,moveGroup,canControl,WEAPONS,DEFAULT_CAST,combatCosts} from '../dist/tactics/engine.js';
import {rateFor,pricesFor,build,slate,compatibility,fit,previewRecruit,describeKit,portraitCrop,contractMinutesLeft,contractPrices,payDay,KITS,RECRUIT_NAMES,RECRUIT_SPECIES,SLATE,ROSTER_MAX,TERMS,COMMITMENT,MERC_ID_BASE,DAY_MINUTES,SURCHARGE,BASE_LOW,BASE_HIGH,skillsFor,levelFor,kitFor} from '../dist/tactics/recruits.js';
import {bond,NAMES,liked,opposing,ARCHETYPES} from '../dist/tactics/archetypes.js';
import {PERSONALITIES,personalityDescription,friendlyReaction} from '../dist/tactics/personalities.js';
import {unitArt} from '../dist/tactics/red-hats-art.js';
import {blankMap,W,levelOf} from '../dist/tactics/maps.js';
import {hasMeter} from '../dist/tactics/happiness.js';
import {BASE} from '../dist/tactics/progression.js';

// ECONOMY.md, "Mercenary contracts". A campaign on a blank, already-won factory with a blank yard beside it; roster seed 7.
const GUARD_NAMES=['Boris','Lev','Grigori','Oleg','Pavel','Igor','Anton','Vadim','Yuri','Sasha','Pyotr','Nikolai'];
function campaign({money=100000,yard=blankMap('Yard'),seed=7}={}){const w=createWorld(blankMap('Factory'),'standard',seed);w.definitions.yard=yard;w.money=money;return {w,s:currentMap(w)};}
const gather=s=>{const e=s.definition.exits[0];squad(s).forEach((u,i)=>{u.x=e.x+(i%3);u.y=e.y+Math.floor(i/3);u.lastAt=u.x+','+u.y+',0';});refresh(s);};
const near=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);

test('the daily rate runs $100 to $10,000 on a clean monotone ladder; a week is about five days of it and a month about twelve, shifted by the archetype\'s commitment',()=>{
 assert.equal(rateFor(0),100);assert.equal(rateFor(1),10000);assert.equal(rateFor(.5),1000);assert.equal(rateFor(-1),100);assert.equal(rateFor(2),10000);
 let last=0;for(let i=0;i<=100;i++){const r=rateFor(i/100);assert.ok(r>=last,'monotone at '+i);assert.equal(r%(r<1000?10:r<10000?100:1000),0,'clean at '+r);last=r;}
 assert.deepEqual([pricesFor(1000,'Sage').week.price,pricesFor(1000,'Sage').month.price],[5000,12000],'no commitment: five days and twelve');
 assert.deepEqual([pricesFor(1000,'Ruler').week.price,pricesFor(1000,'Ruler').month.price],[4500,11000],'a Ruler discounts the long contract');
 assert.deepEqual([pricesFor(1000,'Rebel').week.price,pricesFor(1000,'Rebel').month.price],[5500,13000],'a Rebel charges for it');
 for(const a of NAMES){const p=pricesFor(1000,a);assert.ok(p.week.price>=4500&&p.week.price<=5500,a+' week');assert.ok(p.month.price>=11000&&p.month.price<=13000,a+' month');assert.equal(p.day.price,1000);assert.equal(p.week.minutes,7*DAY_MINUTES);assert.equal(p.month.minutes,30*DAY_MINUTES);}
 assert.equal(Object.keys(COMMITMENT).length,12);
});

test('a day\'s slate is six candidates with distinct names outside the roster and the guard list, grades spread from cheap to dear, the same for the same seed and day and different otherwise',()=>{
 const a=slate(7,0);assert.equal(a.length,SLATE);assert.equal(new Set(a.map(c=>c.name)).size,SLATE);
 for(const c of a){assert.ok(RECRUIT_NAMES.includes(c.name));assert.ok(!Object.keys(PERSONALITIES).includes(c.name)&&!GUARD_NAMES.includes(c.name),c.name);assert.ok(RECRUIT_SPECIES.includes(c.species));assert.ok(ARCHETYPES[c.archetype]);}
 a.forEach((c,i)=>{assert.ok(c.grade>=i/SLATE&&c.grade<(i+1)/SLATE,'slot '+i+' draws inside its band: '+c.grade);assert.equal(c.key,'0:'+i);});
 assert.deepEqual(slate(7,0),a,'reproducible');
 assert.notDeepEqual(slate(7,1).map(c=>[c.name,c.grade]),a.map(c=>[c.name,c.grade]),'tomorrow is another slate');
 assert.notDeepEqual(slate(8,0).map(c=>[c.name,c.grade]),a.map(c=>[c.name,c.grade]),'another campaign is another slate');
 const taken=new Set([a[0].name,a[1].name]),b=slate(7,0,{taken});assert.ok(!taken.has(b[0].name)&&!taken.has(b[1].name),'a taken name walks forward');assert.equal(new Set(b.map(c=>c.name)).size,SLATE);assert.equal(b[0].grade,a[0].grade,'only the name moved');
 for(const c of RECRUIT_NAMES)assert.ok(!GUARD_NAMES.includes(c)&&!PERSONALITIES[c],c);
});

test('the grade buys everything, monotonically: the $100 hand is a knife and the clothes, the $10,000 veteran arrives at level 10 armed for a war; the comrades\' base sits in the middle',()=>{
 const dud=build({name:'Dud',species:'horse',archetype:'Innocent',grade:0}),ace=build({name:'Ace',species:'horse',archetype:'Hero',grade:1});
 assert.deepEqual(dud.base,BASE_LOW);assert.equal(dud.level,1);assert.deepEqual(Object.values(dud.skills),[0,0,0,0,0]);assert.deepEqual([dud.kit.weapon,dud.kit.slots,dud.kit.medkits,dud.kit.cutters],['knife',['knife',null],0,false]);assert.equal(dud.rate,100);
 const d=previewRecruit(dud,WEAPONS);assert.equal(d.maxHp,70,'60 base and the horse\'s 10');assert.equal(d.maxAp,9);assert.equal(d.accuracy,55);assert.equal(describeKit(dud,WEAPONS),'NR-40 knife');
 assert.deepEqual(ace.base,BASE_HIGH);assert.equal(ace.level,10);assert.equal(Object.values(ace.skills).reduce((n,v)=>n+v,0),27,'every point of nine levels spent');assert.deepEqual([ace.kit.weapon,ace.kit.slots,ace.kit.extra,ace.kit.medkits,ace.kit.cutters],['sniper',['sniper','assault'],['grenade'],3,true]);assert.equal(ace.rate,10000);
 const e=previewRecruit(ace,WEAPONS);assert.equal(e.maxHp,160+10+ace.skills.vitality*5);assert.equal(e.accuracy,115+ace.skills.shooting*2);assert.ok(e.maxAp>=16);assert.match(describeKit(ace,WEAPONS),/Sniper rifle \(5 loaded, 15 reserve\), AK-47 \(30 loaded, 90 reserve\), Fragmentation grenade.*3 medkits, wire cutters/);
 let prev=null;for(let g=0;g<=1.0001;g+=.1){const c=build({name:'X',species:'sheep',archetype:'Everyman',grade:g}),p=previewRecruit(c,WEAPONS),k=KITS.indexOf(c.kit);
  if(prev){for(const key of ['maxHp','maxAp','accuracy','medical','stealth'])assert.ok(p[key]>=prev.p[key],key+' at '+g.toFixed(1));assert.ok(c.level>=prev.c.level);assert.ok(k>=prev.k);assert.ok(c.rate>=prev.c.rate);}prev={c,p,k};}
 assert.equal(levelFor(.45),5);assert.equal(rateFor(.45),790,'the comrades (100 HP, 12 AP, 85 accuracy) are worth about $800 a day');
 for(const a of NAMES){const sk=skillsFor(1,a,'goat');for(const v of Object.values(sk))assert.ok(v<=20&&v>=0);assert.ok(BASE_HIGH.medical+sk.medical*5<=100,a+' medical cap');assert.ok(BASE_HIGH.stealth+5+sk.stealth*5<=100,a+' stealth cap');}
 assert.equal(kitFor(.149).weapon,'knife');assert.equal(kitFor(.15).weapon,'pistol');assert.equal(kitFor(.9).extra[0],'grenade');
});

test('who they get on with reads the archetype matrix: works well with is liked both ways, does not work with is opposing either way; the fit labels follow the lower direction and an opposing comrade adds the surcharge',()=>{
 const r=compatibility('Rebel');assert.deepEqual(r.works,['Hero','Explorer','Magician']);assert.deepEqual(r.clashes,['Everyman','Caregiver','Ruler']);
 for(const a of NAMES){const c=compatibility(a);for(const t of c.works)assert.ok(liked(bond(a,t))&&liked(bond(t,a)));for(const t of c.clashes)assert.ok(opposing(bond(a,t))||opposing(bond(t,a)));assert.ok(!c.works.includes(a)&&!c.clashes.includes(a));
  for(const t of NAMES.filter(t=>t!==a)){const inWorks=liked(bond(a,t))&&liked(bond(t,a)),inClash=opposing(bond(a,t))||opposing(bond(t,a));assert.equal(c.works.includes(t),inWorks,a+'/'+t);assert.equal(c.clashes.includes(t),inClash,a+'/'+t);}}
 const squadOf=[{name:'Yakov',archetype:'Ruler'},{name:'Anya',archetype:'Rebel'},{name:'Misha',archetype:'Creator'},{name:'Vera',archetype:'Caregiver'}];
 const f=fit('Rebel',squadOf);assert.deepEqual(f.rows.map(r=>r.label),['would clash with Yakov','would take time with Anya','would grate on Misha','would clash with Vera']);assert.deepEqual(f.trouble,['Yakov','Vera']);assert.equal(f.surcharge,SURCHARGE);
 const g=fit('Sage',[{name:'Misha',archetype:'Creator'}]);assert.deepEqual(g.rows.map(r=>r.label),['would get on with Misha']);assert.equal(g.surcharge,1);assert.deepEqual(g.trouble,[]);
 assert.deepEqual(fit('Hero',[]).rows,[]);
});

test('hiring is gated like rest, priced by the term, debits the treasury exactly, spawns beside the selected comrade with a campaign id, and wires the ledger both ways',()=>{
 const guarded=blankMap('Factory');guarded.guards=[{x:200,y:200,z:0,species:'cow',weapon:'pistol'}];const g=createWorld(guarded,'standard',7);g.money=1e6;
 assert.equal(hiringReason(g),'Clear this map before hiring.');assert.equal(hire(g,candidates(g)[0].key,'day').ok,false);
 const {w,s}=campaign({money:0});assert.equal(hiringReason(w),'');const list=candidates(w);assert.equal(list.length,SLATE);
 const c=list[3],broke=hire(w,c.key,'week');assert.equal(broke.ok,false);assert.match(broke.error,/^Need \$[\d,]+; the treasury holds \$0\./);assert.equal(roster(s).length,4);
 w.money=c.prices.week.price;const r=hire(w,c.key,'week');assert.ok(r.ok,r.error);assert.equal(w.money,0,'the week\'s price, to the dollar');assert.equal(r.price,c.prices.week.price);
 const u=r.unit;assert.equal(u.id,MERC_ID_BASE);assert.equal(unit(s,MERC_ID_BASE),u);assert.equal(roster(s).length,5);assert.equal(contracted(s).length,5);assert.ok(canControl(s,u));assert.ok(alive(u));
 const yakov=unit(s,s.selected);assert.ok(near(u,yakov)<=2,'beside the selected comrade');assert.ok(!s.units.some(v=>v!==u&&alive(v)&&v.x===u.x&&v.y===u.y),'on free ground');
 assert.equal(u.name,c.name);assert.equal(u.archetype,c.archetype);assert.equal(u.level,c.level);assert.equal(u.hp,u.maxHp);assert.equal(u.weapon,c.kit.weapon);assert.equal(u.medkits,c.kit.medkits);
 for(const m of s.units.slice(0,4)){assert.equal(u.social.bonds[m.name],bond(c.archetype,m.archetype),'its regard for '+m.name);assert.equal(u.social.resting[m.name],bond(c.archetype,m.archetype));assert.equal(m.social.bonds[u.name],bond(m.archetype,c.archetype),m.name+'\'s regard for it');assert.equal(m.social.resting[u.name],bond(m.archetype,c.archetype));}
 assert.ok(hasMeter(u));assert.equal(u.social.happiness,100);assert.deepEqual(u.contract,{term:'week',from:480,until:480+7*DAY_MINUTES,paid:c.prices.week.price,renewals:0,expired:false});assert.equal(u.hired.rate,c.rate);
 assert.ok(!candidates(w).some(x=>x.key===c.key),'signed: off the slate');assert.equal(hire(w,c.key,'day').error,'That candidate has moved on.');assert.match(s.log[0],/signed on for a week at \$/);
 assert.equal(hire(w,candidates(w)[0].key,'fortnight').error,'Choose a day, a week or a month.');
 w.money=1e7;let n=5;for(const x of candidates(w)){if(n>=ROSTER_MAX)break;assert.ok(hire(w,x.key,'day').ok);n++;}assert.equal(contracted(s).length,ROSTER_MAX);
 assert.equal(hire(w,candidates(w)[0].key,'day').error,'The roster holds '+ROSTER_MAX+'.');assert.equal(new Set(roster(s).map(u=>u.id)).size,roster(s).length,'ids unique');assert.equal(new Set(roster(s).map(u=>u.name)).size,roster(s).length,'names unique');
});

test('a candidate who expects trouble with a comrade asks 20% more and the log says so',()=>{
 const {w,s}=campaign();const t=candidates(w).find(c=>c.fit.trouble.length),ok=candidates(w).find(c=>!c.fit.trouble.length);
 assert.ok(t&&ok,'the seed-7 slate has both kinds');assert.equal(t.rate,Math.round(rateFor(t.grade)*SURCHARGE));assert.equal(ok.rate,rateFor(ok.grade));
 assert.ok(hire(w,t.key,'day').ok);assert.match(s.log[0],new RegExp('asked more: expects trouble with '+t.fit.trouble.join(' and ')));
 assert.ok(hire(w,ok.key,'day').ok);assert.doesNotMatch(s.log[0],/asked more/);
});

test('a contract runs on the campaign clock: up at its minute, the merc walks on a calm map with the contract line; renewal extends from the end and pays the meter; pay-off is immediate and unrefunded',()=>{
 const {w,s}=campaign();const c=candidates(w)[1];assert.ok(hire(w,c.key,'day').ok);const u=unit(s,MERC_ID_BASE),paid=w.money;
 assert.equal(contractMinutesLeft(u,w.clock.minutes),DAY_MINUTES);
 advanceTime(w,DAY_MINUTES-1);settleContracts(w,s);assert.ok(alive(u));assert.equal(u.contract.expired,false);assert.equal(contractMinutesLeft(u,w.clock.minutes),1);
 tickWorld(w,60000);assert.equal(u.contract.expired,true);assert.equal(u.casualty,'quit');assert.equal(u.contract.ended,'contract');assert.ok(!alive(u));assert.equal(u.x,-1);
 assert.ok(s.log.some(l=>l===u.name+"'s contract has ended: "+u.name+' has left the squad.'),s.log.slice(0,4).join(' | '));assert.ok(s.log.some(l=>l===u.name+"'s contract is up."));
 assert.equal(contracted(s).length,4);assert.equal(roster(s).length,5,'gone, but on the roster record');assert.equal(renewReason(w,u),'No such contract.');
 // Renewal before the end extends from the end, not from now, and lifts the meter (pay day, GUARDS.md G5).
 const d=candidates(w)[2];assert.ok(hire(w,d.key,'week').ok);const v=unit(s,MERC_ID_BASE+1),until=v.contract.until;v.social.happiness=50;
 advanceTime(w,600);const before=w.money;assert.ok(renew(w,v.id,'day').ok);assert.equal(v.contract.until,until+DAY_MINUTES,'from the contract\'s end');assert.equal(v.contract.renewals,1);assert.equal(v.contract.term,'day');
 assert.equal(before-w.money,contractPrices(v).day.price);assert.equal(contractPrices(v).day.price,v.hired.rate);assert.equal(v.social.happiness,60);assert.equal(v.contract.paid,d.prices.week.price+v.hired.rate);
 w.money=0;assert.match(renew(w,v.id,'month').error,/^Need \$/);assert.equal(v.contract.until,until+DAY_MINUTES);
 // Paid off: gone at once, nothing back.
 w.money=1234;assert.ok(release(w,v.id).ok);assert.equal(w.money,1234);assert.equal(v.casualty,'quit');assert.equal(v.contract.ended,'released');assert.ok(s.log.some(l=>l===v.name+' was paid off and left the squad.'));
 assert.equal(release(w,v.id).error,'No such contract.');assert.equal(release(w,0).error,'No such contract.','a comrade has no contract to end');
 assert.equal(payDay({}),0);assert.equal(payDay({social:{happiness:95}}),5);
});

test('a contract that runs out in a fight ends with the contact: the merc keeps fighting until the map is quiet, renewal waits for the fight, then it walks',()=>{
 const yard=blankMap('Yard');yard.guards=[{x:9,y:5,z:0,species:'horse',weapon:'pistol'}];const {w,s}=campaign({yard});
 assert.ok(hire(w,candidates(w)[0].key,'day').ok);const id=MERC_ID_BASE;gather(s);assert.ok(travel(w,'yard').ok);const y=currentMap(w),u=unit(y,id);
 assert.equal(y.phase,'player','the horse guard beside the starts sees the squad: contact');assert.ok(alive(u));assert.ok(combatCosts(y));
 tickWorld(w,DAY_MINUTES*60*1000);assert.equal(u.contract.expired,true,'up');assert.ok(alive(u),'but not walking mid-fight');assert.ok(y.log.some(l=>l===u.name+"'s contract is up."));
 assert.equal(renew(w,id,'day').error,'Finish the fight first.');assert.equal(release(w,id).error,'Finish the fight first.');
 guards(y)[0].hp=0;refresh(y);assert.equal(y.phase,'won');assert.equal(u.casualty,'quit');assert.equal(u.contract.ended,'contract');assert.ok(y.log.some(l=>l.includes(u.name+"'s contract has ended")));
});

test('a hired merc travels: it keeps its id, numbers and contract across maps, lands on free ground beside the first start, walks and joins a group move by id, and the yard\'s guards stay addressable by theirs',()=>{
 const yard=blankMap('Yard');yard.guards=Array.from({length:13},(_,i)=>({x:200+i*2,y:200,z:0,species:'cow',weapon:'knife'}));const {w,s}=campaign({yard});
 assert.ok(hire(w,candidates(w)[4].key,'month').ok);const id=MERC_ID_BASE,h=unit(s,id),stats=[h.maxHp,h.maxAp,h.accuracy,h.level,h.weapon];gather(s);
 assert.ok(travel(w,'yard').ok);const y=currentMap(w),u=unit(y,id);assert.ok(u&&u!==h,'a clone travelled');assert.deepEqual([u.maxHp,u.maxAp,u.accuracy,u.level,u.weapon],stats);assert.deepEqual(u.contract,h.contract);assert.deepEqual(u.base,h.base);
 assert.equal(y.units[4].id,id,'fifth in the array');assert.equal(unit(y,4).team,'guard','the guard with id 4 sits at index 5 and is still found by its id');assert.notEqual(y.units[4],unit(y,4));assert.equal(guards(y).length,13);
 assert.ok(!y.units.some(v=>v!==u&&(alive(v))&&v.x===u.x&&v.y===u.y),'free ground');assert.ok(near(u,y.definition.starts[0])<=3,'beside the first start');
 const x0=u.x;assert.ok(move(y,u,u.x+2,u.y));while(y.queue.length)stepMovement(y);assert.equal(u.x,x0+2,'walked by id');
 const leader=unit(y,0);assert.ok(moveGroup(y,[0,id],leader,leader.x+6,leader.y+6,0));let steps=0;while(y.queue.length&&steps++<200)stepMovement(y);assert.ok(u.x!==x0+2||u.y!==leader.y,'moved with the group');
 gather(y);assert.ok(travel(w,'factory').ok);assert.equal(unit(currentMap(w),id).contract.term,'month');
});

test('the four comrades and a plain game are untouched: DEFAULT_CAST in order, no base, no contract, and a cast option fields one merc alone',()=>{
 const s=createGame(1,blankMap());assert.deepEqual(s.units.slice(0,4).map(u=>u.name),DEFAULT_CAST.map(c=>c[0]));for(const u of s.units.slice(0,4)){assert.equal(u.base,undefined);assert.equal(u.contract,undefined);assert.equal(u.hired,undefined);assert.deepEqual([u.maxHp-((u.species==='horse'?10:u.species==='donkey'?20:u.species==='goat'?-10:0)),u.accuracy-(u.species==='donkey'?-5:u.species==='sheep'?-10:0)],[BASE.hp,BASE.accuracy]);}
 assert.deepEqual(BASE,{hp:100,ap:12,accuracy:85,stealth:20});
 const m=blankMap();m.guards=[{x:30,y:30,z:0,species:'cow',weapon:'knife'}];const solo=createGame(1,m,true,'standard',{cast:[{name:'Solo',species:'goat',weapon:'rifle'}]});
 assert.deepEqual(solo.units.filter(u=>u.team==='squad').map(u=>u.name),['Solo']);assert.equal(solo.units[0].weapon,'rifle');assert.equal(solo.units[1].team,'guard');assert.equal(solo.units[1].id,1);assert.equal(unit(solo,1),solo.units[1]);
 assert.equal(squad(solo).length,1);assert.equal(solo.loot.length,4,'the supply piles still sit at the four starts');
});

test('the portrait is a 128-pixel square inside every standing sprite a recruit can wear, taken from the top of the figure',()=>{
 for(const species of RECRUIT_SPECIES)for(const weapon of ['knife','pistol','rifle','assault','sniper']){const frame=unitArt({species,weapon,stance:'standing'}),c=portraitCrop(frame);
  assert.deepEqual([c.w,c.h],[128,128]);assert.ok(c.x>=0&&c.x+c.w<=frame.width,species+' '+weapon+' x');assert.ok(c.y>=0&&c.y+c.h<=frame.height,species+' '+weapon+' y');assert.ok(c.y<=8,'from the top of the content box');assert.equal(c.x+64,frame.anchor[0],'centred on the figure');}
});

test('a recruit\'s sheet and friendly-fire voice come from its archetype; the comrades keep their authored lines',()=>{
 const {w,s}=campaign();const c=candidates(w)[5];assert.ok(hire(w,c.key,'day').ok);const u=unit(s,MERC_ID_BASE),yakov=unit(s,0);
 const sheet=personalityDescription(u);assert.ok(sheet.some(l=>l.startsWith(c.archetype+': wants ')),sheet.join('|'));assert.ok(sheet.some(l=>l.startsWith('Yakov: ')));assert.match(sheet.find(l=>l.startsWith('Stress')),/Happiness: 100\/100/);assert.ok(!sheet.some(l=>/foreman|courier|fitter|infirmary/.test(l)),'no authored background');
 assert.equal(personalityDescription(yakov)[0],PERSONALITIES.Yakov.background);
 s.socialSeed=1;const reply=friendlyReaction(s,u,yakov,20,false);assert.ok(ARCHETYPES[c.archetype].hit.includes(reply.line),reply.line);assert.equal(reply.speaker,u.name);assert.ok(u.social.memories[0].startsWith('Yakov hit me'));
});

test('the desk numbers follow the roster, not the id: a departed contractor is still on the record, a comrade that quit stays a card',()=>{
 const {w,s}=campaign();assert.ok(hire(w,candidates(w)[0].key,'day').ok);const u=unit(s,MERC_ID_BASE);assert.equal(roster(s).indexOf(u),4,'fifth card');
 assert.ok(release(w,u.id).ok);assert.equal(roster(s).length,5);assert.equal(contracted(s).length,4);assert.ok(roster(s).filter(v=>!(v.casualty==='quit'&&v.hired)).length===4,'the desk hides a contractor who has gone');
 assert.equal(hiringDay(w),0);advanceTime(w,DAY_MINUTES);assert.equal(hiringDay(w),1);assert.notEqual(candidates(w)[0].key,'0:0','a new slate at midnight');
});
