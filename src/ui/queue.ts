import { paginate } from "./validation";
export function queueWindow<T>(tracks:readonly T[],page:number,size=10){return paginate(tracks,page,size);}
