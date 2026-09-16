// Derives initial bond seeds between the twelve Jungian archetypes from three rules.
// 1. Wheel: Pearson's four orientations, opposites 180 degrees apart. base = 30*cos(delta).
// 2. Affinity: complementary wants, +15 both ways.
// 3. Friction: A's failure mode is exactly what B fears, -15 for B toward A (directional).
// Same-archetype pairs: competitive types -10, cooperative types +10.
const A=['Innocent','Sage','Explorer','Rebel','Magician','Hero','Lover','Jester','Everyman','Caregiver','Ruler','Creator'];
const angle=Object.fromEntries(A.map((a,i)=>[a,i*30]));
const affinity=[['Innocent','Caregiver'],['Innocent','Ruler'],['Everyman','Caregiver'],['Everyman','Jester'],['Hero','Ruler'],['Hero','Rebel'],['Caregiver','Lover'],['Explorer','Rebel'],['Explorer','Sage'],['Creator','Magician'],['Creator','Sage'],['Jester','Lover'],['Sage','Magician'],['Ruler','Creator'],['Rebel','Magician']];
// failure of X -> fears of [...]: the listed archetypes resent X.
const friction={
 Innocent:['Sage','Magician'],                       // denial: the Sage fears ignorance, the Magician fears unseen consequences
 Everyman:['Rebel','Sage','Hero'],                   // going along with the crowd: powerlessness, deception, weakness
 Hero:['Innocent','Caregiver','Ruler','Everyman'],   // arrogance and needless fights: wrongdoing, selfishness, chaos, standing out
 Caregiver:['Explorer','Rebel','Hero'],              // smothering: being trapped, powerlessness, weakness
 Explorer:['Ruler','Everyman'],                      // never committing: chaos, being left behind
 Rebel:['Ruler','Innocent','Creator','Everyman'],    // destroying what worked: overthrow, unsafety, lost work, standing out
 Lover:['Sage','Hero'],                              // pleasing instead of truth: deception, weakness
 Creator:['Hero','Ruler'],                           // never shipping: weakness at the deadline, disorder
 Jester:['Ruler','Sage','Caregiver','Hero'],         // frivolity in the serious moment: chaos, ignorance, selfishness, weakness
 Sage:['Hero','Rebel','Explorer'],                   // paralysis: weakness, powerlessness, being trapped
 Magician:['Innocent','Everyman','Lover','Caregiver','Rebel'], // manipulation: wrongdoing, exclusion, being unwanted, selfishness, powerlessness
 Ruler:['Rebel','Explorer','Jester']                 // authoritarianism: powerlessness, being trapped, boredom
};
const competitive=new Set(['Hero','Ruler','Rebel','Jester','Magician']),cooperative=new Set(['Everyman','Caregiver','Innocent']);
const aff=new Set(affinity.flatMap(([a,b])=>[a+'|'+b,b+'|'+a]));
export function bond(from,to){ // how `from` initially regards `to`
 if(from===to)return 30+(competitive.has(from)?-10:cooperative.has(from)?10:0);
 const d=Math.abs(angle[from]-angle[to]),delta=Math.min(d,360-d);
 let v=Math.round(30*Math.cos(delta*Math.PI/180));
 if(aff.has(from+'|'+to))v+=15;
 if(friction[to].includes(from))v-=15; // `to` fails in the way `from` fears
 return v;
}
const M=A.map(a=>A.map(b=>bond(a,b)));
let md='| regards → | '+A.map(a=>a.slice(0,4)).join(' | ')+' |\n|'+' --- |'.repeat(A.length+1)+'\n';
for(const [i,a] of A.entries())md+='| **'+a+'** | '+M[i].map(v=>(v>0?'+':'')+v).join(' | ')+' |\n';
const pairs=[];for(let i=0;i<A.length;i++)for(let j=i+1;j<A.length;j++)pairs.push({a:A[i],b:A[j],ab:M[i][j],ba:M[j][i],sum:M[i][j]+M[j][i],gap:Math.abs(M[i][j]-M[j][i])});
pairs.sort((p,q)=>q.sum-p.sum);
const fmt=p=>`${p.a} ↔ ${p.b} (${p.ab>0?'+':''}${p.ab} / ${p.ba>0?'+':''}${p.ba})`;
console.log('MATRIX\n'+md);
console.log('ALLIES\n'+pairs.slice(0,10).map(fmt).join('\n'));
console.log('\nTHROATS\n'+pairs.slice(-10).reverse().map(fmt).join('\n'));
console.log('\nONE-SIDED (largest asymmetry)\n'+[...pairs].sort((p,q)=>q.gap-p.gap).slice(0,8).map(p=>`${fmt(p)}: ${p.ab>p.ba?p.a+' likes '+p.b+' more than the reverse':p.b+' likes '+p.a+' more than the reverse'}`).join('\n'));
// Expected squad temperature for a random draw of four distinct archetypes: mean pairwise sum.
let tot=0,n=0;for(const p of pairs){tot+=p.sum;n++;}console.log('\nmean pair sum',(tot/n).toFixed(1),'; pairs with both sides negative:',pairs.filter(p=>p.ab<0&&p.ba<0).length,'of',n);
