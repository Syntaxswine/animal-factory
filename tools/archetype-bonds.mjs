// Prints the archetype bond matrix, allies, feuds and one-sided pairs from the rules in dist/tactics/archetypes.js (GUARDS.md G3).
import {WHEEL as A,bond} from '../dist/tactics/archetypes.js';
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
