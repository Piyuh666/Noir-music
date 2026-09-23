import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from "discord.js";
import { safeCustomId, fitButtonLabel, clampInt } from "./surface";
import { UIAction } from "./actions";
import { assertUIActionKnown } from "./actionRegistry";
import { matrixButtonLabel, matrixLabel, matrixEmoji } from "./glyphMatrixUi";
import { NOIR_UI_VERSION } from "./uiVersion";

/** NOIR MUSIC // CANONICAL GLYPH-MATRIX COMPONENTS
 * Glyph Matrix is the only icon grammar; buttons use canonical Glyph Matrix symbols exclusively.
 */
export const UI = Object.freeze({
  version: NOIR_UI_VERSION,
  ids: Object.freeze({
    player: Object.freeze({
      previous:UIAction.PLAYER_PREVIOUS, playPause:UIAction.PLAYER_PLAY_PAUSE, skip:UIAction.PLAYER_SKIP, loop:UIAction.PLAYER_LOOP, shuffle:UIAction.PLAYER_SHUFFLE,
      queue:UIAction.PLAYER_QUEUE, lyrics:UIAction.PLAYER_LYRICS, favorite:UIAction.PLAYER_FAVORITE, refresh:UIAction.PLAYER_REFRESH, close:UIAction.PLAYER_CLOSE,
      dashboard:UIAction.PLAYER_DASHBOARD, matrix:UIAction.PLAYER_MATRIX, queuePrev:UIAction.QUEUE_PREVIOUS, queueNext:UIAction.QUEUE_NEXT,
      volumeDown:UIAction.PLAYER_VOLUME_DOWN, volumeUp:UIAction.PLAYER_VOLUME_UP, mute:UIAction.PLAYER_VOLUME_MUTE, replay:UIAction.PLAYER_REPLAY, stop:UIAction.PLAYER_STOP,
    }),
    help:{ category:UIAction.HELP_CATEGORY, back:UIAction.HELP_BACK, search:UIAction.HELP_SEARCH },
    matrix:{ refresh:UIAction.MATRIX_REFRESH, back:UIAction.MATRIX_BACK },
    dashboard:{ refresh:UIAction.DASHBOARD_REFRESH, queue:UIAction.DASHBOARD_QUEUE, volume:UIAction.DASHBOARD_VOLUME, effects:UIAction.DASHBOARD_EFFECTS, autoplay:UIAction.DASHBOARD_AUTOPLAY, source:UIAction.DASHBOARD_SOURCE, player:UIAction.DASHBOARD_PLAYER },
  }),
});
export const UI_RENDERED_ACTION_IDS = Object.freeze([
  UI.ids.player.previous, UI.ids.player.playPause, UI.ids.player.skip, UI.ids.player.loop, UI.ids.player.shuffle,
  UI.ids.player.queue, UI.ids.player.lyrics, UI.ids.player.favorite, UI.ids.player.refresh, UI.ids.player.close,
  UI.ids.player.dashboard, UI.ids.player.matrix, UI.ids.player.queuePrev, UI.ids.player.queueNext,
  UI.ids.player.volumeDown, UI.ids.player.volumeUp, UI.ids.player.mute, UI.ids.player.replay, UI.ids.player.stop,
  UI.ids.help.category, UI.ids.help.back, UI.ids.help.search, UI.ids.matrix.refresh, UI.ids.matrix.back,
  UI.ids.dashboard.refresh, UI.ids.dashboard.queue, UI.ids.dashboard.volume, UI.ids.dashboard.effects,
  UI.ids.dashboard.autoplay, UI.ids.dashboard.source, UI.ids.dashboard.player,
] as const);
export const UI_FLOW_ACTION_IDS = Object.freeze([UIAction.HELP_SEARCH_SUBMIT] as const);

const canonicalId=(id:string):string=>assertUIActionKnown(id);
const button=(id:string,label:string,style=ButtonStyle.Secondary,disabled=false)=>{
  const actionKey = Object.entries(UI.ids).flatMap(([,group]) => Object.entries(group as Record<string,string>)).find(([,value]) => value===id)?.[0];
  const emojiValue = actionKey ? matrixEmoji(actionKey) : undefined;
  const builder = new ButtonBuilder()
    .setCustomId(safeCustomId(canonicalId(id)))
    .setLabel(fitButtonLabel(label))
    .setStyle(style).setDisabled(Boolean(disabled));
  if (emojiValue) builder.setEmoji(emojiValue);
  return builder;
};

export function playerControls(opts:{paused?:boolean;hasQueue?:boolean;loop?:string;disabled?:boolean;muted?:boolean}={}){
  const d=Boolean(opts.disabled); const q=d||!opts.hasQueue;
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      button(UI.ids.player.previous,matrixLabel("previous"),ButtonStyle.Secondary,q),
      button(UI.ids.player.playPause,matrixButtonLabel("playPause",opts),ButtonStyle.Primary,d),
      button(UI.ids.player.skip,matrixLabel("skip"),ButtonStyle.Secondary,q),
      button(UI.ids.player.loop,matrixButtonLabel("loop",opts)),
      button(UI.ids.player.shuffle,matrixLabel("shuffle"),ButtonStyle.Secondary,q)),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      button(UI.ids.player.queue,matrixLabel("queue")),button(UI.ids.player.lyrics,matrixLabel("lyrics")),
      button(UI.ids.player.favorite,matrixLabel("favorite"),ButtonStyle.Secondary,d),button(UI.ids.player.refresh,matrixLabel("refresh")),
      button(UI.ids.player.matrix,matrixLabel("matrix"),ButtonStyle.Primary)),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      button(UI.ids.player.volumeDown,matrixLabel("volumeDown"),ButtonStyle.Secondary,d),
      button(UI.ids.player.mute,matrixButtonLabel("mute",opts),ButtonStyle.Secondary,d),
      button(UI.ids.player.volumeUp,matrixLabel("volumeUp"),ButtonStyle.Secondary,d),
      button(UI.ids.player.replay,matrixLabel("replay"),ButtonStyle.Secondary,d||!opts.hasQueue),
      button(UI.ids.player.stop,matrixLabel("stop"),ButtonStyle.Danger,d||!opts.hasQueue)),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      button(UI.ids.player.dashboard,matrixLabel("dashboard"),ButtonStyle.Primary),
      button(UI.ids.player.close,matrixLabel("close"),ButtonStyle.Danger)),
  ];
}

export function dashboardControls(){return [
  new ActionRowBuilder<ButtonBuilder>().addComponents(button(UI.ids.dashboard.refresh,matrixLabel("refresh"),ButtonStyle.Primary),button(UI.ids.dashboard.player,matrixLabel("player")),button(UI.ids.dashboard.queue,matrixLabel("queue")),button(UI.ids.dashboard.volume,matrixLabel("volume")),button(UI.ids.player.close,matrixLabel("close"),ButtonStyle.Danger)),
  new ActionRowBuilder<ButtonBuilder>().addComponents(button(UI.ids.dashboard.effects,matrixLabel("effects")),button(UI.ids.dashboard.autoplay,matrixLabel("autoplay")),button(UI.ids.dashboard.source,matrixLabel("source")),button(UI.ids.player.matrix,matrixLabel("matrix"))),
];}
export function helpControls(categories:string[]){const values=[...new Set(categories)].slice(0,25);const menu=new StringSelectMenuBuilder().setCustomId(UI.ids.help.category).setPlaceholder(`${matrixLabel("category")} / PIXEL MODULE`).addOptions(values.map(c=>({label:c.toUpperCase().slice(0,100),value:c.slice(0,100),description:"OPEN GLYPH MATRIX MODULE"})));return [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)];}
export function helpBackControl(){return [new ActionRowBuilder<ButtonBuilder>().addComponents(button(UI.ids.help.back,matrixLabel("back")),button(UI.ids.help.search,matrixLabel("search")))];}
export function matrixControls(){return [new ActionRowBuilder<ButtonBuilder>().addComponents(button(UI.ids.matrix.refresh,matrixLabel("refresh"),ButtonStyle.Primary),button(UI.ids.matrix.back,matrixLabel("back")))];}
export function queueControls(page:number,pages:number){const current=clampInt(page,1,9999,1),total=clampInt(pages,1,9999,1);return [new ActionRowBuilder<ButtonBuilder>().addComponents(button(UI.ids.player.queuePrev,matrixLabel("previous"),ButtonStyle.Secondary,current<=1),button(UI.ids.player.queueNext,matrixLabel("skip"),ButtonStyle.Secondary,current>=total),button(UI.ids.player.refresh,matrixLabel("refresh")),button(UI.ids.player.matrix,matrixLabel("matrix"),ButtonStyle.Primary))];}
export function volumeControls(){return [new ActionRowBuilder<ButtonBuilder>().addComponents(button(UI.ids.player.volumeDown,matrixLabel("volumeDown")),button(UI.ids.player.mute,matrixLabel("mute")),button(UI.ids.player.volumeUp,matrixLabel("volumeUp")),button(UI.ids.player.refresh,matrixLabel("refresh")))];}
export function playerControlsDense(opts:{paused?:boolean;hasQueue?:boolean;loop?:string;disabled?:boolean;muted?:boolean}={}) { return playerControls(opts); }
export function navigationControls(opts:{backId?:string;backLabel?:string;refreshId?:string;refreshLabel?:string;closeId?:string;closeLabel?:string}={}) { return [new ActionRowBuilder<ButtonBuilder>().addComponents(button(opts.backId ?? UI.ids.help.back, opts.backLabel ?? matrixLabel("back")),button(opts.refreshId ?? UI.ids.player.refresh, opts.refreshLabel ?? matrixLabel("refresh"),ButtonStyle.Primary),button(opts.closeId ?? UI.ids.player.close, opts.closeLabel ?? matrixLabel("close"),ButtonStyle.Danger))]; }
export function playerControlsUltra(opts:{paused?:boolean;hasQueue?:boolean;loop?:string;disabled?:boolean;muted?:boolean}={}) { return playerControls(opts); }
export function queueControlsUltra(page:number,pages:number,busy=false) { const rows=queueControls(page,pages); return busy ? rows.map(row=>new ActionRowBuilder<ButtonBuilder>().addComponents(row.components.map(component=>ButtonBuilder.from(component).setDisabled(true)))) : rows; }
export function uxNavigationRail(opts:{back?:string;refresh?:string;next?:string;close?:string}={}) { return [new ActionRowBuilder<ButtonBuilder>().addComponents(button(UI.ids.help.back,opts.back??matrixLabel("back")),button(UI.ids.player.refresh,opts.refresh??matrixLabel("refresh"),ButtonStyle.Primary),button(UI.ids.player.queueNext,opts.next??matrixLabel("skip")),button(UI.ids.player.close,opts.close??matrixLabel("close"),ButtonStyle.Danger))]; }
