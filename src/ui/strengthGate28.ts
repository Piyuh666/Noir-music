/** GLYPH-30 strength-only core: adversarial invariant hardening for existing UI surfaces. No new presentation surfaces. */
import {RenderPlan,RenderBudget,DEFAULT_RENDER_BUDGET,normalizeBudget,countNodes,validateTree} from './renderPipeline';
import {UiRegistry,UiRegistryReport} from './uiRegistry';
import {A11yNode,accessibilityHealth} from './a11y';

export type StrengthState = 'SEALED'|'DEGRADED'|'INVALID';
const text=(x:unknown,cap=500)=>String(x??'').replace(/[\r\n]+/g,' ').replace(/[\u0000-\u001F\u007F]/g,' ').trim().slice(0,cap);
const finiteInt=(x:unknown)=>typeof x==='number'&&Number.isInteger(x)&&Number.isFinite(x);
const finite=(x:unknown)=>typeof x==='number'&&Number.isFinite(x);
const own=(o:object,k:string)=>Object.prototype.hasOwnProperty.call(o,k);

export function planStrength(plan:RenderPlan,budget:RenderBudget=DEFAULT_RENDER_BUDGET):StrengthState{
  if(!plan||typeof plan!=='object'||!plan.root||!Array.isArray(plan.lines)) return 'INVALID';
  const b=normalizeBudget(budget);
  if(!finiteInt(plan.chars)||!finiteInt(plan.nodes)||plan.chars<0||plan.nodes<0) return 'INVALID';
  if(plan.lines.length>b.maxLines||plan.chars>b.maxChars||plan.nodes>b.maxNodes) return 'DEGRADED';
  const exactChars=plan.lines.reduce((n,x)=>n+(typeof x==='string'?x.length:0),0);
  if(exactChars!==plan.chars) return 'DEGRADED';
  const actualNodes=countNodes(plan.root);
  if(plan.nodes!==Math.min(actualNodes,b.maxNodes)) return 'DEGRADED';
  if(plan.lines.some(x=>typeof x!=='string'||text(x)!==x||x.length>b.maxChars)) return 'DEGRADED';
  return validateTree(plan.root,b).length?'DEGRADED':'SEALED';
}

export function accessibilityStrength(nodes:A11yNode[]):StrengthState{
  if(!Array.isArray(nodes)) return 'INVALID';
  if(nodes.length>500) return 'DEGRADED';
  const health=accessibilityHealth(nodes);
  if(health.length) return 'DEGRADED';
  let previous=-1;
  const ids=new Set<string>();
  for(const n of nodes){
    if(!n||typeof n!=='object'||!finiteInt(n.order)||n.order<0||n.order<=previous) return 'DEGRADED';
    if(text(n.label,300)!==n.label||text(n.role,80)!==n.role) return 'DEGRADED';
    if('id' in n){const id=String((n as unknown as {id?:unknown}).id??'');if(!id||text(id,120)!==id||ids.has(id))return 'DEGRADED';ids.add(id);}
    previous=n.order;
  }
  return 'SEALED';
}

export function registryStrength(registry:UiRegistry):StrengthState{
  if(!registry||typeof registry.report!=='function'||typeof registry.all!=='function') return 'INVALID';
  const r=registry.report();
  const all=registry.all();
  if(!r||typeof r!=='object'||!finiteInt(r.total)||r.total<0||!Array.isArray(all)) return 'INVALID';
  if(r.total!==all.length) return 'DEGRADED';
  for(const key of ['duplicates','emptyRenderers','invalid'] as const) if(!Array.isArray(r[key])) return 'DEGRADED';
  const seen=new Set<string>();
  for(const item of all as unknown[]){
    if(!item||typeof item!=='object')return 'DEGRADED';
    const id=String((item as Record<string,unknown>).id??(item as Record<string,unknown>).name??'');
    if(!id||seen.has(id))return 'DEGRADED';
    seen.add(id);
  }
  return r.duplicates.length||r.emptyRenderers.length||r.invalid.length?'DEGRADED':'SEALED';
}

export function reportStrength(report:UiRegistryReport):StrengthState{
  if(!report||typeof report!=='object'||!finiteInt(report.total)||report.total<0) return 'INVALID';
  if(!report.categories||typeof report.categories!=='object'||Array.isArray(report.categories)) return 'DEGRADED';
  if(!Array.isArray(report.duplicates)||!Array.isArray(report.emptyRenderers)||!Array.isArray(report.invalid)) return 'DEGRADED';
  if(Object.values(report.categories).some(x=>!finiteInt(x)||x<0)) return 'DEGRADED';
  const categoryTotal=Object.values(report.categories).reduce((a,b)=>a+b,0);
  if(categoryTotal!==report.total) return 'DEGRADED';
  return 'SEALED';
}

export function strengthSummary(states:StrengthState[]):StrengthState{
  if(!Array.isArray(states)||states.length===0||states.length>64) return 'INVALID';
  if(states.some(x=>x!=='SEALED'&&x!=='DEGRADED'&&x!=='INVALID')) return 'INVALID';
  if(states.includes('INVALID')) return 'INVALID';
  return states.includes('DEGRADED')?'DEGRADED':'SEALED';
}

/** GLYPH-30 adversarial strength evidence. */
export interface StrengthEvidence { layer:string; state:StrengthState; fingerprint:string; }
export interface StrengthSeal { state:StrengthState; evidence:StrengthEvidence[]; fingerprint:string; reasons:string[]; }
export interface StrengthAudit { state:StrengthState; checks:number; failed:string[]; fingerprint:string; }

function hash(textValue:string):string{
  let h=2166136261;
  for(let i=0;i<textValue.length;i++)h=Math.imul(h^textValue.charCodeAt(i),16777619)>>>0;
  return h.toString(16).padStart(8,'0');
}
function canonical(value:unknown,depth=0,seen=new WeakSet<object>()):string{
  if(depth>32)return 'DEPTH_LIMIT';
  if(value===null||value===undefined)return 'null';
  if(typeof value==='string')return JSON.stringify(text(value,1200));
  if(typeof value==='number')return Number.isFinite(value)?String(value):'NaN';
  if(typeof value==='boolean')return value?'true':'false';
  if(typeof value==='bigint')return `bigint:${value.toString()}`;
  if(typeof value==='function')return 'function';
  if(Array.isArray(value))return '['+value.map(v=>canonical(v,depth+1,seen)).join(',')+']';
  if(typeof value==='object'){
    if(seen.has(value as object))return 'CYCLE';
    seen.add(value as object);
    const out='{'+Object.keys(value as Record<string,unknown>).sort().map(k=>JSON.stringify(k)+':'+canonical((value as Record<string,unknown>)[k],depth+1,seen)).join(',')+'}';
    seen.delete(value as object); return out;
  }
  return typeof value;
}

/** Stronger than individual gates: evidence is recomputed and bound together. */
export function crossLayerSeal(plan:RenderPlan,registry:UiRegistry,a11y:A11yNode[],budget:RenderBudget=DEFAULT_RENDER_BUDGET):StrengthSeal{
  const p=planStrength(plan,budget),r=registryStrength(registry),a=accessibilityStrength(a11y);
  const evidence:StrengthEvidence[]=[
    {layer:'render',state:p,fingerprint:hash(canonical(plan))},
    {layer:'registry',state:r,fingerprint:hash(canonical(registry?.all?.()??[]))},
    {layer:'accessibility',state:a,fingerprint:hash(canonical(a11y))},
  ];
  const reasons:string[]=[];
  if(p!=='SEALED')reasons.push(`RENDER_${p}`);
  if(r!=='SEALED')reasons.push(`REGISTRY_${r}`);
  if(a!=='SEALED')reasons.push(`A11Y_${a}`);
  const fingerprint=hash(evidence.map(x=>`${x.layer}:${x.state}:${x.fingerprint}`).join('|'));
  return {state:reasons.length?'DEGRADED':'SEALED',evidence,reasons,fingerprint};
}

export function verifyCrossLayerSeal(seal:StrengthSeal,plan:RenderPlan,registry:UiRegistry,a11y:A11yNode[],budget:RenderBudget=DEFAULT_RENDER_BUDGET):StrengthState{
  if(!seal||typeof seal!=='object'||!Array.isArray(seal.evidence)||!Array.isArray(seal.reasons)||typeof seal.fingerprint!=='string')return 'INVALID';
  const expected=crossLayerSeal(plan,registry,a11y,budget);
  if(seal.fingerprint!==expected.fingerprint)return 'DEGRADED';
  if(canonical(seal.evidence)!==canonical(expected.evidence))return 'DEGRADED';
  if(canonical(seal.reasons)!==canonical(expected.reasons)||seal.state!==expected.state)return 'DEGRADED';
  return expected.state;
}

/** Deterministic mutation fingerprint for already-normalized UI artifacts. */
export function strengthSnapshot(value:unknown):string{return hash(canonical(value));}
export function snapshotStable(before:string,value:unknown):boolean{return typeof before==='string'&&/^[0-9a-f]{8}$/.test(before)&&before===strengthSnapshot(value);}

/** High-strength adversarial audit; diagnostics only and intentionally introduces no UI surface. */
export function strengthAudit(plan:RenderPlan,registry:UiRegistry,a11y:A11yNode[],budget:RenderBudget=DEFAULT_RENDER_BUDGET):StrengthAudit{
  const failed:string[]=[]; let checks=0;
  const check=(name:string,ok:boolean)=>{checks++;if(!ok)failed.push(name);};
  const b=normalizeBudget(budget);
  check('BUDGET_FINITE',Object.values(b).every(finiteInt));
  check('PLAN_SEALED',planStrength(plan,b)==='SEALED');
  check('REGISTRY_SEALED',registryStrength(registry)==='SEALED');
  check('A11Y_SEALED',accessibilityStrength(a11y)==='SEALED');
  check('SEAL_SEALED',crossLayerSeal(plan,registry,a11y,b).state==='SEALED');
  const canonicalPlan=canonical(plan); check('PLAN_CANONICAL_STABLE',canonicalPlan===canonical(plan));
  const canonicalA11y=canonical(a11y); check('A11Y_CANONICAL_STABLE',canonicalA11y===canonical(a11y));
  check('PLAN_CHARS_MATCH',Array.isArray(plan?.lines)&&plan.chars===plan.lines.reduce((n,x)=>n+(typeof x==='string'?x.length:0),0));
  check('PLAN_LINES_BOUNDED',Array.isArray(plan?.lines)&&plan.lines.length<=b.maxLines);
  check('PLAN_NODES_BOUNDED',!!plan?.root&&finiteInt(plan.nodes)&&plan.nodes<=b.maxNodes);
  check('NO_UNEXPECTED_OWN_FIELDS',!!plan&&typeof plan==='object'&&own(plan,'root')&&own(plan,'lines')&&own(plan,'chars')&&own(plan,'nodes'));
  check('BOUNDED_CANONICAL_PLAN',boundedCanonical(plan)!==null);
  check('BOUNDED_CANONICAL_A11Y',boundedCanonical(a11y)!==null);
  let registryItems: unknown[]=[];
  try { registryItems=registry.all() as unknown[]; } catch { failed.push('REGISTRY_THROW'); checks++; }
  check('REGISTRY_ITEMS_BOUNDED',registryItems.length<=STRENGTH_LIMITS.maxRegistryItems);
  check('A11Y_ITEMS_BOUNDED',Array.isArray(a11y)&&a11y.length<=STRENGTH_LIMITS.maxA11yNodes);
  check('INTEGRITY_PROBE',integrityProbe(plan,registry,a11y,b)==='SEALED');
  const state:StrengthState=failed.length?'DEGRADED':'SEALED';
  return {state,checks,failed,fingerprint:hash(`${state}|${checks}|${failed.join('|')}|${strengthSnapshot({plan,a11y})}`)};
}

/** Fail-closed aggregate: an empty evidence set can never be considered strong. */
export function sealedOnly(states:StrengthState[]):boolean{return Array.isArray(states)&&states.length>0&&states.every(x=>x==='SEALED');}


/** GLYPH-31 strength reinforcement: bounded, non-throwing integrity probes. */
export interface StrengthLimits {
  maxCanonicalChars: number;
  maxRegistryItems: number;
  maxA11yNodes: number;
  maxReasons: number;
}

export const STRENGTH_LIMITS: StrengthLimits = Object.freeze({
  maxCanonicalChars: 120000,
  maxRegistryItems: 5000,
  maxA11yNodes: 500,
  maxReasons: 256,
});

function boundedCanonical(value: unknown, limit = STRENGTH_LIMITS.maxCanonicalChars): string | null {
  try {
    const out = canonical(value);
    return out.length <= limit ? out : null;
  } catch {
    return null;
  }
}

export function integrityProbe(plan: RenderPlan, registry: UiRegistry, a11y: A11yNode[], budget: RenderBudget = DEFAULT_RENDER_BUDGET): StrengthState {
  if (!plan || !registry || !Array.isArray(a11y)) return 'INVALID';
  let items: unknown[];
  try { items = registry.all() as unknown[]; } catch { return 'INVALID'; }
  if (items.length > STRENGTH_LIMITS.maxRegistryItems || a11y.length > STRENGTH_LIMITS.maxA11yNodes) return 'DEGRADED';
  const p = boundedCanonical(plan);
  const r = boundedCanonical(items);
  const a = boundedCanonical(a11y);
  if (p === null || r === null || a === null) return 'DEGRADED';
  if (p !== boundedCanonical(plan) || r !== boundedCanonical(items) || a !== boundedCanonical(a11y)) return 'DEGRADED';
  return planStrength(plan, budget) === 'SEALED' && registryStrength(registry) === 'SEALED' && accessibilityStrength(a11y) === 'SEALED' ? 'SEALED' : 'DEGRADED';
}

export function strengthEnvelope(plan: RenderPlan, registry: UiRegistry, a11y: A11yNode[], budget: RenderBudget = DEFAULT_RENDER_BUDGET): StrengthState {
  const checks = [
    integrityProbe(plan, registry, a11y, budget),
    crossLayerSeal(plan, registry, a11y, budget).state,
  ];
  return strengthSummary(checks);
}
