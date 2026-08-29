import { describe, it, expect } from 'vitest';
import { compareVersions, isUpdateAvailable, parseVersion } from './version';

describe('parseVersion', () => {
  it('reads the one to four dotted integers Chrome allows', () => {
    expect(parseVersion('1')).toEqual([1]);
    expect(parseVersion('0.2')).toEqual([0, 2]);
    expect(parseVersion('0.2.1')).toEqual([0, 2, 1]);
    expect(parseVersion('1.2.3.4')).toEqual([1, 2, 3, 4]);
  });

  it('strips the leading v a tag is written with', () => {
    expect(parseVersion('v0.2.1')).toEqual([0, 2, 1]);
    expect(parseVersion('V0.2.1')).toEqual([0, 2, 1]);
    expect(parseVersion(' v0.2.1 ')).toEqual([0, 2, 1]);
  });

  it('refuses anything that is not a plain dotted number', () => {
    // Not "probably fine" — unreadable, which downstream turns into silence
    // rather than into a prompt to go and fetch something.
    for (const junk of ['', 'latest', '0.2.1-beta', '0.2.1+build', '1.2.3.4.5', '0..1', 'v', '-1']) {
      expect(parseVersion(junk), junk).toBeNull();
    }
  });

  it('refuses a part outside the range a manifest version may hold', () => {
    expect(parseVersion('65535.0')).toEqual([65535, 0]);
    expect(parseVersion('65536.0')).toBeNull();
  });
});

describe('compareVersions', () => {
  it('orders part by part, not as text', () => {
    // The reason this is not a string comparison: '10' sorts before '9'.
    expect(compareVersions('0.10.0', '0.9.0')).toBe(1);
    expect(compareVersions('0.9.0', '0.10.0')).toBe(-1);
    expect(compareVersions('1.0.0', '0.99.99')).toBe(1);
  });

  it('reads a missing part as zero, the way Chrome does', () => {
    expect(compareVersions('0.2', '0.2.0')).toBe(0);
    expect(compareVersions('0.2.0.0', '0.2')).toBe(0);
    expect(compareVersions('0.2.1', '0.2')).toBe(1);
  });

  it('answers null rather than a guess when either side is unreadable', () => {
    expect(compareVersions('nightly', '0.2.0')).toBeNull();
    expect(compareVersions('0.2.0', '')).toBeNull();
  });
});

describe('isUpdateAvailable', () => {
  it('is true only for a strictly newer release', () => {
    expect(isUpdateAvailable('v0.2.1', '0.2.0')).toBe(true);
    expect(isUpdateAvailable('v0.3.0', '0.2.9')).toBe(true);
  });

  it('is false for the same version, however it is spelled', () => {
    expect(isUpdateAvailable('v0.2.0', '0.2.0')).toBe(false);
    expect(isUpdateAvailable('0.2', '0.2.0')).toBe(false);
  });

  it('is false for an older tag, because a tag can be moved', () => {
    expect(isUpdateAvailable('v0.1.9', '0.2.0')).toBe(false);
  });

  it('is false when the question cannot be answered', () => {
    expect(isUpdateAvailable('nightly', '0.2.0')).toBe(false);
    expect(isUpdateAvailable('v0.2.1-rc1', '0.2.0')).toBe(false);
  });
});
