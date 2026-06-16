export interface TileImage {
  animated?: boolean;
  attribution?: string;
  license?: string;
  licenseUrl?: string;
  opacity: number | string;
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
  rowBingo?: number | string;
  title?: string;
}

export interface TeamTileInfo {
  checked?: boolean;
  currPoints?: number | string;
  proof?: string;
  proofImages?: string[];
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
