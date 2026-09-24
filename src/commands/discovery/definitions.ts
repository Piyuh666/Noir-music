import { DiscoveryDef } from "./discoveryFactory";

/**
 * All 35 discovery commands as data. Every one performs a real search
 * against the audio provider layer (see discoveryFactory.ts) — nothing
 * here is a static/fake response. Commands without a licensed charts or
 * recommendation API behind them (trending, popular, charts, hidden-gems,
 * etc.) carry an honest heuristicNote saying so, per the "never fake a
 * working feature" rule — they still genuinely search and queue, they
 * just aren't backed by an official charts feed in this build.
 */
export const DISCOVERY_DEFS: DiscoveryDef[] = [
  { id: "search", label: "Search", description: "Search and queue the top match.", mode: "query" },
  { id: "song", label: "Song", description: "Search for a specific song by name.", mode: "query" },
  { id: "artist", label: "Artist", description: "Queue tracks from an artist.", mode: "typed", optionName: "artist", optionDescription: "Artist name", template: "{value} popular tracks", resultCount: 5 },
  { id: "album", label: "Album", description: "Queue a full album.", mode: "typed", optionName: "album", optionDescription: "Album name", template: "{value} full album", resultCount: 10 },
  { id: "playlist-search", label: "Playlist Search", description: "Search for a public playlist by theme.", mode: "typed", optionName: "theme", optionDescription: "Playlist theme", template: "{value} playlist mix", resultCount: 10 },
  { id: "genre", label: "Genre", description: "Queue tracks from a genre.", mode: "typed", optionName: "genre", optionDescription: "Genre name", template: "best {value} tracks", resultCount: 5 },
  { id: "recommend", label: "Recommend", description: "Get recommendations based on what's currently playing.", mode: "seed", template: "similar artists mix", resultCount: 5, heuristicNote: "search-based, not a dedicated recommendation API" },
  { id: "similar", label: "Similar", description: "Find tracks similar to the current one.", mode: "seed", template: "similar songs", resultCount: 5, heuristicNote: "search-based" },
  { id: "trending", label: "Trending", description: "Queue currently trending tracks.", mode: "random", resultCount: 5, heuristicNote: "search-engine trending, not a licensed charts feed" },
  { id: "popular", label: "Popular", description: "Queue widely popular tracks.", mode: "query", template: "most popular", resultCount: 5 },
  { id: "new-releases", label: "New Releases", description: "Queue recent releases matching a query.", mode: "typed", optionName: "genre", optionDescription: "Genre or artist", template: "{value} new releases", resultCount: 5 },
  { id: "discover", label: "Discover", description: "Queue a batch of unfamiliar tracks in a mood.", mode: "typed", optionName: "mood", optionDescription: "Mood or vibe", template: "{value} hidden gems", resultCount: 5, heuristicNote: "search-based" },
  { id: "random-track", label: "Random Track", description: "Queue one random track from a rotating set of moods.", mode: "random" },
  { id: "mood", label: "Mood", description: "Queue tracks for a mood.", mode: "typed", optionName: "mood", optionDescription: "e.g. happy, sad, hype", template: "{value} mood mix", resultCount: 5 },
  { id: "activity", label: "Activity", description: "Queue tracks suited to an activity.", mode: "typed", optionName: "activity", optionDescription: "e.g. studying, driving, gym", template: "music for {value}", resultCount: 5 },
  { id: "related", label: "Related", description: "Queue tracks related to the current one.", mode: "seed", template: "related tracks", resultCount: 5 },
  { id: "artist-radio", label: "Artist Radio", description: "Start a continuous mix seeded on the current artist.", mode: "seed", template: "radio mix", resultCount: 10 },
  { id: "song-radio", label: "Song Radio", description: "Start a continuous mix seeded on the current song.", mode: "seed", template: "radio", resultCount: 10 },
  { id: "genre-radio", label: "Genre Radio", description: "Start a continuous mix for a genre.", mode: "typed", optionName: "genre", optionDescription: "Genre name", template: "{value} radio mix", resultCount: 10 },
  { id: "decade", label: "Decade", description: "Queue hits from a decade.", mode: "typed", optionName: "decade", optionDescription: "e.g. 80s, 90s, 2000s", template: "{value} hits", resultCount: 5 },
  { id: "year", label: "Year", description: "Queue hits from a specific year.", mode: "typed", optionName: "year", optionDescription: "e.g. 2016", template: "top songs {value}", resultCount: 5 },
  { id: "chart-global", label: "Global Chart", description: "Queue tracks from the current global chart.", mode: "query", template: "global top charts", resultCount: 10, heuristicNote: "search-based, not an official charts API" },
  { id: "chart-country", label: "Country Chart", description: "Queue tracks from a country's chart.", mode: "typed", optionName: "country", optionDescription: "Country name", template: "{value} top charts", resultCount: 10, heuristicNote: "search-based" },
  { id: "top-tracks", label: "Top Tracks", description: "Queue an artist's top tracks.", mode: "typed", optionName: "artist", optionDescription: "Artist name", template: "{value} top tracks", resultCount: 5 },
  { id: "hidden-gems", label: "Hidden Gems", description: "Queue lesser-known tracks in a genre.", mode: "typed", optionName: "genre", optionDescription: "Genre name", template: "{value} hidden gems underrated", resultCount: 5, heuristicNote: "search-based" },
  { id: "deep-cuts", label: "Deep Cuts", description: "Queue deep-cut tracks from an artist.", mode: "typed", optionName: "artist", optionDescription: "Artist name", template: "{value} deep cuts b-sides", resultCount: 5 },
  { id: "label", label: "Label", description: "Queue tracks from a record label.", mode: "typed", optionName: "label", optionDescription: "Label name", template: "{value} record label mix", resultCount: 5 },
  { id: "producer", label: "Producer", description: "Queue tracks by a producer.", mode: "typed", optionName: "producer", optionDescription: "Producer name", template: "produced by {value}", resultCount: 5 },
  { id: "collab-search", label: "Collab Search", description: "Search for collaborations between two artists.", mode: "typed", optionName: "artists", optionDescription: "e.g. Artist A x Artist B", template: "{value} collab", resultCount: 5 },
  { id: "remix-search", label: "Remix Search", description: "Search for a remix of a track.", mode: "typed", optionName: "song", optionDescription: "Song name", template: "{value} remix", resultCount: 5 },
  { id: "live-version-search", label: "Live Version", description: "Search for a live version of a track.", mode: "typed", optionName: "song", optionDescription: "Song name", template: "{value} live version", resultCount: 5 },
  { id: "acoustic-search", label: "Acoustic Version", description: "Search for an acoustic version of a track.", mode: "typed", optionName: "song", optionDescription: "Song name", template: "{value} acoustic version", resultCount: 5 },
  { id: "instrumental-search", label: "Instrumental Version", description: "Search for an instrumental version of a track.", mode: "typed", optionName: "song", optionDescription: "Song name", template: "{value} instrumental", resultCount: 5 },
  { id: "cover-search", label: "Cover Search", description: "Search for a cover of a track.", mode: "typed", optionName: "song", optionDescription: "Song name", template: "{value} cover", resultCount: 5 },
  { id: "bpm-search", label: "BPM Search", description: "Search for tracks around a target tempo.", mode: "typed", optionName: "bpm", optionDescription: "e.g. 128", template: "{value} bpm mix", resultCount: 5, heuristicNote: "search-based; not a true BPM-analyzed database" },
];
