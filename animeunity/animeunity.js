async function search(query) {
  const response = await fetch(
    `https://www.animeunity.so/archivio?title=${query}`
  );
  const html = await response.text();

  const regex = /<archivio[^>]*records="([^"]*)"/;
  const match = regex.exec(html);

  if (!match || !match[1]) {
    return { results: [] };
  }

  const items = JSON.parse(match[1].replaceAll(`&quot;`, `"`));

  const results =
    items.map((item) => ({
      id: item.id,
      title: item.title ?? item.title_eng,
      image: item.imageurl,
      url: `https://www.animeunity.so/info_api/${item.id}`,
    })) || [];

  return JSON.stringify(results);
}

async function fetchInfo(url) {
  const response = await fetch(url);
  const json = JSON.parse(await response.text());

  return JSON.stringify([
    {
      description: json.plot,
      airdate: json.date,
    },
  ]);
}

async function fetchEpisodes(id, page = 1) {
  const episodesPerPage = 120;
  const lastPageEpisode = page * episodesPerPage;
  const firstPageEpisode = lastPageEpisode - (episodesPerPage - 1);
  const url = `https://www.animeunity.so/info_api/${id}`;
  const uurl = `${url}/1?start_range=${firstPageEpisode}&end_range=${lastPageEpisode}`;

  const response = await fetch(uurl);
  const json = JSON.parse(await response.text());

  const response2 = await fetch(url);
  const json2 = JSON.parse(await response2.text());

  const results =
    json.episodes.map((e) => ({
      id: `${json2.id}-${json2.slug}/${e.id}`,
      number: Number(e.number),
    })) || [];

  return JSON.stringify(results);
}
async function fetchSources(id) {
  const url = `https://www.animeunity.so/anime/${id}`;
  const response = await fetch(url);
  const html = await response.text();

  const regex = /<video-player[^>]*embed_url="([^"]+)"/;
  const match = regex.exec(html);
  const embedUrl = match ? match[1].replaceAll("&amp;", "&") : "";

  if (!embedUrl) return null;

  const embedResponse = await fetch(embedUrl);
  const embedHtml = await embedResponse.text();

  const scriptRegex =
    /<script[^>]*>([\s\S]*?window\.video\s*=\s*(\{[\s\S]*?\}));/;
  const scriptMatch = scriptRegex.exec(embedHtml);
  const videoJsonStr = scriptMatch ? scriptMatch[2] : "";

  let video;
  if (videoJsonStr) {
    try {
      video = JSON.parse(videoJsonStr);
    } catch (err) {
      video = null;
    }
  }

  const domain = /url:\s*'([^']+)'/.exec(embedHtml)?.[1];
  const token = /token['"]?\s*:\s*'([^']+)'/.exec(embedHtml)?.[1];
  const expires = /expires['"]?\s*:\s*'([^']+)'/.exec(embedHtml)?.[1];

  if (!domain || !token || !expires) return null;

  const streamUrl = new URL(domain);
  streamUrl.searchParams.append("token", token);
  streamUrl.searchParams.append("referer", "");
  streamUrl.searchParams.append("expires", expires);
  streamUrl.searchParams.append("h", "1");

  const playlistResponse = await fetch(streamUrl.href);
  const playlistText = await playlistResponse.text();

  const qualityRegex =
    /#EXT-X-STREAM-INF:.*?RESOLUTION=\d+x(\d+).*?\n([^\n]+)/g;

  const qualities = [];
  let matchQuality;
  while ((matchQuality = qualityRegex.exec(playlistText)) !== null) {
    const height = matchQuality[1];
    const streamPath = matchQuality[2];
    const absoluteUrl = new URL(streamPath, streamUrl.href).href;

    qualities.push({
      quality: `${height}p`,
      url: absoluteUrl,
    });
  }

  // fallback with only default quality
  if (qualities.length === 0) {
    qualities.push({
      quality: video?.quality ? `${video.quality}p` : "default",
      url: streamUrl.href,
      metadata: {
        size: video?.size,
        runtime: video?.duration,
      },
    });
  }

  const source = {
    label: "AnimeUnity",
    type: "hls",
    qualities,
  };

  return JSON.stringify([source]);
}

return {
  search,
  fetchInfo,
  fetchEpisodes,
  fetchSources,
};
