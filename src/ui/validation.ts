import { UI_ACTION_IDS, type UIActionId } from "./actions";
const CONTROL_RE = /[\u0000-\u001F\u007F]/g;
export function sanitizeUIText(value:unknown,max=256):string{return String(value??"").replace(CONTROL_RE," ").replace(/[\r\n]+/g," ").trim().slice(0,max);}
export function validateCustomId(id:string):boolean{return id.length>0&&id.length<=100&&!CONTROL_RE.test(id)&&UI_ACTION_IDS.includes(id as UIActionId);}
export function clampPage(page:number,pages:number):number{return Math.max(1,Math.min(Math.max(1,pages),Number.isFinite(page)?Math.floor(page):1));}
export function paginate<T>(items:readonly T[],page:number,size:number){const pageSize=Math.max(1,Math.min(25,Math.floor(size)));const pages=Math.max(1,Math.ceil(items.length/pageSize));const current=clampPage(page,pages);const start=(current-1)*pageSize;return {items:items.slice(start,start+pageSize),page:current,pages,total:items.length,start};}
