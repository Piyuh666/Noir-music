import type { ButtonInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from "discord.js";
import { UIAction } from "../actions";
import type { UIHandler } from "../router";
import { type DedicatedHandlerContract, assertHandlerRuntimeIntegrity, handlerRuntimeSnapshot } from "./runtime";
import { handlePlayerPrevious, HANDLEPLAYERPREVIOUS_CONTRACT } from "./playerPrevious";
import { handlePlayerPlayPause, HANDLEPLAYERPLAYPAUSE_CONTRACT } from "./playerPlayPause";
import { handlePlayerSkip, HANDLEPLAYERSKIP_CONTRACT } from "./playerSkip";
import { handlePlayerLoop, HANDLEPLAYERLOOP_CONTRACT } from "./playerLoop";
import { handlePlayerShuffle, HANDLEPLAYERSHUFFLE_CONTRACT } from "./playerShuffle";
import { handlePlayerQueue, PLAYER_QUEUE_CONTRACT } from "./playerQueue";
import { handlePlayerLyrics, PLAYER_LYRICS_CONTRACT } from "./playerLyrics";
import { handlePlayerFavorite, PLAYER_FAVORITE_CONTRACT } from "./playerFavorite";
import { handlePlayerRefresh, PLAYER_REFRESH_CONTRACT } from "./playerRefresh";
import { handlePlayerMatrix } from "./playerMatrix";
import { handlePlayerDashboard } from "./playerDashboard";
import { handlePlayerClose } from "./playerClose";
import { handlePlayerVolumeDown, HANDLEPLAYERVOLUMEDOWN_CONTRACT } from "./playerVolumeDown";
import { handlePlayerVolumeMute, HANDLEPLAYERVOLUMEMUTE_CONTRACT } from "./playerVolumeMute";
import { handlePlayerVolumeUp, HANDLEPLAYERVOLUMEUP_CONTRACT } from "./playerVolumeUp";
import { handlePlayerReplay, HANDLEPLAYERREPLAY_CONTRACT } from "./playerReplay";
import { handlePlayerStop, HANDLEPLAYERSTOP_CONTRACT } from "./playerStop";
import { handleQueuePrevious, QUEUE_PREVIOUS_CONTRACT } from "./queuePrevious";
import { handleQueueNext, QUEUE_NEXT_CONTRACT } from "./queueNext";
import { handleHelpCategory, HELP_CATEGORY_CONTRACT } from "./helpCategory";
import { handleHelpBack, HELP_BACK_CONTRACT } from "./helpBack";
import { handleHelpSearch, HELP_SEARCH_CONTRACT } from "./helpSearch";
import { handleHelpSearchSubmit, HELP_SEARCH_SUBMIT_CONTRACT } from "./helpSearchSubmit";
import { handleMatrixRefresh, MATRIX_REFRESH_CONTRACT } from "./matrixRefresh";
import { handleMatrixBack, MATRIX_BACK_CONTRACT } from "./matrixBack";
import { handleDashboardRefresh, DASHBOARD_REFRESH_CONTRACT } from "./dashboardRefresh";
import { handleDashboardQueue, DASHBOARD_QUEUE_CONTRACT } from "./dashboardQueue";
import { handleDashboardVolume, DASHBOARD_VOLUME_CONTRACT } from "./dashboardVolume";
import { handleDashboardEffects, DASHBOARD_EFFECTS_CONTRACT } from "./dashboardEffects";
import { handleDashboardAutoplay, DASHBOARD_AUTOPLAY_CONTRACT } from "./dashboardAutoplay";
import { handleDashboardSource, DASHBOARD_SOURCE_CONTRACT } from "./dashboardSource";
import { handleDashboardPlayer, DASHBOARD_PLAYER_CONTRACT } from "./dashboardPlayer";
import { PLAYER_MATRIX_CONTRACT } from "./playerMatrix";
import { PLAYER_DASHBOARD_CONTRACT } from "./playerDashboard";
import { PLAYER_CLOSE_CONTRACT } from "./playerClose";

const asButton=(fn:(i:ButtonInteraction)=>Promise<void>):UIHandler=>i=>fn(i as ButtonInteraction);
const asSelect=(fn:(i:StringSelectMenuInteraction)=>Promise<void>):UIHandler=>i=>fn(i as StringSelectMenuInteraction);
const asModal=(fn:(i:ModalSubmitInteraction)=>Promise<void>):UIHandler=>i=>fn(i as ModalSubmitInteraction);

export const CANONICAL_UI_HANDLERS:Readonly<Record<string,UIHandler>>=Object.freeze({
 [UIAction.PLAYER_PREVIOUS]:asButton(handlePlayerPrevious),[UIAction.PLAYER_PLAY_PAUSE]:asButton(handlePlayerPlayPause),[UIAction.PLAYER_SKIP]:asButton(handlePlayerSkip),[UIAction.PLAYER_LOOP]:asButton(handlePlayerLoop),[UIAction.PLAYER_SHUFFLE]:asButton(handlePlayerShuffle),[UIAction.PLAYER_QUEUE]:asButton(handlePlayerQueue),[UIAction.PLAYER_LYRICS]:asButton(handlePlayerLyrics),[UIAction.PLAYER_FAVORITE]:asButton(handlePlayerFavorite),[UIAction.PLAYER_REFRESH]:asButton(handlePlayerRefresh),[UIAction.PLAYER_MATRIX]:asButton(handlePlayerMatrix),[UIAction.PLAYER_DASHBOARD]:asButton(handlePlayerDashboard),[UIAction.PLAYER_CLOSE]:asButton(handlePlayerClose),[UIAction.PLAYER_VOLUME_DOWN]:asButton(handlePlayerVolumeDown),[UIAction.PLAYER_VOLUME_MUTE]:asButton(handlePlayerVolumeMute),[UIAction.PLAYER_VOLUME_UP]:asButton(handlePlayerVolumeUp),[UIAction.PLAYER_REPLAY]:asButton(handlePlayerReplay),[UIAction.PLAYER_STOP]:asButton(handlePlayerStop),[UIAction.QUEUE_PREVIOUS]:asButton(handleQueuePrevious),[UIAction.QUEUE_NEXT]:asButton(handleQueueNext),[UIAction.HELP_CATEGORY]:asSelect(handleHelpCategory),[UIAction.HELP_BACK]:asButton(handleHelpBack),[UIAction.HELP_SEARCH]:asButton(handleHelpSearch),[UIAction.HELP_SEARCH_SUBMIT]:asModal(handleHelpSearchSubmit),[UIAction.MATRIX_REFRESH]:asButton(handleMatrixRefresh),[UIAction.MATRIX_BACK]:asButton(handleMatrixBack),[UIAction.DASHBOARD_REFRESH]:asButton(handleDashboardRefresh),[UIAction.DASHBOARD_QUEUE]:asButton(handleDashboardQueue),[UIAction.DASHBOARD_VOLUME]:asButton(handleDashboardVolume),[UIAction.DASHBOARD_EFFECTS]:asButton(handleDashboardEffects),[UIAction.DASHBOARD_AUTOPLAY]:asButton(handleDashboardAutoplay),[UIAction.DASHBOARD_SOURCE]:asButton(handleDashboardSource),[UIAction.DASHBOARD_PLAYER]:asButton(handleDashboardPlayer),
});

export const DEDICATED_HANDLER_CONTRACTS:ReadonlyArray<DedicatedHandlerContract>=Object.freeze([
 HANDLEPLAYERPREVIOUS_CONTRACT,HANDLEPLAYERPLAYPAUSE_CONTRACT,HANDLEPLAYERSKIP_CONTRACT,HANDLEPLAYERLOOP_CONTRACT,HANDLEPLAYERSHUFFLE_CONTRACT,PLAYER_QUEUE_CONTRACT,PLAYER_LYRICS_CONTRACT,PLAYER_FAVORITE_CONTRACT,PLAYER_REFRESH_CONTRACT,PLAYER_MATRIX_CONTRACT,PLAYER_DASHBOARD_CONTRACT,PLAYER_CLOSE_CONTRACT,HANDLEPLAYERVOLUMEDOWN_CONTRACT,HANDLEPLAYERVOLUMEMUTE_CONTRACT,HANDLEPLAYERVOLUMEUP_CONTRACT,HANDLEPLAYERREPLAY_CONTRACT,HANDLEPLAYERSTOP_CONTRACT,QUEUE_PREVIOUS_CONTRACT,QUEUE_NEXT_CONTRACT,HELP_CATEGORY_CONTRACT,HELP_BACK_CONTRACT,HELP_SEARCH_CONTRACT,HELP_SEARCH_SUBMIT_CONTRACT,MATRIX_REFRESH_CONTRACT,MATRIX_BACK_CONTRACT,DASHBOARD_REFRESH_CONTRACT,DASHBOARD_QUEUE_CONTRACT,DASHBOARD_VOLUME_CONTRACT,DASHBOARD_EFFECTS_CONTRACT,DASHBOARD_AUTOPLAY_CONTRACT,DASHBOARD_SOURCE_CONTRACT,DASHBOARD_PLAYER_CONTRACT,
]);

export function assertDedicatedHandlerContracts():void{
 const ids=DEDICATED_HANDLER_CONTRACTS.map(c=>c.id);
 if(ids.length!==(Object.values(UIAction) as string[]).length)throw new Error(`UI_DEDICATED_HANDLER_COUNT:${ids.length}/${(Object.values(UIAction) as string[]).length}`);
 if(new Set(ids).size!==ids.length)throw new Error("UI_DEDICATED_HANDLER_DUPLICATE");
 for(const id of Object.values(UIAction) as string[])if(!ids.includes(id)||!CANONICAL_UI_HANDLERS[id])throw new Error(`UI_DEDICATED_HANDLER_MISSING:${id}`);
}

assertDedicatedHandlerContracts();
assertHandlerRuntimeIntegrity(DEDICATED_HANDLER_CONTRACTS);
import { assertHandlerPolicyCompleteness } from "./runtime";
assertHandlerPolicyCompleteness(DEDICATED_HANDLER_CONTRACTS);
export function canonicalUIHandlerIds():readonly string[]{return Object.freeze(Object.keys(CANONICAL_UI_HANDLERS));}

export function dedicatedHandlerRuntimeStatus() {
  return Object.freeze({ contracts: DEDICATED_HANDLER_CONTRACTS.length, handlers: Object.keys(CANONICAL_UI_HANDLERS).length, metrics: handlerRuntimeSnapshot() });
}
