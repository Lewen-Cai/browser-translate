import { youtubeMatcher } from './youtube';
import { genericMatcher } from './generic';
import { siteFor, type SiteMatcher, type SubtitleSite } from '../site';

/**
 * In order: the sites that need their own handling, then the one that handles
 * everything else. Generic must stay last — it matches every page, and its job
 * is to catch what nothing above it claimed.
 */
export const SITES: readonly SiteMatcher[] = [youtubeMatcher, genericMatcher];

export function subtitleSiteFor(loc: Pick<Location, 'hostname' | 'pathname' | 'search'>): SubtitleSite | null {
  return siteFor(loc, SITES);
}
