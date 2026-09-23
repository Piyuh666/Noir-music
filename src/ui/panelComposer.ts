/** NOIR MUSIC // GLYPH-13 UX COMPOSITOR — assembles complete Discord-safe presentation surfaces. */
import { uiPage } from "./surface";
import { glyphCornerFrame, glyphMetricWall, glyphRail } from "./glyphArt";
import { pixelCode, pixelHeader, pixelMeter, pixelParagraph } from "./pixel";
import { actionRail, type UXAction, type UXDensity, type UXNotice, normalizeDensity, modeForDensity, noticeLine } from "./uxState";
import { focusRail, interactionFooter, interactionModel, type FocusItem, type FocusMode } from "./interaction";
import { stateSurface, type VisualState } from "./visualStates";

export interface UXPanel { id: string; title: string; state: VisualState; body: string; footer?: string; }

export function panel(input: UXPanel, width = 52): string {
  return glyphCornerFrame(input.title, [stateSurface(input.state,input.title,input.body,"",0,width), input.footer || ""].filter(Boolean), {width,tone:"PANEL"});
}
export function hero(title: string, subtitle: string, body: string, density: UXDensity = "STANDARD", seed = "NOIR MUSIC"): string {
  const mode = modeForDensity(normalizeDensity(density)); const width = mode === "compact" ? 40 : mode === "operator" ? 64 : mode === "dense" ? 56 : 48;
  return glyphCornerFrame(title, [pixelHeader(title,seed.length), pixelParagraph(subtitle,width - 6,2), glyphRail(width - 4,"·"), body, `ID ${pixelCode(seed,10)}`], {width,tone:mode === "operator" ? "OPERATOR" : "DENSE"});
}
export function actionSurface(title: string, actions: readonly UXAction[], focus: FocusMode = "PRIMARY", active = 0, width = 52): string {
  const items: FocusItem[] = actions.map(a=>({id:a.id,label:a.label,hint:a.hint,enabled:a.enabled,state:a.enabled === false ? "DISABLED" : undefined}));
  const model = interactionModel(focus,active,items.length,"FOCUSED",title);
  return glyphCornerFrame(title,[actionRail(actions,width - 4),focusRail(items,active,width - 4),interactionFooter(model,width - 4)],{width,tone:"DENSE"});
}
export function pageSurface<T>(items: readonly T[], page: number, pageSize: number, title: string, render: (item:T,index:number)=>string, width=52): string {
  const p = uiPage(items,page,pageSize); const body = items.slice(p.start,p.end).map((item,i)=>render(item,p.start+i)).join("\n");
  return glyphCornerFrame(title,[body || "○ EMPTY PAGE", `PAGE ${p.page}/${p.pages} · RANGE ${p.start + 1}-${p.end}/${p.total}`, pixelMeter(p.total ? p.end / p.total * 100 : 0,18)],{width,tone:"PANEL"});
}
export function matrixSurface(title:string, rows: readonly {label:string;value:string;meter?:number}[], width=56):string {
  return glyphCornerFrame(title,[glyphMetricWall(rows,width - 4),glyphRail(width - 4,"·")],{width,tone:"OPERATOR"});
}
export function noticeSurface(input: UXNotice, width=52):string { return glyphCornerFrame(input.title,[noticeLine(input),input.detail || "",input.action ? `◆ ${input.action}` : ""].filter(Boolean),{width,tone:"PANEL"}); }
