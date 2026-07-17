/**
 * Build-time platform flag (see vite.config.ts define).
 * Default is off so upstream/general FreqUI builds keep multi-bot remote URL behavior.
 */
export function isPlatformSingleOrigin(): boolean {
  try {
    return Boolean(__PLATFORM_SINGLE_ORIGIN__);
  } catch {
    return false;
  }
}
