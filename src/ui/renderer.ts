
import { nowPlayingEmbed, queueMatrixEmbed, commandMatrixEmbed } from "./embeds";
import { playerControls, queueControls, helpControls } from "./components";
import type { UIPlayerState } from "./state";
import type { VisualState as RenderVisualState } from "./visualStateMachine";
import { composeUltraUiSurface } from "./ultraWiring";
import { matrixPlayerSurface, matrixQueueSurface, matrixCommandSurface, matrixDesignFor, type MatrixDesign } from "./glyphMatrixUi";

function mapPlayerVisualState(state: UIPlayerState["state"]): RenderVisualState {
  switch (state) {
    case "PLAYING": return "ACTIVE";
    case "PAUSED": return "WARNING";
    case "BUFFERING": return "LOADING";
    case "BUSY": return "LOADING";
    case "RECONNECTING": return "LOADING";
    case "MUTED": return "WARNING";
    default: return state as RenderVisualState;
  }
}
export function renderPlayer(state:UIPlayerState, design?: MatrixDesign){
  if(!state.hasCurrent) return {embeds:[],components:playerControls({disabled:true,hasQueue:false,muted:state.muted})};
  const embed=nowPlayingEmbed({title:state.title,artist:state.artist,positionMs:state.positionMs,durationMs:state.durationMs,volume:state.volume,loop:state.loop,shuffle:state.shuffle,autoplay:state.autoplay,queuePosition:state.queueSize,requester:state.requester,paused:state.state==="PAUSED",source:state.source});
  embed.setAuthor({name:`▦ NOIR MUSIC › PLAYER`});
  embed.setDescription(matrixPlayerSurface({title:state.title,artist:state.artist,source:state.source,state:state.state,positionMs:state.positionMs,durationMs:state.durationMs,volume:state.volume,queueSize:state.queueSize,width:60,design:matrixDesignFor(60,design ?? "OPERATOR"),requester:state.requester}));
  embed.setFooter({text:`▦ PLAYER · ${state.state} · ⌁ GLYPH MATRIX`});
  const ultra = composeUltraUiSurface({title:state.title,artist:state.artist,positionMs:state.positionMs,durationMs:state.durationMs,volume:state.volume,queueSize:state.queueSize,state: mapPlayerVisualState(state.state),source:state.source,requester:state.requester,width:60,design:matrixDesignFor(60,design ?? "OPERATOR")});
  embed.addFields({name:"▦ GLYPH MATRIX FIELD",value:ultra.join("\n").slice(0,1024)});
  return {embeds:[embed],components:playerControls({paused:state.state==="PAUSED",hasQueue:state.queueSize>0,loop:state.loop,muted:state.muted})};
}
export function renderQueue(tracks:readonly {title:string;artist?:string;duration?:number}[],page:number, design?: MatrixDesign){const pages=Math.max(1,Math.ceil(tracks.length/10));const current=Math.max(1,Math.min(pages,Math.floor(page)));const shown=tracks.slice((current-1)*10,current*10);const embed=queueMatrixEmbed([...tracks],current,10,tracks.length);embed.setDescription(matrixQueueSurface(shown,current,pages,60,matrixDesignFor(60,design ?? "MATRIX")));embed.setFooter({text:`▣ QUEUE · ${current}/${pages} · ⌁ PIXEL MATRIX`});
  const ultra = composeUltraUiSurface({title:"QUEUE FIELD",artist:`${tracks.length} TRACKS`,positionMs:0,durationMs:0,volume:100,queueSize:tracks.length,state:"READY",page:current,pages,queue:tracks.map(t=>({title:t.title,artist:t.artist,duration:t.duration})),width:60,design:matrixDesignFor(60,design ?? "MATRIX")});
  embed.addFields({name:"▦ GLYPH MATRIX FIELD",value:ultra.join("\n").slice(0,1024)});
  return {embeds:[embed],components:queueControls(current,pages)};}
export function renderHelp(categories:string[],total:number, design?: MatrixDesign){const embed=commandMatrixEmbed(categories,total);embed.setAuthor({name:`▤ NOIR MUSIC › COMMAND MATRIX`});embed.setDescription(matrixCommandSurface("COMMAND MATRIX",categories.map(c=>({name:c,description:"OPEN MODULE"})),60,matrixDesignFor(60,design ?? "TERMINAL")));embed.setFooter({text:`▤ COMMAND · ${total} COMMANDS · ⌁ GLYPH MATRIX`});
  const ultra = composeUltraUiSurface({title:"COMMAND MATRIX",artist:categories.join(" · "),positionMs:0,durationMs:0,volume:100,queueSize:0,state:"READY",page:1,pages:1,commands:categories.map(c=>({name:c,description:"OPEN MODULE"})),width:60,design:matrixDesignFor(60,design ?? "TERMINAL")});
  embed.addFields({name:"▦ GLYPH MATRIX FIELD",value:ultra.join("\n").slice(0,1024)});
  return {embeds:[embed],components:helpControls(categories)};}
