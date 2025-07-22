const BASE_URL = "https://animetsu.to";
const HEADERS = { Referer: "https://animetsu.to/" };
const SCRAPED_PROVIDER = "zaza";

async function search(query) {
  const response = await fetch(
    `https://backend.animetsu.to/api/anime/search?query=${encodeURIComponent(
      query
    )}&page=1`,
    { headers: HEADERS }
  );
  const json = await response.json();

  const results = [];

  json.results.map((i) => {
    results.push({
      id: i.id,
      title: i.title?.english || i.title?.romaji || "Unknown title",
      image: i.coverImage?.large || i.coverImage?.medium,
      url: `${BASE_URL}/anime/${i.id}`,
    });
  });

  return JSON.stringify(results);
}

async function fetchInfo(id) {
  const response = await fetch(
    `https://backend.animetsu.to/api/anime/info/${id}`,
    { headers: HEADERS }
  );
  const json = await response.json();

  return JSON.stringify({
    description: json.description || "No summary available",
  });
}

async function fetchEpisodes(id) {
  const response = await fetch(
    `https://backend.animetsu.to/api/anime/episodes/${id}`,
    { headers: HEADERS }
  );
  const json = await response.json();

  const episodes = json.find((j) => j.providerId === SCRAPED_PROVIDER);
  if (!episodes) return [];

  results = [];

  episodes.episodes.map((e) => {
    results.push({
      id: `?provider=${SCRAPED_PROVIDER}&id=${id}&num=${e.number}&subType=sub&watchId=${e.id}&dub_id=null`,
      number: e.number,
    });
  });

  return JSON.stringify(results);
}

async function fetchSources(id) {
  const response = await fetch(
    `https://backend.animetsu.to/api/anime/tiddies${id}`,
    {
      headers: HEADERS,
    }
  );

  const json = await response.json();
  if (!json.sources || !Array.isArray(json.sources)) return [];

  const qualities = json.sources.map((s) => ({
    quality: s.quality || "default",
    url: s.url,
    headers: HEADERS,
  }));

  return JSON.stringify([
    {
      label: `Animetsu ${SCRAPED_PROVIDER.toUpperCase()}`,
      type: "hls",
      qualities,
    },
  ]);
}

return {
  search,
  fetchInfo,
  fetchEpisodes,
  fetchSources,
};
