export interface TileImage {
  animated?: boolean;
  attribution?: string;
  license?: string;
  licenseUrl?: string;
  opacity?: number | string;
  sourceName?: string;
  sourceUrl?: string;
  url: string;
  usePixel?: boolean;
}

export interface TileInfo {
  colBingo?: number | string;
  description?: string;
  image?: TileImage | null;
  points?: number | string;
  revision?: number;
  rowBingo?: number | string;
  title?: string;
}

export interface TeamTileInfo {
  checked?: boolean;
  currPoints?: number | string;
  proof?: string;
  proofImages?: string[];
  revision?: number;
}

export interface TileSaveContext {
  expectedBoardTileRevision?: number;
  expectedRevision: number;
  expectedSettingsRevision: number;
  teamId?: number;
}

export function normalizeRevision(value: unknown): number {
  const revision = Number(value);
  return Number.isSafeInteger(revision) && revision >= 0 ? revision : 0;
}

export interface ImageSuggestion {
  animated?: boolean;
  attribution?: string;
  license?: string;
  licenseUrl?: string;
  sourceName?: string;
  sourceUrl?: string;
  thumbnail?: {
    url?: string;
  };
  title: string;
  url: string;
}

export interface TileModalState extends TileInfo, TeamTileInfo {
  chooseImage?: boolean;
  lightboxIndex: number | null;
  loading?: boolean;
  proofImages: string[];
  proofImagesChanged: boolean;
  storedSuggestions: Record<string, ImageSuggestion>;
  suggestions: ImageSuggestion[];
  triedToSearch?: boolean;
  wikiSearch: string;
  wikiSearchError?: boolean;
}
