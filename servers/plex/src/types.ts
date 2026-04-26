// Plex Media Server API entity types

export interface PlexMediaContainer<T> {
  MediaContainer: {
    size: number;
    totalSize?: number;
    offset?: number;
    Metadata?: T[];
    Directory?: T[];
  };
}

export interface PlexLibraryLocation {
  id: number;
  path: string;
}

export interface PlexLibrarySection {
  key: string;
  title: string;
  type: string;
  agent: string;
  scanner: string;
  language: string;
  uuid: string;
  updatedAt?: number;
  createdAt?: number;
  scannedAt?: number;
  content?: boolean;
  directory?: boolean;
  contentChangedAt?: number;
  hidden?: number;
  Location?: PlexLibraryLocation[];
}

export interface PlexGenre {
  id: number;
  filter: string;
  tag: string;
  title?: string;
}

export interface PlexDirector {
  id: number;
  filter: string;
  tag: string;
}

export interface PlexWriter {
  id: number;
  filter: string;
  tag: string;
}

export interface PlexRole {
  id: number;
  filter: string;
  tag: string;
  role?: string;
  thumb?: string;
}

export interface PlexMediaPart {
  id: number;
  key: string;
  duration?: number;
  file: string;
  size?: number;
  container?: string;
  videoProfile?: string;
}

export interface PlexMedia {
  id: number;
  duration?: number;
  bitrate?: number;
  width?: number;
  height?: number;
  aspectRatio?: number;
  audioChannels?: number;
  audioCodec?: string;
  videoCodec?: string;
  videoResolution?: string;
  container?: string;
  videoFrameRate?: string;
  Part?: PlexMediaPart[];
}

export interface PlexMovie {
  ratingKey: string;
  key: string;
  guid?: string;
  title: string;
  titleSort?: string;
  originalTitle?: string;
  year?: number;
  contentRating?: string;
  summary?: string;
  rating?: number;
  audienceRating?: number;
  viewCount?: number;
  lastViewedAt?: number;
  addedAt?: number;
  updatedAt?: number;
  duration?: number;
  tagline?: string;
  thumb?: string;
  art?: string;
  studio?: string;
  viewOffset?: number;
  Genre?: PlexGenre[];
  Director?: PlexDirector[];
  Writer?: PlexWriter[];
  Role?: PlexRole[];
  Media?: PlexMedia[];
}

export interface PlexPlayer {
  address: string;
  device: string;
  machineIdentifier: string;
  model?: string;
  platform: string;
  platformVersion?: string;
  product: string;
  profile?: string;
  state: string;
  title: string;
  vendor?: string;
  version?: string;
  local?: boolean;
  relayed?: boolean;
  secure?: boolean;
  userID?: number;
}

export interface PlexSessionUser {
  id: string;
  thumb?: string;
  title: string;
}

export interface PlexSession {
  ratingKey: string;
  key: string;
  title: string;
  year?: number;
  thumb?: string;
  summary?: string;
  duration?: number;
  viewOffset?: number;
  sessionKey: string;
  type: string;
  User?: PlexSessionUser;
  Player?: PlexPlayer;
  Session?: {
    id: string;
    bandwidth?: number;
    location?: string;
  };
}

export interface PlexHistoryItem {
  historyKey: string;
  key: string;
  ratingKey: string;
  title: string;
  type: string;
  thumb?: string;
  year?: number;
  duration?: number;
  viewedAt: number;
  accountID?: number;
  deviceID?: number;
}
