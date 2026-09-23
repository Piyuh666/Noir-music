import type { ButtonInteraction, StringSelectMenuInteraction, ModalSubmitInteraction } from "discord.js";
import { assertUIActionKnown, getUIAction, listUIActions } from "./actionRegistry";
import type { UIActionId } from "./actions";
export type UIInteraction = ButtonInteraction|StringSelectMenuInteraction|ModalSubmitInteraction;
export type UIHandler = (interaction:UIInteraction)=>Promise<void>;
const handlers = new Map<UIActionId,UIHandler>();
export function registerUIHandler(id:string,handler:UIHandler){const actionId = assertUIActionKnown(id);if(handlers.has(actionId))throw new Error(`Duplicate UI handler: ${id}`);handlers.set(actionId,handler);}
export function hasUIHandler(id:string){return handlers.has(assertUIActionKnown(id));}
function interactionKind(interaction:UIInteraction): "button"|"select"|"modal" { if(interaction.isButton()) return "button"; if(interaction.isStringSelectMenu()) return "select"; return "modal"; }
export async function routeUIInteraction(interaction:UIInteraction):Promise<boolean>{
  const id=interaction.customId;
  const actionId = assertUIActionKnown(id);
  const handler=handlers.get(actionId);
  if(!handler)return false;
  const definition=getUIAction(actionId);
  if(!definition) throw new Error(`Unknown UI action: ${id}`);
  if(definition.interaction!==interactionKind(interaction)) throw new Error(`UI interaction kind mismatch: ${id}`);
  await handler(interaction);
  return true;
}
export function uiRouterAudit(){
  const registered=[...handlers.keys()];
  const known=listUIActions().map((action)=>action.id);
  const knownSet=new Set(known);
  const unhandled=known.filter(id=>!handlers.has(id));
  const dead=registered.filter(id=>!knownSet.has(id));
  return {registered,unhandled,dead,count:registered.length};
}
export function assertUIRouterComplete(requiredIds: readonly string[]): void { const missing=requiredIds.filter(id=>!handlers.has(assertUIActionKnown(id))); if(missing.length) throw new Error(`UI router incomplete: ${missing.join(", ")}`); }
export function assertUIRouterNoDeadHandlers(renderedOrKnownIds: readonly string[]): void { const allowed=new Set(renderedOrKnownIds); const dead=[...handlers.keys()].filter(id=>!allowed.has(id as UIActionId)); if(dead.length) throw new Error(`UI router contains unreachable handlers: ${dead.join(", ")}`); }
