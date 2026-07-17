import type { ImageSuggestion, TileImage } from './types';

export function nameFilter(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

export function detectURLs(message?: string) {
  if (!message?.length) return [];
  const res = message.match(/(((https?:\/\/)|(www\.))[^\s]+)/g);
  return res || [];
}

export function normaliseExternalUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function formatProofLinkLabel(url: string) {
  try {
    const parsedUrl = new URL(normaliseExternalUrl(url));
    return parsedUrl.hostname.replace(/^www\./i, '') || 'Proof link';
  } catch {
    return 'Proof link';
  }
}

export function isAnimatedImageUrl(url?: string) {
  if (!url) return false;
  return /^data:image\/gif[;,]/i.test(url) || /\.gif(?:[?#]|$)/i.test(url);
}

export function isAnimatedTileImage(image?: TileImage | null) {
  return Boolean(image?.animated || isAnimatedImageUrl(image?.url));
}

export function getImageUrl(image: string) {
  image = getWikiImageBaseName(image);
  return `https://oldschool.runescape.wiki/images/thumb/${encodeURIComponent(image)}_detail.png/180px-${encodeURIComponent(image)}_detail.png`;
}

export function suggestionKey(item: ImageSuggestion) {
  return `${item.title}|${item.url}`;
}

export function cacheSuggestion(
  storedSuggestions: Record<string, ImageSuggestion>,
  item: ImageSuggestion
) {
  storedSuggestions[suggestionKey(item)] = item;
  if (item.sourceName !== 'OSRS Wiki GIF') {
    storedSuggestions[item.title] = item;
  }
}

export function getDetailImageFileTitle(image: string) {
  return `File:${getWikiImageBaseName(image)}_detail.png`;
}

export function normaliseWikiFileTitle(title: string) {
  return title
    .replace(/^File:/i, '')
    .replaceAll('_', ' ')
    .trim()
    .toLowerCase();
}

export function cleanCommonsTitle(title: string) {
  return title
    .replace(/^File:/, '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replaceAll('_', ' ');
}

export function metadataText(metadata: Record<string, { value?: string }>, key: string) {
  return stripHtml(metadataValue(metadata, key));
}

export function metadataValue(metadata: Record<string, { value?: string }>, key: string) {
  return metadata[key]?.value || '';
}

function getWikiImageBaseName(image: string) {
  image = image.split('/').pop() || image;
  image = image.replace(/\.png$/i, '');
  image = decodeURI(image).replaceAll(' ', '_');
  return image.charAt(0).toUpperCase() + image.slice(1);
}

function stripHtml(value: string) {
  if (!value) return '';
  const withoutTags = value.replace(/<[^>]*>/g, ' ');
  if (typeof document === 'undefined') return withoutTags.replace(/\s+/g, ' ').trim();
  const textarea = document.createElement('textarea');
  textarea.innerHTML = withoutTags;
  return textarea.value.replace(/\s+/g, ' ').trim();
}
