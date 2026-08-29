/**
 * Comparing an extension version to a release tag.
 *
 * Deliberately strict. A version we cannot read is not a version that might be
 * newer — it is a question we have no answer to, and answering it with "there
 * is an update" would tell someone to go and fetch something that may not
 * exist. So anything that is not a plain dotted number reads as unknown, and
 * unknown never becomes a prompt.
 */

/** Chrome allows one to four dot-separated integers, each 0–65535. */
const MAX_PARTS = 4;
const MAX_PART = 65535;

/**
 * Read a version into its parts, or null when it is not one.
 *
 * A leading `v` is stripped, because that is how the tags are written and not
 * part of the version itself. Nothing else is: a pre-release suffix means the
 * tag is not a plain version, and this says so rather than guessing which side
 * of the release it falls on.
 */
export function parseVersion(value: string): number[] | null {
  const trimmed = value.trim().replace(/^v/i, '');
  if (!/^\d+(\.\d+){0,3}$/.test(trimmed)) return null;
  const parts = trimmed.split('.').map(Number);
  if (parts.length > MAX_PARTS) return null;
  if (parts.some((p) => !Number.isInteger(p) || p < 0 || p > MAX_PART)) return null;
  return parts;
}

/**
 * -1, 0 or 1, comparing part by part with missing parts read as zero — so
 * `0.2` and `0.2.0` are the same version, which is how Chrome reads them too.
 * Returns null when either side is unreadable.
 */
export function compareVersions(a: string, b: string): number | null {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (!left || !right) return null;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

/**
 * Whether `latest` is a release worth telling someone about. False for the same
 * version, for an older one — a tag can be moved, and a downgrade is not news —
 * and for anything either side of which cannot be read.
 */
export function isUpdateAvailable(latest: string, current: string): boolean {
  return compareVersions(latest, current) === 1;
}
