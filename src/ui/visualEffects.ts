/** GLYPH-25 strength core: deterministic, static-safe, Unicode-safe and strictly bounded effects. */
const width=(n:number,f=28)=>Math.max(1,Math.min(120,Number.isFinite(n)?Math.floor(n):f));
const phase=(n:number,max:number)=>{const p=Number.isFinite(n)?Math.trunc(n):0;return ((p%max)+max)%max;};
const glyph=(g:unknown,fallback:string)=>{const s=String(g??"").replace(/[\r\n\u0000-\u001F\u007F]/g,"");return [...s][0]||fallback;};
const safeText=(x:unknown)=>String(x??"").replace(/[\r\n]+/g," ").replace(/[\u0000-\u001F\u007F]/g," ").slice(0,120);
export function scanline(w=28,glyphChar="─"):string{return glyph(glyphChar,"─").repeat(width(w));}
export function pulseFrame(w=28,phaseValue=0):string{const glyphs=["·",":","+","#"];return glyphs[phase(phaseValue,4)].repeat(width(w));}
export function shimmer(text:string,offset=0):string{const input=safeText(text),o=Number.isFinite(offset)?Math.trunc(offset):0;return [...input].map((c,i)=>((i+o)%7===0?"█":c)).join("").slice(0,120);}
export function sweep(text:string,offset=0):string{const input=safeText(text);if(!input)return input;const chars=[...input],i=phase(offset,chars.length);return chars.map((c,j)=>j===i?"◆":c).join("").slice(0,120);}
export function noise(w=24,h=3,seed=1):string[]{const ww=width(w,24),hh=Math.max(1,Math.min(20,Number.isFinite(h)?Math.floor(h):3));let x=(Number.isFinite(seed)?Math.trunc(seed):1)>>>0;const next=()=>{x=(x*1664525+1013904223)>>>0;return x%2};return Array.from({length:hh},()=>Array.from({length:ww},()=>next()?"·":" ").join(""));}
export function effectHealth(text:string):string[]{const s=String(text??""),errors:string[]=[];if([...s].length>120)errors.push("WIDTH_OVERFLOW");if(/[\r\n]/.test(s))errors.push("CONTROL_CHAR");if(/[\u0000-\u001F\u007F]/.test(s))errors.push("UNSAFE_CONTROL");return errors;}
export function effectSeal(text:string):"SEALED"|"DEGRADED"{return effectHealth(text).length?"DEGRADED":"SEALED";}


/** GLYPH-30 strength hardening: effect-output audit; presentation remains unchanged. */
export function effectStrengthAudit(text:string,widthLimit=120):"SEALED"|"DEGRADED"|"INVALID"{
  if(typeof text!=="string")return "INVALID"; const chars=[...text]; if(chars.length>Math.max(1,Math.min(120,Math.floor(widthLimit))))return "DEGRADED"; if(effectSeal(text)!=="SEALED")return "DEGRADED"; if(/[\u0000-\u001F\u007F\r\n]/.test(text))return "DEGRADED"; return "SEALED";
}
