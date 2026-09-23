import { registry } from "../commands/registry";
export function searchLiveCommands(query:string){const q=query.trim().toLowerCase();return registry.flatCommands().filter(({fullName,command})=>{const aliases=command.meta.aliases??[];return !q||fullName.toLowerCase().includes(q)||command.meta.description.toLowerCase().includes(q)||aliases.some(a=>a.toLowerCase().includes(q))}).sort((a,b)=>a.fullName.localeCompare(b.fullName)).slice(0,25);}
export function helpCategories(){return registry.categories();}
