/** GLYPH-25 strength core: deterministic, bounded, cycle-safe and loss-aware composition. */
export type RenderKind="screen"|"section"|"card"|"metric"|"list"|"action"|"status"|"spacer"|"text";
export interface RenderNode{id:string;kind:RenderKind;label?:string;value?:string;children?:RenderNode[];priority?:number;minLines?:number;maxLines?:number;}
export interface RenderBudget{maxLines:number;maxChars:number;maxNodes:number;}
export interface RenderPlan{root:RenderNode;lines:string[];chars:number;nodes:number;truncated:boolean;dropped:string[];}
export const DEFAULT_RENDER_BUDGET:RenderBudget={maxLines:24,maxChars:3800,maxNodes:80};
const clean=(v:unknown)=>typeof v==="string"?v.replace(/[\r\n]+/g," ").replace(/[\u0000-\u001F\u007F]/g," ").replace(/\s+/g," ").trim():"";
const integer=(x:unknown,f:number,min:number,max:number)=>{const n=typeof x==="number"&&Number.isFinite(x)?Math.floor(x):f;return Math.max(min,Math.min(max,n));};
export function normalizeBudget(b:RenderBudget=DEFAULT_RENDER_BUDGET):RenderBudget{const x=b&&typeof b==="object"?b:DEFAULT_RENDER_BUDGET;return {maxLines:integer(x.maxLines,24,1,500),maxChars:integer(x.maxChars,3800,1,12000),maxNodes:integer(x.maxNodes,80,1,1000)};}
export function node(kind:RenderKind,id:string,label?:string,value?:string,children:RenderNode[]=[]):RenderNode{const safeKind=(["screen","section","card","metric","list","action","status","spacer","text"] as const).includes(kind)?kind:"text";return {kind:safeKind,id:clean(id).slice(0,80)||"node",label:clean(label),value:clean(value),children:Array.isArray(children)?children.filter(Boolean).slice(0,100):[],priority:3};}
export function countNodes(n:RenderNode,seen=new Set<string>()):number{if(!n||typeof n!=="object"||seen.has(n.id))return 0;seen.add(n.id);return 1+(Array.isArray(n.children)?n.children:[]).reduce((a,c)=>a+countNodes(c,seen),0);}
function flatten(n:RenderNode,out:string[],budget:RenderBudget,seen:Set<string>){if(!n||seen.has(n.id)||out.length>=budget.maxLines)return;seen.add(n.id);const line=[clean(n.label),clean(n.value)].filter(Boolean).join(" │ ");if(line)out.push(line.slice(0,budget.maxChars));const children=[...(Array.isArray(n.children)?n.children:[])].sort((a,b)=>(Number.isFinite(b.priority??3)?b.priority??3:3)-(Number.isFinite(a.priority??3)?a.priority??3:3)||clean(a.id).localeCompare(clean(b.id)));for(const c of children)flatten(c,out,budget,seen);}
export function renderPlan(root:RenderNode,budget:RenderBudget=DEFAULT_RENDER_BUDGET):RenderPlan{const b=normalizeBudget(budget),safe=hardenTree(root),raw:string[]=[],seen=new Set<string>();flatten(safe,raw,b,seen);let chars=0;const kept:string[]=[],dropped:string[]=[];for(const line of raw){if(kept.length>=b.maxLines||chars+line.length>b.maxChars){dropped.push(line);continue;}kept.push(line);chars+=line.length;}const nodeCount=countNodes(safe);return {root:safe,lines:kept,chars,nodes:Math.min(nodeCount,b.maxNodes),truncated:dropped.length>0||nodeCount>b.maxNodes,dropped:dropped.slice(0,100)};}
export function validateTree(root:RenderNode,budget=DEFAULT_RENDER_BUDGET):string[]{const b=normalizeBudget(budget),errors:string[]=[],seen=new Set<string>(),objects=new Set<object>();const walk=(n:RenderNode,depth=0)=>{if(!n||typeof n!=="object"){errors.push("NODE_INVALID");return;}if(objects.has(n as object)){errors.push("CYCLE_REFERENCE");return;}objects.add(n as object);const id=clean(n.id);if(seen.has(id)){errors.push(`DUPLICATE:${id}`);return;}seen.add(id);if(!id)errors.push("ID_EMPTY");if(String(n.id??"").length>80)errors.push(`ID_LONG:${id}`);if(depth>32)errors.push(`DEPTH:${id}`);if(!( ["screen","section","card","metric","list","action","status","spacer","text"] as readonly string[]).includes(String(n.kind)))errors.push(`KIND_INVALID:${id}`);if((n.minLines??0)>(n.maxLines??Number.MAX_SAFE_INTEGER))errors.push(`LINE_RANGE:${id}`);if(n.label!==undefined&&typeof n.label!=="string")errors.push(`LABEL_TYPE:${id}`);for(const c of Array.isArray(n.children)?n.children:[])walk(c,depth+1);};walk(root);if(seen.size>b.maxNodes)errors.push("NODE_BUDGET");return [...new Set(errors)];}
export function hardenTree(root:RenderNode):RenderNode{const seen=new Set<string>();const walk=(n:RenderNode,depth=0):RenderNode=>{const rawId=clean(n?.id),base=rawId.slice(0,80)||"node";let id=base,i=2;while(seen.has(id))id=`${base.slice(0,76)}-${i++}`.slice(0,80);seen.add(id);const min=integer(n?.minLines,0,0,500),max=n?.maxLines===undefined?undefined:integer(n.maxLines,0,0,500);return {kind:n?.kind??"text",id,label:clean(n?.label),value:clean(n?.value),children:depth>=32?[]:(Array.isArray(n?.children)?n.children:[]).filter(Boolean).slice(0,100).map(c=>walk(c,depth+1)),priority:integer(n?.priority,3,-100,100),minLines:max!==undefined?Math.min(min,max):min,maxLines:max};};return walk(root);}


/** GLYPH-27 strength hardening: deterministic integrity gates for existing render plans. */
export function renderIntegrity(plan: RenderPlan, budget: RenderBudget = DEFAULT_RENDER_BUDGET): "SEALED" | "DEGRADED" | "INVALID" {
  if (!plan || typeof plan !== "object" || !plan.root || typeof plan.root !== "object" || !Array.isArray(plan.lines)) return "INVALID";
  if (!Number.isInteger(plan.chars) || !Number.isInteger(plan.nodes) || plan.chars < 0 || plan.nodes < 0) return "INVALID";
  const b = normalizeBudget(budget);
  if (plan.lines.length > b.maxLines || plan.chars > b.maxChars || plan.nodes > b.maxNodes) return "DEGRADED";
  if (plan.lines.some(x => typeof x !== "string" || x !== x.replace(/[\r\n\u0000-\u001F\u007F]/g, " ") || x.length > b.maxChars)) return "DEGRADED";
  const exactChars = plan.lines.reduce((n, x) => n + x.length, 0);
  if (exactChars !== plan.chars) return "DEGRADED";
  const actualNodes = countNodes(plan.root);
  if (plan.nodes !== Math.min(actualNodes, b.maxNodes)) return "DEGRADED";
  if (plan.truncated !== (plan.dropped.length > 0 || actualNodes > b.maxNodes)) return "DEGRADED";
  if (!Array.isArray(plan.dropped) || plan.dropped.some(x => typeof x !== "string")) return "DEGRADED";
  if (validateTree(plan.root, b).length) return "DEGRADED";
  const fingerprint = renderFingerprint(plan);
  if (!/^[0-9a-f]{8}$/.test(fingerprint)) return "DEGRADED";
  return "SEALED";
}
export function renderFingerprint(plan: RenderPlan): string {
  const basis = [plan?.root?.id, plan?.root?.kind, ...(Array.isArray(plan?.lines) ? plan.lines : []), plan?.chars, plan?.nodes].join("|");
  let h = 2166136261;
  for (let i = 0; i < basis.length; i++) h = Math.imul(h ^ basis.charCodeAt(i), 16777619) >>> 0;
  return h.toString(16).padStart(8, "0");
}


/** GLYPH-30 strength hardening: adversarial render verification without changing the render surface. */
export interface RenderStrengthAudit{status:"SEALED"|"DEGRADED"|"INVALID";fingerprint:string;issues:string[];limits:{depth:number;children:number;label:number;value:number;nodes:number;lines:number;chars:number;dropped:number;};}
export function renderStrengthAudit(plan:RenderPlan,budget:RenderBudget=DEFAULT_RENDER_BUDGET):RenderStrengthAudit{
  const b=normalizeBudget(budget), issues:string[]=[];
  if(!plan||typeof plan!=="object") return {status:"INVALID",fingerprint:"00000000",issues:["PLAN_INVALID"],limits:{depth:32,children:100,label:300,value:300,nodes:b.maxNodes,lines:b.maxLines,chars:b.maxChars,dropped:100}};
  const walk=(n:RenderNode,d=0,seen=new Set<object>()):void=>{if(!n||typeof n!=="object"){issues.push("NODE_INVALID");return;} if(seen.has(n as object)){issues.push("OBJECT_CYCLE");return;} seen.add(n as object); if(d>32)issues.push("DEPTH_LIMIT"); if(Array.isArray(n.children)&&n.children.length>100)issues.push("CHILD_LIMIT"); if(typeof n.label==="string"&&n.label.length>300)issues.push("LABEL_LIMIT"); if(typeof n.value==="string"&&n.value.length>300)issues.push("VALUE_LIMIT"); for(const c of Array.isArray(n.children)?n.children:[])walk(c,d+1,seen);};
  walk(plan.root); if(plan.lines.length>b.maxLines)issues.push("LINE_LIMIT"); if(plan.chars>b.maxChars)issues.push("CHAR_LIMIT"); if(plan.nodes>b.maxNodes)issues.push("NODE_LIMIT"); if(!Array.isArray(plan.dropped)||plan.dropped.length>100)issues.push("DROP_LIMIT");
  const gate=renderIntegrity(plan,b); if(gate!=="SEALED")issues.push(`RENDER_${gate}`); const unique=[...new Set(issues)]; return {status:unique.length?"DEGRADED":"SEALED",fingerprint:renderFingerprint(plan),issues:unique,limits:{depth:32,children:100,label:300,value:300,nodes:b.maxNodes,lines:b.maxLines,chars:b.maxChars,dropped:100}};
}
