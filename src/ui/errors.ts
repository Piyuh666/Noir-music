import { errorEmbed } from "./embeds";
export function uiError(title:string,why:string,action:string,code:string){return errorEmbed(title,`${why}\n\nTRY:\n• ${action}`,code);}
