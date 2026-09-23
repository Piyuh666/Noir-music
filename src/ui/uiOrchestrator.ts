/** GLYPH-25 strength core: fail-closed orchestration, bounded composition and stable recovery metadata. */
import {RenderNode,renderPlan,RenderBudget,hardenTree,validateTree} from "./renderPipeline";
import {PlayerDeck,deckLines,normalizeDeck,deckHealth} from "./playerDeck";
import {QueueCursor,queueRail,normalizeCursor,cursorHealth} from "./queueNavigator";
import {Notice,noticeLine,dedupeNotices,noticeHealth} from "./feedbackCenter";
import {A11yNode,readingOrder,accessibilityHealth,accessibilitySeal} from "./a11y";
export interface UiFrame{title:string;lines:string[];budget:{chars:number;lines:number;truncated:boolean};accessibility:string[];health:string[];}
const clean=(x:unknown,cap=180)=>String(x??"").replace(/[\r\n]+/g," ").replace(/[\u0000-\u001F\u007F]/g," ").trim().slice(0,cap);
export function composeFrame(title:string,deck:PlayerDeck,cursor:QueueCursor,queueSize:number,notices:Notice[],a11y:A11yNode[],budget?:RenderBudget):UiFrame{const safeSize=Math.max(0,Math.min(100000,Number.isFinite(queueSize)?Math.floor(queueSize):0)),d=normalizeDeck(deck),c=normalizeCursor(cursor,safeSize),safeNotices=dedupeNotices(Array.isArray(notices)?notices:[]),ordered=readingOrder(Array.isArray(a11y)?a11y:[]);const root:RenderNode={id:"screen",kind:"screen",label:clean(title)||"NOIR MUSIC",children:[{id:"player",kind:"section",label:"NOW PLAYING",priority:5,children:deckLines(d).map((x,i)=>({id:`p${i}`,kind:"text",label:x,priority:5}))},{id:"queue",kind:"section",label:`QUEUE ${safeSize}`,priority:4,children:[{id:"rail",kind:"text",label:queueRail(c,safeSize),priority:4}]},{id:"notices",kind:"section",label:"SIGNAL",priority:4,children:safeNotices.map(n=>({id:`notice:${clean(n.id,90)}`,kind:"status",label:noticeLine(n),priority:4}))}]};const hardened=hardenTree(root),treeHealth=validateTree(hardened,budget),plan=renderPlan(hardened,budget),health=[...treeHealth,...deckHealth(d),...cursorHealth(c,safeSize),...noticeHealth(safeNotices),...accessibilityHealth(ordered),...(plan.truncated?["RENDER_TRUNCATED"]:[])];return {title:hardened.label!,lines:plan.lines,budget:{chars:plan.chars,lines:plan.lines.length,truncated:plan.truncated},accessibility:ordered.map(x=>`${x.order}. ${x.label.trim()}`).slice(0,500),health:[...new Set(health)].slice(0,200)};}


/** GLYPH-27 strength hardening: final frame gate for already-composed surfaces. */
export function frameIntegrity(frame: UiFrame): "SEALED" | "DEGRADED" | "INVALID" {
  if (!frame || typeof frame !== "object" || typeof frame.title !== "string" || !Array.isArray(frame.lines) || !Array.isArray(frame.accessibility) || !Array.isArray(frame.health)) return "INVALID";
  if (!frame.title || frame.title.length>180 || clean(frame.title,180)!==frame.title) return "DEGRADED";
  if (frame.lines.length>24 || frame.lines.some(x => typeof x !== "string" || clean(x,3800)!==x)) return "DEGRADED";
  if (frame.accessibility.length>500 || frame.accessibility.some(x => typeof x !== "string" || /[\u0000-\u001F\u007F]/.test(x))) return "DEGRADED";
  if (!frame.budget || !Number.isInteger(frame.budget.chars) || !Number.isInteger(frame.budget.lines) || frame.budget.chars < 0 || frame.budget.lines < 0 || frame.budget.lines !== frame.lines.length) return "DEGRADED";
  const chars=frame.lines.reduce((n,x)=>n+x.length,0);
  if (chars!==frame.budget.chars || chars>3800) return "DEGRADED";
  if (frame.budget.truncated!== (frame.health.includes("RENDER_TRUNCATED"))) return "DEGRADED";
  return frame.health.length === 0 ? "SEALED" : "DEGRADED";
}


/** GLYPH-30 strength hardening: independent end-to-end frame audit. */
export interface FrameStrengthAudit{status:"SEALED"|"DEGRADED"|"INVALID";issues:string[];fingerprint:string;}
export function frameStrengthAudit(frame:UiFrame):FrameStrengthAudit{
  if(!frame||typeof frame!=="object")return {status:"INVALID",issues:["FRAME_INVALID"],fingerprint:"00000000"};
  const issues:string[]=[];const gate=frameIntegrity(frame);if(gate!=="SEALED")issues.push(`FRAME_${gate}`);
  if(frame.lines.length!==frame.budget.lines)issues.push("LINE_ACCOUNTING");if(frame.lines.some(x=>x.length===0))issues.push("EMPTY_LINE");if(frame.accessibility.length>500)issues.push("A11Y_LIMIT");if(frame.health.length>200)issues.push("HEALTH_LIMIT");
  const basis=[frame.title,...frame.lines,...frame.accessibility,...frame.health,String(frame.budget.chars),String(frame.budget.lines),String(frame.budget.truncated)].join("\u001f");let h=2166136261;for(let i=0;i<basis.length;i++)h=Math.imul(h^basis.charCodeAt(i),16777619)>>>0;const unique=[...new Set(issues)];return {status:unique.length?"DEGRADED":"SEALED",issues:unique,fingerprint:h.toString(16).padStart(8,"0")};
}
