import path from "node:path";

export interface PathConfig {
  /** Absolute path on the host filesystem, e.g. /mnt/data/plex/media/movies */
  physicalBase: string;
  /** Absolute path as seen inside the Plex Docker container, e.g. /data/movies */
  virtualBase: string;
}

let _config: PathConfig | null = null;

export function getPathConfig(): PathConfig {
  if (_config) return _config;
  const physicalBase = process.env.PLEX_MEDIA_PATH?.replace(/\/$/, "") ?? "";
  const virtualBase = process.env.PLEX_VIRTUAL_PATH?.replace(/\/$/, "") ?? "";
  _config = { physicalBase, virtualBase };
  return _config;
}

/**
 * Convert any path (physical or virtual) to the physical host path.
 * If neither base is set, the original path is returned unchanged.
 */
export function toPhysical(p: string): string {
  const { physicalBase, virtualBase } = getPathConfig();
  if (virtualBase && p.startsWith(virtualBase + "/")) {
    return physicalBase + p.slice(virtualBase.length);
  }
  return p;
}

/**
 * Convert any path (physical or virtual) to the Plex-internal virtual path.
 * If neither base is set, the original path is returned unchanged.
 */
export function toVirtual(p: string): string {
  const { physicalBase, virtualBase } = getPathConfig();
  if (physicalBase && p.startsWith(physicalBase + "/")) {
    return virtualBase + p.slice(physicalBase.length);
  }
  return p;
}

/**
 * Given a path that may be relative, virtual, or physical,
 * always return the physical host path.
 */
export function resolvePhysical(p: string): string {
  const physical = toPhysical(p);
  // If still not absolute under physicalBase, treat as relative to physicalBase
  const { physicalBase } = getPathConfig();
  if (physicalBase && !path.isAbsolute(physical)) {
    return path.join(physicalBase, physical);
  }
  return physical;
}
