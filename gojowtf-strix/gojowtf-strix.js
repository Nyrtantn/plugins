const BASE_URL = "https://gojo.live";
const HEADERS = { Referer: "https://gojo.live/" };
const SCRAPED_PROVIDER = "strix";

async function search(query) {
  const response = await fetch(
    `https://backend.gojo.live/api/anime/search?query=${encodeURIComponent(
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
      href: `${BASE_URL}/anime/${i.id}`,
    });
  });

  return JSON.stringify(results);
}

async function fetchInfo(id) {
  const response = await fetch(
    `https://backend.gojo.live/api/anime/info/${id}`,
    { headers: HEADERS }
  );
  const json = await response.json();

  return JSON.stringify({
    description: json.description || "No summary available",
  });
}

async function fetchEpisodes(id) {
  const response = await fetch(
    `https://backend.gojo.live/api/anime/episodes/${id}`,
    { headers: HEADERS }
  );
  const json = await response.json();

  const episodes = json.find((j) => j.providerId === SCRAPED_PROVIDER);
  if (!episodes) return [];

  results = [];

  episodes.episodes.map((e) => {
    results.push({
      href: `?provider=${SCRAPED_PROVIDER}&id=${id}&num=${e.number}&subType=sub&watchId=${e.id}&dub_id=null`,
      number: e.number,
    });
  });

  return JSON.stringify(results);
}

async function fetchSources(href) {
  const response = await fetch(
    `https://backend.gojo.live/api/anime/tiddies${href}`,
    {
      headers: HEADERS,
    }
  );
  const json = await response.json();

  results = {};
  results.sources = [];

  if (!json.sources) return [];

  json.sources.map((s) => {
    results.sources.push({
      url: s.url,
      quality: s.quality,
    });
  });

  results.headers = HEADERS;
  return JSON.stringify(results);
}
