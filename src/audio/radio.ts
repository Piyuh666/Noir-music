export interface RadioStation {
  id: string;
  name: string;
  searchQuery: string;
}

export const STATIONS: RadioStation[] = [
  { id: "lofi", name: "LoFi Focus", searchQuery: "lofi hip hop radio mix" },
  { id: "edm", name: "EDM Pulse", searchQuery: "edm dance radio mix" },
  { id: "jazz", name: "Late Night Jazz", searchQuery: "smooth jazz radio mix" },
  { id: "rock", name: "Classic Rock", searchQuery: "classic rock radio mix" },
  { id: "pop", name: "Pop Hits", searchQuery: "top pop hits radio mix" },
  { id: "hiphop", name: "HipHop Flow", searchQuery: "hip hop radio mix" },
  { id: "ambient", name: "Ambient Space", searchQuery: "ambient space music mix" },
];
