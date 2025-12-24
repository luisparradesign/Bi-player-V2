export enum MediaType {
  Audio = 'audio',
  Video = 'video',
}

export enum Category {
  Ambient = 'ambient',
  Visual = 'visual',
  Music = 'music',
}

export interface MediaFile {
  id: string; // unique internal ID
  file: File;
  name: string;
  url: string; // blob url
  type: MediaType;
  category: Category;
  group?: string; // For music subfolders
  relPath: string; // Original relative path for identification
}

export interface DeckItem extends MediaFile {
  deckId: string; // unique ID for the item on the deck
  thumbUrl?: string;
}

export interface Catalog {
  ambient: MediaFile[];
  visuals: MediaFile[];
  music: MediaFile[];
  musicGroups: Record<string, MediaFile[]>;
  thumbnails: Record<string, File>; // key: relative path without ext
}

export interface SlimState {
  all: boolean;
  ambient: boolean;
  music: boolean;
  visual: boolean;
}