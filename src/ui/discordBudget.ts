/** GLYPH-25 strength core: strict Discord limits, safe accounting and deterministic degradation. */
export interface DiscordBudget{content:number;embedDescription:number;fieldName:number;fieldValue:number;fields:number;buttons:number;selectOptions:number;}
export const DISCORD_UI_BUDGET:Readonly<DiscordBudget>={content:2000,embedDescription:4096,fieldName:256,fieldValue:1024,fields:25,buttons:5,selectOptions:25};
export type DegradeLevel="FULL"|"COMPACT"|"DENSE"|"MINIMAL";
export interface BudgetReport{level:DegradeLevel;chars:number;lines:number;fields:number;overflow:boolean;reasons:string[];}
const n=(x:unknown,f=0,max=10000)=>Math.max(0,Math.min(max,typeof x==="number"&&Number.isFinite(x)?Math.floor(x):f));
const safeMetric=(x:unknown)=>typeof x==="number"&&Number.isFinite(x)?Math.max(0,Math.floor(x)):0;
export function normalizeBudget(b:DiscordBudget=DISCORD_UI_BUDGET):DiscordBudget{const x=b??DISCORD_UI_BUDGET;return {content:n(x.content,2000,2000),embedDescription:n(x.embedDescription,4096,4096),fieldName:n(x.fieldName,256,256),fieldValue:n(x.fieldValue,1024,1024),fields:n(x.fields,25,25),buttons:n(x.buttons,5,5),selectOptions:n(x.selectOptions,25,25)};}
export function budgetReport(chars:number,lines:number,fields:number,budget=DISCORD_UI_BUDGET):BudgetReport{const b=normalizeBudget(budget),c=n(safeMetric(chars)),l=n(safeMetric(lines)),f=n(safeMetric(fields)),reasons:string[]=[];if(c>b.embedDescription)reasons.push("DESCRIPTION");if(c>b.content)reasons.push("CONTENT");if(f>b.fields)reasons.push("FIELDS");let level:DegradeLevel="FULL";if(reasons.length)level="MINIMAL";else if(c>3000||l>30)level="DENSE";else if(c>1800||l>20)level="COMPACT";return {level,chars:c,lines:l,fields:f,overflow:reasons.length>0,reasons:[...new Set(reasons)]};}
export function degradeLines(lines:string[],maxChars:number):string[]{const cap=n(maxChars,0,12000),out:string[]=[];let used=0;for(const line of Array.isArray(lines)?lines:[]){const clean=String(line??"").replace(/[\r\n]+/g," ").replace(/[\u0000-\u001F\u007F]/g," ").trim();if(!clean)continue;if(clean.length>cap-used)break;out.push(clean);used+=clean.length;}return out;}
export function budgetHealth(b:DiscordBudget=DISCORD_UI_BUDGET):string[]{const x=normalizeBudget(b),e:string[]=[];if(x.content<1||x.embedDescription<1)e.push("CONTENT_LIMIT");if(x.fieldName<1||x.fieldValue<1)e.push("FIELD_LIMIT");if(x.fields<1)e.push("FIELD_COUNT");if(x.buttons<1||x.selectOptions<1)e.push("COMPONENT_LIMIT");return [...new Set(e)];}
export function budgetFit(chars:number,lines:number,fields:number,budget=DISCORD_UI_BUDGET):boolean{const b=normalizeBudget(budget);return Number.isFinite(chars)&&Number.isFinite(lines)&&Number.isFinite(fields)&&chars>=0&&lines>=0&&fields>=0&&Math.floor(chars)===chars&&Math.floor(lines)===lines&&Math.floor(fields)===fields&&chars<=b.embedDescription&&lines<=b.content&&fields<=b.fields;}
export function budgetSeal(chars:number,lines:number,fields:number,budget=DISCORD_UI_BUDGET):"SEALED"|"OVERFLOW"|"INVALID"{if(!Number.isFinite(chars)||!Number.isFinite(lines)||!Number.isFinite(fields)||chars<0||lines<0||fields<0)return "INVALID";return budgetFit(chars,lines,fields,budget)?"SEALED":"OVERFLOW";}


/** GLYPH-27 strength hardening: exact accounting gate; never trusts caller-provided status. */
export function budgetIntegrity(report: BudgetReport, budget = DISCORD_UI_BUDGET): "SEALED" | "DEGRADED" | "INVALID" {
  if (!report || typeof report !== "object" || !Array.isArray(report.reasons) || !Number.isInteger(report.chars) || !Number.isInteger(report.lines) || !Number.isInteger(report.fields)) return "INVALID";
  if (report.chars < 0 || report.lines < 0 || report.fields < 0) return "INVALID";
  const b = normalizeBudget(budget);
  const expectedReasons = [report.chars > b.embedDescription ? "DESCRIPTION" : "", report.chars > b.content ? "CONTENT" : "", report.fields > b.fields ? "FIELDS" : ""].filter(Boolean);
  const reasons = [...new Set(report.reasons.filter(x => typeof x === "string"))];
  if (reasons.length !== report.reasons.length || reasons.some(x => !expectedReasons.includes(x)) || expectedReasons.some(x => !reasons.includes(x))) return "DEGRADED";
  const overflow = expectedReasons.length > 0;
  if (overflow !== !!report.overflow) return "DEGRADED";
  const expectedLevel = overflow ? "MINIMAL" : (report.chars > 3000 || report.lines > 30 ? "DENSE" : (report.chars > 1800 || report.lines > 20 ? "COMPACT" : "FULL"));
  return report.level === expectedLevel ? "SEALED" : "DEGRADED";
}
