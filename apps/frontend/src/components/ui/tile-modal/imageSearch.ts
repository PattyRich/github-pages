import type { ImageSuggestion } from './types';
import {
  cleanCommonsTitle,
  getDetailImageFileTitle,
  metadataText,
  metadataValue,
  normaliseWikiFileTitle,
} from './imageUtils';

const COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php';
const OSRS_API_URL = 'https://oldschool.runescape.wiki/api.php';

interface OsrsSearchResponse {
  pages?: ImageSuggestion[];
}

interface OsrsFileSearchResponse {
  query?: {
    search?: OsrsFileSearchResult[];
  };
}

interface OsrsFileSearchResult {
  title: string;
}

interface OsrsImageInfoResponse {
  query?: {
    pages?: Record<string, OsrsImageInfoPage>;
  };
}

interface OsrsImageInfoPage {
  imageinfo?: OsrsImageInfo[];
  title: string;
}

interface OsrsImageInfo {
  descriptionurl?: string;
  mime?: string;
  thumburl?: string;
  url?: string;
}

interface CommonsSearchResponse {
  query?: {
    pages?: Record<string, CommonsPage>;
  };
}

interface CommonsPage {
  imageinfo?: CommonsImageInfo[];
  title: string;
}

interface CommonsImageInfo {
  descriptionurl?: string;
  extmetadata?: Record<string, { value?: string }>;
  thumburl?: string;
  url?: string;
}

export async function fetchOsrsSuggestions(
  searchValue: string,
  badTitles: string[],
  storedSuggestions: Record<string, ImageSuggestion>
): Promise<ImageSuggestion[]> {
  const results = await Promise.allSettled([
    fetchOsrsItemSuggestions(searchValue, badTitles, storedSuggestions),
    fetchOsrsGifSuggestions(searchValue),
  ]);

  const fulfilledResults = results.filter(
    (result): result is PromiseFulfilledResult<ImageSuggestion[]> => result.status === 'fulfilled'
  );
  if (fulfilledResults.length > 0) {
    const fulfilled = fulfilledResults.flatMap((result) => result.value);

    return uniqueSuggestions(fulfilled).slice(0, 10);
  }

  throw new Error('Wiki search failed');
}

export async function fetchCommonsSuggestions(searchValue: string): Promise<ImageSuggestion[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: '6',
    gsrsearch: searchValue,
    iiprop: 'url|extmetadata',
    iiurlwidth: '480',
    origin: '*',
    prop: 'imageinfo',
  });
  const res = await fetch(`${COMMONS_API_URL}?${params}`);
  if (!res.ok) {
    throw new Error(`Commons search failed (${res.status})`);
  }
  const data = (await res.json()) as CommonsSearchResponse;
  return Object.values(data.query?.pages || {})
    .map(toCommonsSuggestion)
    .filter((item): item is ImageSuggestion => Boolean(item))
    .slice(0, 5);
}

async function fetchOsrsItemSuggestions(
  searchValue: string,
  badTitles: string[],
  storedSuggestions: Record<string, ImageSuggestion>
): Promise<ImageSuggestion[]> {
  const url = `https://oldschool.runescape.wiki/rest.php/v1/search/title?q=${encodeURIComponent(searchValue)}&limit=5`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Wiki search failed (${res.status})`);
  }
  const data = (await res.json()) as OsrsSearchResponse;
  const candidates = (data.pages || []).filter(
    (item) => item.thumbnail && !badTitles.includes(item.title)
  );
  const cachedSuggestions: ImageSuggestion[] = [];
  const uncachedCandidates = candidates.filter((item) => {
    const cached = storedSuggestions[item.title];
    if (cached) {
      cachedSuggestions.push(cached);
      return false;
    }
    return true;
  });

  const fileTitles = uncachedCandidates.map((item) => getDetailImageFileTitle(item.title));
  const detailImages = await fetchOsrsImageInfoPages(fileTitles, 180);
  const detailSuggestions = uncachedCandidates
    .map((item) => {
      const fileTitle = getDetailImageFileTitle(item.title);
      const page = detailImages.get(normaliseWikiFileTitle(fileTitle));
      const suggestion = toOsrsDetailSuggestion(item, page);
      if (!suggestion) {
        badTitles.push(item.title);
      }
      return suggestion;
    })
    .filter((item): item is ImageSuggestion => Boolean(item));

  return [...cachedSuggestions, ...detailSuggestions];
}

async function fetchOsrsGifSuggestions(searchValue: string): Promise<ImageSuggestion[]> {
  const gifSearchValue = /\bgif\b/i.test(searchValue) ? searchValue : `${searchValue} gif`;
  const searchParams = new URLSearchParams({
    action: 'query',
    format: 'json',
    list: 'search',
    origin: '*',
    srnamespace: '6',
    srlimit: '20',
    srsearch: gifSearchValue,
  });
  const searchRes = await fetch(`${OSRS_API_URL}?${searchParams}`);
  if (!searchRes.ok) {
    throw new Error(`Wiki GIF search failed (${searchRes.status})`);
  }

  const searchData = (await searchRes.json()) as OsrsFileSearchResponse;
  const titles = (searchData.query?.search || [])
    .map((result) => result.title)
    .filter((title) => /\.gif$/i.test(title))
    .slice(0, 5);

  if (titles.length === 0) {
    return [];
  }

  const detailImages = await fetchOsrsImageInfoPages(titles, 160);
  return Array.from(detailImages.values())
    .map(toOsrsGifSuggestion)
    .filter((item): item is ImageSuggestion => Boolean(item));
}

async function fetchOsrsImageInfoPages(titles: string[], thumbWidth: number) {
  const pagesByTitle = new Map<string, OsrsImageInfoPage>();
  if (titles.length === 0) return pagesByTitle;

  const imageParams = new URLSearchParams({
    action: 'query',
    format: 'json',
    iiprop: 'url|mime|size',
    iiurlwidth: String(thumbWidth),
    origin: '*',
    prop: 'imageinfo',
    titles: titles.join('|'),
  });
  const imageRes = await fetch(`${OSRS_API_URL}?${imageParams}`);
  if (!imageRes.ok) {
    throw new Error(`Wiki GIF info failed (${imageRes.status})`);
  }

  const imageData = (await imageRes.json()) as OsrsImageInfoResponse;
  Object.values(imageData.query?.pages || {}).forEach((page) => {
    if (page.imageinfo?.[0]?.url) {
      pagesByTitle.set(normaliseWikiFileTitle(page.title), page);
    }
  });
  return pagesByTitle;
}

function toOsrsDetailSuggestion(
  item: ImageSuggestion,
  page?: OsrsImageInfoPage
): ImageSuggestion | null {
  const imageInfo = page?.imageinfo?.[0];
  if (!imageInfo?.url) return null;

  return {
    ...item,
    sourceName: 'OSRS Wiki',
    sourceUrl: `https://oldschool.runescape.wiki/w/${encodeURIComponent(item.title.replaceAll(' ', '_'))}`,
    url: imageInfo.thumburl || imageInfo.url,
  };
}

function toOsrsGifSuggestion(page: OsrsImageInfoPage): ImageSuggestion | null {
  const imageInfo = page.imageinfo?.[0];
  if (imageInfo?.mime !== 'image/gif' || !imageInfo.url) return null;
  const title = cleanCommonsTitle(page.title);

  return {
    animated: true,
    sourceName: 'OSRS Wiki GIF',
    sourceUrl: imageInfo.descriptionurl,
    thumbnail: { url: imageInfo.thumburl || imageInfo.url },
    title,
    url: imageInfo.url,
  };
}

function uniqueSuggestions(items: ImageSuggestion[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.url || item.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toCommonsSuggestion(page: CommonsPage): ImageSuggestion | null {
  const imageInfo = page.imageinfo?.[0];
  const imageUrl = imageInfo?.thumburl || imageInfo?.url;
  if (!imageUrl) return null;

  const extmetadata = imageInfo?.extmetadata || {};
  const title = metadataText(extmetadata, 'ObjectName') || cleanCommonsTitle(page.title);
  const attribution = metadataText(extmetadata, 'Artist') || metadataText(extmetadata, 'Credit');
  const license =
    metadataText(extmetadata, 'LicenseShortName') || metadataText(extmetadata, 'UsageTerms');
  const licenseUrl = metadataValue(extmetadata, 'LicenseUrl');

  return {
    attribution,
    license,
    licenseUrl,
    sourceName: 'Wikimedia Commons',
    sourceUrl: imageInfo?.descriptionurl,
    thumbnail: { url: imageUrl },
    title,
    url: imageUrl,
  };
}
