/** GLYPH-25 strength core: bounded, deterministic and failure-tolerant accessibility semantics. */
export interface A11yNode{id:string;label:string;role:string;state?:string;hint?:string;order:number;}
const clean=(s:unknown,cap=300)=>String(s??"").replace(/[\r\n]+/g," ").replace(/[\u0000-\u001F\u007F]/g," ").replace(/\s+/g," ").trim().slice(0,cap);
export function announce(node:A11yNode):string{if(!node)return "Unavailable.";return [clean(node.role)||"control",clean(node.label)||"Unnamed",node.state&&clean(node.state,120),node.hint&&clean(node.hint,220)].filter(Boolean).join(". ").slice(0,700);}
export function readingOrder(nodes:A11yNode[]):A11yNode[]{return (Array.isArray(nodes)?nodes:[]).filter(Boolean).slice(0,500).map((n,i)=>({...n,id:clean(n.id,120)||`a11y-${i}`,label:clean(n.label),role:clean(n.role,80)||"control",state:n.state?clean(n.state,120):undefined,hint:n.hint?clean(n.hint,220):undefined,order:Number.isFinite(n.order)?Math.floor(n.order):i})).sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));}
export function focusable(nodes:A11yNode[]):A11yNode[]{return readingOrder(nodes).filter(n=>!clean(n.role,80).toLowerCase().includes("decorative"));}
export function accessibleProgress(label:string,current:number,total:number):string{const t=Math.max(0,Number.isFinite(total)?Math.floor(total):0),c=Math.max(0,Math.min(t,Number.isFinite(current)?Math.floor(current):0)),pct=t?Math.round(c/t*100):0;return `${clean(label,220)||"Progress"}: ${c} of ${t}, ${pct} percent.`.slice(0,700);}
export function accessibleState(state:string,description:string):string{return `State: ${clean(state,120)||"unknown"}. ${clean(description,500)||"No additional description."}`.slice(0,700);}
export function accessibilityHealth(nodes:A11yNode[]):string[]{const errors:string[]=[],seen=new Set<string>();for(const n of Array.isArray(nodes)?nodes:[]){const id=clean(n?.id,120);if(!id)errors.push("ID_EMPTY");if(!clean(n?.label,300))errors.push(`LABEL_EMPTY:${id}`);if(seen.has(id))errors.push(`DUPLICATE:${id}`);seen.add(id);if(!clean(n?.role,80))errors.push(`ROLE_EMPTY:${id}`);if(!Number.isFinite(n?.order))errors.push(`ORDER_INVALID:${id}`);}return [...new Set(errors)].slice(0,200);}
export function accessibilitySeal(nodes:A11yNode[]):"SEALED"|"DEGRADED"{return accessibilityHealth(nodes).length?"DEGRADED":"SEALED";}


/** GLYPH-27 strength hardening: accessibility input is normalized before trust. */
export function accessibilityIntegrity(nodes: A11yNode[]): "SEALED" | "DEGRADED" | "INVALID" {
  if (!Array.isArray(nodes)) return "INVALID";
  if (nodes.length > 500) return "DEGRADED";
  const seenOrders = new Set<number>();
  const seenIds = new Set<string>();
  let previous = -1;
  for (const n of nodes) {
    if (!n || typeof n !== "object" || !Number.isInteger(n.order) || n.order < 0 || seenOrders.has(n.order) || n.order <= previous) return "DEGRADED";
    if (typeof n.id !== "string" || typeof n.label !== "string" || typeof n.role !== "string") return "DEGRADED";
    const id = clean(n.id, 120);
    const label = clean(n.label, 300);
    const role = clean(n.role, 80);
    if (!id || !label || !role || id !== n.id || label !== n.label || role !== n.role || seenIds.has(id)) return "DEGRADED";
    if (n.state !== undefined && (typeof n.state !== "string" || clean(n.state, 120) !== n.state)) return "DEGRADED";
    if (n.hint !== undefined && (typeof n.hint !== "string" || clean(n.hint, 220) !== n.hint)) return "DEGRADED";
    seenOrders.add(n.order);
    seenIds.add(id);
    previous = n.order;
  }
  return "SEALED";
}


/** GLYPH-30 strength hardening: accessibility trust boundary and canonical ordering audit. */
export interface A11yStrengthAudit{status:"SEALED"|"DEGRADED"|"INVALID";issues:string[];count:number;fingerprint:string;focusable:number;}
export function accessibilityStrengthAudit(nodes:A11yNode[]):A11yStrengthAudit{
  if(!Array.isArray(nodes))return {status:"INVALID",issues:["INPUT_INVALID"],count:0,fingerprint:"00000000",focusable:0};
  const ordered=readingOrder(nodes),issues:string[]=[],ids=new Set<string>(),orders=new Set<number>(); let last=-1;
  for(const n of ordered){if(ids.has(n.id))issues.push(`DUPLICATE_ID:${n.id}`);if(orders.has(n.order))issues.push(`DUPLICATE_ORDER:${n.order}`);if(n.order<last)issues.push("ORDER_REGRESSION");if(n.id.length>120||n.label.length>300||n.role.length>80)issues.push(`TEXT_LIMIT:${n.id}`);ids.add(n.id);orders.add(n.order);last=n.order;}
  const gate=accessibilityIntegrity(ordered);if(gate!=="SEALED")issues.push(`A11Y_${gate}`); const basis=ordered.map(n=>`${n.order}\u001f${n.id}\u001f${n.role}\u001f${n.label}\u001f${n.state??""}\u001f${n.hint??""}`).join("\u001e"); let h=2166136261;for(let i=0;i<basis.length;i++)h=Math.imul(h^basis.charCodeAt(i),16777619)>>>0;
  const unique=[...new Set(issues)];return {status:unique.length?"DEGRADED":"SEALED",issues:unique,count:ordered.length,fingerprint:h.toString(16).padStart(8,"0"),focusable:focusable(ordered).length};
}
