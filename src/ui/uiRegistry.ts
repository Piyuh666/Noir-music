/** GLYPH-25 strength core: duplicate-safe, immutable snapshots and defensive diagnostics. */
export interface UiSurfaceRegistration{id:string;title:string;version:string;category:string;renderers:string[];interactive?:boolean;}
export interface UiRegistryReport{total:number;categories:Record<string,number>;duplicates:string[];emptyRenderers:string[];invalid:string[];}
const clean=(x:unknown,cap=120)=>String(x??"").replace(/[\r\n]+/g," ").replace(/[\u0000-\u001F\u007F]/g," ").trim().slice(0,cap);
export class UiRegistry{private readonly items=new Map<string,UiSurfaceRegistration>();private readonly rejected=new Set<string>();register(item:UiSurfaceRegistration):boolean{if(!item||typeof item!=="object")return false;const id=clean(item.id,100);if(!id||id!==item.id||this.items.has(id)){if(id)this.rejected.add(id);return false;}const title=clean(item.title,256),version=clean(item.version,64),category=clean(item.category,80);if(!title||!version||!category||title!==item.title||version!==item.version||category!==item.category){this.rejected.add(id);return false;}const renderers=Array.isArray(item.renderers)?[...new Set(item.renderers.filter(x=>typeof x==="string").map(x=>clean(x,100)).filter(Boolean))].slice(0,25):[];if(renderers.length===0||renderers.some(x=>x.length>100)){this.rejected.add(id);return false;}this.items.set(id,{id,title,version,category,renderers,interactive:item.interactive===true});return true;}get(id:string){const x=this.items.get(clean(id,100));return x?{...x,renderers:[...x.renderers]}:undefined;}all(){return [...this.items.values()].sort((a,b)=>a.id.localeCompare(b.id)).map(x=>({...x,renderers:[...x.renderers]}));}report():UiRegistryReport{const categories:Record<string,number>={},emptyRenderers:string[]=[],invalid:string[]=[];for(const x of this.items.values()){const k=x.category||"UNCLASSIFIED";categories[k]=(categories[k]??0)+1;if(!x.renderers.length)emptyRenderers.push(x.id);if(!x.title||!x.version)invalid.push(x.id);}return {total:this.items.size,categories,duplicates:[...this.rejected].sort(),emptyRenderers:emptyRenderers.sort(),invalid:invalid.sort()};}clear(){this.items.clear();this.rejected.clear();}}
export function registrySeal(registry:UiRegistry):"SEALED"|"DEGRADED"{const r=registry.report();return r.invalid.length||r.emptyRenderers.length||r.duplicates.length?"DEGRADED":"SEALED";}
export function stableSurfaceId(category:string,name:string):string{return `mono:ui:${clean(category,60)||"surface"}:${clean(name,60)||"unnamed"}`.toLowerCase().replace(/[^a-z0-9:_-]/g,"-").slice(0,100);}


/** GLYPH-27 strength hardening: registry snapshots must be detached before diagnostics. */
export function registrySnapshotIntegrity(snapshot: unknown): "SEALED" | "DEGRADED" | "INVALID" {
  if (!snapshot || typeof snapshot !== "object") return "INVALID";
  const x = snapshot as Record<string, unknown>;
  if (!Number.isInteger(x.total) || Number(x.total) < 0 || !x.categories || typeof x.categories !== "object" || Array.isArray(x.categories)) return "DEGRADED";
  for (const key of ["invalid", "duplicates", "emptyRenderers"]) {
    if (!Array.isArray(x[key])) return "DEGRADED";
    if ((x[key] as unknown[]).some(v => typeof v !== "string" || !clean(v,100))) return "DEGRADED";
  }
  const categories=x.categories as Record<string,unknown>;
  if (Object.entries(categories).some(([k,v]) => !clean(k,80) || !Number.isInteger(v) || Number(v)<0)) return "DEGRADED";
  return "SEALED";
}


/** GLYPH-30 strength hardening: registry immutability and identity audit. */
export interface RegistryStrengthAudit{status:"SEALED"|"DEGRADED";issues:string[];fingerprint:string;total:number;}
export function registryStrengthAudit(registry:UiRegistry):RegistryStrengthAudit{
  if(!registry||typeof registry!="object")return {status:"DEGRADED",issues:["REGISTRY_INVALID"],fingerprint:"00000000",total:0};
  const items=registry.all(),issues:string[]=[],ids=new Set<string>(); for(const x of items){if(ids.has(x.id))issues.push(`DUPLICATE:${x.id}`);if(!x.id||!x.title||!x.version||!x.category)issues.push(`IDENTITY:${x.id}`);if(x.renderers.length===0)issues.push(`RENDERERS:${x.id}`);if(x.renderers.length>25)issues.push(`RENDERER_LIMIT:${x.id}`);ids.add(x.id);}
  const report=registry.report();if(registrySeal(registry)!==`SEALED`)issues.push("REGISTRY_SEAL");if(registrySnapshotIntegrity(report)!=="SEALED")issues.push("SNAPSHOT_SEAL");
  const basis=items.map(x=>`${x.id}|${x.title}|${x.version}|${x.category}|${x.renderers.join(",")}|${x.interactive?1:0}`).join("\n");let h=2166136261;for(let i=0;i<basis.length;i++)h=Math.imul(h^basis.charCodeAt(i),16777619)>>>0;const unique=[...new Set(issues)];return {status:unique.length?"DEGRADED":"SEALED",issues:unique,fingerprint:h.toString(16).padStart(8,"0"),total:items.length};
}
